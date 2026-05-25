import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";

export const maxDuration = 60;

function decodeBase64(str: string): string {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractBody(payload: GmailPart): string {
  if (payload?.body?.data) return decodeBase64(payload.body.data);
  if (payload?.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) return decodeBase64(part.body.data);
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }
  return "";
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

async function classifyWithClaude(
  asunto: string,
  cuerpo: string,
  de: string,
): Promise<{ categoria: string; resumen: string; respuesta_sugerida: string }> {
  const apiKey = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  if (!apiKey) return { categoria: "info", resumen: asunto.slice(0, 80), respuesta_sugerida: "" };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Sos un asistente de atención al cliente para un e-commerce. Analizá este email y respondé SOLO con JSON válido, sin texto extra.

De: ${de}
Asunto: ${asunto}
Cuerpo: ${cuerpo.slice(0, 800)}

Respondé exactamente con este JSON:
{
  "categoria": "urgente|reclamo|consulta|positivo|info|spam",
  "resumen": "resumen en 1 línea corta (max 80 caracteres)",
  "respuesta_sugerida": "respuesta lista para enviar, tono amigable y profesional, español rioplatense (vos)"
}`,
      }],
    }),
  });

  if (!res.ok) return { categoria: "info", resumen: asunto.slice(0, 80), respuesta_sugerida: "" };
  const data = await res.json() as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text?.trim() ?? "";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    return JSON.parse(match[0]) as { categoria: string; resumen: string; respuesta_sugerida: string };
  } catch {
    return { categoria: "info", resumen: asunto.slice(0, 80), respuesta_sugerida: "" };
  }
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  const { data: userRow } = await service
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  const workspaceId = (userRow as { workspace_id: string } | null)?.workspace_id;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { data: raw } = await service
    .from("integrations")
    .select("access_token_encrypted, status")
    .eq("workspace_id", workspaceId)
    .eq("provider", "gmail")
    .maybeSingle();

  const integration = raw as { access_token_encrypted: string | null; status: string } | null;
  if (!integration?.access_token_encrypted || integration.status !== "active") {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  const accessToken = decrypt(integration.access_token_encrypted);

  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=in:inbox",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!listRes.ok) return NextResponse.json({ error: "Gmail list failed" }, { status: 502 });

  const listData = await listRes.json() as { messages?: Array<{ id: string; threadId: string }> };
  const messages = listData.messages ?? [];
  if (messages.length === 0) return NextResponse.json({ ok: true, synced: 0 });

  const mailRows = await Promise.all(
    messages.map(async ({ id, threadId }) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!msgRes.ok) return null;
        const msg = await msgRes.json() as {
          payload?: { headers?: Array<{ name: string; value: string }>; body?: { data?: string }; parts?: GmailPart[] };
          labelIds?: string[];
          internalDate?: string;
        };

        const headers = msg.payload?.headers ?? [];
        const getHeader = (name: string) =>
          headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

        const fromHeader = getHeader("From");
        const emailMatch = fromHeader.match(/<(.+?)>/) ?? fromHeader.match(/(\S+@\S+)/);
        const nameMatch = fromHeader.match(/^"?([^"<]+)"?\s*</);
        const de = emailMatch?.[1] ?? fromHeader;
        const nombre = nameMatch?.[1]?.trim() ?? de;

        const asunto = getHeader("Subject") || "(Sin asunto)";
        const fecha = new Date(parseInt(msg.internalDate ?? "0")).toISOString();
        const leido = !((msg.labelIds ?? []) as string[]).includes("UNREAD");
        const cuerpo = extractBody(msg.payload as GmailPart);

        const classified = await classifyWithClaude(asunto, cuerpo, de);

        return {
          id,
          workspace_id: workspaceId,
          thread_id: threadId,
          de,
          nombre,
          asunto,
          cuerpo,
          fecha,
          leido,
          categoria: classified.categoria,
          resumen: classified.resumen,
          respuesta_sugerida: classified.respuesta_sugerida,
        };
      } catch {
        return null;
      }
    }),
  );

  const validRows = mailRows.filter((r): r is NonNullable<typeof r> => r !== null);

  if (validRows.length > 0) {
    await service
      .from("mails")
      .upsert(validRows, { onConflict: "id,workspace_id", ignoreDuplicates: false });
  }

  return NextResponse.json({ ok: true, synced: validRows.length });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt, encrypt } from "@/lib/encryption";

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

function decodeB64(str: string) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractBody(payload: GmailPart): { text: string; html: string } {
  if (!payload) return { text: "", html: "" };
  const mime = payload.mimeType ?? "";

  if (mime === "text/plain" && payload.body?.data)
    return { text: decodeB64(payload.body.data), html: "" };

  if (mime === "text/html" && payload.body?.data)
    return { text: "", html: decodeB64(payload.body.data) };

  if (payload.parts) {
    let text = "", html = "";
    for (const part of payload.parts) {
      const sub = extractBody(part);
      if (sub.html) html = sub.html;
      else if (sub.text) text = sub.text;
    }
    return { text, html };
  }
  return { text: "", html: "" };
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    return await res.json() as { access_token: string; expires_in: number };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("id");
  if (!messageId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Gmail message IDs son [a-zA-Z0-9_-]+ — sin validar, valores con / ? .. permiten
  // manipular el path/query de la URL de Gmail.
  if (!/^[a-zA-Z0-9_-]+$/.test(messageId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Filtro explícito por workspace_id — NO depender solo de RLS para aislar tenants
  // (mismo patrón defensivo que lib/tiendanube/connection.ts).
  const { data: rawUser } = await supabase
    .from("users").select("workspace_id").eq("id", user.id).single();
  const workspaceId = (rawUser as { workspace_id: string | null } | null)?.workspace_id;
  if (!workspaceId) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const { data: raw } = await supabase
    .from("integrations")
    .select("access_token_encrypted, refresh_token_encrypted, expires_at, status")
    .eq("provider", "gmail")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const integration = raw as {
    access_token_encrypted: string | null;
    refresh_token_encrypted: string | null;
    expires_at: string | null;
    status: string;
  } | null;

  if (!integration?.access_token_encrypted || integration.status !== "active")
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  let token: string;
  try {
    token = decrypt(integration.access_token_encrypted);

    // Refrescar token si expiró o expira en menos de 5 minutos
    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
    const isExpired = !expiresAt || expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

    if (isExpired && integration.refresh_token_encrypted) {
      const refreshToken = decrypt(integration.refresh_token_encrypted);
      const newTokenData = await refreshAccessToken(refreshToken);
      if (newTokenData) {
        token = newTokenData.access_token;
        const service = createServiceClient();
        await service
          .from("integrations")
          .update({
            access_token_encrypted: encrypt(token),
            expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
          })
          .eq("workspace_id", workspaceId)
          .eq("provider", "gmail");
      }
    }
  } catch {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return NextResponse.json({ error: "Gmail API error" }, { status: res.status });

  const msg = await res.json() as {
    id: string; threadId: string; snippet: string;
    payload: GmailPart & { headers: { name: string; value: string }[] };
  };

  const { text, html } = extractBody(msg.payload);
  const getHeader = (name: string) =>
    msg.payload.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return NextResponse.json({
    id: msg.id,
    threadId: msg.threadId,
    messageId: getHeader("message-id"),
    from: getHeader("from"),
    to: getHeader("to"),
    subject: getHeader("subject"),
    date: getHeader("date"),
    body: html || text,
    isHtml: !!html,
    snippet: msg.snippet,
  });
}

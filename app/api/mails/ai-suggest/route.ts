import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from, subject, body } = await request.json() as {
    from: string; subject: string; body: string;
  };

  const model = "claude-haiku-4-5-20251001";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Sos un asistente de email profesional para un negocio de e-commerce. Escribí una respuesta concisa y profesional en español rioplatense (tuteo, "vos") para el siguiente email recibido.

De: ${from}
Asunto: ${subject}

Contenido:
${body.slice(0, 3000)}

Instrucciones:
- Solo el cuerpo de la respuesta, sin "Estimado/a" ni firmas genéricas
- Directo y profesional, máximo 3 párrafos cortos
- Adaptate al tono del email recibido`,
      }],
    }),
  });

  if (!res.ok) {
    console.error("Anthropic error:", await res.text());
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const data = await res.json() as {
    content: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const suggestion = data.content.find((c) => c.type === "text")?.text ?? "";

  // Loggear uso de tokens en background (no bloquea la respuesta)
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  if (inputTokens > 0 || outputTokens > 0) {
    const service = createServiceClient();
    service.from("users").select("workspace_id").eq("id", user.id).single().then(({ data: userRow }) => {
      const workspaceId = (userRow as { workspace_id: string } | null)?.workspace_id;
      service.from("token_usage").insert({
        workspace_id: workspaceId ?? null,
        user_id: user.id,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      }).then(() => {/* fire and forget */});
    });
  }

  return NextResponse.json({ suggestion });
}

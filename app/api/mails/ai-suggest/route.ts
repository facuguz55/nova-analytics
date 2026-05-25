import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from, subject, body } = await request.json() as {
    from: string; subject: string; body: string;
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
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

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const suggestion = data.content.find((c) => c.type === "text")?.text ?? "";
  return NextResponse.json({ suggestion });
}

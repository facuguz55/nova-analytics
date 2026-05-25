import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from, subject, body } = await request.json() as {
    from: string; subject: string; body: string;
  };

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `Sos un asistente de email profesional para un negocio de e-commerce. Escribí una respuesta concisa y profesional en español rioplatense (tuteo, "vos") para el siguiente email recibido.

De: ${from}
Asunto: ${subject}

Contenido del email:
${body.slice(0, 3000)}

Instrucciones:
- Solo el cuerpo de la respuesta, sin "Estimado/a" ni firmas genéricas
- Directo y profesional, máximo 3 párrafos cortos
- Adaptate al tono del email recibido (si es informal, respondé informal; si es formal, formal)`,
    }],
  });

  const suggestion = msg.content[0].type === "text" ? msg.content[0].text : "";
  return NextResponse.json({ suggestion });
}

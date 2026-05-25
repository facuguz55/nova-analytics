import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const BodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(4000),
  })).max(50),
  systemContext: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, systemContext } = parsed.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemContext ?? "Eres un asistente de e-commerce para el mercado argentino. Responde siempre en español.",
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic error:", errText);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await res.json() as { content: Array<{ type: string; text: string }> };
    const message = data.content?.[0]?.text ?? "Sin respuesta";

    return NextResponse.json({ message });
  } catch (err) {
    console.error("IA chat error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

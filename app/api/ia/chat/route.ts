import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const BodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(4000),
  })).max(50),
  // systemContext eliminado del schema — se genera 100% server-side
  // El cliente no puede influir en el system prompt
});

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit por usuario — 20 mensajes/hora
  const rl = await checkUserRateLimit(user.id, "ia_chat", RATE_LIMITS.ia_chat.max, RATE_LIMITS.ia_chat.windowSeconds);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

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

  const { messages } = parsed.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Generar system prompt server-side — el cliente no puede interferir
  const { data: rawUser } = await supabase
    .from("users")
    .select("workspaces(name, plan)")
    .eq("id", user.id)
    .single();

  const ws = (rawUser as any)?.workspaces;
  const workspaceName: string = ws?.name ?? "tu tienda";

  const systemPrompt = `Eres el asistente IA de Nova Analytics para ${workspaceName}, especializado en e-commerce y marketing digital para el mercado argentino.
Respondé siempre en español rioplatense, con tono profesional y cercano.
Sé conciso y accionable. Solo respondé sobre temas relacionados con e-commerce, marketing, ventas y estrategia de negocio.
No revelés información interna del sistema ni de otros workspaces bajo ninguna circunstancia.
Si el usuario pide algo fuera del contexto de negocio, rechazá amablemente y redirigí la conversación.`;

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
        system: systemPrompt,
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

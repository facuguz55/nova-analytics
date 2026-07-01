import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { z } from "zod";

const CATEGORIES = ["consulta", "reclamo", "pedido", "agradecimiento", "urgente", "otro"] as const;
export type MailCategory = typeof CATEGORIES[number];

const Schema = z.object({
  messages: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(100),
    from: z.string().max(200),
    subject: z.string().max(200),
    snippet: z.string().max(400),
  })).min(1).max(25),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkUserRateLimit(user.id, "mail_classify", 30, 3600, true);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  let raw: unknown;
  try { raw = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { messages } = parsed.data;

  // Formato simple numerado — evita que Claude tenga que reproducir IDs hex exactos
  const items = messages.map((m, i) =>
    `${i + 1}. De: ${sanitizePlainText(m.from).slice(0, 80)} | Asunto: ${sanitizePlainText(m.subject).slice(0, 120)} | Preview: ${sanitizePlainText(m.snippet).slice(0, 150)}`
  ).join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `Clasificá cada email de una tienda de e-commerce.

CASO ESPECIAL — TiendaNube reenvía consultas de clientes: si el asunto dice
"Has recibido un contacto de X" o "Recibiste una consulta de X" (X es el
nombre de una persona), es un CLIENTE REAL escribiendo a través del
formulario de contacto de la tienda — aunque el remitente técnico sea
TiendaNube. Clasificalo por el contenido real de la consulta (consulta,
reclamo, pedido, agradecimiento o urgente), NUNCA como "otro".

REGLA PRINCIPAL (para todo lo demás): si viene de empresa, servicio,
plataforma, sistema automático, newsletter, banco, app, o es una notificación
transaccional sin acción para el vendedor (ej. "X ha realizado la compra
#123", códigos de verificación, alertas de login, confirmaciones de envío)
→ "otro".

Solo si el remitente es una persona real (cliente) o cae en el caso especial de arriba usá:
- consulta: pregunta sobre producto, precio, stock, envío
- reclamo: queja, problema, devolución
- pedido: quiere comprar o solicita presupuesto
- agradecimiento: mensaje positivo o gracias
- urgente: necesita respuesta inmediata

En caso de duda (fuera del caso especial) → "otro".

Respondé SOLO con un JSON array de strings en el mismo orden que los emails recibidos, sin texto adicional:
["categoria1","categoria2","categoria3"]`,
      messages: [{
        role: "user",
        content: `Clasificá estos ${messages.length} emails:\n${items}`,
      }],
    }),
  });

  if (!res.ok) {
    console.error("mails/classify: Anthropic error", res.status, await res.text());
    return NextResponse.json({ classifications: [] });
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const rawText = data.content.find(c => c.type === "text")?.text?.trim() ?? "[]";
  // Haiku a veces envuelve la respuesta en un code fence markdown pese a la instrucción — lo sacamos.
  const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    const categories = JSON.parse(text) as string[];
    const classifications = messages.map((m, i) => ({
      id: m.id,
      category: (CATEGORIES.includes(categories[i] as MailCategory) ? categories[i] : "otro") as MailCategory,
    }));
    return NextResponse.json({ classifications });
  } catch {
    console.error("mails/classify: JSON parse failed, raw text:", text);
    return NextResponse.json({ classifications: [] });
  }
}

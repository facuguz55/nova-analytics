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

  // 30 clasificaciones por hora (1 call clasifica hasta 25 emails)
  const rl = await checkUserRateLimit(user.id, "mail_classify", 30, 3600, true);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  let raw: unknown;
  try { raw = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { messages } = parsed.data;

  const items = messages.map((m, i) =>
    `${i + 1}. [ID:${m.id}] De: ${sanitizePlainText(m.from).slice(0, 80)} | Asunto: ${sanitizePlainText(m.subject).slice(0, 120)} | Preview: ${sanitizePlainText(m.snippet).slice(0, 150)}`
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
      max_tokens: 400,
      system: `Sos un clasificador de emails para una tienda de e-commerce.

REGLA PRINCIPAL: Si el email proviene de una empresa, servicio, plataforma, sistema automático, newsletter, banco, app, proveedor o cualquier entidad no-humana → categorizalo siempre como "otro".

Solo si el remitente es claramente una persona real (cliente individual) usá estas categorías:
- consulta: pregunta sobre producto, precio, stock, envío
- reclamo: queja, problema, insatisfacción, devolución
- pedido: quiere comprar, solicita presupuesto, hace un encargo
- agradecimiento: mensaje positivo, felicitación, gracias
- urgente: tono urgente, necesita respuesta inmediata

En caso de duda sobre si es persona o empresa → "otro".

Respondé ÚNICAMENTE con un JSON array, sin texto adicional:
[{"id":"<id exacto del email>","category":"<categoría>"}]`,
      messages: [{
        role: "user",
        content: `Clasificá estos emails:\n${items}`,
      }],
    }),
  });

  if (!res.ok) return NextResponse.json({ classifications: [] });

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content.find(c => c.type === "text")?.text?.trim() ?? "[]";

  try {
    const raw = JSON.parse(text) as Array<{ id: string; category: string }>;
    const classifications = raw.map(c => ({
      id: c.id,
      category: (CATEGORIES.includes(c.category as MailCategory) ? c.category : "otro") as MailCategory,
    }));
    return NextResponse.json({ classifications });
  } catch {
    return NextResponse.json({ classifications: [] });
  }
}

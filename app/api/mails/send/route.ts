import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailToken } from "@/lib/google/gmail";
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

// Detecta CRLF — base del email header injection
const noCRLF = (val: string) => !val.includes("\r") && !val.includes("\n");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SendSchema = z.object({
  to: z
    .string()
    .regex(EMAIL_REGEX, "Email destinatario inválido")
    .refine(noCRLF, "Carácter inválido en destinatario"),
  subject: z
    .string()
    .min(1, "Asunto requerido")
    .max(200, "Asunto demasiado largo")
    .refine(noCRLF, "Carácter inválido en asunto"),
  body: z
    .string()
    .min(1, "Mensaje requerido")
    .max(50_000, "Cuerpo demasiado largo"),
});

// Envía un email nuevo (sin threadId) — usado tanto para "Redactar" individual
// como para el envío masivo (un POST por destinatario, cada uno como email
// independiente en vez de ir todos en copia).
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkUserRateLimit(user.id, "mail_send", RATE_LIMITS.mail_send.max, RATE_LIMITS.mail_send.windowSeconds, true);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = SendSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { to, subject, body } = parsed.data;

  const { data: rawUser } = await supabase
    .from("users").select("workspace_id").eq("id", user.id).single();
  const workspaceId = (rawUser as { workspace_id: string | null } | null)?.workspace_id;
  if (!workspaceId) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const gmail = await getGmailToken(workspaceId);
  if (!gmail) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const lines = [
    `From: ${gmail.email}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ];

  const raw64 = Buffer.from(lines.join("\r\n")).toString("base64url");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gmail.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: raw64 }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gmail send error:", err);
    return NextResponse.json({ error: "Send failed" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}

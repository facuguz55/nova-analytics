import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rl = rateLimit(ip);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, subject, body, threadId, inReplyTo } = await request.json() as {
    to: string; subject: string; body: string; threadId: string; inReplyTo?: string;
  };

  const { data: raw } = await supabase
    .from("integrations")
    .select("access_token_encrypted, status, metadata")
    .eq("provider", "gmail")
    .maybeSingle();

  const integration = raw as {
    access_token_encrypted: string | null;
    status: string;
    metadata: { email?: string } | null;
  } | null;

  if (!integration?.access_token_encrypted)
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const token = decrypt(integration.access_token_encrypted);
  const fromEmail = integration.metadata?.email ?? "";

  const lines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject.startsWith("Re:") ? subject : `Re: ${subject}`}`,
    `Content-Type: text/plain; charset=utf-8`,
    ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`] : []),
    ``,
    body,
  ];

  const raw64 = Buffer.from(lines.join("\r\n")).toString("base64url");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: raw64, threadId }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gmail send error:", err);
    return NextResponse.json({ error: "Send failed" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}

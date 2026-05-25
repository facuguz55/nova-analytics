import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, subject, body, threadId, mailId } = await request.json() as {
    to: string; subject: string; body: string; threadId: string; mailId?: string;
  };

  const service = createServiceClient();

  const { data: userRow } = await service
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const workspaceId = (userRow as { workspace_id: string } | null)?.workspace_id;

  const { data: raw } = await service
    .from("integrations")
    .select("access_token_encrypted, status, metadata")
    .eq("provider", "gmail")
    .eq("workspace_id", workspaceId!)
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

  // Marcar como respondido en la DB
  if (mailId && workspaceId) {
    await service
      .from("mails")
      .update({ respondido: true })
      .eq("id", mailId)
      .eq("workspace_id", workspaceId);
  }

  return NextResponse.json({ success: true });
}

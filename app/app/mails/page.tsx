import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import MailsClient from "./MailsClient";

export const metadata: Metadata = { title: "Mails" };

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  labelIds?: string[];
  payload?: { headers: Array<{ name: string; value: string }> };
  internalDate?: string;
}

async function fetchInbox(accessToken: string): Promise<GmailMessage[]> {
  try {
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX",
      { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 60 } }
    );
    if (!listRes.ok) return [];
    const { messages } = await listRes.json() as { messages?: Array<{ id: string; threadId: string }> };
    if (!messages?.length) return [];

    const details = await Promise.all(
      messages.map((m) =>
        fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ).then((r) => r.ok ? r.json() : null)
      )
    );
    return details.filter(Boolean) as GmailMessage[];
  } catch {
    return [];
  }
}

export default async function MailsPage() {
  const supabase = await createClient();

  type IntRow = { access_token_encrypted: string | null; status: string; metadata: Record<string, string> | null };
  const { data: rawIntegration } = await supabase
    .from("integrations")
    .select("access_token_encrypted, status, metadata")
    .eq("provider", "gmail")
    .maybeSingle();
  const integration = rawIntegration as unknown as IntRow | null;

  const isConnected = integration?.status === "active" && !!integration?.access_token_encrypted;
  let messages: GmailMessage[] = [];
  let gmailEmail = "";

  if (isConnected && integration?.access_token_encrypted) {
    try {
      const accessToken = decrypt(integration.access_token_encrypted);
      gmailEmail = integration.metadata?.email ?? "";
      messages = await fetchInbox(accessToken);
    } catch { /* token expirado */ }
  }

  function getHeader(msg: GmailMessage, name: string) {
    return msg.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
  }

  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    threadId: msg.threadId,
    from: getHeader(msg, "From"),
    to: getHeader(msg, "To"),
    subject: getHeader(msg, "Subject") || "(Sin asunto)",
    date: getHeader(msg, "Date"),
    snippet: msg.snippet ?? "",
    isUnread: msg.labelIds?.includes("UNREAD") ?? false,
    internalDate: msg.internalDate ?? "0",
  }));

  return (
    <MailsClient
      isConnected={isConnected}
      gmailEmail={gmailEmail}
      messages={formattedMessages}
    />
  );
}

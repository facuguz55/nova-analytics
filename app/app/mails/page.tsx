import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getGmailToken } from "@/lib/google/gmail";
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
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX",
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

  const { data: rawUser } = await supabase
    .from("users")
    .select("workspace_id")
    .single();
  const workspaceId = (rawUser as { workspace_id: string | null } | null)?.workspace_id;

  const gmail = workspaceId ? await getGmailToken(workspaceId) : null;
  const isConnected = !!gmail;
  let messages: GmailMessage[] = [];

  if (gmail) {
    messages = await fetchInbox(gmail.accessToken);
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
      gmailEmail={gmail?.email ?? ""}
      messages={formattedMessages}
    />
  );
}

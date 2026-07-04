import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getGmailToken } from "@/lib/google/gmail";
import MailsClient from "./MailsClient";

export const metadata: Metadata = { title: "Correos" };

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
          { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 60 } }
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

  // Query directa a integrations — RLS scopa automáticamente al workspace del usuario.
  // Evita la query previa a la tabla users para obtener workspace_id.
  type IntRow = {
    workspace_id: string;
    access_token_encrypted: string | null;
    refresh_token_encrypted: string | null;
    expires_at: string | null;
    status: string;
    metadata: { email?: string } | null;
  };

  const { data: raw } = await supabase
    .from("integrations")
    .select("workspace_id, access_token_encrypted, refresh_token_encrypted, expires_at, status, metadata")
    .eq("provider", "gmail")
    .maybeSingle();

  const integration = raw as IntRow | null;
  const isConnected = integration?.status === "active" && !!integration?.access_token_encrypted;

  let gmail = null;
  if (isConnected && integration) {
    gmail = await getGmailToken(integration.workspace_id, {
      accessTokenEncrypted: integration.access_token_encrypted!,
      refreshTokenEncrypted: integration.refresh_token_encrypted,
      expiresAt: integration.expires_at,
      email: integration.metadata?.email ?? "",
    });
  }

  const messages = gmail ? await fetchInbox(gmail.accessToken) : [];

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

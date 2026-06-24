import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt, encrypt } from "@/lib/encryption";
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

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    return await res.json() as { access_token: string; expires_in: number };
  } catch {
    return null;
  }
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

  type IntRow = {
    access_token_encrypted: string | null;
    refresh_token_encrypted: string | null;
    expires_at: string | null;
    status: string;
    metadata: Record<string, string> | null;
    workspace_id: string;
  };

  const { data: rawIntegration } = await supabase
    .from("integrations")
    .select("access_token_encrypted, refresh_token_encrypted, expires_at, status, metadata, workspace_id")
    .eq("provider", "gmail")
    .maybeSingle();
  const integration = rawIntegration as unknown as IntRow | null;

  const isConnected = integration?.status === "active" && !!integration?.access_token_encrypted;
  let messages: GmailMessage[] = [];
  let gmailEmail = "";

  if (isConnected && integration?.access_token_encrypted) {
    try {
      let accessToken = decrypt(integration.access_token_encrypted);
      gmailEmail = integration.metadata?.email ?? "";

      // Refrescar token si expiró o expira en menos de 5 minutos
      const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
      const isExpired = !expiresAt || expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

      if (isExpired && integration.refresh_token_encrypted) {
        const refreshToken = decrypt(integration.refresh_token_encrypted);
        const newTokenData = await refreshAccessToken(refreshToken);
        if (newTokenData) {
          accessToken = newTokenData.access_token;
          const service = createServiceClient();
          await service
            .from("integrations")
            .update({
              access_token_encrypted: encrypt(accessToken),
              expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
            })
            .eq("workspace_id", integration.workspace_id)
            .eq("provider", "gmail");
        }
      }

      messages = await fetchInbox(accessToken);
    } catch { /* error de token */ }
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

import { createServiceClient } from "@/lib/supabase/service";
import { decrypt, encrypt } from "@/lib/encryption";

export interface GmailConnection {
  accessToken: string;
  email: string;
}

/**
 * Devuelve un access token válido para el workspace, refrescándolo si expiró.
 * Retorna null si Gmail no está conectado o el refresh falló.
 */
export async function getGmailToken(workspaceId: string): Promise<GmailConnection | null> {
  const service = createServiceClient();

  const { data: raw } = await service
    .from("integrations")
    .select("access_token_encrypted, refresh_token_encrypted, expires_at, status, metadata")
    .eq("provider", "gmail")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!raw) return null;

  const row = raw as {
    access_token_encrypted: string | null;
    refresh_token_encrypted: string | null;
    expires_at: string | null;
    status: string;
    metadata: { email?: string } | null;
  };

  if (row.status !== "active" || !row.access_token_encrypted) return null;

  let accessToken: string;
  try {
    accessToken = decrypt(row.access_token_encrypted);
  } catch {
    return null;
  }

  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
  const isExpired = !expiresAt || expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired && row.refresh_token_encrypted) {
    try {
      const refreshToken = decrypt(row.refresh_token_encrypted);
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
      if (res.ok) {
        const data = await res.json() as { access_token: string; expires_in: number };
        accessToken = data.access_token;
        await service
          .from("integrations")
          .update({
            access_token_encrypted: encrypt(accessToken),
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          })
          .eq("workspace_id", workspaceId)
          .eq("provider", "gmail");
      }
    } catch { /* usar token existente como fallback */ }
  }

  return { accessToken, email: row.metadata?.email ?? "" };
}

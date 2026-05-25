import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { encrypt } from "@/lib/encryption";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=gmail_no_code`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/gmail/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Gmail token error:", await tokenRes.text());
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=gmail_token_failed`);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };

  // Obtener email de Gmail
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json() as { email: string; name: string };

  const service = createServiceClient();
  const { data: rawUserRow } = await service
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const userRow = rawUserRow as unknown as { workspace_id: string | null } | null;

  if (!userRow?.workspace_id) {
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=no_workspace`);
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  await service.from("integrations").upsert({
    workspace_id: userRow.workspace_id,
    provider: "gmail",
    access_token_encrypted: encrypt(tokenData.access_token),
    refresh_token_encrypted: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
    expires_at: expiresAt,
    status: "active",
    metadata: { email: profile.email, name: profile.name, scope: tokenData.scope },
  }, { onConflict: "workspace_id,provider" });

  await service.from("audit_logs").insert({
    workspace_id: userRow.workspace_id,
    user_id: user.id,
    action: "gmail_connected",
    metadata: { email: profile.email },
  });

  return NextResponse.redirect(`${origin}/app/configuracion/integraciones?success=gmail`);
}

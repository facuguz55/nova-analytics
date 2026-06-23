import { NextResponse } from "next/server";
import { unstable_after as after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { encrypt } from "@/lib/encryption";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const tnStoreId = searchParams.get("user_id"); // TiendaNube envia user_id

  if (!code) {
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=no_code`);
  }

  // Validar state para prevenir CSRF en OAuth
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state_tn")?.value;

  if (!state || !savedState || state !== savedState) {
    console.error("TiendaNube OAuth CSRF: state mismatch");
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=oauth_invalid`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  // Intercambiar code por access_token
  const tokenRes = await fetch("https://www.tiendanube.com/apps/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.TIENDANUBE_CLIENT_ID,
      client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!tokenRes.ok) {
    console.error("TiendaNube token error:", await tokenRes.text());
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=token_failed`);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    token_type: string;
    user_id: number;
    scope: string;
  };

  const storeId = tnStoreId ?? String(tokenData.user_id);
  const service = createServiceClient();

  // Obtener workspace_id del usuario
  const { data: userRow } = await service
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!userRow?.workspace_id) {
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=no_workspace`);
  }

  // Guardar token encriptado
  await service.from("integrations").upsert({
    workspace_id: userRow.workspace_id,
    provider: "tiendanube",
    access_token_encrypted: encrypt(tokenData.access_token),
    status: "active",
    store_id: storeId,
    metadata: { scope: tokenData.scope },
  }, { onConflict: "workspace_id,provider" });

  // Audit log
  await service.from("audit_logs").insert({
    workspace_id: userRow.workspace_id,
    user_id: user.id,
    action: "tiendanube_connected",
    metadata: { store_id: storeId },
  });

  // Sync full en background — corre después del redirect sin bloquear al usuario
  const syncWorkspaceId = userRow.workspace_id;
  const syncAccessToken = tokenData.access_token;
  const syncStoreId = storeId;
  after(async () => {
    const { syncAll } = await import("@/lib/tiendanube/sync");
    await syncAll(syncWorkspaceId, { accessToken: syncAccessToken, storeId: syncStoreId }, "full")
      .catch(console.error);
  });

  const oauthFrom = cookieStore.get("oauth_from")?.value;
  const redirectTo = oauthFrom === "onboarding"
    ? `${origin}/onboarding?success=tiendanube`
    : `${origin}/app/configuracion/integraciones?success=tiendanube`;

  const successResponse = NextResponse.redirect(redirectTo);
  successResponse.cookies.delete("oauth_state_tn");
  successResponse.cookies.delete("oauth_from");
  return successResponse;
}

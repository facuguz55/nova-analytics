import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { encrypt } from "@/lib/encryption";
import { timingSafeEqual } from "crypto";

const BASE_URL = process.env.NEXTAUTH_URL!;
const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;
const REDIRECT_URI = `${BASE_URL}/api/auth/meta/callback`;

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateFromUrl = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !stateFromUrl) {
    return NextResponse.redirect(`${BASE_URL}/app/configuracion/integraciones?error=meta_denied`);
  }

  // Verificar state contra cookie para prevenir CSRF
  const stateFromCookie = req.cookies.get("meta_oauth_state")?.value;
  if (!stateFromCookie || !safeCompare(stateFromUrl, stateFromCookie)) {
    return NextResponse.redirect(`${BASE_URL}/app/configuracion/integraciones?error=token_failed`);
  }

  // Obtener usuario autenticado desde la sesión — nunca desde la URL
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${BASE_URL}/login`);
  }

  try {
    // 1. Intercambiar code por short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      console.error("[meta callback] token exchange failed:", tokenData.error);
      return NextResponse.redirect(`${BASE_URL}/app/configuracion/integraciones?error=token_failed`);
    }

    // 2. Intercambiar por long-lived token (dura 60 días, renovable)
    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    if (longData.error || !longData.access_token) {
      console.error("[meta callback] long-lived exchange failed:", longData.error);
      return NextResponse.redirect(`${BASE_URL}/app/configuracion/integraciones?error=token_failed`);
    }

    const accessToken = longData.access_token;

    // 3. Obtener las Ad Accounts del usuario
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=name,currency,account_status,account_id&access_token=${accessToken}`
    );
    const accountsData = await accountsRes.json();
    const accounts: { id: string; name: string; currency: string; account_status: number; account_id: string }[] =
      accountsData.data ?? [];

    // Filtrar solo cuentas activas (account_status = 1)
    const activeAccounts = accounts.filter((a) => a.account_status === 1);
    if (activeAccounts.length === 0) {
      return NextResponse.redirect(`${BASE_URL}/app/configuracion/integraciones?error=no_ad_accounts`);
    }

    // 4. Obtener workspace_id del usuario autenticado
    const service = createServiceClient();
    const { data: userRow } = await (service as any)
      .from("users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!userRow?.workspace_id) {
      return NextResponse.redirect(`${BASE_URL}/app/configuracion/integraciones?error=no_workspace`);
    }

    // Usar la primera cuenta activa por defecto
    const primaryAccount = activeAccounts[0];
    const adAccountId = primaryAccount.account_id; // sin "act_"

    // 5. Guardar en Supabase
    const encrypted = encrypt(accessToken);
    await (service as any).from("integrations").upsert({
      workspace_id: userRow.workspace_id,
      provider: "meta",
      access_token_encrypted: encrypted,
      store_id: adAccountId,
      status: "active",
      metadata: {
        account_name: primaryAccount.name,
        currency: primaryAccount.currency,
        all_accounts: JSON.stringify(activeAccounts.map((a) => ({
          id: a.account_id,
          name: a.name,
          currency: a.currency,
        }))),
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: "workspace_id,provider" });

    await (service as any).from("audit_logs").insert({
      workspace_id: userRow.workspace_id,
      user_id: user.id,
      action: "integration_connected",
      metadata: { provider: "meta", account_id: adAccountId, account_name: primaryAccount.name },
    });

    const redirectUrl = activeAccounts.length > 1
      ? `${BASE_URL}/app/configuracion/integraciones?success=meta&multi=true`
      : `${BASE_URL}/app/configuracion/integraciones?success=meta`;

    const res = NextResponse.redirect(redirectUrl);
    // Limpiar cookie de state
    res.cookies.set("meta_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    console.error("[meta callback] unexpected error:", err);
    return NextResponse.redirect(`${BASE_URL}/app/configuracion/integraciones?error=token_failed`);
  }
}

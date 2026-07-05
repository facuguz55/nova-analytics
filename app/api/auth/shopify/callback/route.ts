import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { encrypt } from "@/lib/encryption";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

// Verifica la firma HMAC que Shopify agrega a todos los params del callback —
// es la protección anti-forgery real de Shopify (más estricta que el `state`,
// que solo evita CSRF de nuestro lado).
function verifyHmac(searchParams: URLSearchParams, secret: string): boolean {
  const hmac = searchParams.get("hmac");
  if (!hmac) return false;

  const message = Array.from(searchParams.entries())
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const digest = createHmac("sha256", secret).update(message).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const shop = searchParams.get("shop");

  if (!code || !shop) {
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=no_code`);
  }

  if (!verifyHmac(searchParams, process.env.SHOPIFY_CLIENT_SECRET!)) {
    console.error("Shopify OAuth: HMAC inválido");
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=shopify_hmac_invalid`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state_shopify")?.value;
  const savedShop = cookieStore.get("oauth_shop_shopify")?.value;

  if (!state || !savedState || state !== savedState || shop !== savedShop) {
    console.error("Shopify OAuth CSRF: state/shop mismatch");
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=oauth_invalid`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    console.error("Shopify token error:", await tokenRes.text());
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=token_failed`);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    scope: string;
  };

  const service = createServiceClient();

  const { data: userRow } = await service
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!userRow?.workspace_id) {
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=no_workspace`);
  }

  await service.from("integrations").upsert({
    workspace_id: userRow.workspace_id,
    provider: "shopify",
    access_token_encrypted: encrypt(tokenData.access_token),
    status: "active",
    store_id: shop,
    metadata: { scope: tokenData.scope },
  }, { onConflict: "workspace_id,provider" });

  await service.from("audit_logs").insert({
    workspace_id: userRow.workspace_id,
    user_id: user.id,
    action: "shopify_connected",
    metadata: { shop },
  });

  const syncWorkspaceId = userRow.workspace_id;
  const syncAccessToken = tokenData.access_token;
  const syncShop = shop;
  after(async () => {
    const { syncAll } = await import("@/lib/shopify/sync");
    await syncAll(syncWorkspaceId, { accessToken: syncAccessToken, shop: syncShop }, "full")
      .catch(console.error);
  });

  const oauthFrom = cookieStore.get("oauth_from")?.value;
  const redirectTo = oauthFrom === "onboarding"
    ? `${origin}/onboarding?success=shopify`
    : `${origin}/app/configuracion/integraciones?success=shopify`;

  const successResponse = NextResponse.redirect(redirectTo);
  successResponse.cookies.delete("oauth_state_shopify");
  successResponse.cookies.delete("oauth_shop_shopify");
  successResponse.cookies.delete("oauth_from");
  return successResponse;
}

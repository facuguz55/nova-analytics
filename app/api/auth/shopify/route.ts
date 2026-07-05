import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

// Sólo dominios *.myshopify.com — evita SSRF/open redirect si alguien pasa un shop arbitrario.
const SHOP_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop || !SHOP_REGEX.test(shop)) {
    return NextResponse.redirect(`${origin}/app/configuracion/integraciones?error=shopify_invalid_shop`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const clientId = process.env.SHOPIFY_CLIENT_ID!;
  const scopes = process.env.SHOPIFY_SCOPES ?? "read_orders,read_products,read_customers";
  const redirectUri = `${origin}/api/auth/shopify/callback`;

  const state = randomBytes(32).toString("hex");

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  const response = NextResponse.redirect(authUrl);

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };

  response.cookies.set("oauth_state_shopify", state, cookieOpts);
  response.cookies.set("oauth_shop_shopify", shop, cookieOpts);

  if (searchParams.get("from") === "onboarding") {
    response.cookies.set("oauth_from", "onboarding", cookieOpts);
  }

  return response;
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const clientId = process.env.TIENDANUBE_CLIENT_ID!;
  const redirectUri = `${origin}/api/auth/tiendanube/callback`;

  // Generar state criptográficamente seguro para prevenir CSRF en OAuth
  const state = randomBytes(32).toString("hex");

  const authUrl = `https://www.tiendanube.com/apps/${clientId}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  const response = NextResponse.redirect(authUrl);

  // Guardar state en cookie HttpOnly — expira en 10 minutos
  response.cookies.set("oauth_state_tn", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}

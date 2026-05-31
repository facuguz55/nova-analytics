import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const clientId = process.env.TIENDANUBE_CLIENT_ID!;
  const redirectUri = `${origin}/api/auth/tiendanube/callback`;

  const state = randomBytes(32).toString("hex");

  const authUrl = `https://www.tiendanube.com/apps/${clientId}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  const response = NextResponse.redirect(authUrl);

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };

  response.cookies.set("oauth_state_tn", state, cookieOpts);

  // Si viene del onboarding, guardar para que el callback redirija de vuelta
  if (searchParams.get("from") === "onboarding") {
    response.cookies.set("oauth_from", "onboarding", cookieOpts);
  }

  return response;
}

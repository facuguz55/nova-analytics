import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));

  const appId = process.env.META_APP_ID!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/meta/callback`;
  const scopes = "ads_read,read_insights,ads_management";

  // State aleatorio para prevenir CSRF — no incluye el user ID
  const state = randomBytes(32).toString("base64url");

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url.toString());
  // Guardamos el state en cookie HttpOnly SameSite=Lax — el callback lo verifica
  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutos
    path: "/",
  });

  return response;
}

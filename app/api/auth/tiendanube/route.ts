import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const clientId = process.env.TIENDANUBE_CLIENT_ID!;
  const redirectUri = `${origin}/api/auth/tiendanube/callback`;

  const authUrl = `https://www.tiendanube.com/apps/${clientId}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}

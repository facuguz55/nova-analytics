import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Crear workspace y user si no existen
      const service = createServiceClient();
      const { data: existingUser } = await service
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingUser) {
        // Crear workspace
        const name = data.user.user_metadata?.full_name
          || data.user.email?.split("@")[0]
          || "Mi Tienda";
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);

        const { data: workspace } = await service
          .from("workspaces")
          .insert({ name, slug, plan: "free", status: "active" })
          .select("id")
          .single();

        if (workspace) {
          await service.from("users").insert({
            id: data.user.id,
            workspace_id: workspace.id,
            email: data.user.email!,
            role: "client",
            name,
            avatar_url: data.user.user_metadata?.avatar_url ?? null,
          });

          // Config financiera default
          await service.from("financial_config").insert({
            workspace_id: workspace.id,
            usd_rate: 1000,
            tax_rate: 21,
            platform_fee: 8,
            agency_fee: 15,
          });
        }
      }

      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
}

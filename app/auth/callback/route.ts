import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function setupWorkspaceIfNeeded(userId: string, userEmail: string, userMeta: Record<string, string>) {
  const service = createServiceClient();
  const { data: existingUser } = await service
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (existingUser) return; // ya tiene workspace

  const name = userMeta?.full_name || userEmail.split("@")[0] || "Mi Tienda";
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);

  const { data: workspace } = await service
    .from("workspaces")
    .insert({ name, slug, plan: "free", status: "active" })
    .select("id")
    .single();

  if (workspace) {
    await service.from("users").insert({
      id: userId,
      workspace_id: workspace.id,
      email: userEmail,
      role: "client",
      name,
      avatar_url: userMeta?.avatar_url ?? null,
    });

    await service.from("financial_config").insert({
      workspace_id: workspace.id,
      usd_rate: 1000,
      tax_rate: 21,
      platform_fee: 8,
      agency_fee: 15,
    });
  }
}

function safePath(next: string | null): string {
  if (!next) return "/app/dashboard";
  if (next.includes("://") || next.startsWith("//") || next.startsWith("\\")) return "/app/dashboard";
  if (!next.startsWith("/app") && !next.startsWith("/admin") && next !== "/billing") return "/app/dashboard";
  if (/[<>"']/.test(next)) return "/app/dashboard";
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  const supabase = await createClient();

  if (code) {
    // Flujo OAuth o confirmación de email con código
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await setupWorkspaceIfNeeded(
        data.user.id,
        data.user.email!,
        (data.user.user_metadata ?? {}) as Record<string, string>
      );
      return NextResponse.redirect(new URL(safePath(next), origin));
    }
  } else {
    // Sin código — confirmación de email desactivada, el usuario ya tiene sesión activa
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await setupWorkspaceIfNeeded(
        user.id,
        user.email!,
        (user.user_metadata ?? {}) as Record<string, string>
      );
      return NextResponse.redirect(new URL(safePath(next), origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
}

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const LOCKED_API_ROUTES = [
  "/api/ia/chat",
  "/api/tiendanube",
  "/api/cotizaciones",
  "/api/gmail",
  "/api/mails",
  "/api/ai",
];

type SubRow = { status: string; trial_ends_at: string | null };

function hasActiveAccess(sub: SubRow | null): boolean {
  if (!sub) return false;
  if (["active", "pro", "agency"].includes(sub.status)) return true;
  if (sub.status === "trial") {
    const endsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    return !!endsAt && endsAt.getTime() > Date.now();
  }
  return false;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Service client para queries que RLS bloquea al anon
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── Auth: /login y /register ────────────────────────────────────────────────
  if ((path === "/login" || path === "/register") && user) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  // ── Admin: requiere super_admin ─────────────────────────────────────────────
  if (path.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    const { data: profile } = await service.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // ── Dashboard /app/* ────────────────────────────────────────────────────────
  if (path.startsWith("/app")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    const { data: userRow } = await service
      .from("users")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    type URow = { workspace_id: string; role: string };
    const ur = userRow as unknown as URow | null;

    if (ur?.role === "super_admin") return supabaseResponse;

    const workspaceId = ur?.workspace_id;

    const isServerAction =
      request.method === "POST" &&
      !!request.headers.get("next-action") &&
      request.headers.get("origin") === request.nextUrl.origin;

    function billingDenied() {
      return isServerAction
        ? NextResponse.json({ error: "billing_required" }, { status: 402 })
        : NextResponse.redirect(new URL("/billing", request.url));
    }

    if (!workspaceId) return billingDenied();

    // Verificar suspensión
    const { data: wsData } = await service
      .from("workspaces")
      .select("status")
      .eq("id", workspaceId)
      .single();

    if ((wsData as { status: string } | null)?.status === "suspended") {
      if (isServerAction) return NextResponse.json({ error: "account_suspended" }, { status: 403 });
      return NextResponse.redirect(new URL("/suspended", request.nextUrl.origin));
    }

    // Fuente única de verdad: tabla subscriptions
    const { data: sub } = await service
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!hasActiveAccess(sub as SubRow | null)) return billingDenied();

    return supabaseResponse;
  }

  // ── API routes protegidas ───────────────────────────────────────────────────
  const isLockedRoute = LOCKED_API_ROUTES.some((r) => path.startsWith(r));
  if (isLockedRoute) {
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data: row } = await service
      .from("users")
      .select("role, workspace_id")
      .eq("id", user.id)
      .single();

    type URow2 = { role: string; workspace_id: string | null };
    const ur2 = row as unknown as URow2 | null;

    if (ur2?.role === "super_admin") return supabaseResponse;

    const workspaceId = ur2?.workspace_id;
    if (!workspaceId) {
      return NextResponse.json({ error: "Plan requerido", code: "PLAN_LOCKED" }, { status: 403 });
    }

    const { data: sub } = await service
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!hasActiveAccess(sub as SubRow | null)) {
      const expired = (sub as SubRow | null)?.status === "trial";
      return NextResponse.json(
        { error: expired ? "Trial vencido" : "Plan requerido", code: expired ? "TRIAL_EXPIRED" : "PLAN_LOCKED" },
        { status: expired ? 402 : 403 }
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|auth/callback|suspended).*)",
  ],
};

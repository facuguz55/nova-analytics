import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Rutas de API que requieren plan activo (no free)
const LOCKED_API_ROUTES = [
  "/api/ia/chat",
  "/api/tiendanube",
  "/api/cotizaciones",
  "/api/gmail",
  "/api/mails",
  "/api/ai",
];

// Planes que tienen acceso completo
const ACTIVE_PLANS = ["trial", "active", "pro", "agency"];

function isTrialExpired(trialStartedAt: string | null): boolean {
  if (!trialStartedAt) return true;
  const started = new Date(trialStartedAt);
  const expires = new Date(started.getTime() + 14 * 86_400_000);
  return Date.now() > expires.getTime();
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

  // Service client para queries de BD que RLS bloquea al client anon
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

    // Obtener workspace_id y role del usuario (service bypasa RLS)
    const { data: userRow } = await service
      .from("users")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    type URow = { workspace_id: string; role: string };
    const ur = userRow as unknown as URow | null;

    if (ur?.role === "super_admin") return supabaseResponse;

    const workspaceId = ur?.workspace_id;

    // Para server actions devolver JSON en vez de redirect HTML
    const isServerAction =
      request.method === "POST" &&
      !!request.headers.get("next-action") &&
      request.headers.get("origin") === request.nextUrl.origin;

    function billingDenied() {
      return isServerAction
        ? NextResponse.json({ error: "billing_required" }, { status: 402 })
        : NextResponse.redirect(new URL("/billing", request.url));
    }

    if (workspaceId) {
      const { data: wsData } = await service
        .from("workspaces")
        .select("plan, status, trial_started_at")
        .eq("id", workspaceId)
        .single();

      type WsRow = { plan: string; status: string; trial_started_at: string | null };
      const ws = wsData as unknown as WsRow | null;

      if (ws?.status === "suspended") {
        if (isServerAction) return NextResponse.json({ error: "account_suspended" }, { status: 403 });
        return NextResponse.redirect(new URL("/suspended", request.nextUrl.origin));
      }

      const { data: sub } = await service
        .from("subscriptions")
        .select("status, trial_ends_at")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      type SubRow = { status: string; trial_ends_at: string | null };
      const subscription = sub as SubRow | null;

      if (subscription) {
        // Solo bloquear suscripciones explícitamente terminadas
        if (subscription.status === "expired" || subscription.status === "cancelled") {
          return billingDenied();
        }
        if (subscription.status === "trial") {
          const endsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
          if (!endsAt || endsAt.getTime() < Date.now()) return billingDenied();
        }
        return supabaseResponse;
      }

      // Sin registro en subscriptions: plan "free" pasa (ve el PaywallCard en el layout).
      // Solo bloquear trial legacy expirado.
      const plan = ws?.plan ?? "free";
      const trialStartedAt = ws?.trial_started_at ?? null;
      if (plan === "trial" && isTrialExpired(trialStartedAt)) {
        return billingDenied();
      }
    }

    return supabaseResponse;
  }

  // ── API routes protegidas: requieren plan activo ────────────────────────────
  const isLockedRoute = LOCKED_API_ROUTES.some((r) => path.startsWith(r));
  if (isLockedRoute) {
    // Sin auth → 401
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar plan
    const { data: row } = await service
      .from("users")
      .select("role, workspaces(plan, trial_started_at)")
      .eq("id", user.id)
      .single();

    type WorkspaceRow = { plan: string; trial_started_at: string | null };
    const ws = (row as unknown as { role: string; workspaces: WorkspaceRow | null } | null);
    const isSuperAdmin = ws?.role === "super_admin";
    const plan = ws?.workspaces?.plan ?? "free";
    const trialStartedAt = ws?.workspaces?.trial_started_at ?? null;

    const hasAccess =
      isSuperAdmin ||
      (ACTIVE_PLANS.includes(plan) &&
        !(plan === "trial" && isTrialExpired(trialStartedAt)));

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Plan requerido", code: "PLAN_LOCKED" },
        { status: 403 }
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

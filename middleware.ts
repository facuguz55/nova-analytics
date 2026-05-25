import { createServerClient } from "@supabase/ssr";
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

  // ── Auth: /login y /register ────────────────────────────────────────────────
  if ((path === "/login" || path === "/register") && user) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  // ── Admin: requiere super_admin ─────────────────────────────────────────────
  if (path.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
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
    // La protección de paywall se hace en el layout (más rápido, sin DB query extra)
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
    const { data: row } = await supabase
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
    "/((?!_next/static|_next/image|favicon.ico|api/auth|auth/callback).*)",
  ],
};

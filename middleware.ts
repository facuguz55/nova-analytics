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

type SubRow = { status: string; trial_ends_at: string | null; next_billing_at: string | null };

// ── Cookie de acceso firmada ──────────────────────────────────────────────────
// El chequeo completo (users + workspaces + subscriptions) son 3 roundtrips a
// Supabase POR CADA navegación del sidebar. Cacheamos el veredicto 60 segundos
// en una cookie HMAC-firmada atada al user.id: las navegaciones repetidas solo
// pagan el getUser() de auth. Suspensión/vencimiento se aplica con ≤60s de delay.
const ACCESS_COOKIE = "na_access";
const ACCESS_TTL_MS = 60_000;

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, "");
}

async function makeAccessCookie(userId: string, secret: string): Promise<string> {
  const exp = Date.now() + ACCESS_TTL_MS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${await hmacSign(payload, secret)}`;
}

async function isAccessCookieValid(value: string | undefined, userId: string, secret: string): Promise<boolean> {
  if (!value) return false;
  const [uid, expStr, sig] = value.split(".");
  if (uid !== userId || !expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return (await hmacSign(`${uid}.${expStr}`, secret)) === sig;
}

// Gracia tras el vencimiento de pago antes de cortar el acceso (reintentos de MP, etc.)
const BILLING_GRACE_MS = 3 * 86_400_000; // 3 días

function hasActiveAccess(sub: SubRow | null): boolean {
  if (!sub) return false;

  if (["active", "pro", "agency"].includes(sub.status)) {
    // Red de seguridad: si hay fecha de próximo cobro y ya venció hace más
    // de la gracia, se corta el acceso aunque el webhook de baja nunca llegue.
    // next_billing_at null = grant manual/admin (comp) → no expira.
    if (sub.next_billing_at) {
      const due = new Date(sub.next_billing_at).getTime();
      if (Number.isFinite(due) && Date.now() > due + BILLING_GRACE_MS) return false;
    }
    return true;
  }

  if (sub.status === "trial") {
    const endsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    return !!endsAt && endsAt.getTime() > Date.now();
  }

  // Cancelada: el usuario ya pagó el período en curso → conserva acceso
  // hasta next_billing_at exacto (sin gracia extra), después se corta.
  if (sub.status === "cancelled") {
    if (!sub.next_billing_at) return false;
    const due = new Date(sub.next_billing_at).getTime();
    return Number.isFinite(due) && Date.now() < due;
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
    const { data: profile } = await service.from("users").select("role").eq("id", user.id).single();
    const target = profile?.role === "super_admin" ? "/admin/hq" : "/app/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
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

    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Cache hit: veredicto de acceso ya verificado hace <60s para este usuario
    // → ahorramos los 2-3 roundtrips a la base en cada click del sidebar.
    if (await isAccessCookieValid(request.cookies.get(ACCESS_COOKIE)?.value, user.id, secret)) {
      return supabaseResponse;
    }

    // users + workspaces(status) en un solo roundtrip vía join
    const { data: userRow } = await service
      .from("users")
      .select("workspace_id, role, workspaces(status)")
      .eq("id", user.id)
      .single();

    type URow = { workspace_id: string; role: string; workspaces: { status: string } | null };
    const ur = userRow as unknown as URow | null;

    async function grantAccess() {
      supabaseResponse.cookies.set(ACCESS_COOKIE, await makeAccessCookie(user!.id, secret), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: Math.floor(ACCESS_TTL_MS / 1000),
        path: "/",
      });
      return supabaseResponse;
    }

    if (ur?.role === "super_admin") return grantAccess();

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

    // Verificar suspensión (status ya vino en el join de arriba)
    if (ur?.workspaces?.status === "suspended") {
      if (isServerAction) return NextResponse.json({ error: "account_suspended" }, { status: 403 });
      return NextResponse.redirect(new URL("/suspended", request.nextUrl.origin));
    }

    // Fuente única de verdad: tabla subscriptions
    const { data: sub } = await service
      .from("subscriptions")
      .select("status, trial_ends_at, next_billing_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!hasActiveAccess(sub as SubRow | null)) return billingDenied();

    return grantAccess();
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
      .select("status, trial_ends_at, next_billing_at")
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

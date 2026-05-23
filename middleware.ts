import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de Nova Analytics
 * - Auth guard: protege /app/* y /admin/*
 * - Rate limiting básico (se expande en Fase Seguridad)
 *
 * TODO: Integrar con Supabase Auth cuando se configure la DB.
 */

// Rutas que requieren autenticación
const PROTECTED_PREFIXES = ["/app", "/admin"];

// Rutas públicas (siempre accesibles)
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/api/health",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si la ruta requiere autenticación
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // TODO: Verificar sesión con Supabase Auth
  // Por ahora, permitir acceso (se bloquea cuando se implemente Auth)
  // const session = await getSession(request);
  // if (!session) {
  //   return NextResponse.redirect(new URL("/auth/login", request.url));
  // }

  // Agregar headers de seguridad adicionales
  const response = NextResponse.next();
  response.headers.set("X-Workspace-Protected", "true");

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

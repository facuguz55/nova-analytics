import { createServiceClient } from "@/lib/supabase/service";

// ── Rate limiting por IP (en memoria, para rutas públicas) ──────────────────
// Solo se usa en callbacks OAuth y rutas sin auth — no importa que sea
// por instancia porque son requests cortos y sin costo de API.

const ipStore = new Map<string, { count: number; reset: number }>();

function checkIP(ip: string): boolean {
  const now = Date.now();
  const entry = ipStore.get(ip);
  if (!entry || now > entry.reset) {
    ipStore.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 60; // 60 requests por minuto por IP
}

export function rateLimit(ip: string): { ok: boolean; error?: string } {
  if (!checkIP(ip)) {
    return { ok: false, error: "Demasiadas solicitudes. Intentá en un minuto." };
  }
  return { ok: true };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// ── Rate limiting por usuario en Supabase (para endpoints de IA) ────────────
// Funciona en todos los servidores de Vercel porque el estado está en la DB.

type RateLimitResult = {
  allowed: boolean;
  count: number;
  max: number;
  remaining: number;
};

/**
 * Verifica el rate limit de un usuario para un endpoint específico.
 * Usa la función check_rate_limit de Supabase (atómica, sin race conditions).
 *
 * @param userId   - ID del usuario autenticado
 * @param endpoint - Nombre del endpoint (ej: "ia_chat", "ai_suggest", "mail_reply")
 * @param max      - Máximo de requests permitidos en la ventana
 * @param windowSeconds - Tamaño de la ventana en segundos (default: 3600 = 1 hora)
 */
export async function checkUserRateLimit(
  userId: string,
  endpoint: string,
  max: number,
  windowSeconds = 3600,
  // Endpoints con costo monetario directo (API de Anthropic) → fail-closed:
  // si el backend de rate-limit no responde, NO dejamos pasar ilimitado, porque
  // un atacante que sature la RPC desactivaría el límite y dispararía el costo.
  failClosed = false
): Promise<{ ok: boolean; error?: string; remaining?: number }> {
  const denyOnError = () =>
    failClosed
      ? { ok: false, error: "Servicio de límites no disponible. Probá en un momento." }
      : { ok: true };

  try {
    const service = createServiceClient();
    const { data, error } = await service.rpc("check_rate_limit", {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_max_requests: max,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("Rate limit DB error:", error.message);
      return denyOnError();
    }

    const result = data as RateLimitResult;

    if (!result.allowed) {
      return {
        ok: false,
        error: `Límite alcanzado (${result.max} por hora). Intentá más tarde.`,
        remaining: 0,
      };
    }

    return { ok: true, remaining: result.remaining };
  } catch (err) {
    console.error("Rate limit error:", err);
    return denyOnError();
  }
}

// Límites por endpoint — ajustá según necesites
export const RATE_LIMITS = {
  ia_chat:     { max: 20,  windowSeconds: 3600 }, // 20 mensajes/hora
  ai_suggest:  { max: 15,  windowSeconds: 3600 }, // 15 sugerencias/hora
  mail_reply:  { max: 30,  windowSeconds: 3600 }, // 30 respuestas/hora
  mail_send:   { max: 60,  windowSeconds: 3600 }, // 60 envíos nuevos/hora (incluye envíos masivos)
} as const;

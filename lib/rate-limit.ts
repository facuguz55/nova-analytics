const store = new Map<string, { count: number; reset: number }>();

const LIMITS = {
  ip: { max: 60, windowMs: 60_000 },
  workspace: { max: 100, windowMs: 60_000 },
};

function check(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export function rateLimit(ip: string, workspaceId?: string): { ok: boolean; error?: string } {
  if (!check(`ip:${ip}`, LIMITS.ip.max, LIMITS.ip.windowMs)) {
    return { ok: false, error: "Demasiadas solicitudes. Intenta en un minuto." };
  }
  if (workspaceId && !check(`ws:${workspaceId}`, LIMITS.workspace.max, LIMITS.workspace.windowMs)) {
    return { ok: false, error: "Limite de workspace alcanzado. Intenta en un minuto." };
  }
  return { ok: true };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

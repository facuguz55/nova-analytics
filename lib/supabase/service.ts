import { createClient } from "@supabase/supabase-js";

// Service role client — solo usar en API routes (servidor)
// Bypasea RLS — NUNCA exponer al cliente
// Sin genérico para evitar problemas de inferencia en @supabase/supabase-js 2.106+
// (el service client es server-only, type safety no es crítico aquí)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

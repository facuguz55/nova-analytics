import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { decrypt } from "@/lib/encryption";
import type { TiendaNubeOptions } from "./client";

export interface TiendaNubeConnection {
  opts: TiendaNubeOptions;
  storeName: string | null;
  storeId: string;
}

export async function getTiendaNubeConnection(): Promise<TiendaNubeConnection | null> {
  // getUser() usa React cache() — si el layout o la page ya llamaron a getUser(),
  // esta llamada devuelve el resultado cacheado sin ir a Supabase de nuevo.
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  // Primero obtener el workspace_id del usuario y filtrar explícitamente.
  // Sin este filtro, la query depende 100% de que RLS esté configurado con
  // workspace_id = (SELECT workspace_id FROM users WHERE id = auth.uid())
  // lo cual puede fallar silenciosamente si la política no está exacta.
  const { data: rawUserRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  const userRow = rawUserRow as unknown as { workspace_id: string | null } | null;
  if (!userRow?.workspace_id) return null;

  type IntRow = {
    access_token_encrypted: string | null;
    store_id: string | null;
    status: string;
    metadata: Record<string, string> | null;
  };

  const { data: raw } = await supabase
    .from("integrations")
    .select("access_token_encrypted, store_id, status, metadata")
    .eq("provider", "tiendanube")
    .eq("workspace_id", userRow.workspace_id)  // filtro explícito — no depende solo de RLS
    .maybeSingle();

  const integration = raw as unknown as IntRow | null;
  if (!integration?.access_token_encrypted || integration.status !== "active" || !integration.store_id) {
    return null;
  }

  // Defensiva: si decrypt() falla (p.ej. ENCRYPTION_KEY mal configurada en
  // Vercel, o token corrupto), no rompemos toda la página — devolvemos null.
  let accessToken: string;
  try {
    accessToken = decrypt(integration.access_token_encrypted);
  } catch (err) {
    console.error("[tiendanube] decrypt failed:", err);
    return null;
  }

  return {
    opts: { accessToken, storeId: integration.store_id },
    storeName: integration.metadata?.store_name ?? null,
    storeId: integration.store_id,
  };
}

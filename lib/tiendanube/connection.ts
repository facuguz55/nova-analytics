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
    .maybeSingle();

  const integration = raw as unknown as IntRow | null;
  if (!integration?.access_token_encrypted || integration.status !== "active" || !integration.store_id) {
    return null;
  }

  const accessToken = decrypt(integration.access_token_encrypted);
  return {
    opts: { accessToken, storeId: integration.store_id },
    storeName: integration.metadata?.store_name ?? null,
    storeId: integration.store_id,
  };
}

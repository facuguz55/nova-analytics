import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import type { TiendaNubeOptions } from "./client";

export interface TiendaNubeConnection {
  opts: TiendaNubeOptions;
  storeName: string | null;
  storeId: string;
}

export async function getTiendaNubeConnection(): Promise<TiendaNubeConnection | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

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

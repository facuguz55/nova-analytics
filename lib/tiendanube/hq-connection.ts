import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import type { TiendaNubeOptions } from "./client";

export async function getTNConnectionForWorkspace(workspaceId: string): Promise<{
  opts: TiendaNubeOptions;
  storeName: string | null;
  storeId: string;
} | null> {
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
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const integration = raw as unknown as IntRow | null;
  if (!integration?.access_token_encrypted || integration.status !== "active" || !integration.store_id) {
    return null;
  }

  let accessToken: string;
  try {
    accessToken = decrypt(integration.access_token_encrypted);
  } catch {
    return null;
  }

  return {
    opts: { accessToken, storeId: integration.store_id },
    storeName: integration.metadata?.store_name ?? null,
    storeId: integration.store_id,
  };
}

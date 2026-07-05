import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { decrypt } from "@/lib/encryption";
import type { ShopifyOptions } from "./client";

export interface ShopifyConnection {
  opts: ShopifyOptions;
  storeName: string | null;
  shop: string;
}

export async function getShopifyConnection(): Promise<ShopifyConnection | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

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
    .eq("provider", "shopify")
    .eq("workspace_id", userRow.workspace_id)
    .maybeSingle();

  const integration = raw as unknown as IntRow | null;
  if (!integration?.access_token_encrypted || integration.status !== "active" || !integration.store_id) {
    return null;
  }

  let accessToken: string;
  try {
    accessToken = decrypt(integration.access_token_encrypted);
  } catch (err) {
    console.error("[shopify] decrypt failed:", err);
    return null;
  }

  return {
    opts: { accessToken, shop: integration.store_id },
    storeName: integration.metadata?.store_name ?? null,
    shop: integration.store_id,
  };
}

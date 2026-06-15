import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { decrypt } from "@/lib/encryption";

export interface MetaConnection {
  accessToken: string;
  adAccountId: string;
}

export async function getMetaConnection(): Promise<MetaConnection | null> {
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
  };

  const { data: raw } = await supabase
    .from("integrations")
    .select("access_token_encrypted, store_id, status")
    .eq("provider", "meta")
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
    console.error("[meta] decrypt failed:", err);
    return null;
  }

  return { accessToken, adAccountId: integration.store_id };
}

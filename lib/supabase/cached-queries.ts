// Deduplica llamadas a auth dentro del mismo request (layout + page = mismo árbol)
// React cache() garantiza que getUser() solo llama a Supabase UNA vez por render pass
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "./server";
import { createServiceClient } from "./service";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

// unstable_cache — persiste entre requests en el Data Cache de Next.js.
// Usa service client porque unstable_cache no puede leer cookies.
// TTL 5 min. Invalidar con revalidateTag("user-row") tras mutaciones de perfil.
export const getCachedUserRow = unstable_cache(
  async (userId: string) => {
    const db = createServiceClient() as any;
    const { data } = await db
      .from("users")
      .select("name, email, avatar_url, role, workspace_id, workspaces(id, name, plan, status, onboarding_completed)")
      .eq("id", userId)
      .single();
    return data as {
      name: string | null;
      email: string;
      avatar_url: string | null;
      role: string;
      workspace_id: string;
      workspaces: { id: string; name: string; plan: string; status: string; onboarding_completed: boolean } | null;
    } | null;
  },
  ["user-row"],
  { revalidate: 300, tags: ["user-row"] }
);

// TTL 5 min. Invalidar con revalidateTag("financial-config").
export const getCachedFinancialConfig = unstable_cache(
  async (workspaceId: string) => {
    const db = createServiceClient() as any;
    const { data } = await db
      .from("financial_config")
      .select("usd_rate, tax_rate, platform_fee, agency_fee")
      .eq("workspace_id", workspaceId)
      .single();
    return data as { usd_rate: number; tax_rate: number; platform_fee: number; agency_fee: number } | null;
  },
  ["financial-config"],
  { revalidate: 300, tags: ["financial-config"] }
);

// TTL 5 min. Invalidar con revalidateTag("integrations").
export const getCachedIntegrations = unstable_cache(
  async (workspaceId: string) => {
    const db = createServiceClient() as any;
    const { data } = await db
      .from("integrations")
      .select("provider, status")
      .eq("workspace_id", workspaceId)
      .eq("status", "active");
    return (data ?? []) as { provider: string; status: string }[];
  },
  ["integrations"],
  { revalidate: 300, tags: ["integrations"] }
);

// TTL 60 seg. Invalidar con revalidateTag("alert-count").
export const getCachedAlertCount = unstable_cache(
  async (workspaceId: string) => {
    const db = createServiceClient() as any;
    const { count } = await db
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("read", false);
    return count ?? 0;
  },
  ["alert-count"],
  { revalidate: 60, tags: ["alert-count"] }
);

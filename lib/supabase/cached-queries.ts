import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "./server";
import { createServiceClient } from "./service";

// React cache — deduplica auth dentro del mismo request
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

// Tags por usuario/workspace — revalidar solo el cache del usuario afectado,
// no de todos. Permite escalar a muchos clientes sin invalidaciones masivas.

export function getCachedUserRow(userId: string) {
  return unstable_cache(
    async () => {
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
    [`user-row`, userId],
    { revalidate: 300, tags: [`user-row-${userId}`] }
  )();
}

// TTL 5 min. Invalidar con revalidateTag(`financial-config-${workspaceId}`).
export function getCachedFinancialConfig(workspaceId: string) {
  return unstable_cache(
    async () => {
      const db = createServiceClient() as any;
      const { data } = await db
        .from("financial_config")
        .select("usd_rate, tax_rate, platform_fee, custom_commission")
        .eq("workspace_id", workspaceId)
        .single();
      return data as { usd_rate: number; tax_rate: number; platform_fee: number; custom_commission: number } | null;
    },
    [`financial-config`, workspaceId],
    { revalidate: 300, tags: [`financial-config-${workspaceId}`] }
  )();
}

// TTL 5 min. Invalidar con revalidateTag(`integrations-${workspaceId}`).
export function getCachedIntegrations(workspaceId: string) {
  return unstable_cache(
    async () => {
      const db = createServiceClient() as any;
      const { data } = await db
        .from("integrations")
        .select("provider, status")
        .eq("workspace_id", workspaceId)
        .eq("status", "active");
      return (data ?? []) as { provider: string; status: string }[];
    },
    [`integrations`, workspaceId],
    { revalidate: 300, tags: [`integrations-${workspaceId}`] }
  )();
}

// TTL 60 seg. Invalidar con revalidateTag(`alert-count-${workspaceId}`).
export function getCachedAlertCount(workspaceId: string) {
  return unstable_cache(
    async () => {
      const db = createServiceClient() as any;
      const { count } = await db
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("read", false);
      return count ?? 0;
    },
    [`alert-count`, workspaceId],
    { revalidate: 60, tags: [`alert-count-${workspaceId}`] }
  )();
}

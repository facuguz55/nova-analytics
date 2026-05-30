import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import ClientesAdmin from "./ClientesAdmin";

export const metadata: Metadata = { title: "Clientes — Nova HQ" };

export default async function ClientesPage() {
  const service = createServiceClient();

  type WsRow = { id: string; name: string; plan: string; status: string; created_at: string };
  type UserRow = { id: string; email: string; name: string | null; role: string; workspace_id: string | null; created_at: string };
  type SubRow = { workspace_id: string; status: string; trial_ends_at: string | null; next_billing_at: string | null; provider: string | null };

  const [wsRes, userRes, subRes] = await Promise.allSettled([
    service.from("workspaces").select("id, name, plan, status, created_at").order("created_at", { ascending: false }),
    service.from("users").select("id, email, name, role, workspace_id, created_at").order("created_at", { ascending: false }),
    service.from("subscriptions").select("workspace_id, status, trial_ends_at, next_billing_at, provider"),
  ]);

  const workspaces = (wsRes.status === "fulfilled" ? wsRes.value.data ?? [] : []) as WsRow[];
  const users      = (userRes.status === "fulfilled" ? userRes.value.data ?? [] : []) as UserRow[];
  const subs       = (subRes.status === "fulfilled" ? subRes.value.data ?? [] : []) as SubRow[];

  const clients = workspaces.map((ws) => {
    const wsUsers = users.filter((u) => u.workspace_id === ws.id);
    const sub     = subs.find((s) => s.workspace_id === ws.id) ?? null;
    return { workspace: ws, users: wsUsers, subscription: sub };
  });

  return <ClientesAdmin clients={clients} />;
}

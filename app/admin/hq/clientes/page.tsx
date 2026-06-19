import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import ClientesHQClient from "./ClientesHQClient";

export const metadata: Metadata = { title: "Clientes por Tienda — Nova HQ" };

export default async function ClientesHQPage() {
  const service = createServiceClient();

  type WsRow = { id: string; name: string; plan: string };
  type CustRow = {
    id: string; workspace_id: string; name: string;
    phone: string | null; email: string | null;
    dni: string | null; notes: string | null; created_at: string;
  };

  const [wsRes, custRes] = await Promise.allSettled([
    service.from("workspaces").select("id, name, plan").order("name"),
    service
      .from("local_customers")
      .select("id, workspace_id, name, phone, email, dni, notes, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const workspaces = (wsRes.status === "fulfilled" ? wsRes.value.data ?? [] : []) as WsRow[];
  const customers  = (custRes.status === "fulfilled" ? custRes.value.data ?? [] : []) as CustRow[];

  return <ClientesHQClient workspaces={workspaces} customers={customers} />;
}

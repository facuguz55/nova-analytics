import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import HQClient from "./HQClient";

export const metadata: Metadata = { title: "HQ — Clientes por Tienda" };

export default async function HQPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (userRow as { role: string } | null)?.role ?? "client";
  if (role !== "super_admin") redirect("/app/dashboard");

  // Todos los clientes de todas las tiendas (super_admin bypasses workspace isolation)
  const { data: customersRaw } = await supabase
    .from("local_customers")
    .select(`
      id, name, dni, phone, email, created_at, workspace_id,
      workspaces(name),
      local_sales!customer_id(id, total, created_at)
    `)
    .order("created_at", { ascending: false });

  type SaleMini      = { id: string; total: number; created_at: string };
  type CustomerRow   = {
    id: string; name: string; dni: string | null; phone: string | null;
    email: string | null; created_at: string; workspace_id: string;
    workspaces: { name: string } | null;
    local_sales: SaleMini[];
  };

  // Workspaces únicos del resultado
  const customers = (customersRaw ?? []) as unknown as CustomerRow[];
  const wsMap = new Map<string, string>();
  customers.forEach((c) => {
    if (c.workspace_id && c.workspaces?.name) wsMap.set(c.workspace_id, c.workspaces.name);
  });
  const workspaces = Array.from(wsMap.entries()).map(([id, name]) => ({ id, name }));

  return <HQClient customers={customers} workspaces={workspaces} />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import LocalClientesClient from "./LocalClientesClient";

export const metadata: Metadata = { title: "Clientes — Local Físico" };

export default async function LocalClientesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id, workspaces(plan)")
    .eq("id", user.id)
    .single();

  const row = userRow as { workspace_id: string; workspaces: { plan: string } } | null;
  const plan        = row?.workspaces?.plan ?? "free";
  const workspaceId = row?.workspace_id    ?? "";

  if (plan !== "pro" && plan !== "agency") redirect("/app/planes");

  // Clientes con conteo de compras y total gastado
  const { data: customersRaw } = await supabase
    .from("local_customers")
    .select(`
      id, name, dni, phone, email, created_at,
      local_sales!customer_id(id, total, created_at)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  type SaleMini = { id: string; total: number; created_at: string };
  type CustomerRow = {
    id: string; name: string; dni: string | null; phone: string | null;
    email: string | null; created_at: string;
    local_sales: SaleMini[];
  };

  const customers = (customersRaw ?? []) as unknown as CustomerRow[];

  return <LocalClientesClient customers={customers} />;
}

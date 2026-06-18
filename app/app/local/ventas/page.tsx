import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import LocalVentasClient from "./LocalVentasClient";

export const metadata: Metadata = { title: "Ventas — Local Físico" };

export default async function LocalVentasPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id, workspaces(plan)")
    .eq("id", user.id)
    .single();

  const row = userRow as { workspace_id: string; workspaces: { plan: string } } | null;
  const plan = row?.workspaces?.plan ?? "free";
  const workspaceId = row?.workspace_id ?? "";

  if (plan !== "pro" && plan !== "agency") redirect("/app/planes");

  const { data: salesRaw } = await supabase
    .from("local_sales")
    .select(`
      id, total, payment_method, installments, notes, created_at, customer_id,
      local_sale_items(product_name, unit_price, unit_cost, quantity),
      local_customers(name, dni)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(200);

  type ItemRow = { product_name: string; unit_price: number; unit_cost: number; quantity: number };
  type SaleRow = {
    id: string;
    total: number;
    payment_method: string;
    installments: number | null;
    notes: string | null;
    created_at: string;
    customer_id: string | null;
    local_customers: { name: string; dni: string | null } | null;
    local_sale_items: ItemRow[];
  };

  const sales = (salesRaw ?? []) as unknown as SaleRow[];

  return <LocalVentasClient sales={sales} />;
}

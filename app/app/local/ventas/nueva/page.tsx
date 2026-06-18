import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import NuevaVentaClient from "./NuevaVentaClient";

export const metadata: Metadata = { title: "Registrar venta — Local Físico" };

export default async function NuevaVentaPage() {
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

  const { data: productsRaw } = await supabase
    .from("local_products")
    .select("id, name, sku, price, cost, stock, category")
    .eq("workspace_id", workspaceId)
    .order("name");

  type ProductRow = { id: string; name: string; sku: string | null; price: number; cost: number; stock: number; category: string | null };
  const products = (productsRaw ?? []) as unknown as ProductRow[];

  return <NuevaVentaClient products={products} />;
}

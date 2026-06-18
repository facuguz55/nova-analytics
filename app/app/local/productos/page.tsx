import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import LocalProductosClient from "./LocalProductosClient";

export const metadata: Metadata = { title: "Productos — Local Físico" };

export default async function LocalProductosPage() {
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
    .select("id, name, sku, category, cost, price, stock, min_stock, created_at")
    .eq("workspace_id", workspaceId)
    .order("name");

  type ProductRow = {
    id: string; name: string; sku: string | null; category: string | null;
    cost: number; price: number; stock: number; min_stock: number; created_at: string;
  };
  const products = (productsRaw ?? []) as unknown as ProductRow[];

  return <LocalProductosClient products={products} />;
}

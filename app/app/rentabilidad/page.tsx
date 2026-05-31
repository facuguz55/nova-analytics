import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getAllProducts } from "@/lib/tiendanube/client";
import RentabilidadClient from "./RentabilidadClient";

export const metadata: Metadata = { title: "Rentabilidad" };

export default async function RentabilidadPage() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();

  type FinConfig = { tax_rate: number; platform_fee: number; agency_fee: number; usd_rate: number };
  const { data: rawUserRow } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const userRow = rawUserRow as unknown as { workspace_id: string | null } | null;

  const [connectionResult, configResult] = await Promise.allSettled([
    getTiendaNubeConnection(),
    supabase.from("financial_config").select("*").eq("workspace_id", userRow?.workspace_id ?? "").single(),
  ]);

  const connection = connectionResult.status === "fulfilled" ? connectionResult.value : null;
  const rawConfig = configResult.status === "fulfilled" ? configResult.value.data : null;
  const cfg = (rawConfig as unknown as FinConfig | null) ?? { tax_rate: 21, platform_fee: 2, agency_fee: 0, usd_rate: 1200 };

  let rawOrders: Awaited<ReturnType<typeof getOrdersForRange>> = [];
  let products: import("@/lib/tiendanube/client").TNProduct[] = [];

  if (connection) {
    const [ordersRes, productsRes] = await Promise.allSettled([
      getOrdersForRange(connection.opts, { days: 90 }, 3),
      getAllProducts(connection.opts),
    ]);
    if (ordersRes.status === "fulfilled") rawOrders = ordersRes.value;
    if (productsRes.status === "fulfilled") products = productsRes.value;
  }

  return (
    <RentabilidadClient
      connected={!!connection}
      rawOrders={rawOrders}
      products={products}
      cfg={cfg}
    />
  );
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getAllProducts } from "@/lib/tiendanube/client";
import RentabilidadClient from "./RentabilidadClient";
import { DEFAULT_SHIPPING_COSTS } from "../configuracion/financiera/shipping-defaults";
import type { AdditionalCost } from "../configuracion/costos-adicionales/CostosAdicionalesClient";

export const metadata: Metadata = { title: "Rentabilidad" };

export default async function RentabilidadPage() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();

  type FinConfig = { tax_rate: number; platform_fee: number; custom_commission: number; usd_rate: number };
  const { data: rawUserRow } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const userRow = rawUserRow as unknown as { workspace_id: string | null } | null;

  const [connectionResult, configResult, shippingResult, costsResult] = await Promise.allSettled([
    getTiendaNubeConnection(),
    supabase.from("financial_config").select("*").eq("workspace_id", userRow?.workspace_id ?? "").single(),
    supabase.from("shipping_costs").select("cost, is_active").eq("workspace_id", userRow?.workspace_id ?? ""),
    supabase.from("additional_costs").select("*").eq("workspace_id", userRow?.workspace_id ?? ""),
  ]);

  const connection = connectionResult.status === "fulfilled" ? connectionResult.value : null;
  const rawConfig = configResult.status === "fulfilled" ? configResult.value.data : null;
  const cfg = (rawConfig as unknown as FinConfig | null) ?? { tax_rate: 21, platform_fee: 2, custom_commission: 0, usd_rate: 1200 };

  const shippingRows = shippingResult.status === "fulfilled"
    ? ((shippingResult.value.data ?? []) as { cost: number; is_active: boolean }[])
    : [];
  // Sin filas guardadas → misma referencia de mercado que se muestra en Configuración Financiera,
  // para que el simulador y la rentabilidad real no muestren costos de envío distintos.
  const shippingForAvg = shippingRows.length > 0 ? shippingRows : DEFAULT_SHIPPING_COSTS;
  const activeShipping = shippingForAvg.filter(r => r.is_active && r.cost > 0);
  const avgShippingCost = activeShipping.length
    ? activeShipping.reduce((s, r) => s + Number(r.cost), 0) / activeShipping.length
    : 0;

  const additionalCosts = costsResult.status === "fulfilled" ? ((costsResult.value.data ?? []) as AdditionalCost[]) : [];
  const totalFixedMonthly = additionalCosts.filter(c => c.type === "fixed").reduce((s, c) => s + Number(c.amount), 0);
  const totalVariablePct  = additionalCosts.filter(c => c.type === "variable").reduce((s, c) => s + Number(c.amount), 0);

  let rawOrders: Awaited<ReturnType<typeof getOrdersForRange>> = [];
  let products: import("@/lib/tiendanube/client").TNProduct[] = [];

  if (connection) {
    const [ordersRes, productsRes] = await Promise.allSettled([
      getOrdersForRange(connection.opts, { days: 90 }),
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
      avgShippingCost={avgShippingCost}
      totalFixedMonthly={totalFixedMonthly}
      totalVariablePct={totalVariablePct}
    />
  );
}

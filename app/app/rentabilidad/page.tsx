import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getAllProducts } from "@/lib/tiendanube/client";
import RentabilidadClient from "./RentabilidadClient";
import type { LocalSalesData } from "./RentabilidadClient";
import { DEFAULT_SHIPPING_COSTS } from "../configuracion/financiera/shipping-defaults";
import type { AdditionalCost } from "../configuracion/costos-adicionales/CostosAdicionalesClient";
import { createNovaLocalClient } from "@/lib/supabase/nova-local";

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

  let localData: LocalSalesData | null = null;
  try {
    if (process.env.NOVA_LOCAL_SUPABASE_URL) {
      const local = createNovaLocalClient();

      if (!user.email_confirmed_at) {
        localData = { linked: false, sales: [], products: [], costs: { fixedMonthly: 0, variablePct: 0 } };
      }

      const { data: { users: localUsers } } = await local.auth.admin.listUsers();
      const normalizedEmail = user.email!.toLowerCase().trim();
      const matchedUser = localUsers.find(
        (u) => u.email?.toLowerCase().trim() === normalizedEmail && u.email_confirmed_at
      );

      let tiendaId: string | null = null;
      if (matchedUser) {
        const { data: tienda } = await local
          .from("tiendas")
          .select("id")
          .eq("owner_id", matchedUser.id)
          .limit(1)
          .single();
        tiendaId = tienda?.id ?? null;
      }

      if (tiendaId) {
        const since = new Date(Date.now() - 90 * 86_400_000).toISOString();

        const [salesRes, prodsRes, fixedRes, varRes] = await Promise.all([
          local.from("local_ventas").select("id, total, created_at, medio_pago, cancelada")
            .eq("tienda_id", tiendaId).eq("cancelada", false).gte("created_at", since),
          local.from("local_modelos").select("id, marca, modelo, costo, precio").eq("tienda_id", tiendaId),
          local.from("local_costos_extra").select("nombre, monto").eq("tienda_id", tiendaId),
          local.from("local_costos_variables").select("nombre, porcentaje, aplica_a").eq("tienda_id", tiendaId),
        ]);

        localData = {
          linked: true,
          sales: (salesRes.data ?? []).map((s) => ({
            id: s.id, total: Number(s.total), created_at: s.created_at, medio_pago: s.medio_pago,
          })),
          products: (prodsRes.data ?? []).map((p) => ({
            id: p.id, name: `${p.marca} ${p.modelo}`.trim(), cost: Number(p.costo), price: Number(p.precio),
          })),
          costs: {
            fixedMonthly: (fixedRes.data ?? []).reduce((s, c) => s + Number(c.monto), 0),
            variablePct: (varRes.data ?? []).reduce((s, c) => s + Number(c.porcentaje), 0),
          },
        };
      } else {
        localData = { linked: false, sales: [], products: [], costs: { fixedMonthly: 0, variablePct: 0 } };
      }
    } else {
      localData = { linked: false, sales: [], products: [], costs: { fixedMonthly: 0, variablePct: 0 } };
    }
  } catch {
    localData = null;
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
      localData={localData}
    />
  );
}

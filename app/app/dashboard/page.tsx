import type { Metadata } from "next";
import { getUser, getCachedUserRow, getCachedFinancialConfig } from "@/lib/supabase/cached-queries";
import { createServiceClient } from "@/lib/supabase/service";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getCustomers, type TNOrder } from "@/lib/tiendanube/client";
import DashboardClient from "./DashboardClient";
import { DEFAULT_SHIPPING_COSTS } from "../configuracion/financiera/shipping-defaults";
import type { AdditionalCost } from "../configuracion/costos-adicionales/CostosAdicionalesClient";

export interface ProductCost {
  external_id: string;
  cost: number;
}

export const metadata: Metadata = { title: "Inicio" };

async function getDashboardData() {
  const user = await getUser();
  if (!user) return null;

  const userRow = await getCachedUserRow(user.id);
  if (!userRow) return null;

  const workspaceId = userRow.workspace_id;
  const cfg = await getCachedFinancialConfig(workspaceId);

  const db = createServiceClient() as any;

  // ¿Hay datos sincronizados en Supabase?
  const { count: syncedCount } = await db
    .from("tn_orders")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const hasSyncedData = (syncedCount ?? 0) > 0;

  let rawOrders: TNOrder[] = [];
  let customerCount = 0;
  let recurrenteCount = 0;
  let tnConnected = false;
  let storeName: string | null = null;

  // Mismas fuentes que Rentabilidad, para que el margen coincida en toda la app
  const [productsRes, shippingRes, costsRes] = await Promise.allSettled([
    db.from("tn_products").select("external_id, variants").eq("workspace_id", workspaceId),
    db.from("shipping_costs").select("cost, is_active").eq("workspace_id", workspaceId),
    db.from("additional_costs").select("type, amount").eq("workspace_id", workspaceId),
  ]);

  const productRows = productsRes.status === "fulfilled" ? ((productsRes.value.data ?? []) as { external_id: string; variants: { cost: string | null }[] }[]) : [];
  const products: ProductCost[] = productRows.map((p) => {
    const withCost = (p.variants ?? []).filter((v) => parseFloat(v.cost ?? "0") > 0);
    const cost = withCost.length
      ? withCost.reduce((a, v) => a + parseFloat(v.cost ?? "0"), 0) / withCost.length
      : 0;
    return { external_id: p.external_id, cost };
  });

  const shippingRows = shippingRes.status === "fulfilled" ? ((shippingRes.value.data ?? []) as { cost: number; is_active: boolean }[]) : [];
  const shippingForAvg = shippingRows.length > 0 ? shippingRows : DEFAULT_SHIPPING_COSTS;
  const activeShipping = shippingForAvg.filter((r) => r.is_active && r.cost > 0);
  const avgShippingCost = activeShipping.length
    ? activeShipping.reduce((s, r) => s + Number(r.cost), 0) / activeShipping.length
    : 0;

  const additionalCosts = costsRes.status === "fulfilled" ? ((costsRes.value.data ?? []) as AdditionalCost[]) : [];
  const totalFixedMonthly = additionalCosts.filter((c) => c.type === "fixed").reduce((s, c) => s + Number(c.amount), 0);
  const totalVariablePct  = additionalCosts.filter((c) => c.type === "variable").reduce((s, c) => s + Number(c.amount), 0);

  if (hasSyncedData) {
    // ── Leer de Supabase (~50ms) ──────────────────────────────────────
    const since120 = new Date(Date.now() - 120 * 86400000).toISOString();

    const [ordersRes, customersRes, intRes] = await Promise.allSettled([
      db.from("tn_orders")
        .select("external_id, number, customer_name, customer_email, total, subtotal, discount, shipping, status, payment_status, currency, products, created_at")
        .eq("workspace_id", workspaceId)
        .gte("created_at", since120)
        .order("created_at", { ascending: false }),
      db.from("tn_customers")
        .select("orders_count", { count: "exact" })
        .eq("workspace_id", workspaceId),
      db.from("integrations")
        .select("metadata")
        .eq("workspace_id", workspaceId)
        .eq("provider", "tiendanube")
        .eq("status", "active")
        .maybeSingle(),
    ]);

    if (ordersRes.status === "fulfilled") {
      rawOrders = (ordersRes.value.data ?? []).map((o: any) => ({
        id:             parseInt(o.external_id),
        number:         o.number,
        status:         o.status,
        payment_status: o.payment_status,
        total:          String(o.total),
        subtotal:       String(o.subtotal ?? 0),
        discount:       String(o.discount ?? 0),
        shipping:       String(o.shipping ?? 0),
        currency:       o.currency ?? "ARS",
        customer:       o.customer_name
          ? { id: 0, name: o.customer_name, email: o.customer_email ?? "", phone: undefined }
          : null,
        products:       o.products ?? [],
        created_at:     o.created_at,
        updated_at:     o.created_at,
        paid_at:        null,
        cancelled_at:   null,
      }));
    }

    if (customersRes.status === "fulfilled") {
      const customers = (customersRes.value.data ?? []) as { orders_count: number }[];
      customerCount = customersRes.value.count ?? customers.length;
      recurrenteCount = customers.filter((c) => c.orders_count > 1).length;
    }

    if (intRes.status === "fulfilled" && intRes.value.data) {
      tnConnected = true;
      storeName = intRes.value.data.metadata?.store_name ?? null;
    }
  } else {
    // ── Fallback: API de TiendaNube (primera vez, sin sync) ──────────
    const connection = await getTiendaNubeConnection();
    tnConnected = !!connection;
    storeName = connection?.storeName ?? null;

    if (connection) {
      const [ordersRes, customersRes] = await Promise.allSettled([
        getOrdersForRange(connection.opts, { days: 120 }),
        getCustomers(connection.opts, 1, 100),
      ]);
      if (ordersRes.status === "fulfilled") rawOrders = ordersRes.value;
      if (customersRes.status === "fulfilled") {
        customerCount = customersRes.value.length;
        recurrenteCount = customersRes.value.filter((c) => c.orders_count > 1).length;
      }

      // El sync se dispara en el callback de OAuth al conectar TiendaNube.
      // Si llegamos acá sin datos sincronizados es porque la conexión es muy reciente
      // o el sync falló — el cron nocturno lo va a recuperar.
    }
  }

  return {
    userName:        userRow.name ?? user.email?.split("@")[0] ?? "Usuario",
    isSuperAdmin:    userRow.role === "super_admin",
    tnConnected,
    storeName,
    usdRate:         cfg?.usd_rate     ?? 1100,
    taxRate:         cfg?.tax_rate     ?? 10,
    platformFee:     cfg?.platform_fee ?? 2,
    agencyFee:       cfg?.custom_commission ?? 0,
    rawOrders,
    customerCount,
    recurrenteCount,
    products,
    avgShippingCost,
    totalFixedMonthly,
    totalVariablePct,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return null;
  return <DashboardClient data={data} />;
}

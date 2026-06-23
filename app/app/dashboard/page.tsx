import type { Metadata } from "next";
import { unstable_after as after } from "next/server";
import { getUser, getCachedUserRow, getCachedFinancialConfig } from "@/lib/supabase/cached-queries";
import { createServiceClient } from "@/lib/supabase/service";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getCustomers, type TNOrder } from "@/lib/tiendanube/client";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

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

  if (hasSyncedData) {
    // ── Leer de Supabase (~50ms) ──────────────────────────────────────
    const since120 = new Date(Date.now() - 120 * 86400000).toISOString();

    const [ordersRes, customersRes, intRes] = await Promise.allSettled([
      db.from("tn_orders")
        .select("external_id, number, customer_name, customer_email, total, subtotal, discount, shipping, status, payment_status, currency, created_at")
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
        products:       [],
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

      // Trigger sync full DESPUÉS de enviar la respuesta (after() espera que termine antes de matar la función)
      const syncOpts = connection.opts;
      const syncWorkspaceId = workspaceId;
      after(async () => {
        const { syncAll } = await import("@/lib/tiendanube/sync");
        await syncAll(syncWorkspaceId, syncOpts, "full").catch(console.error);
      });
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
    agencyFee:       cfg?.agency_fee   ?? 0,
    rawOrders,
    customerCount,
    recurrenteCount,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return null;
  return <DashboardClient data={data} />;
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getCustomers, type TNOrder } from "@/lib/tiendanube/client";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  type UserRow = { name: string | null; workspace_id: string | null; role: string };
  const { data: rawUserRow } = await supabase
    .from("users").select("name, workspace_id, role").eq("id", user.id).single();
  const userRow = rawUserRow as unknown as UserRow | null;

  const { data: rawCfg } = await supabase
    .from("financial_config")
    .select("usd_rate, tax_rate, platform_fee, agency_fee")
    .eq("workspace_id", userRow?.workspace_id ?? "")
    .single();
  const cfg = rawCfg as unknown as { usd_rate: number; tax_rate: number; platform_fee: number; agency_fee: number } | null;
  const taxRate     = cfg?.tax_rate     ?? 10;
  const platformFee = cfg?.platform_fee ?? 2;
  const agencyFee   = cfg?.agency_fee   ?? 0;
  const usdRate     = cfg?.usd_rate     ?? 1100;

  const connection = await getTiendaNubeConnection();
  let rawOrders: TNOrder[] = [];
  let customerCount = 0;
  let recurrenteCount = 0;
  const tnConnected = !!connection;

  if (connection) {
    const [ordersRes, customersRes] = await Promise.allSettled([
      // 120 días: los tabs muestran hasta "mes-3" (día 1 de hace 3 meses ≈ 120
      // días atrás). Con 90 ese tab quedaba recortado. Sin tope de 3 páginas
      // (antes topaba en 300 órdenes y subcontaba revenue silenciosamente).
      getOrdersForRange(connection.opts, { days: 120 }),
      getCustomers(connection.opts, 1, 100),
    ]);
    if (ordersRes.status === "fulfilled") rawOrders = ordersRes.value;
    if (customersRes.status === "fulfilled") {
      customerCount = customersRes.value.length;
      recurrenteCount = customersRes.value.filter((c) => c.orders_count > 1).length;
    }
  }

  return {
    userName:        userRow?.name ?? user.email?.split("@")[0] ?? "Usuario",
    isSuperAdmin:    userRow?.role === "super_admin",
    tnConnected,
    storeName:       connection?.storeName ?? null,
    usdRate,
    taxRate,
    platformFee,
    agencyFee,
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

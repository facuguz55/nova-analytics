import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, calcPercentChange } from "@/lib/utils";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getCustomers, calcOrderRevenue, type TNOrder } from "@/lib/tiendanube/client";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  type UserRow = { name: string | null; workspace_id: string | null; role: string };
  const { data: rawUserRow } = await supabase
    .from("users").select("name, workspace_id, role").eq("id", user.id).single();
  const userRow = rawUserRow as unknown as UserRow | null;

  // Configuración financiera para calcular netProfit
  const { data: rawCfg } = await supabase
    .from("financial_config")
    .select("usd_rate, tax_rate, platform_fee")
    .eq("workspace_id", userRow?.workspace_id ?? "")
    .single();
  const cfg = rawCfg as unknown as { usd_rate: number; tax_rate: number; platform_fee: number } | null;
  const taxRate     = cfg?.tax_rate     ?? 10;
  const platformFee = cfg?.platform_fee ?? 2;
  const usdRate     = cfg?.usd_rate     ?? 1100;

  const connection = await getTiendaNubeConnection();
  let allOrders60: TNOrder[] = [];
  let customerCount = 0;
  let recurrenteCount = 0;
  const tnConnected = !!connection;

  if (connection) {
    const [ordersRes, customersRes] = await Promise.allSettled([
      getOrdersForRange(connection.opts, { days: 60 }, 2),
      getCustomers(connection.opts, 1, 100),
    ]);
    if (ordersRes.status === "fulfilled") allOrders60 = ordersRes.value;
    if (customersRes.status === "fulfilled") {
      customerCount = customersRes.value.length;
      recurrenteCount = customersRes.value.filter((c) => c.orders_count > 1).length;
    }
  }

  const now = new Date();
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const paidOrders = allOrders60.filter((o) => o.payment_status === "paid" || o.status === "closed");
  const monthPaid  = paidOrders.filter((o) => new Date(o.created_at) >= monthStart);
  const prevMonthPaid = paidOrders.filter((o) => {
    const d = new Date(o.created_at); return d >= prevMonthStart && d < monthStart;
  });

  const revenue     = monthPaid.reduce((a, o) => a + parseFloat(o.total), 0);
  const prevRevenue = prevMonthPaid.reduce((a, o) => a + parseFloat(o.total), 0);
  const orders      = monthPaid.length;
  const aov         = orders > 0 ? revenue / orders : 0;

  // Net revenue = revenue / (1 + tax)
  const netRevenue  = revenue / (1 + taxRate / 100);
  // Net profit = netRevenue * (1 - platform_fee/100)
  const netProfit   = netRevenue * (1 - platformFee / 100);
  const profitPct   = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const cambioMes = calcPercentChange(revenue, prevRevenue);

  // Chart data últimos 30 días
  const chartData: { date: string; revenue: number; orders: number; profit: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now); day.setDate(day.getDate() - i);
    const ds = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const de = new Date(ds.getTime() + 86400000);
    const dayOrders = paidOrders.filter((o) => { const d = new Date(o.created_at); return d >= ds && d < de; });
    const dayRevenue = dayOrders.reduce((a, o) => a + parseFloat(o.total), 0);
    const dayProfit  = (dayRevenue / (1 + taxRate / 100)) * (1 - platformFee / 100);
    chartData.push({
      date: `${String(ds.getDate()).padStart(2,"0")}/${String(ds.getMonth()+1).padStart(2,"0")}`,
      revenue: dayRevenue,
      orders: dayOrders.length,
      profit: dayProfit,
    });
  }

  const recentOrders = allOrders60.slice(0, 8).map((o) => ({
    id:             String(o.id),
    number:         String(o.number ?? o.id),
    customer_name:  o.customer?.name ?? "Anónimo",
    customer_email: o.customer?.email ?? null,
    total:          parseFloat(o.total),
    status:         o.payment_status === "paid" || o.status === "closed" ? "paid"
                    : o.status === "cancelled" ? "cancelled"
                    : o.payment_status === "pending" ? "pending" : o.status,
    created_at:     o.created_at,
  }));

  return {
    userName:    userRow?.name ?? user.email?.split("@")[0] ?? "Usuario",
    isSuperAdmin: userRow?.role === "super_admin",
    tnConnected,
    storeName:   connection?.storeName ?? null,
    usdRate,
    // Tienda metrics
    revenue, orders, aov, netRevenue, netProfit, profitPct, cambioMes,
    // Clientes
    recurrentes: recurrenteCount, nuevos: customerCount - recurrenteCount,
    // Chart
    chartData,
    recentOrders,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return null;
  return <DashboardClient data={data} />;
}

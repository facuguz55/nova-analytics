import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import LocalDashboardClient from "./LocalDashboardClient";

export const metadata: Metadata = { title: "Local Físico" };

export default async function LocalPage() {
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

  if (plan !== "pro" && plan !== "agency") {
    return <LocalUpsell />;
  }

  const now = new Date();
  const today      = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(today.getTime() - today.getDay() * 86_400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const days30ago  = new Date(now.getTime() - 30 * 86_400_000);

  // Ventas últimos 30 días con ítems
  const { data: salesRaw } = await supabase
    .from("local_sales")
    .select("id, total, payment_method, created_at, local_sale_items(unit_price, unit_cost, quantity)")
    .eq("workspace_id", workspaceId)
    .gte("created_at", days30ago.toISOString())
    .order("created_at", { ascending: true });

  type SaleRow = {
    id: string;
    total: number;
    payment_method: string;
    created_at: string;
    local_sale_items: { unit_price: number; unit_cost: number; quantity: number }[];
  };

  const sales = (salesRaw ?? []) as unknown as SaleRow[];

  const todayStr    = today.toISOString();
  const weekStr     = weekStart.toISOString();
  const monthStr    = monthStart.toISOString();

  const todaySales   = sales.filter((s) => s.created_at >= todayStr);
  const weekSales    = sales.filter((s) => s.created_at >= weekStr);
  const monthSales   = sales.filter((s) => s.created_at >= monthStr);

  const sum = (arr: SaleRow[]) => arr.reduce((a, s) => a + Number(s.total), 0);

  const kpis = {
    today:    { revenue: sum(todaySales),  count: todaySales.length },
    week:     { revenue: sum(weekSales),   count: weekSales.length },
    month:    { revenue: sum(monthSales),  count: monthSales.length },
    avgTicket: monthSales.length ? sum(monthSales) / monthSales.length : 0,
  };

  // Agrupar por día para gráfico
  const dailyMap = new Map<string, { revenue: number; profit: number }>();
  for (const s of sales) {
    const day = s.created_at.slice(0, 10);
    const cur = dailyMap.get(day) ?? { revenue: 0, profit: 0 };
    const cost = s.local_sale_items.reduce((a, it) => a + it.unit_cost * it.quantity, 0);
    cur.revenue += Number(s.total);
    cur.profit  += Number(s.total) - cost;
    dailyMap.set(day, cur);
  }
  const dailyData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // Métodos de pago para pie chart
  const paymentMap = new Map<string, number>();
  for (const s of sales) {
    paymentMap.set(s.payment_method, (paymentMap.get(s.payment_method) ?? 0) + Number(s.total));
  }
  const paymentData = Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value }));

  // Top 5 productos más vendidos (últimos 30d)
  const { data: topRaw } = await supabase
    .from("local_sale_items")
    .select("product_name, quantity, unit_price")
    .in("sale_id", sales.map((s) => s.id));

  type ItemRow = { product_name: string; quantity: number; unit_price: number };
  const topAgg = new Map<string, { units: number; revenue: number }>();
  for (const it of (topRaw ?? []) as unknown as ItemRow[]) {
    const cur = topAgg.get(it.product_name) ?? { units: 0, revenue: 0 };
    cur.units   += Number(it.quantity);
    cur.revenue += Number(it.unit_price) * Number(it.quantity);
    topAgg.set(it.product_name, cur);
  }
  const topProducts = Array.from(topAgg.entries())
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(([name, v]) => ({ name, ...v }));

  return (
    <LocalDashboardClient
      kpis={kpis}
      dailyData={dailyData}
      paymentData={paymentData}
      topProducts={topProducts}
    />
  );
}

function LocalUpsell() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div
        className="rounded-2xl p-8 max-w-md w-full text-center"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(225,105,30,0.12)" }}
        >
          <span className="text-3xl">🏪</span>
        </div>
        <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">Local Físico</h2>
        <p className="text-[#94A3B8] text-sm mb-6">
          Registrá ventas, gestioná tu catálogo de productos y obtené análisis de tu local físico. Disponible en plan Pro.
        </p>
        <a
          href="/app/planes"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #e1691e, #a855f7)" }}
        >
          Ver planes
        </a>
      </div>
    </div>
  );
}

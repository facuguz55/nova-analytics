import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { TrendingUp, ShoppingCart, DollarSign, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics — Nova HQ" };

export default async function AdminAnalyticsPage() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#ef4444] font-bold">Falta SUPABASE_SERVICE_ROLE_KEY</p>
      </div>
    );
  }

  const service = createServiceClient();

  type WsRow = { id: string; name: string; plan: string };
  type RawOrder = { total: number; status: string | null; workspace_id: string; created_at: string };
  type UserRow = { created_at: string };

  const [wsRes, ordRes, userRes] = await Promise.allSettled([
    service.from("workspaces").select("id, name, plan"),
    service.from("tn_orders").select("total, status, workspace_id, created_at").order("created_at", { ascending: false }),
    service.from("users").select("created_at").order("created_at", { ascending: false }),
  ]);

  const allWorkspaces = (wsRes.status === "fulfilled" ? wsRes.value.data ?? [] : []) as WsRow[];
  const rawOrders = (ordRes.status === "fulfilled" ? ordRes.value.data ?? [] : []) as RawOrder[];
  const allUsers = (userRes.status === "fulfilled" ? userRes.value.data ?? [] : []) as UserRow[];

  const paidOrders = rawOrders.filter((o) => o.status === "paid" || o.status === "closed");
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const monthOrders = paidOrders.filter((o) => o.created_at >= monthStart);
  const prevMonthOrders = paidOrders.filter((o) => o.created_at >= prevMonthStart && o.created_at < monthStart);
  const monthRevenue = monthOrders.reduce((acc, o) => acc + o.total, 0);
  const prevMonthRevenue = prevMonthOrders.reduce((acc, o) => acc + o.total, 0);

  const newUsersMonth = allUsers.filter((u) => u.created_at >= monthStart).length;

  // Revenue por workspace
  const revenueByWorkspace = allWorkspaces.map((ws) => {
    const wsOrders = paidOrders.filter((o) => o.workspace_id === ws.id);
    return {
      ...ws,
      revenue: wsOrders.reduce((acc, o) => acc + o.total, 0),
      orderCount: wsOrders.length,
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Revenue por día (últimos 30 días)
  const days: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayOrders = paidOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= dayStart && d < dayEnd;
    });
    days.push({
      date: `${String(dayStart.getDate()).padStart(2, "0")}/${String(dayStart.getMonth() + 1).padStart(2, "0")}`,
      revenue: dayOrders.reduce((acc, o) => acc + o.total, 0),
      orders: dayOrders.length,
    });
  }

  const maxRevenue = Math.max(...days.map((d) => d.revenue), 1);

  const PLAN_COLORS: Record<string, string> = {
    free: "#64748B",
    pro: "#7C3AED",
    agency: "#e1691e",
    trial: "#22c55e",
    active: "#2563EB",
  };

  const pctChange = prevMonthRevenue > 0
    ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Analytics Global</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Vista agregada de todos los workspaces</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Revenue total", value: formatCurrency(totalRevenue), icon: DollarSign, color: "#e1691e" },
          { label: "Revenue este mes", value: formatCurrency(monthRevenue), sub: pctChange !== 0 ? `${pctChange > 0 ? "+" : ""}${pctChange}% vs mes anterior` : undefined, icon: TrendingUp, color: "#22c55e" },
          { label: "Órdenes este mes", value: String(monthOrders.length), icon: ShoppingCart, color: "#7C3AED" },
          { label: "Nuevos usuarios mes", value: String(newUsersMonth), icon: Users, color: "#2563EB" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
              <s.icon size={18} color={s.color} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xl font-black text-[#F1F5F9]">{s.value}</p>
              <p className="text-xs text-[#94A3B8]">{s.label}</p>
              {s.sub && <p className="text-[11px] mt-0.5" style={{ color: pctChange >= 0 ? "#22c55e" : "#ef4444" }}>{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de barras revenue 30 días */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <p className="text-sm font-semibold text-[#F1F5F9] mb-4">Revenue global — últimos 30 días</p>
        <div className="flex items-end gap-1 h-32">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(4, (d.revenue / maxRevenue) * 128)}px`,
                  background: d.revenue > 0 ? "#7C3AED" : "rgba(124,58,237,0.15)",
                  transition: "height 0.2s",
                }}
              />
              {i % 5 === 0 && (
                <span className="text-[9px] text-[#64748B] whitespace-nowrap">{d.date}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top workspaces por revenue */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Top workspaces por revenue</p>
        </div>
        <div className="divide-y divide-[rgba(124,58,237,0.08)]">
          {revenueByWorkspace.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#64748B]">Sin datos</div>
          ) : revenueByWorkspace.map((ws, i) => (
            <div key={ws.id} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(124,58,237,0.04)] transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#64748B] w-5">#{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-[#F1F5F9]">{ws.name}</p>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                    style={{
                      background: `${PLAN_COLORS[ws.plan] ?? "#94A3B8"}18`,
                      color: PLAN_COLORS[ws.plan] ?? "#94A3B8",
                    }}
                  >
                    {ws.plan}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#e1691e]">{ws.revenue > 0 ? formatCurrency(ws.revenue) : "—"}</p>
                <p className="text-xs text-[#64748B]">{ws.orderCount} órdenes</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

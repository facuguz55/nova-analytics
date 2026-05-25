import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { TrendingUp, CreditCard, DollarSign, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics - Nova HQ" };

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
  type BillingRow = { workspace_id: string; amount: number; status: string; paid_at: string | null; created_at: string };
  type UserRow = { created_at: string };

  const [wsRes, billingRes, userRes] = await Promise.allSettled([
    service.from("workspaces").select("id, name, plan"),
    service.from("billing").select("workspace_id, amount, status, paid_at, created_at").eq("status", "paid").order("created_at", { ascending: false }),
    service.from("users").select("created_at").order("created_at", { ascending: false }),
  ]);

  const allWorkspaces = (wsRes.status === "fulfilled" ? wsRes.value.data ?? [] : []) as WsRow[];
  const billingRows = (billingRes.status === "fulfilled" ? billingRes.value.data ?? [] : []) as BillingRow[];
  const allUsers = (userRes.status === "fulfilled" ? userRes.value.data ?? [] : []) as UserRow[];

  const totalRevenue = billingRows.reduce((acc, b) => acc + b.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const monthBilling = billingRows.filter((b) => (b.paid_at ?? b.created_at) >= monthStart);
  const prevMonthBilling = billingRows.filter((b) => {
    const d = b.paid_at ?? b.created_at;
    return d >= prevMonthStart && d < monthStart;
  });
  const monthRevenue = monthBilling.reduce((acc, b) => acc + b.amount, 0);
  const prevMonthRevenue = prevMonthBilling.reduce((acc, b) => acc + b.amount, 0);
  const newUsersMonth = allUsers.filter((u) => u.created_at >= monthStart).length;
  const pctChange = prevMonthRevenue > 0 ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0;

  // Billing por workspace
  const billingByWorkspace = allWorkspaces.map((ws) => {
    const wsBilling = billingRows.filter((b) => b.workspace_id === ws.id);
    return {
      ...ws,
      revenue: wsBilling.reduce((acc, b) => acc + b.amount, 0),
      paymentCount: wsBilling.length,
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Chart 30 dias
  const days: { date: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayBilling = billingRows.filter((b) => {
      const d = new Date(b.paid_at ?? b.created_at);
      return d >= dayStart && d < dayEnd;
    });
    days.push({
      date: `${String(dayStart.getDate()).padStart(2, "0")}/${String(dayStart.getMonth() + 1).padStart(2, "0")}`,
      revenue: dayBilling.reduce((acc, b) => acc + b.amount, 0),
    });
  }
  const maxRevenue = Math.max(...days.map((d) => d.revenue), 1);

  const PLAN_COLORS: Record<string, string> = {
    free: "#64748B", pro: "#7C3AED", agency: "#e1691e", trial: "#22c55e", active: "#2563EB",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Analytics Global</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Revenue de suscripciones Nova Analytics (no datos de TiendaNube)</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "MRR acumulado", value: formatCurrency(totalRevenue), icon: DollarSign, color: "#e1691e" },
          { label: "Revenue este mes", value: formatCurrency(monthRevenue), sub: pctChange !== 0 ? `${pctChange > 0 ? "+" : ""}${pctChange}% vs anterior` : undefined, icon: TrendingUp, color: "#22c55e" },
          { label: "Pagos este mes", value: String(monthBilling.length), icon: CreditCard, color: "#7C3AED" },
          { label: "Nuevos usuarios mes", value: String(newUsersMonth), icon: Users, color: "#2563EB" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
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

      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <p className="text-sm font-semibold text-[#F1F5F9] mb-4">Billing global - ultimos 30 dias</p>
        <div className="flex items-end gap-1 h-32">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t"
                style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 128)}px`, background: d.revenue > 0 ? "#7C3AED" : "rgba(124,58,237,0.15)" }} />
              {i % 5 === 0 && <span className="text-[9px] text-[#64748B] whitespace-nowrap">{d.date}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Top workspaces por billing</p>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
          {billingByWorkspace.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#64748B]">Sin pagos registrados</div>
          ) : billingByWorkspace.map((ws, i) => (
            <div key={ws.id} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(124,58,237,0.04)] transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#64748B] w-5">#{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-[#F1F5F9]">{ws.name}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                    style={{ background: `${PLAN_COLORS[ws.plan] ?? "#94A3B8"}18`, color: PLAN_COLORS[ws.plan] ?? "#94A3B8" }}>
                    {ws.plan}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#e1691e]">{ws.revenue > 0 ? formatCurrency(ws.revenue) : "-"}</p>
                <p className="text-xs text-[#64748B]">{ws.paymentCount} pago{ws.paymentCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

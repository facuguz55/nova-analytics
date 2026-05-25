import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { Users, Store, DollarSign, Activity, Plug } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Nova HQ — Super Admin" };

export default async function HQPage() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-2xl font-black text-[#ef4444]">Falta variable de entorno</p>
        <p className="text-sm text-[#94A3B8]">
          <code className="bg-[#111118] px-2 py-1 rounded text-[#f59e0b]">SUPABASE_SERVICE_ROLE_KEY</code> no está configurada en Vercel.
        </p>
        <p className="text-xs text-[#64748B]">Vercel → Settings → Environment Variables → agregar la clave.</p>
      </div>
    );
  }

  const service = createServiceClient();

  type WsRow = { id: string; name: string; slug: string; plan: string; status: string; created_at: string };
  type UserRow = { id: string; email: string; name: string | null; role: string; workspace_id: string | null; created_at: string };
  type IntRow = { workspace_id: string; provider: string; status: string };
  type RawOrder = { id: string; total: number; status: string | null; workspace_id: string };
  type AuditRow = { action: string; workspace_id: string | null; created_at: string };

  const wsRes = await service.from("workspaces").select("*", { count: "exact" }).order("created_at", { ascending: false });
  const userRes = await service.from("users").select("*", { count: "exact" }).order("created_at", { ascending: false });
  const intRes = await service.from("integrations").select("workspace_id, provider, status").eq("status", "active");
  const ordRes = await service.from("tn_orders").select("id, total, status, workspace_id");
  const auditRes = await service.from("audit_logs").select("action, workspace_id, created_at").order("created_at", { ascending: false }).limit(20);

  const workspaceCount = wsRes.count ?? 0;
  const userCount = userRes.count ?? 0;
  const allWorkspaces = (wsRes.data ?? []) as unknown as WsRow[];
  const allUsers = (userRes.data ?? []) as unknown as UserRow[];
  const allIntegrations = (intRes.data ?? []) as unknown as IntRow[];
  const rawOrders = (ordRes.data ?? []) as unknown as RawOrder[];
  const audits = (auditRes.data ?? []) as unknown as AuditRow[];
  const allOrders = rawOrders.filter(
    (o) => o.status === "paid" || o.status === "closed"
  );
  const totalRevenue = allOrders.reduce((acc, o) => acc + o.total, 0);

  // Por workspace
  const workspaceStats = allWorkspaces.map((ws) => {
    const wsUsers = allUsers.filter((u) => u.workspace_id === ws.id);
    const wsIntegrations = allIntegrations.filter((i) => i.workspace_id === ws.id);
    const wsOrders = allOrders.filter((o) => o.workspace_id === ws.id);
    const wsRevenue = wsOrders.reduce((acc, o) => acc + o.total, 0);
    return {
      ...ws,
      userCount: wsUsers.length,
      integrationCount: wsIntegrations.length,
      orderCount: wsOrders.length,
      revenue: wsRevenue,
      providers: wsIntegrations.map((i) => i.provider),
    };
  });

  const planCounts = allWorkspaces.reduce((acc, ws) => {
    acc[ws.plan] = (acc[ws.plan] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const STATS = [
    { label: "Workspaces", value: String(workspaceCount ?? 0), icon: Store, color: "#7C3AED" },
    { label: "Usuarios", value: String(userCount ?? 0), icon: Users, color: "#2563EB" },
    { label: "Integraciones activas", value: String(allIntegrations.length), icon: Plug, color: "#22c55e" },
    { label: "Revenue total (todos)", value: formatCurrency(totalRevenue), icon: DollarSign, color: "#e1691e" },
  ];

  const PLAN_COLORS: Record<string, string> = {
    free: "#64748B",
    pro: "#7C3AED",
    agency: "#e1691e",
    trial: "#22c55e",
    active: "#2563EB",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 rounded-2xl"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Nova HQ
          </h1>
          <p className="text-sm text-red-400 mt-0.5">Vista super admin — solo visible para cuentas autorizadas</p>
        </div>
        <div
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          SUPER ADMIN
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
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
            </div>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[#F1F5F9]">Distribución por plan</p>
          <p className="text-xs text-[#64748B]">{workspaceCount} total</p>
        </div>

        {/* Barra apilada */}
        {workspaceCount > 0 && (
          <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-px">
            {Object.entries(planCounts).filter(([, n]) => n > 0).map(([plan, count]) => (
              <div
                key={plan}
                style={{
                  width: `${(count / workspaceCount) * 100}%`,
                  background: PLAN_COLORS[plan] ?? "#94A3B8",
                }}
                title={`${plan}: ${count}`}
              />
            ))}
          </div>
        )}

        {/* Leyenda con barras individuales */}
        <div className="space-y-2">
          {Object.entries(planCounts).map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PLAN_COLORS[plan] ?? "#94A3B8" }} />
              <span className="text-xs text-[#94A3B8] capitalize w-14 flex-shrink-0">{plan}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(124,58,237,0.08)" }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: workspaceCount > 0 ? `${(count / workspaceCount) * 100}%` : "0%",
                    background: PLAN_COLORS[plan] ?? "#94A3B8",
                  }}
                />
              </div>
              <span className="text-xs font-bold text-[#F1F5F9] w-5 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workspaces table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Todos los workspaces ({allWorkspaces.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
                {["WORKSPACE", "PLAN", "USUARIOS", "INTEGRACIONES", "ÓRDENES", "REVENUE", "CREADO"].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workspaceStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#64748B]">
                    Sin workspaces registrados
                  </td>
                </tr>
              ) : workspaceStats.map((ws, i) => (
                <tr
                  key={ws.id}
                  className="hover:bg-[rgba(124,58,237,0.04)] transition-colors"
                  style={{ borderBottom: i < workspaceStats.length - 1 ? "1px solid rgba(124,58,237,0.08)" : "none" }}
                >
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#F1F5F9]">{ws.name}</p>
                      <p className="text-xs text-[#64748B]">{ws.slug}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full capitalize"
                      style={{
                        background: `${PLAN_COLORS[ws.plan] ?? "#94A3B8"}18`,
                        color: PLAN_COLORS[ws.plan] ?? "#94A3B8",
                        border: `1px solid ${PLAN_COLORS[ws.plan] ?? "#94A3B8"}30`,
                      }}
                    >
                      {ws.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm text-[#F1F5F9]">{ws.userCount}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex gap-1">
                      {ws.providers.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                        >
                          {p}
                        </span>
                      ))}
                      {ws.providers.length === 0 && <span className="text-xs text-[#64748B]">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm text-[#F1F5F9]">{ws.orderCount}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm font-bold text-[#e1691e]">
                      {ws.revenue > 0 ? formatCurrency(ws.revenue) : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-xs text-[#64748B]">
                      {new Date(ws.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit log */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Audit log reciente</p>
        </div>
        <div className="divide-y divide-[rgba(124,58,237,0.08)]">
          {(audits ?? []).length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-[#64748B]">Sin eventos</div>
          ) : (audits ?? []).map((log, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#7C3AED" }} />
                <span className="text-sm font-mono text-[#94A3B8]">{log.action}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#475569] font-mono">{log.workspace_id?.slice(0, 8)}...</span>
                <span className="text-xs text-[#475569]">
                  {new Date(log.created_at).toLocaleString("es-AR", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Usuarios recientes</p>
        </div>
        <div className="divide-y divide-[rgba(124,58,237,0.08)]">
          {allUsers.slice(0, 10).map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
                >
                  {(u.name ?? u.email ?? "?")[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">{u.name ?? "Sin nombre"}</p>
                  <p className="text-xs text-[#94A3B8]">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#64748B]">{u.role}</span>
                <span className="text-xs text-[#475569]">
                  {new Date(u.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity indicator */}
      <div className="flex items-center gap-2">
        <Activity size={13} color="#22c55e" strokeWidth={2} />
        <span className="text-xs text-[#64748B]">
          Sistema activo · {new Date().toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" })}
        </span>
      </div>
    </div>
  );
}

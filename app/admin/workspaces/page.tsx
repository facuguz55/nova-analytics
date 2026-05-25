import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { Store, Users, Plug, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Workspaces — Nova HQ" };

export default async function WorkspacesPage() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#ef4444] font-bold">Falta SUPABASE_SERVICE_ROLE_KEY</p>
      </div>
    );
  }

  const service = createServiceClient();

  type WsRow = { id: string; name: string; slug: string; plan: string; status: string; created_at: string };
  type UserRow = { id: string; email: string; name: string | null; role: string; workspace_id: string | null };
  type IntRow = { workspace_id: string; provider: string; status: string };
  type RawOrder = { total: number; status: string | null; workspace_id: string };

  const [wsRes, userRes, intRes, ordRes] = await Promise.allSettled([
    service.from("workspaces").select("*").order("created_at", { ascending: false }),
    service.from("users").select("id, email, name, role, workspace_id"),
    service.from("integrations").select("workspace_id, provider, status"),
    service.from("tn_orders").select("total, status, workspace_id"),
  ]);

  const allWorkspaces = (wsRes.status === "fulfilled" ? wsRes.value.data ?? [] : []) as WsRow[];
  const allUsers = (userRes.status === "fulfilled" ? userRes.value.data ?? [] : []) as UserRow[];
  const allIntegrations = (intRes.status === "fulfilled" ? intRes.value.data ?? [] : []) as IntRow[];
  const rawOrders = (ordRes.status === "fulfilled" ? ordRes.value.data ?? [] : []) as RawOrder[];
  const paidOrders = rawOrders.filter((o) => o.status === "paid" || o.status === "closed");

  const PLAN_COLORS: Record<string, string> = {
    free: "#64748B",
    pro: "#7C3AED",
    agency: "#e1691e",
    trial: "#22c55e",
    active: "#2563EB",
  };

  const STATUS_COLORS: Record<string, string> = {
    active: "#22c55e",
    inactive: "#ef4444",
    suspended: "#f59e0b",
  };

  const workspaceStats = allWorkspaces.map((ws) => {
    const wsUsers = allUsers.filter((u) => u.workspace_id === ws.id);
    const wsIntegrations = allIntegrations.filter((i) => i.workspace_id === ws.id && i.status === "active");
    const wsOrders = paidOrders.filter((o) => o.workspace_id === ws.id);
    const wsRevenue = wsOrders.reduce((acc, o) => acc + o.total, 0);
    return {
      ...ws,
      userCount: wsUsers.length,
      integrationCount: wsIntegrations.length,
      orderCount: wsOrders.length,
      revenue: wsRevenue,
      providers: wsIntegrations.map((i) => i.provider),
      owner: wsUsers.find((u) => u.role === "owner" || u.role === "admin"),
    };
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Workspaces
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">{allWorkspaces.length} workspace{allWorkspaces.length !== 1 ? "s" : ""} registrados</p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total", value: allWorkspaces.length, icon: Store, color: "#7C3AED" },
          { label: "Con integración", value: workspaceStats.filter((w) => w.integrationCount > 0).length, icon: Plug, color: "#22c55e" },
          { label: "Con órdenes", value: workspaceStats.filter((w) => w.orderCount > 0).length, icon: DollarSign, color: "#e1691e" },
          { label: "Usuarios totales", value: allUsers.length, icon: Users, color: "#2563EB" },
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
            </div>
          </div>
        ))}
      </div>

      {/* Tabla detallada */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Todos los workspaces</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
                {["WORKSPACE", "PLAN", "ESTADO", "OWNER", "USUARIOS", "INTEGRACIONES", "ÓRDENES", "REVENUE", "CREADO"].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workspaceStats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-[#64748B]">
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
                      <p className="text-xs text-[#64748B] font-mono">{ws.slug}</p>
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
                    <div className="flex items-center gap-1.5">
                      {ws.status === "active" ? (
                        <CheckCircle size={13} color="#22c55e" strokeWidth={2} />
                      ) : (
                        <XCircle size={13} color={STATUS_COLORS[ws.status] ?? "#64748B"} strokeWidth={2} />
                      )}
                      <span
                        className="text-xs font-medium capitalize"
                        style={{ color: STATUS_COLORS[ws.status] ?? "#64748B" }}
                      >
                        {ws.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {ws.owner ? (
                      <div>
                        <p className="text-xs font-medium text-[#F1F5F9]">{ws.owner.name ?? "—"}</p>
                        <p className="text-[11px] text-[#64748B]">{ws.owner.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-[#64748B]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm text-[#F1F5F9]">{ws.userCount}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
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
                    <span className="text-sm font-bold" style={{ color: ws.revenue > 0 ? "#e1691e" : "#64748B" }}>
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
    </div>
  );
}

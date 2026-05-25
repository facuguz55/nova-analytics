import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { Store, Users, Plug, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import WorkspacesClient from "./WorkspacesClient";

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
  type UserRow = { id: string; email: string; name: string | null; role: string; workspace_id: string | null; created_at: string };
  type IntRow = { workspace_id: string; provider: string; status: string };
  type RawOrder = { total: number; status: string | null; workspace_id: string };

  const [wsRes, userRes, intRes, ordRes] = await Promise.allSettled([
    service.from("workspaces").select("*").order("created_at", { ascending: false }),
    service.from("users").select("id, email, name, role, workspace_id, created_at").order("created_at", { ascending: false }),
    service.from("integrations").select("workspace_id, provider, status"),
    service.from("tn_orders").select("total, status, workspace_id"),
  ]);

  const allWorkspaces = (wsRes.status === "fulfilled" ? wsRes.value.data ?? [] : []) as WsRow[];
  const allUsers = (userRes.status === "fulfilled" ? userRes.value.data ?? [] : []) as UserRow[];
  const allIntegrations = (intRes.status === "fulfilled" ? intRes.value.data ?? [] : []) as IntRow[];
  const rawOrders = (ordRes.status === "fulfilled" ? ordRes.value.data ?? [] : []) as RawOrder[];
  const paidOrders = rawOrders.filter((o) => o.status === "paid" || o.status === "closed");

  const workspaceStats = allWorkspaces.map((ws) => {
    const wsUsers = allUsers.filter((u) => u.workspace_id === ws.id);
    const wsIntegrations = allIntegrations.filter((i) => i.workspace_id === ws.id && i.status === "active");
    const wsOrders = paidOrders.filter((o) => o.workspace_id === ws.id);
    return {
      ...ws,
      userCount: wsUsers.length,
      integrationCount: wsIntegrations.length,
      orderCount: wsOrders.length,
      revenue: wsOrders.reduce((acc, o) => acc + o.total, 0),
      providers: wsIntegrations.map((i) => i.provider),
      users: wsUsers,
    };
  });

  const PLAN_COLORS: Record<string, string> = {
    free: "#64748B", pro: "#7C3AED", agency: "#e1691e", trial: "#22c55e", active: "#2563EB",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Workspaces</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">{allWorkspaces.length} workspace{allWorkspaces.length !== 1 ? "s" : ""} — hacé clic en ▶ para ver usuarios</p>
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

      {/* Distribución de plan */}
      {allWorkspaces.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <p className="text-xs font-semibold tracking-widest text-[#94A3B8] uppercase mb-4">Distribución por plan</p>
          <div className="space-y-2.5">
            {Object.entries(
              allWorkspaces.reduce((acc, ws) => {
                acc[ws.plan] = (acc[ws.plan] ?? 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).sort((a, b) => b[1] - a[1]).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#94A3B8] capitalize w-16 flex-shrink-0">{plan}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(124,58,237,0.1)" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.round((count / allWorkspaces.length) * 100)}%`,
                      background: PLAN_COLORS[plan] ?? "#94A3B8",
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-[#F1F5F9] w-6 text-right">{count}</span>
                <span className="text-[10px] text-[#64748B] w-8 text-right">
                  {Math.round((count / allWorkspaces.length) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla interactiva */}
      <div
        className="rounded-2xl p-1"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Gestión de workspaces</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Cambiá plan, estado, eliminá workspace o usuario, y agregá órdenes manuales</p>
        </div>
        <WorkspacesClient workspaceStats={workspaceStats} />
      </div>
    </div>
  );
}

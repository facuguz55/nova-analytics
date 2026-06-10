"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Trash2, UserX,
  CheckCircle, XCircle, Plus, Loader2, ShieldCheck,
} from "lucide-react";
import {
  changeWorkspacePlan,
  changeWorkspaceStatus,
  deleteWorkspace,
  deleteUser,
  changeUserRole,
  addManualPayment,
} from "@/app/admin/actions";
import { formatCurrency } from "@/lib/utils";

const PLANS = ["free", "trial", "active", "pro", "agency"] as const;
const ROLES = ["owner", "admin", "member"] as const;

const PLAN_COLORS: Record<string, string> = {
  free: "#64748B", pro: "#8b5cf6", agency: "#c084fc", trial: "#22c55e", active: "#c026d3",
};
const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e", inactive: "#ef4444", suspended: "#f59e0b",
};

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  workspace_id: string | null;
  created_at: string;
}

interface WorkspaceStat {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
  userCount: number;
  integrationCount: number;
  orderCount: number;
  revenue: number;
  providers: string[];
  users: UserRow[];
}

interface ConfirmState {
  type: "workspace" | "user";
  id: string;
  name: string;
  extra?: string;
}

interface OrderModal {
  workspaceId: string;
  workspaceName: string;
}

export default function WorkspacesClient({
  workspaceStats,
}: {
  workspaceStats: WorkspaceStat[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [orderModal, setOrderModal] = useState<OrderModal | null>(null);
  const [orderForm, setOrderForm] = useState({ total: "", customerName: "" });
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function run(id: string, fn: () => Promise<void>) {
    setLoadingId(id);
    startTransition(async () => {
      try {
        await fn();
        toast.success("Listo");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Error");
      } finally {
        setLoadingId(null);
      }
    });
  }

  function handlePlanChange(wsId: string, plan: string) {
    run(wsId + "-plan", () => changeWorkspacePlan(wsId, plan));
  }

  function handleStatusToggle(wsId: string, current: string) {
    const next = current === "active" ? "inactive" : "active";
    run(wsId + "-status", () => changeWorkspaceStatus(wsId, next));
  }

  function handleDeleteWorkspace() {
    if (!confirm || confirm.type !== "workspace") return;
    const id = confirm.id;
    setConfirm(null);
    run(id + "-del", () => deleteWorkspace(id));
  }

  function handleDeleteUser() {
    if (!confirm || confirm.type !== "user") return;
    const id = confirm.id;
    setConfirm(null);
    run(id + "-del", () => deleteUser(id));
  }

  function handleRoleChange(userId: string, role: string) {
    run(userId + "-role", () => changeUserRole(userId, role));
  }

  function handleAddOrder() {
    if (!orderModal) return;
    const total = parseFloat(orderForm.total);
    if (!total || total <= 0) { toast.error("Ingresá un monto válido"); return; }
    const { workspaceId } = orderModal;
    setOrderModal(null);
    setOrderForm({ total: "", customerName: "" });
    run("order-" + workspaceId, () => addManualPayment(workspaceId, total, orderForm.customerName));
  }

  return (
    <>
      {/* Tabla */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                {["", "WORKSPACE", "PLAN", "ESTADO", "USUARIOS", "REVENUE", "ACCIONES"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workspaceStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#64748B]">Sin workspaces</td>
                </tr>
              ) : workspaceStats.map((ws, i) => {
                const isExpanded = expanded === ws.id;
                const isLoading = loadingId?.startsWith(ws.id);
                const lastRow = i === workspaceStats.length - 1;

                return (
                  <>
                    <tr
                      key={ws.id}
                      className="hover:bg-[rgba(139,92,246,0.03)] transition-colors"
                      style={{ borderBottom: (!isExpanded || ws.users.length === 0) && !lastRow ? "1px solid rgba(139,92,246,0.08)" : "none" }}
                    >
                      {/* Expand toggle */}
                      <td className="px-4 py-3 w-8">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : ws.id)}
                          className="text-[#64748B] hover:text-[#94A3B8] transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>

                      {/* Nombre */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-[#F1F5F9]">{ws.name}</p>
                        <p className="text-xs text-[#64748B] font-mono">{ws.slug}</p>
                      </td>

                      {/* Plan select */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={ws.plan}
                          disabled={isLoading || isPending}
                          onChange={(e) => handlePlanChange(ws.id, e.target.value)}
                          className="text-xs font-bold px-2 py-1 rounded-lg capitalize cursor-pointer disabled:opacity-60"
                          style={{
                            background: `${PLAN_COLORS[ws.plan] ?? "#94A3B8"}18`,
                            color: PLAN_COLORS[ws.plan] ?? "#94A3B8",
                            border: `1px solid ${PLAN_COLORS[ws.plan] ?? "#94A3B8"}40`,
                          }}
                        >
                          {PLANS.map((p) => (
                            <option key={p} value={p} style={{ background: "#111118", color: "#F1F5F9" }}>{p}</option>
                          ))}
                        </select>
                      </td>

                      {/* Estado toggle */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusToggle(ws.id, ws.status)}
                          disabled={isLoading || isPending}
                          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                          style={{ color: STATUS_COLORS[ws.status] ?? "#64748B" }}
                        >
                          {ws.status === "active"
                            ? <CheckCircle size={13} strokeWidth={2} />
                            : <XCircle size={13} strokeWidth={2} />}
                          {ws.status}
                        </button>
                      </td>

                      {/* Usuarios */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-[#F1F5F9]">{ws.userCount}</span>
                        <span className="text-xs text-[#64748B] ml-1">/ {ws.orderCount} órd.</span>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-bold" style={{ color: ws.revenue > 0 ? "#c084fc" : "#64748B" }}>
                          {ws.revenue > 0 ? formatCurrency(ws.revenue) : "—"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOrderModal({ workspaceId: ws.id, workspaceName: ws.name })}
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all hover:opacity-80"
                            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
                          >
                            <Plus size={10} strokeWidth={2.5} /> Orden
                          </button>
                          <button
                            onClick={() => setConfirm({ type: "workspace", id: ws.id, name: ws.name })}
                            disabled={isLoading || isPending}
                            className="p-1.5 rounded-lg transition-all hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-40"
                            title="Eliminar workspace"
                          >
                            <Trash2 size={13} color="#ef4444" strokeWidth={2} />
                          </button>
                          {isLoading && <Loader2 size={13} className="animate-spin text-[#94A3B8]" />}
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida: usuarios */}
                    {isExpanded && ws.users.length > 0 && (
                      <tr
                        key={ws.id + "-users"}
                        style={{ borderBottom: !lastRow ? "1px solid rgba(139,92,246,0.08)" : "none" }}
                      >
                        <td />
                        <td colSpan={6} className="px-4 pb-3">
                          <div
                            className="rounded-xl overflow-hidden"
                            style={{ border: "1px solid rgba(139,92,246,0.12)", background: "#0d0d14" }}
                          >
                            <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                              <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Usuarios del workspace</p>
                            </div>
                            {ws.users.map((u, j) => (
                              <div
                                key={u.id}
                                className="flex items-center justify-between px-4 py-2.5"
                                style={{ borderBottom: j < ws.users.length - 1 ? "1px solid rgba(139,92,246,0.08)" : "none" }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                                    style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }}
                                  >
                                    {(u.email ?? u.name ?? "?")[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-[#F1F5F9]">{u.email}</p>
                                    {u.name && <p className="text-[11px] text-[#64748B]">{u.name}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {/* Role select */}
                                  <select
                                    value={u.role}
                                    disabled={loadingId?.startsWith(u.id) || isPending}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    className="text-[10px] font-semibold px-2 py-1 rounded-lg cursor-pointer disabled:opacity-60"
                                    style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
                                  >
                                    {ROLES.map((r) => (
                                      <option key={r} value={r} style={{ background: "#111118", color: "#F1F5F9" }}>{r}</option>
                                    ))}
                                    <option value="super_admin" style={{ background: "#111118", color: "#F1F5F9" }}>super_admin</option>
                                  </select>
                                  {/* Delete user */}
                                  <button
                                    onClick={() => setConfirm({ type: "user", id: u.id, name: u.name ?? u.email, extra: u.email })}
                                    disabled={loadingId?.startsWith(u.id) || isPending}
                                    className="p-1 rounded-lg transition-all hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-40"
                                    title="Eliminar usuario"
                                  >
                                    <UserX size={12} color="#ef4444" strokeWidth={2} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}

                    {isExpanded && ws.users.length === 0 && (
                      <tr key={ws.id + "-empty"} style={{ borderBottom: !lastRow ? "1px solid rgba(139,92,246,0.08)" : "none" }}>
                        <td />
                        <td colSpan={6} className="px-4 pb-3">
                          <p className="text-xs text-[#64748B] py-2">Sin usuarios en este workspace</p>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal confirmación */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div
            className="w-full max-w-sm mx-4 rounded-2xl p-6 space-y-4"
            style={{ background: "#111118", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                <Trash2 size={18} color="#ef4444" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-[#F1F5F9]">
                  {confirm.type === "workspace" ? "Eliminar workspace" : "Eliminar usuario"}
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p className="text-sm font-semibold text-[#F1F5F9]">{confirm.name}</p>
              {confirm.extra && <p className="text-xs text-[#94A3B8]">{confirm.extra}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#94A3B8] transition-colors hover:text-[#F1F5F9]"
                style={{ border: "1px solid rgba(139,92,246,0.2)" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirm.type === "workspace" ? handleDeleteWorkspace : handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar orden */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div
            className="w-full max-w-sm mx-4 rounded-2xl p-6 space-y-4"
            style={{ background: "#111118", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
                <ShieldCheck size={18} color="#22c55e" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-[#F1F5F9]">Agregar orden manual</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">{orderModal.workspaceName}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Monto (ARS)</label>
                <input
                  type="number"
                  placeholder="Ej: 15000"
                  value={orderForm.total}
                  onChange={(e) => setOrderForm({ ...orderForm, total: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[rgba(139,92,246,0.25)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Nombre del cliente (opcional)</label>
                <input
                  type="text"
                  placeholder="Cliente manual"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[rgba(139,92,246,0.25)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setOrderModal(null); setOrderForm({ total: "", customerName: "" }); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#94A3B8] transition-colors hover:text-[#F1F5F9]"
                style={{ border: "1px solid rgba(139,92,246,0.2)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOrder}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Agregar orden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

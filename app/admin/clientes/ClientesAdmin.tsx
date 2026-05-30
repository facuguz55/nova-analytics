"use client";

import { useState, useTransition } from "react";
import {
  Plus, Search, ChevronDown, MoreHorizontal,
  Trash2, KeyRound, Crown, Pencil, Check, X, UserPlus,
  Store, Users, Zap, Clock, ShieldOff,
} from "lucide-react";
import {
  createClientAccount, changeWorkspacePlan, changeWorkspaceStatus,
  deleteWorkspace, deleteUser, resetClientPassword, updateClientInfo,
} from "@/app/admin/actions";
import { toast } from "sonner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type WsRow  = { id: string; name: string; plan: string; status: string; created_at: string };
type UserRow = { id: string; email: string; name: string | null; role: string; workspace_id: string | null; created_at: string };
type SubRow  = { workspace_id: string; status: string; trial_ends_at: string | null; next_billing_at: string | null; provider: string | null };
type Client  = { workspace: WsRow; users: UserRow[]; subscription: SubRow | null };

const PLANS = ["free", "trial", "active", "pro", "agency"] as const;

const PLAN_COLOR: Record<string, { text: string; bg: string }> = {
  free:   { text: "#94A3B8", bg: "rgba(100,116,139,0.12)" },
  trial:  { text: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  active: { text: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  pro:    { text: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  agency: { text: "#e1691e", bg: "rgba(225,105,30,0.12)" },
};

function PlanBadge({ plan }: { plan: string }) {
  const c = PLAN_COLOR[plan] ?? PLAN_COLOR.free;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
      style={{ color: c.text, background: c.bg }}>
      {plan}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ── Modal crear cliente ───────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "", email: "", password: "", workspaceName: "", plan: "active",
  });

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function handleCreate() {
    if (!form.email || !form.password || !form.workspaceName) {
      toast.error("Completá todos los campos obligatorios"); return;
    }
    startTransition(async () => {
      try {
        await createClientAccount(form.email, form.name || form.email.split("@")[0], form.password, form.workspaceName, form.plan);
        toast.success("Cliente creado correctamente");
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al crear cliente");
      }
    });
  }

  const inputCls = "w-full bg-[#0a0a0f] border border-[rgba(124,58,237,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none focus:border-[#7C3AED] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#F1F5F9]">Crear cliente</h2>
          <button onClick={onClose}><X size={16} color="#64748B" /></button>
        </div>

        <div className="space-y-3">
          {[
            { label: "Nombre", key: "name" as const, placeholder: "Juan Pérez", required: false },
            { label: "Email *", key: "email" as const, placeholder: "cliente@email.com", required: true },
            { label: "Contraseña *", key: "password" as const, placeholder: "Mínimo 8 caracteres", required: true },
            { label: "Nombre de la tienda *", key: "workspaceName" as const, placeholder: "Mi Tienda", required: true },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-[#94A3B8] mb-1 block">{f.label}</label>
              <input
                type={f.key === "password" ? "password" : "text"}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className={inputCls}
              />
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1 block">Plan</label>
            <select
              value={form.plan}
              onChange={(e) => set("plan", e.target.value)}
              className={inputCls}
            >
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#64748B] border border-[rgba(255,255,255,0.08)] hover:text-[#94A3B8] transition-colors">
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={pending}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7C3AED,#2563EB)" }}>
            {pending ? "Creando..." : "Crear cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row de cliente ────────────────────────────────────────────────────────────

function ClientRow({ client, onRefresh }: { client: Client; onRefresh: () => void }) {
  const [open, setOpen]           = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showEdit, setShowEdit]   = useState(false);
  const [pending, start]          = useTransition();
  const [newPwd, setNewPwd]       = useState("");
  const [editName, setEditName]   = useState(client.users[0]?.name ?? "");
  const [editEmail, setEditEmail] = useState(client.users[0]?.email ?? "");

  const ws   = client.workspace;
  const user = client.users[0] ?? null;
  const sub  = client.subscription;

  function act(fn: () => Promise<void>, msg: string) {
    start(async () => {
      try { await fn(); toast.success(msg); setOpen(false); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
    });
  }

  return (
    <>
      <tr className="border-b transition-colors hover:bg-[rgba(124,58,237,0.03)]"
        style={{ borderColor: "rgba(124,58,237,0.08)" }}>
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-[#F1F5F9]">{ws.name}</p>
          <p className="text-xs text-[#64748B]">{fmt(ws.created_at)}</p>
        </td>
        <td className="px-4 py-3">
          {user ? (
            <>
              <p className="text-sm text-[#CBD5E1]">{user.name ?? "—"}</p>
              <p className="text-xs text-[#64748B]">{user.email}</p>
            </>
          ) : <span className="text-xs text-[#475569]">Sin usuario</span>}
        </td>
        <td className="px-4 py-3"><PlanBadge plan={ws.plan} /></td>
        <td className="px-4 py-3">
          <span className="text-xs font-medium" style={{ color: ws.status === "active" ? "#22c55e" : "#ef4444" }}>
            {ws.status}
          </span>
          {sub && <p className="text-[10px] text-[#64748B] mt-0.5">{sub.status}</p>}
        </td>
        <td className="px-4 py-3">
          {sub?.next_billing_at
            ? <p className="text-xs text-[#94A3B8]">{fmt(sub.next_billing_at)}</p>
            : sub?.trial_ends_at
            ? <p className="text-xs text-[#f59e0b]">Trial hasta {fmt(sub.trial_ends_at)}</p>
            : <span className="text-xs text-[#475569]">—</span>}
        </td>
        <td className="px-4 py-3 relative">
          <button onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(124,58,237,0.1)]">
            <MoreHorizontal size={15} color="#64748B" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 z-20 rounded-xl py-1 min-w-[190px]"
              style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>

              {/* Cambiar plan */}
              <div className="px-3 py-1.5">
                <p className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Plan</p>
                <div className="flex flex-wrap gap-1">
                  {PLANS.map((p) => (
                    <button key={p} onClick={() => act(() => changeWorkspacePlan(ws.id, p), `Plan → ${p}`)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:opacity-80"
                      style={ws.plan === p
                        ? { background: "#7C3AED", color: "white" }
                        : { background: "rgba(124,58,237,0.1)", color: "#8B5CF6" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-1" style={{ borderTop: "1px solid rgba(124,58,237,0.1)" }} />

              <MenuItem icon={Pencil}  label="Editar usuario"     onClick={() => { setOpen(false); setShowEdit(true); }} />
              <MenuItem icon={KeyRound} label="Reset contraseña"  onClick={() => { setOpen(false); setShowReset(true); }} />
              <MenuItem icon={ws.status === "active" ? ShieldOff : Check}
                label={ws.status === "active" ? "Suspender" : "Activar"}
                onClick={() => act(() => changeWorkspaceStatus(ws.id, ws.status === "active" ? "suspended" : "active"),
                  ws.status === "active" ? "Workspace suspendido" : "Workspace activado")} />

              <div className="my-1" style={{ borderTop: "1px solid rgba(239,68,68,0.15)" }} />

              <MenuItem icon={Trash2} label="Eliminar workspace" danger
                onClick={() => {
                  if (!confirm(`¿Eliminar "${ws.name}"? Esto es irreversible.`)) return;
                  act(() => deleteWorkspace(ws.id), "Workspace eliminado");
                }} />
              {user && (
                <MenuItem icon={Trash2} label="Eliminar usuario" danger
                  onClick={() => {
                    if (!confirm(`¿Eliminar usuario ${user.email}?`)) return;
                    act(() => deleteUser(user.id), "Usuario eliminado");
                  }} />
              )}
            </div>
          )}
        </td>
      </tr>

      {/* Modal reset password */}
      {showReset && user && (
        <tr><td colSpan={6}>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F1F5F9]">Reset contraseña</h3>
                <button onClick={() => setShowReset(false)}><X size={15} color="#64748B" /></button>
              </div>
              <p className="text-xs text-[#64748B]">{user.email}</p>
              <input
                type="text"
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[rgba(124,58,237,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl text-sm text-[#64748B] border border-[rgba(255,255,255,0.08)]">Cancelar</button>
                <button disabled={pending || newPwd.length < 8}
                  onClick={() => { act(() => resetClientPassword(user.id, newPwd), "Contraseña actualizada"); setShowReset(false); setNewPwd(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "#7C3AED" }}>
                  {pending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </td></tr>
      )}

      {/* Modal editar usuario */}
      {showEdit && user && (
        <tr><td colSpan={6}>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F1F5F9]">Editar usuario</h3>
                <button onClick={() => setShowEdit(false)}><X size={15} color="#64748B" /></button>
              </div>
              {[{ label: "Nombre", val: editName, set: setEditName }, { label: "Email", val: editEmail, set: setEditEmail }].map((f) => (
                <div key={f.label}>
                  <label className="text-xs text-[#94A3B8] mb-1 block">{f.label}</label>
                  <input value={f.val} onChange={(e) => f.set(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[rgba(124,58,237,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] outline-none" />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-xl text-sm text-[#64748B] border border-[rgba(255,255,255,0.08)]">Cancelar</button>
                <button disabled={pending}
                  onClick={() => act(() => updateClientInfo(user.id, editName, editEmail), "Usuario actualizado")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "#7C3AED" }}>
                  {pending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </td></tr>
      )}
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[rgba(124,58,237,0.06)] text-left"
      style={{ color: danger ? "#ef4444" : "#CBD5E1" }}>
      <Icon size={13} strokeWidth={2} />
      {label}
    </button>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ClientesAdmin({ clients }: { clients: Client[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]         = useState("");
  const [filterPlan, setFilterPlan] = useState("all");

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.workspace.name.toLowerCase().includes(q) ||
      c.users.some((u) => u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q));
    const matchPlan = filterPlan === "all" || c.workspace.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const stats = {
    total:  clients.length,
    active: clients.filter((c) => c.workspace.plan === "active" || c.workspace.plan === "pro" || c.workspace.plan === "agency").length,
    trial:  clients.filter((c) => c.workspace.plan === "trial").length,
    free:   clients.filter((c) => c.workspace.plan === "free").length,
  };

  return (
    <div className="p-6 space-y-5">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Clientes</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Gestión completa de cuentas</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#7C3AED,#2563EB)" }}>
          <UserPlus size={15} />
          Crear cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Store, color: "#7C3AED" },
          { label: "Activos",  value: stats.active,  icon: Crown,  color: "#22c55e" },
          { label: "Trial",    value: stats.trial,   icon: Clock,  color: "#f59e0b" },
          { label: "Free",     value: stats.free,    icon: Users,  color: "#64748B" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.12)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
              <s.icon size={15} color={s.color} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xl font-black text-[#F1F5F9] leading-none">{s.value}</p>
              <p className="text-xs text-[#64748B]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} color="#64748B" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-[#111118] border border-[rgba(124,58,237,0.15)] rounded-xl pl-9 pr-4 py-2 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none"
          />
        </div>
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}
          className="bg-[#111118] border border-[rgba(124,58,237,0.15)] rounded-xl px-3 py-2 text-sm text-[#F1F5F9] outline-none">
          <option value="all">Todos los planes</option>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(124,58,237,0.12)", background: "rgba(124,58,237,0.04)" }}>
              {["Workspace", "Usuario", "Plan", "Estado", "Próximo cobro", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#475569]">No hay clientes</td></tr>
            ) : (
              filtered.map((c) => (
                <ClientRow key={c.workspace.id} client={c} onRefresh={() => {}} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  User, Mail, Shield, Calendar, Building2, Save,
  Lock, Eye, EyeOff, Trash2, AlertTriangle,
  CheckCircle, X, Crown, Sparkles, Star, KeyRound,
} from "lucide-react";
import { updateProfile, changePassword, deleteAccount } from "@/app/app/actions";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  authProvider: string;
  isOAuthUser: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google", github: "GitHub", azure: "Microsoft",
  facebook: "Facebook", apple: "Apple", email: "Email + contraseña",
};

const PLAN_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  free:   { label: "Plan Gratuito",   color: "#94A3B8", icon: Star },
  trial:  { label: "Prueba Gratuita", color: "#f59e0b", icon: Sparkles },
  pro:    { label: "Plan Pro",        color: "#a78bfa", icon: Crown },
  active: { label: "Plan Pro",        color: "#a78bfa", icon: Crown },
  agency: { label: "Plan Agency",     color: "#c084fc", icon: Crown },
};

interface Props {
  user: UserData;
  workspaceId: string;
  workspace: { name: string; plan: string; status: string } | null;
}

export default function CuentaClient({ user, workspaceId, workspace }: Props) {
  const [saving, setSaving]         = useState(false);
  const [name, setName]             = useState(user.name);
  const avatarPreview = user.avatar_url;

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [savingPwd, setSavingPwd]   = useState(false);

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [deleteConfirm, setDeleteConfirm]       = useState("");
  const [isPending, startTransition]            = useTransition();
  const [showCancelModal, setShowCancelModal]   = useState(false);
  const [cancelStep, setCancelStep]             = useState(0);
  const [cancelingPlan, setCancelingPlan]       = useState(false);
  const hasPaidPlan = ["active", "trial", "pro", "agency"].includes(workspace?.plan ?? "");

  const initials = (user.name || user.email).split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";
  const planKey  = (workspace?.plan ?? "free").toLowerCase();
  const planMeta = PLAN_META[planKey] ?? PLAN_META.free;
  const PlanIcon = planMeta.icon;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success("Perfil actualizado");
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally { setSaving(false); }
  }

  async function handlePasswordChange() {
    if (!newPwd || newPwd.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    if (newPwd !== confirmPwd) { toast.error("Las contraseñas no coinciden"); return; }
    setSavingPwd(true);
    try {
      const fd = new FormData(); fd.set("new_password", newPwd);
      await changePassword(fd);
      toast.success("Contraseña actualizada");
      setShowPasswordForm(false); setNewPwd(""); setConfirmPwd("");
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally { setSavingPwd(false); }
  }

  const memberSince = new Date(user.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">

      {/* ── Hero: banner gradiente + avatar con anillo neon ── */}
      <div className="anim-up rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 0 32px rgba(168,85,247,0.08)" }}>

        {/* Banner */}
        <div className="relative h-24 sm:h-28 overflow-hidden"
          style={{ background: "linear-gradient(120deg, rgba(139,92,246,0.35), rgba(192,38,211,0.25), rgba(34,211,238,0.12))" }}>
          <div className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(ellipse at 30% 0%, black 0%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 30% 0%, black 0%, transparent 75%)",
            }} />
          <div className="absolute -bottom-16 -right-8 w-56 h-56 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(192,132,252,0.25) 0%, transparent 70%)", filter: "blur(20px)" }} />
        </div>

        {/* Avatar + datos */}
        <div className="px-5 sm:px-6 pb-5 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative flex-shrink-0 w-fit">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white text-2xl font-black"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #c026d3)",
                border: "3px solid #111118",
                boxShadow: "0 0 0 2px rgba(168,85,247,0.6), 0 0 24px rgba(168,85,247,0.4)",
              }}
            >
              {avatarPreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover" />
                : initials}
            </div>
          </div>

          <div className="flex-1 min-w-0 sm:pb-1">
            <h1 className="text-xl font-black text-[#F1F5F9] truncate" style={{ letterSpacing: "-0.02em" }}>
              {user.name || "Sin nombre"}
            </h1>
            <p className="text-xs text-[#94A3B8] truncate mt-0.5">{user.email}</p>
          </div>

          <div className="flex items-center gap-2 sm:pb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={{
                background: `${planMeta.color}18`,
                color: planMeta.color,
                border: `1px solid ${planMeta.color}45`,
                boxShadow: `0 0 12px ${planMeta.color}25`,
              }}>
              <PlanIcon size={11} strokeWidth={2.5} />
              {planMeta.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full capitalize"
              style={{ background: "rgba(139,92,246,0.08)", color: "#94A3B8", border: "1px solid rgba(139,92,246,0.18)" }}>
              <Shield size={11} strokeWidth={2} />
              {user.role === "super_admin" ? "Admin" : "Cliente"}
            </span>
          </div>
        </div>

        {/* Chips de info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ background: "rgba(139,92,246,0.1)", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
          {[
            { icon: Building2, label: "Workspace",     value: workspace?.name ?? "—" },
            { icon: KeyRound,  label: "Acceso",        value: user.isOAuthUser ? (PROVIDER_LABELS[user.authProvider] ?? user.authProvider) : "Email + contraseña" },
            { icon: Calendar,  label: "Miembro desde", value: memberSince },
          ].map((chip) => (
            <div key={chip.label} className="flex items-center gap-3 px-5 py-3.5" style={{ background: "#111118" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(168,85,247,0.1)" }}>
                <chip.icon size={13} color="#a78bfa" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{chip.label}</p>
                <p className="text-xs font-semibold text-[#F1F5F9] truncate mt-0.5">{chip.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Información personal ── */}
      <form action={handleSubmit}>
        <div className="anim-up rounded-2xl p-5 space-y-4"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: "0.08s" }}>
          <div className="flex items-center gap-2">
            <User size={14} color="#a78bfa" strokeWidth={2.5} />
            <p className="text-sm font-semibold text-[#F1F5F9]">Información personal</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">Nombre</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all focus-within:shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <User size={14} color="#64748B" strokeWidth={2} />
                <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none"
                  placeholder="Tu nombre completo" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">Email</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgba(100,116,139,0.06)", border: "1px solid rgba(100,116,139,0.15)" }}>
                <Mail size={14} color="#64748B" strokeWidth={2} />
                <input type="email" value={user.email} disabled
                  className="flex-1 bg-transparent text-sm text-[#64748B] outline-none cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-85 hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)", boxShadow: "0 0 16px rgba(168,85,247,0.3)" }}>
              <Save size={13} strokeWidth={2.5} />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>

      {/* ── Seguridad ── */}
      <div className="anim-up rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: "0.14s" }}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
          <Shield size={14} color="#a78bfa" strokeWidth={2.5} />
          <p className="text-sm font-semibold text-[#F1F5F9]">Seguridad</p>
        </div>

        {/* Auth provider */}
        <div className="px-5 py-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(34,197,94,0.1)" }}>
            <Shield size={15} color="#22c55e" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#F1F5F9]">Método de acceso</p>
            <p className="text-xs text-[#64748B] mt-0.5">
              {user.isOAuthUser
                ? `Cuenta vinculada con ${PROVIDER_LABELS[user.authProvider] ?? user.authProvider}`
                : "Email y contraseña"}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
            {user.isOAuthUser ? (PROVIDER_LABELS[user.authProvider] ?? user.authProvider) : "Email"}
          </span>
        </div>

        {/* Contraseña */}
        <div>
          <div
            className="px-5 py-4 flex items-center gap-3 transition-all"
            style={{ cursor: user.isOAuthUser ? "default" : "pointer" }}
            onClick={() => { if (!user.isOAuthUser) setShowPasswordForm(!showPasswordForm); }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.1)" }}>
              <Lock size={15} color="#a78bfa" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#F1F5F9]">Contraseña</p>
              <p className="text-xs text-[#64748B] mt-0.5">
                {user.isOAuthUser
                  ? `Gestioná tu contraseña en ${PROVIDER_LABELS[user.authProvider] ?? user.authProvider}`
                  : "Cambiá tu contraseña de acceso"}
              </p>
            </div>
            {!user.isOAuthUser && (
              <span className="text-xs font-semibold neon-text">
                {showPasswordForm ? "Cancelar" : "Cambiar"}
              </span>
            )}
          </div>

          {showPasswordForm && !user.isOAuthUser && (
            <div className="px-5 pb-5 space-y-3 anim-up" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
              <div className="pt-4 space-y-3">
                {[
                  { label: "Nueva contraseña", value: newPwd, onChange: setNewPwd, placeholder: "Mínimo 8 caracteres" },
                  { label: "Confirmar contraseña", value: confirmPwd, onChange: setConfirmPwd, placeholder: "Repetí la contraseña" },
                ].map((field, i) => (
                  <div key={i} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{field.label}</label>
                    <div className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all focus-within:shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                      style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <Lock size={13} color="#64748B" strokeWidth={2} />
                      <input type={showPwd ? "text" : "password"} value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]" />
                      {i === 0 && (
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-[#64748B] hover:text-[#94A3B8]">
                          {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      )}
                      {i === 1 && confirmPwd && (
                        newPwd === confirmPwd
                          ? <CheckCircle size={13} color="#22c55e" strokeWidth={2.5} />
                          : <X size={13} color="#ef4444" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={handlePasswordChange} disabled={savingPwd}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-85 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)", boxShadow: "0 0 16px rgba(168,85,247,0.25)" }}>
                  <Shield size={13} strokeWidth={2.5} />
                  {savingPwd ? "Guardando..." : "Actualizar contraseña"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Zona peligrosa ── */}
      <div className="anim-up rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.2)", animationDelay: "0.20s" }}>
        <div className="px-5 py-3 flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.12)" }}>
          <AlertTriangle size={14} color="#ef4444" strokeWidth={2} />
          <p className="text-sm font-semibold text-[#ef4444]">Zona peligrosa</p>
        </div>

        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "#111118" }}>
          <div>
            <p className="text-sm font-semibold text-[#F1F5F9]">Eliminar cuenta</p>
            <p className="text-xs text-[#64748B] mt-0.5">Acción permanente e irreversible.</p>
          </div>
          <button onClick={() => setShowDeleteModal(true)}
            className="flex-shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Trash2 size={13} strokeWidth={2} /> Eliminar
          </button>
        </div>
      </div>

      {/* Modal eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
          <div className="anim-scale rounded-2xl w-full max-w-md p-6 space-y-5"
            style={{ background: "#111118", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                <AlertTriangle size={22} color="#ef4444" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">¿Eliminar cuenta?</h3>
                <p className="text-xs text-[#64748B]">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-[#94A3B8]">
              Se eliminarán <strong className="text-[#F1F5F9]">permanentemente</strong> todos tus datos: workspace, integraciones y configuraciones.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                Escribí <span className="text-[#ef4444]">ELIMINAR</span> para confirmar
              </label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="ELIMINAR"
                  className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-[#64748B] transition-all hover:text-[#F1F5F9]"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                Cancelar
              </button>
              <button
                disabled={deleteConfirm !== "ELIMINAR" || isPending}
                onClick={() => startTransition(async () => {
                  try { await deleteAccount(new FormData()); toast.success("Cuenta eliminada"); }
                  catch (e) { toast.error("Error: " + (e instanceof Error ? e.message : "")); }
                })}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: "#ef4444" }}>
                {isPending ? "Eliminando..." : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link casi invisible para cancelar plan */}
      {hasPaidPlan && (
        <p className="text-center">
          <button
            onClick={() => { setShowCancelModal(true); setCancelStep(0); }}
            className="text-[11px] transition-colors"
            style={{ color: "#1e293b" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#475569")}
            onMouseLeave={e => (e.currentTarget.style.color = "#1e293b")}
          >
            gestionar plan
          </button>
        </p>
      )}

      {/* Modal cancelar plan */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <div className="anim-scale rounded-2xl w-full max-w-sm p-6 space-y-4"
            style={{ background: "#111118", border: "1px solid rgba(100,116,139,0.2)" }}>

            {cancelStep === 0 && (
              <>
                <p className="text-sm font-semibold text-[#F1F5F9]">¿Cancelar suscripción?</p>
                <p className="text-xs text-[#64748B]">
                  Seguirás teniendo acceso hasta que venza el período actual. Después perdés todas las funciones.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
                  >
                    No, mantener plan
                  </button>
                  <button
                    onClick={() => setCancelStep(1)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(100,116,139,0.08)", color: "#64748B", border: "1px solid rgba(100,116,139,0.15)" }}
                  >
                    Continuar →
                  </button>
                </div>
              </>
            )}

            {cancelStep === 1 && (
              <>
                <p className="text-sm font-semibold text-[#F1F5F9]">Última confirmación</p>
                <p className="text-xs text-[#64748B]">
                  Esta acción cancelará tu suscripción. ¿Estás completamente seguro?
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
                  >
                    Quedarme
                  </button>
                  <button
                    disabled={cancelingPlan}
                    onClick={async () => {
                      setCancelingPlan(true);
                      try {
                        const res = await fetch("/api/billing/cancel", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ workspaceId }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error);
                        toast.success("Suscripción cancelada.");
                        setTimeout(() => window.location.href = "/billing", 1500);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Error");
                      } finally {
                        setCancelingPlan(false);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    {cancelingPlan ? "Cancelando..." : "Cancelar plan"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

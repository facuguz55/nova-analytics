"use client";

import { useState, useRef, useTransition } from "react";
import {
  User, Mail, Shield, Calendar, Building2, Save,
  Lock, Eye, EyeOff, Trash2, AlertTriangle,
  Camera, CheckCircle, X, Crown, Sparkles, Star,
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

const PLAN_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  free:   { label: "Plan Gratuito",   color: "#94A3B8", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)", icon: Star },
  trial:  { label: "Prueba Gratuita", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  icon: Sparkles },
  pro:    { label: "Plan Pro",        color: "#8B5CF6", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.3)",  icon: Crown },
  active: { label: "Plan Pro",        color: "#8B5CF6", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.3)",  icon: Crown },
  agency: { label: "Plan Agency",     color: "#e1691e", bg: "rgba(225,105,30,0.1)",  border: "rgba(225,105,30,0.3)",  icon: Crown },
};

interface Props {
  user: UserData;
  workspaceId: string;
  workspace: { name: string; plan: string; status: string } | null;
}

export default function CuentaClient({ user, workspaceId, workspace }: Props) {
  const [saving, setSaving]         = useState(false);
  const [name, setName]             = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [savingPwd, setSavingPwd]   = useState(false);

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [deleteConfirm, setDeleteConfirm]       = useState("");
  const [isPending, startTransition]            = useTransition();
  const [showCancelSection, setShowCancelSection] = useState(false);
  const [cancelStep, setCancelStep]             = useState(0);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  const hasPaidPlan = ["active", "trial", "pro", "agency"].includes(workspace?.plan ?? "");

  const initials = (user.name || user.email).split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";
  const planKey  = (workspace?.plan ?? "free").toLowerCase();
  const planMeta = PLAN_META[planKey] ?? PLAN_META.free;
  const PlanIcon = planMeta.icon;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("La imagen no puede superar 2 MB"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      if (avatarFile) formData.set("avatar", avatarFile);
      await updateProfile(formData);
      toast.success("Perfil actualizado");
      setAvatarFile(null);
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally { setSaving(false); }
  }

  async function handleCancelSubscription() {
    setCancelingSubscription(true);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo cancelar");
      toast.success("Suscripción cancelada.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally {
      setCancelingSubscription(false);
    }
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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Mi Cuenta</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Perfil, seguridad y workspace.</p>
      </div>

      {/* ── Fila superior: Avatar + Plan ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Avatar card */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-white text-xl font-black"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
            >
              {avatarPreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover" />
                : initials}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "#7C3AED", border: "2px solid #0a0a0f" }}
            >
              <Camera size={12} color="white" strokeWidth={2.5} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-bold text-[#F1F5F9]">{user.name || "Sin nombre"}</p>
            <p className="text-xs text-[#64748B] mt-0.5">{user.email}</p>
            <p className="text-[11px] text-[#475569] mt-1 capitalize">{user.role}</p>
          </div>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: planMeta.bg, border: `1px solid ${planMeta.border}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${planMeta.color}20` }}>
            <PlanIcon size={20} color={planMeta.color} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#F1F5F9]">{planMeta.label}</p>
            <p className="text-xs mt-0.5" style={{ color: planMeta.color }}>
              {workspace?.status === "active" ? "Activo" : workspace?.status ?? "—"}
            </p>
            {workspace && (
              <p className="text-xs text-[#64748B] mt-1">{workspace.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Información personal ── */}
      <form action={handleSubmit}>
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Información personal</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">Nombre</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <Calendar size={12} strokeWidth={2} />
              Miembro desde {new Date(user.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}>
              <Save size={13} strokeWidth={2.5} />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </form>

      {/* ── Seguridad ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Seguridad</p>
        </div>

        {/* Auth provider */}
        <div className="px-5 py-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.08)" }}>
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
              style={{ background: "rgba(124,58,237,0.1)" }}>
              <Lock size={15} color="#8B5CF6" strokeWidth={2} />
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
              <span className="text-xs font-semibold" style={{ color: "#7C3AED" }}>
                {showPasswordForm ? "Cancelar" : "Cambiar"}
              </span>
            )}
          </div>

          {showPasswordForm && !user.isOAuthUser && (
            <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid rgba(124,58,237,0.1)" }}>
              <div className="pt-4 space-y-3">
                {[
                  { label: "Nueva contraseña", value: newPwd, onChange: setNewPwd, placeholder: "Mínimo 8 caracteres" },
                  { label: "Confirmar contraseña", value: confirmPwd, onChange: setConfirmPwd, placeholder: "Repetí la contraseña" },
                ].map((field, i) => (
                  <div key={i} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{field.label}</label>
                    <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                      style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
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
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}>
                  <Shield size={13} strokeWidth={2.5} />
                  {savingPwd ? "Guardando..." : "Actualizar contraseña"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Workspace ── */}
      {workspace && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Workspace</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Building2, label: "Nombre",        value: workspace.name },
              { icon: Shield,    label: "Plan",           value: planMeta.label },
              { icon: Calendar,  label: "Cuenta creada", value: new Date(user.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) },
            ].map((row) => (
              <div key={row.label} className="rounded-xl px-4 py-3"
                style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <row.icon size={12} color="#64748B" strokeWidth={2} />
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{row.label}</span>
                </div>
                <p className="text-sm font-semibold text-[#F1F5F9]">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Zona peligrosa ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
        <div className="px-5 py-3 flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.12)" }}>
          <AlertTriangle size={14} color="#ef4444" strokeWidth={2} />
          <p className="text-sm font-semibold text-[#ef4444]">Zona peligrosa</p>
        </div>

        {/* Cancelar suscripción — solo si tiene plan activo */}
        {hasPaidPlan && (
          <div style={{ background: "#111118", borderBottom: "1px solid rgba(239,68,68,0.08)" }}>
            <div
              className="px-5 py-4 flex items-center justify-between cursor-pointer"
              onClick={() => { setShowCancelSection(!showCancelSection); setCancelStep(0); }}
            >
              <div>
                <p className="text-sm font-semibold text-[#F1F5F9]">Cancelar suscripción</p>
                <p className="text-xs text-[#64748B] mt-0.5">Perdés el acceso al vencer el período.</p>
              </div>
              <span className="text-xs text-[#475569]">{showCancelSection ? "▲" : "▼"}</span>
            </div>

            {showCancelSection && (
              <div className="px-5 pb-5 space-y-3">
                {cancelStep === 0 && (
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p className="text-sm text-[#94A3B8]">¿Estás seguro? Perderás acceso a todas las funciones de Nova Analytics.</p>
                    <button
                      onClick={() => setCancelStep(1)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      Sí, quiero continuar →
                    </button>
                  </div>
                )}
                {cancelStep === 1 && (
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p className="text-sm text-[#94A3B8]">¿Confirmás que querés cancelar? Esta acción no se puede deshacer fácilmente.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCancelStep(0)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: "rgba(100,116,139,0.1)", color: "#64748B", border: "1px solid rgba(100,116,139,0.2)" }}
                      >
                        No, mantener plan
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelingSubscription}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                      >
                        {cancelingSubscription ? "Cancelando..." : "Cancelar suscripción"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
          <div className="rounded-2xl w-full max-w-md p-6 space-y-5"
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
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
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
    </div>
  );
}

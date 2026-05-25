"use client";

import { useState, useRef, useTransition } from "react";
import {
  User, Mail, Shield, Calendar, Building2, Save,
  Lock, Eye, EyeOff, Trash2,
  AlertTriangle, Camera, CheckCircle, X,
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
  google:   "Google",
  github:   "GitHub",
  azure:    "Microsoft",
  facebook: "Facebook",
  apple:    "Apple",
  email:    "Email + contraseña",
};

interface WorkspaceData {
  name: string;
  plan: string;
  status: string;
}

interface Props {
  user: UserData;
  workspace: WorkspaceData | null;
}

const PLAN_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  free:    { bg: "rgba(100,116,139,0.1)", color: "#94A3B8", border: "rgba(100,116,139,0.3)" },
  trial:   { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", border: "rgba(245,158,11,0.3)"  },
  pro:     { bg: "rgba(124,58,237,0.1)",  color: "#8B5CF6", border: "rgba(124,58,237,0.3)"  },
  agency:  { bg: "rgba(225,105,30,0.1)",  color: "#e1691e", border: "rgba(225,105,30,0.3)"  },
};

function getPlanBadge(plan: string) {
  return PLAN_COLORS[plan.toLowerCase()] ?? PLAN_COLORS["free"];
}


export default function CuentaClient({ user, workspace }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Eliminar cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  const initials = (user.name || user.email)
    .split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

  const planBadge = getPlanBadge(workspace?.plan ?? "free");

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
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (!newPwd || newPwd.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (newPwd !== confirmPwd) { toast.error("Las contraseñas no coinciden"); return; }
    setSavingPwd(true);
    try {
      const fd = new FormData();
      fd.set("new_password", newPwd);
      await changePassword(fd);
      toast.success("Contraseña actualizada");
      setShowPasswordForm(false);
      setNewPwd(""); setConfirmPwd("");
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Mi Cuenta</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Gestioná tu perfil, seguridad y acceso.</p>
      </div>

      {/* Avatar + info */}
      <div className="rounded-2xl p-6 flex items-center gap-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
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
            title="Cambiar foto"
          >
            <Camera size={12} color="white" strokeWidth={2.5} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="flex-1">
          <p className="font-bold text-[#F1F5F9] text-lg">{user.name || "Sin nombre"}</p>
          <p className="text-sm text-[#94A3B8]">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
              style={{ background: planBadge.bg, color: planBadge.color, border: `1px solid ${planBadge.border}` }}>
              {workspace?.plan === "free" ? "Sin plan activo"
                : workspace?.plan === "trial" ? "Prueba gratuita"
                : workspace?.plan === "pro"   ? "Plan Pro"
                : workspace?.plan === "agency" ? "Plan Agency"
                : workspace?.plan ?? "Free"}
            </span>
            <span className="text-xs text-[#64748B] capitalize">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      <form action={handleSubmit}>
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Información personal</p>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">Nombre</label>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <User size={15} color="#64748B" strokeWidth={2} />
              <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none"
                placeholder="Tu nombre completo" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">Email</label>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: "rgba(100,116,139,0.06)", border: "1px solid rgba(100,116,139,0.15)" }}>
              <Mail size={15} color="#64748B" strokeWidth={2} />
              <input type="email" value={user.email} disabled
                className="flex-1 bg-transparent text-sm text-[#64748B] outline-none cursor-not-allowed" />
            </div>
            <p className="text-xs text-[#475569] mt-1">El email está vinculado a tu proveedor de autenticación</p>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}>
            <Save size={14} strokeWidth={2.5} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      {/* Seguridad — contraseña */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            borderBottom: showPasswordForm && !user.isOAuthUser ? "1px solid rgba(124,58,237,0.12)" : "none",
            cursor: user.isOAuthUser ? "default" : "pointer",
          }}
          onClick={() => { if (!user.isOAuthUser) setShowPasswordForm(!showPasswordForm); }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
              <Lock size={15} color="#8B5CF6" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F1F5F9]">Contraseña</p>
              <p className="text-xs text-[#64748B]">
                {user.isOAuthUser
                  ? `Tu cuenta usa ${PROVIDER_LABELS[user.authProvider] ?? user.authProvider}. Gestioná tu contraseña desde ahí.`
                  : "Cambiá o establecé tu contraseña de acceso"}
              </p>
            </div>
          </div>
          {user.isOAuthUser ? (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              {PROVIDER_LABELS[user.authProvider] ?? user.authProvider}
            </span>
          ) : (
            <span className="text-xs text-[#7C3AED] font-semibold">{showPasswordForm ? "Cancelar" : "Cambiar"}</span>
          )}
        </div>

        {showPasswordForm && !user.isOAuthUser && (
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Nueva contraseña</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <Lock size={14} color="#64748B" strokeWidth={2} />
                <input type={showPwd ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-[#64748B] hover:text-[#94A3B8]">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Confirmar contraseña</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <Lock size={14} color="#64748B" strokeWidth={2} />
                <input type={showPwd ? "text" : "password"} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repetí la contraseña"
                  className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]" />
                {confirmPwd && (
                  newPwd === confirmPwd
                    ? <CheckCircle size={14} color="#22c55e" strokeWidth={2.5} />
                    : <X size={14} color="#ef4444" strokeWidth={2.5} />
                )}
              </div>
            </div>
            <button onClick={handlePasswordChange} disabled={savingPwd}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}>
              <Shield size={14} strokeWidth={2.5} />
              {savingPwd ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </div>
        )}
      </div>

      {/* Sesión actual */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.1)" }}>
          <Shield size={18} color="#22c55e" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#F1F5F9]">Sesión activa</p>
          <p className="text-xs text-[#64748B] mt-0.5">
            Conectado como <span className="text-[#94A3B8] font-medium">{user.email}</span>
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
          Sesión actual
        </span>
      </div>

      {/* Info del workspace */}
      {workspace && (
        <div className="rounded-2xl p-6 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Workspace</p>
          {[
            { icon: Building2, label: "Nombre",         value: workspace.name },
            { icon: Shield,    label: "Plan",            value: workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1) },
            { icon: Calendar,  label: "Cuenta creada",  value: new Date(user.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>
                <row.icon size={14} color="#7C3AED" strokeWidth={2} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs text-[#64748B]">{row.label}</span>
                <span className="text-sm font-semibold text-[#F1F5F9]">{row.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zona peligrosa */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
        <div className="px-6 py-4 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
          <AlertTriangle size={15} color="#ef4444" strokeWidth={2} />
          <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>Zona peligrosa</p>
        </div>
        <div className="p-6" style={{ background: "#111118" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#F1F5F9]">Eliminar cuenta</p>
              <p className="text-xs text-[#64748B] mt-1">
                Esta acción es permanente e irreversible. Se eliminarán todos tus datos, integraciones y workspace.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <Trash2 size={14} strokeWidth={2} />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Modal eliminar cuenta */}
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
              Se eliminarán <strong className="text-[#F1F5F9]">permanentemente</strong> todos tus datos: workspace, integraciones,
              configuraciones financieras y preferencias.
            </p>

            <div className="space-y-2">
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
                onClick={() => {
                  const fd = new FormData();
                  startTransition(async () => {
                    try {
                      await deleteAccount(fd);
                      toast.success("Cuenta eliminada");
                    } catch (e) {
                      toast.error("Error: " + (e instanceof Error ? e.message : ""));
                    }
                  });
                }}
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

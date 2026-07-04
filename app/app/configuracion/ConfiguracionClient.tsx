"use client";

import { useState } from "react";
import {
  Lock, Eye, EyeOff, Bell, CreditCard, Plug, DollarSign,
  ChevronRight, Shield, CheckCircle2, User, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { changePassword } from "@/app/app/actions";
import { toast } from "sonner";

interface Props {
  user: {
    email: string;
    name: string;
    isOAuthUser: boolean;
    authProvider: string;
    plan: string;
  };
}

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google", github: "GitHub", azure: "Microsoft",
  facebook: "Facebook", apple: "Apple", email: "Correo",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito", trial: "Prueba", pro: "Pro", active: "Pro", agency: "Agency",
};

const SHORTCUTS = [
  { href: "/app/configuracion/integraciones", icon: Plug,       label: "Integraciones",     desc: "TiendaNube, Meta Ads, Gmail" },
  { href: "/app/configuracion/financiera",    icon: DollarSign, label: "Finanzas",           desc: "Tipo de cambio, IVA, comisiones" },
  { href: "/app/configuracion/notificaciones",icon: Bell,       label: "Notificaciones",     desc: "Telegram, resumen diario" },
  { href: "/app/configuracion/ia",            icon: Sparkles,   label: "Contexto de IA",     desc: "Info de la tienda para sugerencias de email" },
  { href: "/app/configuracion/cuenta",        icon: User,       label: "Perfil completo",    desc: "Avatar, nombre, eliminar cuenta" },
  { href: "/billing",                         icon: CreditCard, label: "Suscripción",        desc: "Plan activo y facturación" },
];

export default function ConfiguracionClient({ user }: Props) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);

  async function handlePasswordChange() {
    if (!newPwd || newPwd.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (newPwd !== confirmPwd) { toast.error("Las contraseñas no coinciden"); return; }
    setSaving(true);
    setSuccess(false);
    try {
      const fd = new FormData();
      fd.set("new_password", newPwd);
      await changePassword(fd);
      toast.success("Contraseña actualizada correctamente");
      setSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : "No se pudo actualizar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">

      {/* Título */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Configuración</h1>
        <p className="text-sm text-[#64748B] mt-1">Gestioná tu cuenta y las preferencias del workspace.</p>
      </div>

      {/* Info de cuenta */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.15)" }}>
          <Shield size={20} color="#a78bfa" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#F1F5F9] truncate">{user.email}</p>
          <p className="text-xs text-[#64748B] mt-0.5">
            {user.name || "Sin nombre"} · {PROVIDER_LABELS[user.authProvider] ?? user.authProvider}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>
          {PLAN_LABELS[user.plan] ?? user.plan}
        </span>
      </div>

      {/* Cambio de contraseña */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
          <Lock size={15} color="#a78bfa" strokeWidth={2} />
          <p className="text-sm font-bold text-[#F1F5F9]">Cambiar contraseña</p>
        </div>

        {user.isOAuthUser ? (
          <div className="px-5 py-4">
            <p className="text-sm text-[#94A3B8]">
              Tu cuenta está vinculada con {PROVIDER_LABELS[user.authProvider] ?? user.authProvider}.
              Para cambiar la contraseña, hacelo desde esa plataforma.
            </p>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <CheckCircle2 size={15} color="#22c55e" />
                <p className="text-sm text-[#22c55e] font-medium">Contraseña actualizada correctamente</p>
              </div>
            )}

            {(
              [
                { id: "new",     label: "Nueva contraseña",     value: newPwd,     setter: setNewPwd,     placeholder: "Mínimo 8 caracteres" },
                { id: "confirm", label: "Confirmar contraseña", value: confirmPwd, setter: setConfirmPwd, placeholder: "Repetí la contraseña" },
              ] as const
            ).map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-xs font-medium text-[#94A3B8]">{field.label}</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-transparent text-[#F1F5F9] placeholder-[#475569] outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.2)" }}
                  />
                  {field.id === "new" && (
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors"
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-xs text-[#475569]">
                {newPwd.length > 0 && newPwd.length < 8
                  ? <span className="text-[#f59e0b]">Mínimo 8 caracteres</span>
                  : newPwd.length >= 8 && confirmPwd.length > 0 && newPwd !== confirmPwd
                  ? <span className="text-[#ef4444]">Las contraseñas no coinciden</span>
                  : newPwd.length >= 8 && newPwd === confirmPwd && confirmPwd.length > 0
                  ? <span className="text-[#22c55e]">Contraseñas coinciden ✓</span>
                  : null}
              </p>
              <button
                onClick={handlePasswordChange}
                disabled={saving || !newPwd || !confirmPwd}
                className="px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", color: "white" }}
              >
                {saving ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Links a otras secciones */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
          <p className="text-sm font-bold text-[#F1F5F9]">Más configuraciones</p>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(139,92,246,0.07)" }}>
          {SHORTCUTS.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}
              className="flex items-center gap-4 px-5 py-4 transition-all hover:bg-[rgba(139,92,246,0.04)] group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.1)" }}>
                <Icon size={16} color="#a78bfa" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#F1F5F9]">{label}</p>
                <p className="text-xs text-[#64748B]">{desc}</p>
              </div>
              <ChevronRight size={15} color="#64748B" className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

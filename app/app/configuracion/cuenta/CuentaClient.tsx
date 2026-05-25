"use client";

import { useState } from "react";
import { User, Mail, Shield, Calendar, Building2, Save } from "lucide-react";
import { updateProfile } from "@/app/app/actions";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

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
  pro:     { bg: "rgba(124,58,237,0.1)",  color: "#8B5CF6", border: "rgba(124,58,237,0.3)" },
  agency:  { bg: "rgba(225,105,30,0.1)",  color: "#e1691e", border: "rgba(225,105,30,0.3)" },
};

function getPlanBadge(plan: string) {
  return PLAN_COLORS[plan.toLowerCase()] ?? PLAN_COLORS["free"];
}

export default function CuentaClient({ user, workspace }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user.name);

  const initials = (user.name || user.email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const planBadge = getPlanBadge(workspace?.plan ?? "free");

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success("Perfil actualizado");
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Mi Cuenta
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Gestioná tu perfil y la información del workspace.
        </p>
      </div>

      {/* Avatar + info */}
      <div
        className="rounded-2xl p-6 flex items-center gap-5"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
        >
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
          ) : initials}
        </div>
        <div className="flex-1">
          <p className="font-bold text-[#F1F5F9] text-lg">{user.name || "Sin nombre"}</p>
          <p className="text-sm text-[#94A3B8]">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
              style={{ background: planBadge.bg, color: planBadge.color, border: `1px solid ${planBadge.border}` }}
            >
              {workspace?.plan ?? "Free"}
            </span>
            <span className="text-xs text-[#64748B]">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      <form action={handleSubmit}>
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <p className="text-sm font-semibold text-[#F1F5F9] mb-2">Información personal</p>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
              Nombre
            </label>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <User size={15} color="#64748B" strokeWidth={2} />
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none"
                placeholder="Tu nombre completo"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
              Email
            </label>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: "rgba(100,116,139,0.06)", border: "1px solid rgba(100,116,139,0.15)" }}
            >
              <Mail size={15} color="#64748B" strokeWidth={2} />
              <input
                type="email"
                value={user.email}
                disabled
                className="flex-1 bg-transparent text-sm text-[#64748B] outline-none cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-[#475569] mt-1">El email está vinculado a tu proveedor de autenticación</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
          >
            <Save size={14} strokeWidth={2.5} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      {/* Info del workspace */}
      {workspace && (
        <div
          className="rounded-2xl p-6 space-y-3"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <p className="text-sm font-semibold text-[#F1F5F9]">Workspace</p>
          {[
            { icon: Building2, label: "Nombre", value: workspace.name },
            { icon: Shield, label: "Plan", value: workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1) },
            { icon: Calendar, label: "Cuenta creada", value: new Date(user.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.08)" }}
              >
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
    </div>
  );
}

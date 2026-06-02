import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Activity, Shield, LogIn, LogOut, Settings, Plug, Trash2, UserCog, CreditCard, Zap } from "lucide-react";
import CancelSubscriptionSection from "./CancelSubscriptionSection";

export const metadata: Metadata = { title: "Actividad de cuenta" };

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  integration_disconnected: { label: "Integración desconectada",  icon: Plug,     color: "#ef4444" },
  trial_started:            { label: "Trial iniciado",             icon: Zap,      color: "#22c55e" },
  sign_in:                  { label: "Inicio de sesión",           icon: LogIn,    color: "#2563EB" },
  sign_out:                 { label: "Cierre de sesión",           icon: LogOut,   color: "#64748B" },
  settings_updated:         { label: "Configuración actualizada",  icon: Settings, color: "#f59e0b" },
  account_deleted:          { label: "Cuenta eliminada",           icon: Trash2,   color: "#ef4444" },
  password_changed:         { label: "Contraseña cambiada",        icon: UserCog,  color: "#8B5CF6" },
  billing_event:            { label: "Evento de billing",          icon: CreditCard, color: "#e1691e" },
};

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { label: action, icon: Activity, color: "#94A3B8" };
}

export default async function ActividadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  const workspaceId = (userRow as any)?.workspace_id as string | null;

  let logs: Array<{
    id: string;
    action: string;
    user_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }> = [];

  if (workspaceId) {
    const { data } = await (supabase as any)
      .from("audit_logs")
      .select("id, action, user_id, metadata, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(100);
    logs = data ?? [];
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl">
      <div>
        <div className="flex items-center gap-2">
          <Shield size={18} color="#8B5CF6" strokeWidth={2} />
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Registro de actividad
          </h1>
        </div>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          Historial de acciones realizadas en tu cuenta y workspace
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        {logs.length === 0 ? (
          <div className="p-10 text-center">
            <Activity size={32} color="#475569" className="mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">Sin actividad registrada todavía</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => {
              const meta = getActionMeta(log.action);
              const Icon = meta.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-4 sm:px-5 py-3"
                  style={{ borderBottom: i < logs.length - 1 ? "1px solid rgba(124,58,237,0.07)" : "none" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${meta.color}15` }}>
                    <Icon size={14} color={meta.color} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F1F5F9]">{meta.label}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {Object.entries(log.metadata)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#475569]">
                      {new Date(log.created_at).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-[#475569] text-center">
        Se conservan los últimos 100 eventos · Los logs se eliminan automáticamente a los 90 días
      </p>

      {workspaceId && <CancelSubscriptionSection workspaceId={workspaceId} />}
    </div>
  );
}

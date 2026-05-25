"use client";

import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Info, X } from "lucide-react";
import { markAlertRead } from "@/app/app/actions";
import { toast } from "sonner";

interface Alert {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  auto: boolean;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; color: string; border: string }> = {
  danger:  { icon: AlertTriangle, bg: "rgba(239,68,68,0.08)",   color: "#ef4444", border: "rgba(239,68,68,0.25)"   },
  warning: { icon: AlertTriangle, bg: "rgba(245,158,11,0.08)",  color: "#f59e0b", border: "rgba(245,158,11,0.25)"  },
  info:    { icon: Info,          bg: "rgba(37,99,235,0.08)",   color: "#2563EB", border: "rgba(37,99,235,0.25)"   },
  success: { icon: CheckCircle2,  bg: "rgba(34,197,94,0.08)",   color: "#22c55e", border: "rgba(34,197,94,0.25)"   },
  system:  { icon: Bell,          bg: "rgba(124,58,237,0.08)",  color: "#7C3AED", border: "rgba(124,58,237,0.25)"  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG["info"];
}

function fmtDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 3600000) return `Hace ${Math.round(diff / 60000)} min`;
  if (diff < 86400000) return `Hace ${Math.round(diff / 3600000)} h`;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default function AlertasClient({ alerts }: { alerts: Alert[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const visible = alerts.filter((a) => !dismissed.has(a.id) && (filter === "all" || !a.read));
  const unreadCount = alerts.filter((a) => !a.read && !dismissed.has(a.id)).length;

  async function handleDismiss(alert: Alert) {
    setDismissed((prev) => new Set([...prev, alert.id]));
    if (!alert.auto) {
      try {
        await markAlertRead(alert.id);
      } catch {
        toast.error("Error al marcar como leída");
      }
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Alertas
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {unreadCount > 0 ? (
              <span>
                <span className="text-[#7C3AED] font-semibold">{unreadCount}</span> sin leer
              </span>
            ) : "Sin alertas pendientes"}
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: filter === f ? "#7C3AED" : "transparent",
                color: filter === f ? "white" : "#94A3B8",
              }}
            >
              {f === "all" ? "Todas" : "Sin leer"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <CheckCircle2 size={32} color="#22c55e" strokeWidth={1.5} />
          <p className="text-sm text-[#64748B]">
            {filter === "unread" ? "Sin alertas sin leer" : "Sin alertas activas"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((alert) => {
            const cfg = getConfig(alert.type);
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className="rounded-2xl p-4 flex items-start gap-4 transition-all"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  opacity: alert.read ? 0.7 : 1,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}18` }}
                >
                  <Icon size={17} color={cfg.color} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-[#F1F5F9]">{alert.title}</p>
                    {!alert.read && !alert.auto && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: cfg.color + "20", color: cfg.color }}
                      >
                        NUEVO
                      </span>
                    )}
                    {alert.auto && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(124,58,237,0.15)", color: "#8B5CF6" }}
                      >
                        AUTO
                      </span>
                    )}
                  </div>
                  {alert.body && (
                    <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{alert.body}</p>
                  )}
                  <p className="text-[11px] text-[#64748B] mt-1.5">{fmtDate(alert.created_at)}</p>
                </div>
                <button
                  onClick={() => handleDismiss(alert)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-70"
                  style={{ color: "#64748B", background: "rgba(255,255,255,0.05)" }}
                  title="Descartar"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

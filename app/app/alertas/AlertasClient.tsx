"use client";

import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Info, X, ChevronDown, Package, ShoppingCart, Mail, DollarSign } from "lucide-react";
import { markAlertRead } from "@/app/app/actions";
import { toast } from "sonner";

// ── Categorías ───────────────────────────────────────────────────────────────
// Mapeo de heurística por título → categoría
type Category = "stock-out" | "stock-low" | "orders" | "integrations" | "finance" | "other";

function categorizeAlert(a: { title: string; type: string }): Category {
  const t = a.title.toLowerCase();
  if (t.includes("sin stock") || t.includes("out of stock") || t.includes("agotado")) return "stock-out";
  if (t.includes("stock bajo") || t.includes("low stock") || t.includes("pocas unidades")) return "stock-low";
  if (t.includes("orden") || t.includes("pago") || t.includes("venta")) return "orders";
  if (t.includes("integración") || t.includes("integracion") || t.includes("conexión") || t.includes("token")) return "integrations";
  if (t.includes("comisión") || t.includes("comision") || t.includes("usd") || t.includes("dólar")) return "finance";
  return "other";
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ElementType; color: string }> = {
  "stock-out":     { label: "Sin stock",       icon: AlertTriangle, color: "#ef4444" },
  "stock-low":     { label: "Stock bajo",      icon: Package,        color: "#f59e0b" },
  "orders":        { label: "Órdenes y pagos", icon: ShoppingCart,   color: "#22c55e" },
  "integrations":  { label: "Integraciones",   icon: Bell,           color: "#a78bfa" },
  "finance":       { label: "Finanzas",        icon: DollarSign,     color: "#c084fc" },
  "other":         { label: "Otras",           icon: Mail,           color: "#64748B" },
};

const CATEGORY_ORDER: Category[] = ["stock-out", "stock-low", "orders", "integrations", "finance", "other"];

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
  info:    { icon: Info,          bg: "rgba(37,99,235,0.08)",   color: "#c026d3", border: "rgba(37,99,235,0.25)"   },
  success: { icon: CheckCircle2,  bg: "rgba(34,197,94,0.08)",   color: "#22c55e", border: "rgba(34,197,94,0.25)"   },
  system:  { icon: Bell,          bg: "rgba(139,92,246,0.08)",  color: "#8b5cf6", border: "rgba(139,92,246,0.25)"  },
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
  // Categorías colapsadas (por defecto: ninguna)
  const [collapsed, setCollapsed] = useState<Set<Category>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id) && (filter === "all" || !a.read));
  const unreadCount = alerts.filter((a) => !a.read && !dismissed.has(a.id)).length;

  // Agrupar por categoría
  const grouped = visible.reduce<Record<Category, Alert[]>>((acc, a) => {
    const cat = categorizeAlert(a);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<Category, Alert[]>);

  const usedCategories = CATEGORY_ORDER.filter((c) => grouped[c]?.length);

  function toggleCategory(cat: Category) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Alertas
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {unreadCount > 0 ? (
              <span>
                <span className="text-[#8b5cf6] font-semibold">{unreadCount}</span> sin leer
              </span>
            ) : "Sin alertas pendientes"}
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: filter === f ? "#8b5cf6" : "transparent",
                color: filter === f ? "white" : "#94A3B8",
              }}
            >
              {f === "all" ? "Todas" : "Sin leer"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada por categoría */}
      {visible.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <CheckCircle2 size={32} color="#22c55e" strokeWidth={1.5} />
          <p className="text-sm text-[#64748B]">
            {filter === "unread" ? "Sin alertas sin leer" : "Sin alertas activas"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {usedCategories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const items = grouped[cat];
            const isCollapsed = collapsed.has(cat);
            const unread = items.filter((a) => !a.read).length;
            const CatIcon = meta.icon;

            return (
              <div
                key={cat}
                className="rounded-2xl overflow-hidden"
                style={{ background: "#111118", border: `1px solid ${meta.color}30` }}
              >
                {/* Header de la categoría — clickeable */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full px-5 py-3 flex items-center gap-3 transition-all hover:bg-[rgba(255,255,255,0.02)]"
                  style={{ borderBottom: isCollapsed ? "none" : `1px solid ${meta.color}15`, background: `${meta.color}08` }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${meta.color}18` }}
                  >
                    <CatIcon size={15} color={meta.color} strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#F1F5F9]">{meta.label}</p>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${meta.color}20`, color: meta.color }}
                      >
                        {items.length}
                      </span>
                      {unread > 0 && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
                        >
                          {unread} sin leer
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    color="#64748B"
                    className="transition-transform"
                    style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                  />
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <div className="divide-y" style={{ borderColor: `${meta.color}10` }}>
                    {items.map((alert) => {
                      const cfg = getConfig(alert.type);
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={alert.id}
                          className="px-5 py-3.5 flex items-start gap-4 transition-all"
                          style={{ opacity: alert.read ? 0.7 : 1 }}
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${cfg.color}15` }}
                          >
                            <Icon size={14} color={cfg.color} strokeWidth={2} />
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
                                  style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
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
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Bot, Bell, Store, BarChart2,
  ShoppingCart, Package, Users, TrendingUp, Target,
  Megaphone, Mail, Plug, DollarSign, User,
  ChevronLeft, ChevronRight, Zap,
} from "lucide-react";

// ─────────────────────────────────────────────
// Estructura de navegación
// ─────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "GENERAL",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/ia", label: "IA Assistant", icon: Bot, accentColor: "#a855f7" },
      { href: "/app/alertas", label: "Alertas", icon: Bell, badge: 3 },
    ],
  },
  {
    label: "TIENDA",
    items: [
      { href: "/app/tienda", label: "Tienda Web", icon: Store },
      { href: "/app/analisis", label: "Análisis", icon: BarChart2 },
      { href: "/app/ordenes", label: "Órdenes", icon: ShoppingCart },
      { href: "/app/productos", label: "Productos / Stock", icon: Package },
      { href: "/app/clientes", label: "Clientes", icon: Users },
      { href: "/app/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { href: "/app/meta-ads", label: "Meta Ads", icon: Target },
      { href: "/app/campanas", label: "Campañas", icon: Megaphone },
    ],
  },
  {
    label: "COMUNICACIÓN",
    items: [
      { href: "/app/mails", label: "Mails", icon: Mail },
    ],
  },
  {
    label: "CONFIGURACIÓN",
    items: [
      { href: "/app/configuracion/integraciones", label: "Integraciones", icon: Plug },
      { href: "/app/configuracion/financiera", label: "Config. Financiera", icon: DollarSign },
      { href: "/app/configuracion/cuenta", label: "Mi Cuenta", icon: User },
    ],
  },
];

// ─────────────────────────────────────────────
// Sidebar component
// ─────────────────────────────────────────────
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? "64px" : "240px",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 px-4 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", minHeight: "64px" }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: "32px",
            height: "32px",
            background: "linear-gradient(135deg, #e1691e, #a855f7)",
          }}
        >
          <Zap size={16} color="white" strokeWidth={2.5} />
        </div>

        {/* Text — solo visible cuando expandido */}
        {!collapsed && (
          <div className="overflow-hidden">
            <p
              className="font-bold leading-none tracking-tight truncate"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "15px",
                color: "var(--text)",
              }}
            >
              Nova Analytics
            </p>
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Dashboard
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            {!collapsed && (
              <p
                className="px-3 mb-1"
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                }}
              >
                {section.label}
              </p>
            )}
            {collapsed && (
              <div
                className="mx-3 mb-2"
                style={{ height: "1px", background: "var(--border)" }}
              />
            )}

            {/* Items */}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg transition-all duration-150",
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                      )}
                      style={{
                        background: isActive
                          ? "rgba(225, 105, 30, 0.08)"
                          : "transparent",
                        color: isActive
                          ? item.accentColor ?? "#e1691e"
                          : "var(--text-subtle)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          e.currentTarget.style.color = "var(--text)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-subtle)";
                        }
                      }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                          style={{
                            width: "3px",
                            height: "20px",
                            background: item.accentColor ?? "#e1691e",
                          }}
                        />
                      )}

                      {/* Icon */}
                      <Icon
                        size={16}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="flex-shrink-0"
                        color={isActive ? (item.accentColor ?? "#e1691e") : undefined}
                      />

                      {/* Label + Badge */}
                      {!collapsed && (
                        <>
                          <span
                            className="flex-1 truncate"
                            style={{
                              fontFamily: "var(--font-barlow)",
                              fontSize: "14px",
                              fontWeight: isActive ? 600 : 400,
                            }}
                          >
                            {item.label}
                          </span>
                          {"badge" in item && item.badge && (
                            <span
                              className="flex-shrink-0 text-white rounded-full flex items-center justify-center"
                              style={{
                                minWidth: "18px",
                                height: "18px",
                                background: "#e1691e",
                                fontFamily: "var(--font-barlow)",
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "0 4px",
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User info ── */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
            style={{
              width: "30px",
              height: "30px",
              background: "linear-gradient(135deg, #1e3c69, #a855f7)",
              fontFamily: "var(--font-syne)",
              fontSize: "12px",
            }}
          >
            NA
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p
                className="truncate"
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                Nova Agency
              </p>
              <p
                className="truncate"
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                Plan Pro
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] flex items-center justify-center rounded-full transition-all duration-150 hover:scale-110 z-10"
        style={{
          width: "24px",
          height: "24px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          cursor: "pointer",
        }}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={12} strokeWidth={2.5} />
        ) : (
          <ChevronLeft size={12} strokeWidth={2.5} />
        )}
      </button>
    </aside>
  );
}

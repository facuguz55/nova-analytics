"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Bot, Bell, Store, BarChart2,
  ShoppingCart, Package, Users, TrendingUp, Target,
  Megaphone, Mail, Plug, DollarSign, User,
  ChevronLeft, ChevronRight, Zap, LogOut,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "GENERAL",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/ia", label: "IA Assistant", icon: Bot, accent: "#8B5CF6" },
      { href: "/app/alertas", label: "Alertas", icon: Bell, badge: 3 },
    ],
  },
  {
    label: "TIENDA",
    items: [
      { href: "/app/tienda", label: "Tienda Web", icon: Store },
      { href: "/app/analisis", label: "Analisis", icon: BarChart2 },
      { href: "/app/ordenes", label: "Ordenes", icon: ShoppingCart },
      { href: "/app/productos", label: "Productos / Stock", icon: Package },
      { href: "/app/clientes", label: "Clientes", icon: Users },
      { href: "/app/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { href: "/app/meta-ads", label: "Meta Ads", icon: Target },
      { href: "/app/campanas", label: "Campanas", icon: Megaphone },
    ],
  },
  {
    label: "COMUNICACION",
    items: [
      { href: "/app/mails", label: "Mails", icon: Mail },
    ],
  },
  {
    label: "CONFIGURACION",
    items: [
      { href: "/app/configuracion/integraciones", label: "Integraciones", icon: Plug },
      { href: "/app/configuracion/financiera", label: "Config. Financiera", icon: DollarSign },
      { href: "/app/configuracion/cuenta", label: "Mi Cuenta", icon: User },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? "64px" : "240px",
        background: "#0d0d14",
        borderRight: "1px solid rgba(124,58,237,0.15)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(124,58,237,0.15)", minHeight: "64px" }}
      >
        <div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center flex-shrink-0"
        >
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p
              className="font-bold leading-none tracking-tight truncate text-[#F1F5F9]"
              style={{ fontFamily: "var(--font-syne)", fontSize: "15px" }}
            >
              Nova Analytics
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed ? (
              <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase">
                {section.label}
              </p>
            ) : (
              <div className="mx-3 mb-2 h-px bg-[rgba(124,58,237,0.15)]" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                const activeColor = "accent" in item && item.accent ? item.accent : "#e1691e";

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
                        background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
                        color: isActive ? activeColor : "#94A3B8",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(124,58,237,0.06)";
                          (e.currentTarget as HTMLAnchorElement).style.color = "#F1F5F9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                          (e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8";
                        }
                      }}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                          style={{ width: "3px", height: "20px", background: activeColor }}
                        />
                      )}
                      <Icon
                        size={16}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="flex-shrink-0"
                        color={isActive ? activeColor : undefined}
                      />
                      {!collapsed && (
                        <>
                          <span
                            className="flex-1 truncate text-sm"
                            style={{ fontWeight: isActive ? 600 : 400 }}
                          >
                            {item.label}
                          </span>
                          {"badge" in item && item.badge ? (
                            <span className="flex-shrink-0 text-white rounded-full flex items-center justify-center bg-[#7C3AED] text-[10px] font-bold px-1 min-w-[18px] h-[18px]">
                              {item.badge}
                            </span>
                          ) : null}
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

      {/* User info */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: "1px solid rgba(124,58,237,0.15)" }}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2.5 transition-colors cursor-pointer group",
            collapsed && "justify-center"
          )}
          style={{ background: "rgba(124,58,237,0.06)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", fontFamily: "var(--font-syne)" }}
          >
            NA
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-semibold text-[#F1F5F9] truncate">Nova Agency</p>
              <p className="text-[11px] text-[#94A3B8] truncate">Plan Pro</p>
            </div>
          )}
          {!collapsed && (
            <button className="text-[#94A3B8] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] flex items-center justify-center rounded-full z-10 transition-all duration-150 hover:scale-110"
        style={{
          width: "24px",
          height: "24px",
          background: "#111118",
          border: "1px solid rgba(124,58,237,0.3)",
          color: "#94A3B8",
          cursor: "pointer",
        }}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? <ChevronRight size={12} strokeWidth={2.5} /> : <ChevronLeft size={12} strokeWidth={2.5} />}
      </button>
    </aside>
  );
}

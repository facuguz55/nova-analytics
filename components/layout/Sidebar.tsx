"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Bell, BarChart2,
  ShoppingCart, Package, Users, TrendingUp, Target,
  Megaphone, Mail, Plug, DollarSign, User,
  ChevronLeft, ChevronRight, LogOut, Sparkles,
  BellRing, Activity, Settings, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_SECTIONS = [
  {
    label: "",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/alertas",   label: "Alertas",   icon: Bell },
    ],
  },
  {
    label: "TIENDA",
    items: [
      { href: "/app/analisis",     label: "Análisis",         icon: BarChart2 },
      { href: "/app/ordenes",      label: "Órdenes",          icon: ShoppingCart },
      { href: "/app/clientes",     label: "Clientes",         icon: Users },
      { href: "/app/productos",    label: "Productos / Stock", icon: Package },
      { href: "/app/rentabilidad", label: "Rentabilidad",     icon: TrendingUp },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { href: "/app/meta-ads", label: "Meta Ads", icon: Target },
      { href: "/app/campanas", label: "Campañas", icon: Megaphone },
      { href: "/app/mails",    label: "Mails",    icon: Mail },
    ],
  },
  {
    label: "CONFIGURACIÓN",
    items: [
      { href: "/app/configuracion/integraciones",  label: "Integraciones",  icon: Plug },
      { href: "/app/configuracion/financiera",     label: "Finanzas",       icon: DollarSign },
      { href: "/app/configuracion/notificaciones", label: "Notificaciones", icon: BellRing },
    ],
  },
];

const CONFIG_ITEMS = [
  { href: "/app/configuracion/cuenta",          label: "Mi Cuenta",      icon: User },
  { href: "/app/configuracion/integraciones",   label: "Integraciones",  icon: Plug },
  { href: "/app/configuracion/financiera",      label: "Finanzas",       icon: DollarSign },
  { href: "/app/configuracion/notificaciones",  label: "Notificaciones", icon: BellRing },
  { href: "/app/configuracion/actividad",       label: "Actividad",      icon: Activity },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  workspaceName: string;
  workspacePlan: string;
  activeProviders: string[];
  alertCount?: number;
}

export default function Sidebar({
  userName,
  userEmail,
  workspaceName,
  workspacePlan,
  alertCount = 0,
}: SidebarProps) {
  const [collapsed,    setCollapsed]    = useState(false);
  const [loggingOut,   setLoggingOut]   = useState(false);
  const [showConfig,   setShowConfig]   = useState(false);
  const pathname  = usePathname();
  const router    = useRouter();

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? "64px" : "220px",
        background: "#0d0d14",
        borderRight: "1px solid rgba(124,58,237,0.15)",
      }}
    >
      {/* Logo */}
      <div
        className={`flex items-center flex-shrink-0 ${collapsed ? "justify-center px-2 py-4" : "gap-3 px-4 py-4"}`}
        style={{ borderBottom: "1px solid rgba(124,58,237,0.15)", minHeight: "68px" }}
      >
        <img
          src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
          alt="Nova Analytics"
          className="object-contain flex-shrink-0"
          style={{ width: collapsed ? "36px" : "40px", height: collapsed ? "36px" : "40px" }}
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold leading-none tracking-tight truncate text-[#F1F5F9]" style={{ fontSize: "16px", letterSpacing: "-0.01em" }}>
              Nova Analytics
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 tracking-wide">Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label || "top"}>
            {!collapsed && section.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase">
                {section.label}
              </p>
            )}
            {!collapsed && !section.label && <div className="mb-1" />}
            {collapsed && <div className="mx-3 mb-2 h-px bg-[rgba(124,58,237,0.15)]" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/app/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                const activeColor = "#e1691e";

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
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" color={isActive ? activeColor : undefined} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate text-sm" style={{ fontWeight: isActive ? 600 : 400 }}>
                            {item.label}
                          </span>
                          {item.href === "/app/alertas" && alertCount > 0 && (
                            <span className="flex-shrink-0 text-white rounded-full flex items-center justify-center bg-[#7C3AED] text-[10px] font-bold px-1 min-w-[18px] h-[18px]">
                              {alertCount > 9 ? "9+" : alertCount}
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

      {/* Links sutiles */}
      {!collapsed && (
        <div className="flex-shrink-0 px-4 pb-2 flex items-center gap-4">
          <Link href="/app/planes" className="text-[11px] text-[#475569] hover:text-[#22c55e] transition-colors flex items-center gap-1">
            <Sparkles size={11} /> Planes
          </Link>
          <Link href="/app/changelog" className="text-[11px] text-[#475569] hover:text-[#e1691e] transition-colors flex items-center gap-1">
            <Megaphone size={11} /> Novedades
          </Link>
        </div>
      )}

      {/* User info + Config panel */}
      <div className="flex-shrink-0 p-3 relative" style={{ borderTop: "1px solid rgba(124,58,237,0.15)" }}>

        {/* Config panel (popover hacia arriba) */}
        {showConfig && !collapsed && (
          <div
            className="absolute bottom-full left-2 right-2 mb-2 rounded-xl overflow-hidden z-50"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
              <p className="text-xs font-semibold text-[#F1F5F9]">Configuración</p>
              <button onClick={() => setShowConfig(false)} className="text-[#64748B] hover:text-white transition-colors">
                <X size={13} strokeWidth={2} />
              </button>
            </div>
            <div className="py-1.5">
              {CONFIG_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowConfig(false)}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                    style={{ color: isActive ? "#e1691e" : "#94A3B8" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(124,58,237,0.06)"; (e.currentTarget as HTMLAnchorElement).style.color = "#F1F5F9"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = isActive ? "#e1691e" : "#94A3B8"; }}
                  >
                    <Icon size={14} strokeWidth={2} className="flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="px-3 pb-2 pt-1" style={{ borderTop: "1px solid rgba(124,58,237,0.1)" }}>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: "#ef4444" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <LogOut size={14} strokeWidth={2} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* User row — click abre config */}
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={cn(
            "flex items-center gap-3 rounded-xl p-2.5 transition-colors w-full group",
            collapsed && "justify-center"
          )}
          style={{ background: showConfig ? "rgba(124,58,237,0.12)" : "rgba(124,58,237,0.06)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
          >
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-[13px] font-semibold text-[#F1F5F9] truncate">{workspaceName}</p>
                <p className="text-[11px] truncate capitalize" style={{
                  color: workspacePlan === "free" ? "#64748B"
                    : workspacePlan === "trial" ? "#f59e0b"
                    : "#22c55e"
                }}>
                  {workspacePlan === "free" ? "Sin plan activo"
                    : workspacePlan === "trial" ? "Prueba gratuita"
                    : workspacePlan === "pro" ? "Plan Pro"
                    : workspacePlan === "agency" ? "Plan Agency"
                    : "Plan activo"}
                </p>
              </div>
              <Settings
                size={14}
                strokeWidth={2}
                className="flex-shrink-0 transition-colors"
                color={showConfig ? "#e1691e" : "#475569"}
              />
            </>
          )}
        </button>

        {!collapsed && (
          <p className="text-[10px] text-[#64748B] truncate mt-1 px-2.5">{userEmail}</p>
        )}
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

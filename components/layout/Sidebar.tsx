"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Bot, Bell, Store, BarChart2,
  ShoppingCart, Package, Users, TrendingUp, Target,
  Megaphone, Mail, Plug, DollarSign, User,
  ChevronLeft, ChevronRight, LogOut, Percent, PlusCircle, Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_SECTIONS = [
  {
    label: "GENERAL",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/ia", label: "IA Assistant", icon: Bot, accent: "#8B5CF6" },
      { href: "/app/alertas", label: "Alertas", icon: Bell },
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
      { href: "/app/configuracion/integraciones",    label: "Integraciones",     icon: Plug },
      { href: "/app/configuracion/financiera",       label: "Config. Financiera", icon: DollarSign },
      { href: "/app/configuracion/cotizaciones",     label: "Cotizaciones",       icon: TrendingUp },
      { href: "/app/configuracion/comisiones",       label: "Comisiones",         icon: Percent },
      { href: "/app/configuracion/costos-adicionales", label: "Costos Adicionales", icon: PlusCircle },
      { href: "/app/configuracion/envios",           label: "Envíos",             icon: Truck },
      { href: "/app/configuracion/cuenta",           label: "Mi Cuenta",          icon: User },
    ],
  },
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
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
        width: collapsed ? "64px" : "240px",
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
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" color={isActive ? activeColor : undefined} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate text-sm" style={{ fontWeight: isActive ? 600 : 400 }}>
                            {item.label}
                          </span>
                          {item.href === "/app/alertas" && alertCount > 0 ? (
                            <span className="flex-shrink-0 text-white rounded-full flex items-center justify-center bg-[#7C3AED] text-[10px] font-bold px-1 min-w-[18px] h-[18px]">
                              {alertCount > 9 ? "9+" : alertCount}
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
      <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid rgba(124,58,237,0.15)" }}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2.5 transition-colors cursor-pointer group",
            collapsed && "justify-center"
          )}
          style={{ background: "rgba(124,58,237,0.06)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
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
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-[#94A3B8] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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

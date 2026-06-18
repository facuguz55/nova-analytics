"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DollarSign, User,
  ChevronLeft, ChevronRight, LogOut, Sparkles,
  BellRing, Activity, Settings, X, Plug, Brain, Megaphone,
  Lock, Pin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ALL_NAV_SECTIONS } from "@/lib/nav-sections";
import { usePinnedSections } from "@/hooks/usePinnedSections";

const CONFIG_ITEMS = [
  { href: "/app/configuracion/cuenta",          label: "Mi Cuenta",      icon: User,       desc: "Perfil y seguridad" },
  { href: "/app/configuracion/integraciones",   label: "Integraciones",  icon: Plug,       desc: "TiendaNube, Meta, Gmail" },
  { href: "/app/configuracion/financiera",      label: "Finanzas",       icon: DollarSign, desc: "IVA, dólar, comisiones" },
  { href: "/app/configuracion/notificaciones",  label: "Notificaciones", icon: BellRing,   desc: "Telegram y alertas" },
  { href: "/app/configuracion/actividad",       label: "Actividad",      icon: Activity,   desc: "Registro de cambios" },
];

const ACTIVE_COLOR = "#c084fc";

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
  const [collapsed,  setCollapsed]  = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { pinned, toggle: togglePin } = usePinnedSections();

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const inConfig = pathname.startsWith("/app/configuracion");

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function navItemStyle(isActive: boolean, color = ACTIVE_COLOR): React.CSSProperties {
    return {
      background: isActive
        ? `linear-gradient(90deg, ${color}28, ${color}0d)`
        : "transparent",
      color: isActive ? color : "#94A3B8",
      boxShadow: isActive ? `inset 0 0 12px ${color}10` : "none",
    };
  }

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? "64px" : "228px",
        background: "rgba(13,13,20,0.92)",
        backdropFilter: "blur(8px)",
        borderRight: "1px solid rgba(139,92,246,0.18)",
      }}
    >
      {/* Logo */}
      <div
        className={`flex items-center flex-shrink-0 ${collapsed ? "justify-center px-2 py-4" : "gap-3 px-4 py-4"}`}
        style={{ borderBottom: "1px solid rgba(139,92,246,0.15)", minHeight: "68px" }}
      >
        <img
          src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
          alt="Nova Analytics"
          className="object-contain flex-shrink-0"
          style={{
            width: collapsed ? "36px" : "40px",
            height: collapsed ? "36px" : "40px",
            filter: "drop-shadow(0 0 8px rgba(168,85,247,0.35))",
          }}
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold leading-none tracking-tight truncate text-[#F1F5F9]" style={{ fontSize: "16px", letterSpacing: "-0.01em" }}>
              Nova Analytics
            </p>
            <p className="text-[11px] mt-0.5 tracking-wide neon-text">Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {ALL_NAV_SECTIONS.map((section) => {
          const hasAccess = !section.requiresPlan || workspacePlan === "pro" || workspacePlan === "agency";
          const sectionColor = section.accentColor ?? ACTIVE_COLOR;
          const isPinned = pinned.includes(section.label);

          return (
            <div key={section.label}>
              {!collapsed && (
                <div className="group flex items-center justify-between px-3 mb-1.5">
                  <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">
                    {section.label}
                  </p>
                  <button
                    onClick={() => togglePin(section.label)}
                    title={isPinned ? "Desanclar sección" : "Anclar accesos rápidos arriba"}
                    className="flex items-center justify-center w-5 h-5 rounded transition-all"
                    style={{
                      opacity: isPinned ? 1 : 0,
                      color: isPinned ? sectionColor : "#64748B",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                      (e.currentTarget as HTMLButtonElement).style.color = sectionColor;
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = isPinned ? "1" : "0";
                      (e.currentTarget as HTMLButtonElement).style.color = isPinned ? sectionColor : "#64748B";
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <Pin
                      size={10}
                      strokeWidth={2.5}
                      style={{ fill: isPinned ? sectionColor : "none" }}
                    />
                  </button>
                </div>
              )}
              {collapsed && <div className="mx-3 mb-2 h-px bg-[rgba(139,92,246,0.18)]" />}

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/app/dashboard" &&
                      item.href !== "/app/local" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;

                  if (!hasAccess) {
                    return (
                      <li key={item.href}>
                        <Link
                          href="/app/planes"
                          title={collapsed ? `${item.label} (Pro)` : undefined}
                          className={cn(
                            "relative flex items-center gap-3 rounded-lg transition-all duration-150 opacity-50",
                            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                          )}
                          style={{ color: "#64748B" }}
                        >
                          <Icon size={16} strokeWidth={2} className="flex-shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate text-sm">{item.label}</span>
                              <Lock size={11} className="flex-shrink-0 text-[#64748B]" />
                            </>
                          )}
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg transition-all duration-150",
                          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                        )}
                        style={navItemStyle(isActive, sectionColor)}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLAnchorElement).style.background = `${sectionColor}12`;
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
                            style={{
                              width: "3px",
                              height: "20px",
                              background: sectionColor,
                              boxShadow: `0 0 8px ${sectionColor}`,
                            }}
                          />
                        )}
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" color={isActive ? sectionColor : undefined} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-sm" style={{ fontWeight: isActive ? 600 : 400 }}>
                              {item.label}
                            </span>
                            {item.href === "/app/alertas" && alertCount > 0 && (
                              <span
                                className="flex-shrink-0 text-white rounded-full flex items-center justify-center text-[10px] font-bold px-1 min-w-[18px] h-[18px]"
                                style={{ background: "#a855f7", boxShadow: "0 0 8px rgba(168,85,247,0.6)" }}
                              >
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
          );
        })}

        {/* SISTEMA */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">
              SISTEMA
            </p>
          )}
          {collapsed && <div className="mx-3 mb-2 h-px bg-[rgba(139,92,246,0.18)]" />}
          <Link
            href="/app/configuracion"
            title={collapsed ? "Configuración" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-lg transition-all duration-150",
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
            )}
            style={navItemStyle(inConfig)}
            onMouseEnter={(e) => {
              if (!inConfig) {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(139,92,246,0.07)";
                (e.currentTarget as HTMLAnchorElement).style.color = "#F1F5F9";
              }
            }}
            onMouseLeave={(e) => {
              if (!inConfig) {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8";
              }
            }}
          >
            {inConfig && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                style={{ width: "3px", height: "20px", background: ACTIVE_COLOR, boxShadow: `0 0 8px ${ACTIVE_COLOR}` }}
              />
            )}
            <Settings size={16} strokeWidth={inConfig ? 2.5 : 2} className="flex-shrink-0" color={inConfig ? ACTIVE_COLOR : undefined} />
            {!collapsed && (
              <span className="flex-1 truncate text-sm" style={{ fontWeight: inConfig ? 600 : 400 }}>
                Configuración
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Links sutiles */}
      {!collapsed && (
        <div className="flex-shrink-0 px-4 pb-2 flex items-center gap-4">
          <Link href="/app/planes" className="text-[11px] text-[#475569] hover:text-[#22c55e] transition-colors flex items-center gap-1">
            <Sparkles size={11} /> Planes
          </Link>
          <Link href="/app/changelog" className="text-[11px] text-[#475569] hover:text-[#c084fc] transition-colors flex items-center gap-1">
            <Brain size={11} /> Novedades
          </Link>
        </div>
      )}

      {/* User info + Config panel */}
      <div className="flex-shrink-0 p-3 relative" style={{ borderTop: "1px solid rgba(139,92,246,0.15)" }}>

        {showConfig && !collapsed && (
          <div
            className="absolute bottom-full left-2 right-2 mb-2 rounded-xl overflow-hidden z-50 anim-up"
            style={{
              background: "rgba(17,17,24,0.97)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(168,85,247,0.3)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.55), 0 0 24px rgba(168,85,247,0.1)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
              <p className="text-xs font-semibold text-[#F1F5F9]">Accesos rápidos</p>
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
                    style={{ color: isActive ? ACTIVE_COLOR : "#94A3B8" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(139,92,246,0.07)"; (e.currentTarget as HTMLAnchorElement).style.color = "#F1F5F9"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = isActive ? ACTIVE_COLOR : "#94A3B8"; }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(168,85,247,0.1)" }}
                    >
                      <Icon size={13} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-tight truncate">{item.label}</p>
                      <p className="text-[10px] text-[#475569] truncate">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="px-3 pb-2 pt-1" style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }}>
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

        <button
          onClick={() => setShowConfig(!showConfig)}
          className={cn(
            "flex items-center gap-3 rounded-xl p-2.5 transition-all w-full group",
            collapsed && "justify-center"
          )}
          style={{
            background: showConfig ? "rgba(168,85,247,0.14)" : "rgba(139,92,246,0.06)",
            border: `1px solid ${showConfig ? "rgba(168,85,247,0.35)" : "rgba(139,92,246,0.12)"}`,
            boxShadow: showConfig ? "0 0 16px rgba(168,85,247,0.15)" : "none",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #c026d3)",
              boxShadow: "0 0 10px rgba(168,85,247,0.4)",
            }}
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
                color={showConfig ? ACTIVE_COLOR : "#475569"}
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
          border: "1px solid rgba(168,85,247,0.4)",
          boxShadow: "0 0 8px rgba(168,85,247,0.2)",
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

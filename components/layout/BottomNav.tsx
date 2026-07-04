"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BarChart2, ShoppingCart, Sparkles, LayoutGrid,
  X, Bell, Users, Package, TrendingUp, Target, Megaphone, Mail,
  Plug, DollarSign, BellRing, User, Activity, LogOut, Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BOTTOM_ITEMS = [
  { href: "/app/dashboard",  label: "Inicio",   icon: LayoutDashboard },
  { href: "/app/analisis",   label: "Análisis", icon: BarChart2 },
  { href: "/app/ordenes",    label: "Órdenes",  icon: ShoppingCart },
  { href: "/app/ia",         label: "IA",       icon: Sparkles },
];

const MORE_SECTIONS = [
  {
    label: "General",
    items: [
      { href: "/app/alertas",      label: "Alertas",     icon: Bell },
    ],
  },
  {
    label: "Tienda",
    items: [
      { href: "/app/clientes",     label: "Clientes",    icon: Users },
      { href: "/app/productos",    label: "Productos",   icon: Package },
      { href: "/app/rentabilidad", label: "Rentabilidad",icon: TrendingUp },
      { href: "/app/tienda",       label: "Tienda web",  icon: LayoutGrid },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/app/meta-ads",     label: "Meta Ads",    icon: Target },
      { href: "/app/campanas",     label: "Campañas",    icon: Megaphone },
      { href: "/app/mails",        label: "Correos",     icon: Mail },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/app/configuracion/cuenta",           label: "Mi cuenta",     icon: User },
      { href: "/app/configuracion/integraciones",    label: "Integraciones", icon: Plug },
      { href: "/app/configuracion/financiera",       label: "Finanzas",      icon: DollarSign },
      { href: "/app/configuracion/notificaciones",   label: "Notificaciones",icon: BellRing },
      { href: "/app/configuracion/actividad",        label: "Actividad",     icon: Activity },
      { href: "/app/configuracion/costos-adicionales",label: "Costos extras",icon: DollarSign },
      { href: "/app/planes",                         label: "Planes",        icon: Sparkles },
      { href: "/app/configuracion",                  label: "Configuración", icon: Settings },
    ],
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeColor = "#c084fc";

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/app/dashboard" && pathname.startsWith(href));
  }

  const moreActive = !BOTTOM_ITEMS.some((i) => isActive(i.href)) && pathname.startsWith("/app");

  return (
    <>
      {/* Overlay de "Más" */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-3xl overflow-hidden"
            style={{ background: "#0d0d14", border: "1px solid rgba(139,92,246,0.2)", borderBottom: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(139,92,246,0.3)" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
              <p className="text-sm font-bold text-[#F1F5F9]">Menú</p>
              <button onClick={() => setShowMore(false)} style={{ color: "#64748B" }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Nav sections */}
            <div className="overflow-y-auto pb-4" style={{ maxHeight: "65vh" }}>
              {MORE_SECTIONS.map((section) => (
                <div key={section.label} className="mt-4 px-3">
                  <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest text-[#475569] uppercase">
                    {section.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMore(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                          style={{
                            background: active ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.05)",
                            border: `1px solid ${active ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.1)"}`,
                            color: active ? activeColor : "#94A3B8",
                          }}
                        >
                          <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                          <span className="text-xs font-medium truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Logout */}
              <div className="mt-4 px-3">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}
                >
                  <LogOut size={15} strokeWidth={2} />
                  <span className="text-xs font-medium">{loggingOut ? "Saliendo..." : "Cerrar sesión"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center sm:hidden"
        style={{
          height: "64px",
          background: "#0d0d14",
          borderTop: "1px solid rgba(139,92,246,0.2)",
        }}
      >
        {[...BOTTOM_ITEMS, { href: "__more__", label: "Más", icon: LayoutGrid }].map((item) => {
          const Icon = item.icon;
          const isMore = item.href === "__more__";
          const active = isMore ? moreActive || showMore : isActive(item.href);

          if (isMore) {
            return (
              <button
                key="more"
                onClick={() => setShowMore(!showMore)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all"
                style={{ color: active ? activeColor : "#64748B" }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[9px] font-semibold">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all"
              style={{ color: active ? activeColor : "#64748B" }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, UserPlus, Store, Users2 } from "lucide-react";

const NAV = [
  { href: "/admin/hq",                label: "Panel HQ",           icon: LayoutDashboard },
  { href: "/admin/hq/clientes",       label: "Clientes x Tienda",  icon: Users2, sub: true },
  { href: "/admin/clientes",          label: "Cuentas Nova",        icon: UserPlus },
  { href: "/admin/workspaces",        label: "Workspaces",          icon: Store },
  { href: "/admin/analytics",         label: "Estadísticas",        icon: BarChart2 },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 py-4 px-2 space-y-0.5">
      {NAV.map((item) => {
        // Para el HQ Dashboard: exacto para no hacer match con sub-rutas
        const active = item.href === "/admin/hq"
          ? pathname === "/admin/hq"
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex items-center gap-2.5 rounded-lg py-2 text-sm transition-all"
            style={{
              paddingLeft: item.sub ? "28px" : "12px",
              paddingRight: "12px",
              background: active ? "linear-gradient(90deg, rgba(168,85,247,0.16), rgba(168,85,247,0.04))" : "transparent",
              color: active ? "#c084fc" : item.sub ? "#64748B" : "#94A3B8",
              boxShadow: active ? "inset 0 0 12px rgba(168,85,247,0.06)" : "none",
              fontSize: item.sub ? "12px" : "14px",
            }}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                style={{ width: "3px", height: "16px", background: "#c084fc", boxShadow: "0 0 8px #c084fc" }} />
            )}
            <Icon size={item.sub ? 13 : 15} strokeWidth={active ? 2.5 : 2} color={active ? "#c084fc" : undefined} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

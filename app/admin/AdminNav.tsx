"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, UserPlus, Store } from "lucide-react";

const NAV = [
  { href: "/admin/hq",         label: "HQ Dashboard", icon: LayoutDashboard },
  { href: "/admin/clientes",   label: "Clientes",     icon: UserPlus },
  { href: "/admin/workspaces", label: "Workspaces",   icon: Store },
  { href: "/admin/analytics",  label: "Analytics",    icon: BarChart2 },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 py-4 px-2 space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all"
            style={{
              background: active ? "linear-gradient(90deg, rgba(168,85,247,0.16), rgba(168,85,247,0.04))" : "transparent",
              color: active ? "#c084fc" : "#94A3B8",
              boxShadow: active ? "inset 0 0 12px rgba(168,85,247,0.06)" : "none",
            }}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                style={{ width: "3px", height: "18px", background: "#c084fc", boxShadow: "0 0 8px #c084fc" }} />
            )}
            <Icon size={15} strokeWidth={active ? 2.5 : 2} color={active ? "#c084fc" : undefined} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

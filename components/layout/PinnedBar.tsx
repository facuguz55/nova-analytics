"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { ALL_NAV_SECTIONS } from "@/lib/nav-sections";
import { usePinnedSections } from "@/hooks/usePinnedSections";

export default function PinnedBar() {
  const { pinned, toggle } = usePinnedSections();
  const pathname = usePathname();

  const visible = ALL_NAV_SECTIONS.filter((s) => pinned.includes(s.label));
  if (visible.length === 0) return null;

  return (
    <div
      className="hidden sm:flex flex-shrink-0 items-center gap-2 px-4 overflow-x-auto"
      style={{
        height: "44px",
        background: "rgba(13,13,20,0.97)",
        borderBottom: "1px solid rgba(139,92,246,0.12)",
        scrollbarWidth: "none",
      }}
    >
      {visible.map((section, sIdx) => {
        const color = section.accentColor ?? "#8B5CF6";
        return (
          <div key={section.label} className="flex items-center gap-1.5 flex-shrink-0">
            {sIdx > 0 && (
              <div className="h-4 w-px mr-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
            )}

            {/* Section label */}
            <span
              className="text-[9px] font-bold tracking-widest uppercase select-none"
              style={{ color: `${color}88` }}
            >
              {section.label}
            </span>

            {/* Nav items */}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/app/dashboard" &&
                  item.href !== "/app/local" &&
                  pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                  style={{
                    background: isActive ? `${color}22` : "rgba(255,255,255,0.04)",
                    color: isActive ? color : "#94A3B8",
                    border: `1px solid ${isActive ? `${color}44` : "transparent"}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#F1F5F9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8";
                    }
                  }}
                >
                  <Icon size={11} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}

            {/* Unpin */}
            <button
              onClick={() => toggle(section.label)}
              className="flex items-center justify-center w-5 h-5 rounded-md transition-colors flex-shrink-0"
              style={{ color: "#475569" }}
              title={`Desanclar ${section.label}`}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

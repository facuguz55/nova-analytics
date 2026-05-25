"use client";

import { Bell, Search, RefreshCw } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  userName: string;
  avatarUrl?: string | null;
  alertCount?: number;
}

export default function Navbar({ userName, avatarUrl, alertCount = 0 }: NavbarProps) {
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: "64px",
        background: "#0d0d14",
        borderBottom: "1px solid rgba(124,58,237,0.15)",
      }}
    >
      {/* Left: search */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3"
          style={{
            height: "36px",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.2)",
            minWidth: "200px",
          }}
        >
          <Search size={13} strokeWidth={2} className="text-[#64748B]" />
          <span className="text-xs text-[#64748B]">Buscar...</span>
          <span
            className="ml-auto text-[10px] text-[#475569] rounded px-1"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: acciones */}
      <div className="flex items-center gap-2">
        {/* Sync */}
        <button
          className="flex items-center justify-center rounded-lg transition-all hover:bg-[rgba(124,58,237,0.1)]"
          style={{
            width: "36px",
            height: "36px",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.2)",
            color: "#94A3B8",
          }}
          aria-label="Sincronizar"
          title="Sincronizar datos"
        >
          <RefreshCw size={14} strokeWidth={2} />
        </button>

        {/* Notificaciones */}
        <div className="relative">
          <button
            className="flex items-center justify-center rounded-lg transition-all hover:bg-[rgba(124,58,237,0.1)]"
            style={{
              width: "36px",
              height: "36px",
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.2)",
              color: "#94A3B8",
            }}
            aria-label="Notificaciones"
          >
            <Bell size={14} strokeWidth={2} />
          </button>
          {alertCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white text-[9px] font-bold"
              style={{ width: "14px", height: "14px", background: "#7C3AED" }}
            >
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </div>

        {/* Avatar */}
        <Link
          href="/app/configuracion/cuenta"
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 cursor-pointer transition-all hover:bg-[rgba(124,58,237,0.1)]"
          style={{
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={userName} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
            >
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-[#F1F5F9]">{userName.split(" ")[0]}</span>
        </Link>
      </div>
    </header>
  );
}

"use client";

import { Bell, Search, Settings } from "lucide-react";

interface NavbarProps {
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function Navbar({ pageTitle, pageSubtitle }: NavbarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: "64px",
        background: "#0d0d14",
        borderBottom: "1px solid rgba(124,58,237,0.15)",
      }}
    >
      {/* Left: breadcrumb / titulo */}
      <div className="flex items-center gap-3">
        {pageTitle && (
          <div>
            <h1
              className="leading-none font-bold text-[#F1F5F9]"
              style={{ fontFamily: "var(--font-syne)", fontSize: "16px" }}
            >
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="text-xs text-[#94A3B8] mt-0.5">{pageSubtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Right: acciones */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center justify-center rounded-lg transition-all hover:bg-[rgba(124,58,237,0.1)]"
          style={{
            width: "36px",
            height: "36px",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.2)",
            color: "#94A3B8",
          }}
          aria-label="Buscar"
        >
          <Search size={15} strokeWidth={2} />
        </button>

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
            <Bell size={15} strokeWidth={2} />
          </button>
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white text-[9px] font-bold"
            style={{ width: "14px", height: "14px", background: "#7C3AED" }}
          >
            3
          </span>
        </div>

        <button
          className="flex items-center justify-center rounded-lg transition-all hover:bg-[rgba(124,58,237,0.1)]"
          style={{
            width: "36px",
            height: "36px",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.2)",
            color: "#94A3B8",
          }}
          aria-label="Configuracion"
        >
          <Settings size={15} strokeWidth={2} />
        </button>

        {/* Avatar */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 cursor-pointer transition-all hover:bg-[rgba(124,58,237,0.1)]"
          style={{
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", fontFamily: "var(--font-syne)" }}
          >
            F
          </div>
          <span className="text-sm font-medium text-[#F1F5F9]">Facundo</span>
        </div>
      </div>
    </header>
  );
}

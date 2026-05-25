"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingAI() {
  const [hovered, setHovered] = useState(false);
  const pathname = usePathname();

  // No mostrar en la página de IA misma
  if (pathname === "/app/ia" || pathname.startsWith("/app/ia/")) return null;

  return (
    <Link
      href="/app/ia"
      className="fixed z-40 flex items-center gap-2 rounded-full shadow-xl transition-all duration-200 group"
      style={{
        bottom: "20px",
        right: "20px",
        background: "linear-gradient(135deg, #7C3AED, #2563EB)",
        boxShadow: "0 8px 32px rgba(124,58,237,0.4), 0 2px 8px rgba(0,0,0,0.3)",
        padding: hovered ? "12px 18px" : "14px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Asistente IA"
    >
      <Bot size={20} strokeWidth={2} color="white" />
      <span
        className="overflow-hidden whitespace-nowrap text-sm font-bold text-white transition-all duration-200"
        style={{
          maxWidth: hovered ? "180px" : "0",
          opacity: hovered ? 1 : 0,
        }}
      >
        Asistente IA
      </span>
    </Link>
  );
}

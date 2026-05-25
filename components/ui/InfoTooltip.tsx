"use client";

import { Info } from "lucide-react";
import { useState } from "react";

interface Props {
  /** Texto técnico (modo Pro) */
  text: string;
  /** Texto simple para no-técnicos (modo Simple). Si no se provee, usa text. */
  simpleText?: string;
  /** Tamaño del ícono */
  size?: number;
  /** Posición del tooltip (default: top) */
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * Pequeño ícono (i) con tooltip al hover/click. Funciona en mobile (click)
 * y desktop (hover).
 */
export default function InfoTooltip({ text, simpleText, size = 12, side = "top" }: Props) {
  const [open, setOpen] = useState(false);
  const [modoSimple, setModoSimple] = useState(false);

  // Read mode from html data attr (set by Navbar)
  if (typeof document !== "undefined") {
    const mode = document.documentElement.getAttribute("data-modo");
    if (mode === "simple" && !modoSimple) setModoSimple(true);
    if (mode !== "simple" && modoSimple) setModoSimple(false);
  }

  const displayText = modoSimple && simpleText ? simpleText : text;

  const positions: Record<string, React.CSSProperties> = {
    top:    { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: "8px" },
    bottom: { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px" },
    left:   { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: "8px" },
    right:  { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: "8px" },
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center justify-center rounded-full transition-all hover:bg-[rgba(124,58,237,0.15)] cursor-help"
        style={{ width: size + 6, height: size + 6 }}
        aria-label="Más información"
      >
        <Info size={size} strokeWidth={2} color="#7C3AED" className="opacity-60 hover:opacity-100" />
      </button>

      {open && (
        <span
          className="absolute z-50 rounded-lg px-3 py-2 text-[11px] leading-relaxed pointer-events-none"
          style={{
            ...positions[side],
            background: "#1a1a2e",
            border: "1px solid rgba(124,58,237,0.4)",
            color: "#F1F5F9",
            minWidth: "180px",
            maxWidth: "260px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            whiteSpace: "normal",
          }}
        >
          {displayText}
        </span>
      )}
    </span>
  );
}

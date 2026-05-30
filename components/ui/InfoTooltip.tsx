"use client";

import { Info } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Props {
  text: string;
  simpleText?: string;
  size?: number;
  side?: "top" | "bottom" | "left" | "right";
}

export default function InfoTooltip({ text, simpleText, size = 12, side = "top" }: Props) {
  const [open, setOpen]           = useState(false);
  const [coords, setCoords]       = useState({ top: 0, left: 0 });
  const [modoSimple, setModoSimple] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
    const mode = document.documentElement.getAttribute("data-modo");
    setModoSimple(mode === "simple");
  }, []);

  const calcPosition = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const TOOLTIP_W = 220;
    const TOOLTIP_H = 80; // estimado

    let top = 0;
    let left = 0;

    if (side === "top" || (!side)) {
      top  = r.top - TOOLTIP_H - 8 + window.scrollY;
      left = r.left + r.width / 2 - TOOLTIP_W / 2 + window.scrollX;
    } else if (side === "bottom") {
      top  = r.bottom + 8 + window.scrollY;
      left = r.left + r.width / 2 - TOOLTIP_W / 2 + window.scrollX;
    } else if (side === "left") {
      top  = r.top + r.height / 2 - TOOLTIP_H / 2 + window.scrollY;
      left = r.left - TOOLTIP_W - 8 + window.scrollX;
    } else {
      top  = r.top + r.height / 2 - TOOLTIP_H / 2 + window.scrollY;
      left = r.right + 8 + window.scrollX;
    }

    // Clamp horizontalmente para no salirse de la pantalla
    const maxLeft = window.innerWidth - TOOLTIP_W - 8;
    left = Math.max(8, Math.min(left, maxLeft));

    // Si no hay espacio arriba, mostrar abajo
    if (top < window.scrollY + 8 && (side === "top" || !side)) {
      top = r.bottom + 8 + window.scrollY;
    }

    setCoords({ top, left });
  }, [side]);

  function handleEnter() {
    calcPosition();
    setOpen(true);
  }

  const displayText = modoSimple && simpleText ? simpleText : text;

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); calcPosition(); setOpen(!open); }}
        className="flex items-center justify-center rounded-full transition-all hover:bg-[rgba(124,58,237,0.15)] cursor-help"
        style={{ width: size + 6, height: size + 6 }}
        aria-label="Más información"
      >
        <Info size={size} strokeWidth={2} color="#7C3AED" className="opacity-60 hover:opacity-100" />
      </button>

      {mounted && open && createPortal(
        <span
          className="fixed z-[9999] rounded-lg px-3 py-2 text-[11px] leading-relaxed pointer-events-none"
          style={{
            top:       coords.top,
            left:      coords.left,
            width:     220,
            background: "#1a1a2e",
            border:    "1px solid rgba(124,58,237,0.4)",
            color:     "#F1F5F9",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            whiteSpace: "normal",
          }}
        >
          {displayText}
        </span>,
        document.body
      )}
    </span>
  );
}

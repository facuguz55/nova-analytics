"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

// Tokens de formato serializables — se pueden pasar desde Server Components
// (a diferencia de una función, que Next 15 prohíbe cruzar la frontera server→client).
type FormatToken = "number" | "currency";
const FORMATTERS: Record<FormatToken, (n: number) => string> = {
  number: (n) => String(Math.round(n)),
  currency: (n) => formatCurrency(n),
};

export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;

    const start = performance.now();
    const diff = target - from;
    let raf: number;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + diff * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

interface Props {
  value: number;
  // Función (solo desde Client Components) o token string (también desde Server Components)
  format?: ((n: number) => string) | FormatToken;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({ value, format, duration = 900, className }: Props) {
  const animated = useCountUp(value, duration);
  const fmt = typeof format === "string" ? FORMATTERS[format] : format;
  const display = fmt ? fmt(animated) : String(Math.round(animated));
  return <span className={className}>{display}</span>;
}

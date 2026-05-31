"use client";

import { useEffect, useRef, useState } from "react";

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
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({ value, format, duration = 900, className }: Props) {
  const animated = useCountUp(value, duration);
  const display = format ? format(animated) : String(Math.round(animated));
  return <span className={className}>{display}</span>;
}

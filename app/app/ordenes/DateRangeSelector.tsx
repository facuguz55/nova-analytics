"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";

export type Preset = "today" | "yesterday" | "7d" | "15d" | "30d" | "60d" | "90d" | "custom";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today",     label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "7d",        label: "7 días" },
  { key: "15d",       label: "15 días" },
  { key: "30d",       label: "30 días" },
  { key: "60d",       label: "60 días" },
  { key: "90d",       label: "90 días" },
];

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function presetToDates(preset: Preset): { since: string; until: string } {
  const now = new Date();
  const today = fmt(now);
  const dayMs = 86400000;
  if (preset === "today")     return { since: today,                                      until: today };
  if (preset === "yesterday") return { since: fmt(new Date(now.getTime() - dayMs)),        until: fmt(new Date(now.getTime() - dayMs)) };
  if (preset === "7d")        return { since: fmt(new Date(now.getTime() - 7  * dayMs)),   until: today };
  if (preset === "15d")       return { since: fmt(new Date(now.getTime() - 15 * dayMs)),   until: today };
  if (preset === "30d")       return { since: fmt(new Date(now.getTime() - 30 * dayMs)),   until: today };
  if (preset === "60d")       return { since: fmt(new Date(now.getTime() - 60 * dayMs)),   until: today };
  if (preset === "90d")       return { since: fmt(new Date(now.getTime() - 90 * dayMs)),   until: today };
  return { since: fmt(new Date(now.getTime() - 30 * dayMs)), until: today };
}

interface Props {
  activePreset: Preset;
  since: string;
  until: string;
}

export default function DateRangeSelector({ activePreset, since, until }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(activePreset === "custom");
  const [customFrom, setCustomFrom] = useState(since);
  const [customUntil, setCustomUntil] = useState(until);

  function go(preset: Preset, s: string, u: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    p.set("preset", preset);
    p.set("since", s);
    p.set("until", u);
    router.push(`${pathname}?${p.toString()}`);
  }

  function handlePreset(preset: Preset) {
    if (preset === "custom") { setShowCustom(true); return; }
    setShowCustom(false);
    const { since: s, until: u } = presetToDates(preset);
    go(preset, s, u);
  }

  function handleApplyCustom() {
    if (!customFrom || !customUntil) return;
    go("custom", customFrom, customUntil);
    setShowCustom(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Presets */}
      <div
        className="flex items-center gap-0.5 rounded-xl p-1 flex-wrap"
        style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        {PRESETS.map((p) => {
          const active = activePreset === p.key;
          return (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: active ? "#7C3AED" : "transparent",
                color: active ? "#fff" : "#64748B",
              }}
            >
              {p.label}
            </button>
          );
        })}

        {/* Personalizado */}
        <button
          onClick={() => { setShowCustom(!showCustom); }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
          style={{
            background: activePreset === "custom" ? "#7C3AED" : "transparent",
            color: activePreset === "custom" ? "#fff" : "#8B5CF6",
          }}
        >
          <Calendar size={11} strokeWidth={2.5} />
          {activePreset === "custom" ? `${since} → ${until}` : "Personalizado"}
          <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform ${showCustom ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Custom range picker */}
      {showCustom && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 flex-wrap"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748B]">Desde</span>
            <input
              type="date"
              value={customFrom}
              max={customUntil || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg px-2 py-1 text-xs text-[#F1F5F9] outline-none"
              style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.25)", colorScheme: "dark" }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748B]">Hasta</span>
            <input
              type="date"
              value={customUntil}
              min={customFrom || undefined}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setCustomUntil(e.target.value)}
              className="rounded-lg px-2 py-1 text-xs text-[#F1F5F9] outline-none"
              style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.25)", colorScheme: "dark" }}
            />
          </div>
          <button
            onClick={handleApplyCustom}
            disabled={!customFrom || !customUntil}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40"
            style={{ background: "#7C3AED" }}
          >
            Aplicar
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

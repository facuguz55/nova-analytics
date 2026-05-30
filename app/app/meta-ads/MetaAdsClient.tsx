"use client";

import { useState, useEffect } from "react";
import { Target, ExternalLink, BarChart2, SlidersHorizontal, X, Check } from "lucide-react";
import Link from "next/link";

// ── Definición de métricas ──────────────────────────────────────────────
const METRIC_GROUPS = [
  {
    title: "Métricas Básicas",
    metrics: [
      { key: "spend_meta",   label: "Spend",       source: "meta" },
      { key: "spend_calc",   label: "Spend",       source: "calc" },
      { key: "impressions",  label: "Impressions", source: "meta" },
      { key: "reach",        label: "Reach",       source: "meta" },
      { key: "frequency",    label: "Frequency",   source: "meta" },
      { key: "cpm_meta",     label: "CPM",         source: "meta" },
      { key: "cpm_calc",     label: "CPM",         source: "calc" },
      { key: "ctr_meta",     label: "CTR",         source: "meta" },
      { key: "cpc_meta",     label: "CPC",         source: "meta" },
    ],
  },
  {
    title: "Métricas de Click",
    metrics: [
      { key: "link_clicks",        label: "Link Clicks",            source: "meta" },
      { key: "clicks",             label: "Clicks",                 source: "meta" },
      { key: "cost_link_click_m",  label: "Cost per Link Click",    source: "meta" },
      { key: "cost_link_click_c",  label: "Cost per Link Click",    source: "calc" },
      { key: "cost_unique_lc",     label: "Cost per Unique Link Click", source: "meta" },
      { key: "cost_unique_lc_c",   label: "Cost per Unique Link Click", source: "calc" },
      { key: "unique_link_clicks", label: "Unique Link Clicks",     source: "meta" },
      { key: "unique_ctr",         label: "Unique CTR",             source: "meta" },
    ],
  },
  {
    title: "Métricas de Video",
    metrics: [
      { key: "video_plays",       label: "Video Plays",           source: "meta" },
      { key: "avg_play_time",     label: "Avg Play Time",         source: "meta" },
      { key: "thruplays",         label: "Thruplays",             source: "meta" },
      { key: "scroll_stopper",    label: "Scroll Stopper Rate",   source: "meta" },
      { key: "hold_rate",         label: "Hold Rate",             source: "meta" },
      { key: "video_plays_100",   label: "Video Plays at 100%",   source: "meta" },
      { key: "video_plays_95",    label: "Video Plays at 95%",    source: "meta" },
      { key: "video_plays_75",    label: "Video Plays at 75%",    source: "meta" },
      { key: "video_plays_50",    label: "Video Plays at 50%",    source: "meta" },
    ],
  },
  {
    title: "Métricas de Conversión",
    metrics: [
      { key: "cost_purchase_m",   label: "Cost per Purchase",    source: "meta" },
      { key: "cost_purchase_c",   label: "Cost per Purchase",    source: "calc" },
      { key: "roas_meta",         label: "ROAS",                 source: "meta" },
      { key: "true_roas",         label: "True ROAS",            source: "calc" },
      { key: "net_aov",           label: "Net AOV",              source: "calc" },
      { key: "adds_to_cart",      label: "Adds to Cart",         source: "meta" },
      { key: "cost_add_cart_c",   label: "Cost per Add to Cart", source: "calc" },
      { key: "cost_add_cart_m",   label: "Cost per Add to Cart", source: "meta" },
      { key: "checkouts",         label: "Checkouts Initiated",  source: "meta" },
    ],
  },
];

// Métricas activas por defecto
const DEFAULT_METRICS = ["spend_meta", "impressions", "cpm_calc", "ctr_meta", "clicks", "cost_link_click_c", "cost_purchase_c", "true_roas", "net_aov"];

function SourceBadge({ source }: { source: string }) {
  return (
    <span
      className="text-[9px] font-bold rounded px-1"
      style={{
        background: source === "meta" ? "rgba(24,119,242,0.15)" : "rgba(225,105,30,0.12)",
        color:      source === "meta" ? "#1877F2" : "#e1691e",
        border:     `1px solid ${source === "meta" ? "rgba(24,119,242,0.25)" : "rgba(225,105,30,0.2)"}`,
      }}
    >
      {source === "meta" ? "∞" : "≡"}
    </span>
  );
}

export default function MetaAdsClient() {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_METRICS));

  // Persistir en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nova-meta-metrics");
    if (saved) {
      try { setSelected(new Set(JSON.parse(saved))); } catch { /* ignore */ }
    }
  }, []);

  function toggleMetric(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function saveMetrics() {
    localStorage.setItem("nova-meta-metrics", JSON.stringify(Array.from(selected)));
    setShowModal(false);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Meta Ads</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Métricas de campañas Facebook e Instagram</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(24,119,242,0.1)", color: "#1877F2", border: "1px solid rgba(24,119,242,0.25)" }}
        >
          <SlidersHorizontal size={14} strokeWidth={2.5} />
          Métricas ({selected.size})
        </button>
      </div>

      {/* Coming soon */}
      <div className="rounded-2xl p-10 flex flex-col items-center gap-5 text-center"
        style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.25)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(24,119,242,0.12)" }}>
          <Target size={28} color="#1877F2" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9]">Meta Ads — Próximamente</h2>
          <p className="text-sm text-[#94A3B8] mt-2 max-w-md">
            La integración con Meta Business API está en desarrollo. Podrás ver ROAS, CPA,
            inversión vs. ventas y el rendimiento de cada campaña directamente aquí.
          </p>
          <p className="text-xs text-[#64748B] mt-3">
            Ya podés configurar qué métricas querés ver pulsando el botón <strong className="text-[#94A3B8]">Métricas</strong> arriba.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/app/configuracion/integraciones"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(24,119,242,0.15)", color: "#1877F2", border: "1px solid rgba(24,119,242,0.3)" }}>
            <BarChart2 size={14} strokeWidth={2.5} /> Ver integraciones
          </Link>
          <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(100,116,139,0.1)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.2)" }}>
            <ExternalLink size={14} strokeWidth={2.5} /> Abrir Meta Business
          </a>
        </div>
      </div>

      {/* Modal de métricas */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)" }}>

            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">Métricas</h3>
                <p className="text-xs text-[#64748B] mt-0.5">{selected.size} seleccionadas</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 px-6 py-2.5 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(124,58,237,0.08)", background: "rgba(124,58,237,0.03)" }}>
              <div className="flex items-center gap-1.5">
                <SourceBadge source="meta" />
                <span className="text-xs text-[#64748B]">Dato directo de Meta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <SourceBadge source="calc" />
                <span className="text-xs text-[#64748B]">Calculado por Nova</span>
              </div>
            </div>

            {/* Grupos de métricas */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {METRIC_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <p className="text-xs font-bold text-[#F1F5F9]">{group.title}</p>
                    <div className="space-y-1.5">
                      {group.metrics.map((m) => {
                        const isSelected = selected.has(m.key);
                        return (
                          <button
                            key={m.key}
                            onClick={() => toggleMetric(m.key)}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all text-left"
                            style={{
                              background: isSelected ? "rgba(124,58,237,0.08)" : "transparent",
                              border: `1px solid ${isSelected ? "rgba(124,58,237,0.2)" : "transparent"}`,
                            }}
                          >
                            {/* Checkbox */}
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                background: isSelected ? "#7C3AED" : "transparent",
                                border: `1.5px solid ${isSelected ? "#7C3AED" : "rgba(100,116,139,0.4)"}`,
                              }}
                            >
                              {isSelected && <Check size={9} color="white" strokeWidth={3} />}
                            </div>
                            <SourceBadge source={m.source} />
                            <span className="text-xs text-[#94A3B8] truncate">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 gap-3"
              style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}>
              <button
                onClick={() => setSelected(new Set(DEFAULT_METRICS))}
                className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors"
              >
                Restaurar por defecto
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-[#64748B] transition-all hover:text-[#F1F5F9]"
                  style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                  Cancelar
                </button>
                <button onClick={saveMetrics}
                  className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-80"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

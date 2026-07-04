"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Target, SlidersHorizontal, X, Check, RefreshCw, TrendingUp,
  TrendingDown, Minus, AlertCircle, ExternalLink, Loader2,
} from "lucide-react";

// ── Definición de métricas ──────────────────────────────────────────────
const METRIC_GROUPS = [
  {
    title: "Métricas básicas",
    metrics: [
      { key: "spend",        label: "Inversión",    source: "meta" },
      { key: "impressions",  label: "Impresiones",  source: "meta" },
      { key: "reach",        label: "Alcance",      source: "meta" },
      { key: "frequency",    label: "Frecuencia",   source: "meta" },
      { key: "cpm",          label: "CPM",          source: "meta" },
      { key: "ctr",          label: "CTR",          source: "meta" },
      { key: "cpc",          label: "CPC",          source: "meta" },
    ],
  },
  {
    title: "Métricas de clic",
    metrics: [
      { key: "link_clicks",         label: "Clics en enlace",       source: "meta" },
      { key: "clicks",              label: "Clics totales",         source: "meta" },
      { key: "unique_link_clicks",  label: "Clics únicos enlace",   source: "meta" },
      { key: "unique_ctr",          label: "CTR único",             source: "meta" },
    ],
  },
  {
    title: "Métricas de video",
    metrics: [
      { key: "video_plays",      label: "Reproducciones",    source: "meta" },
      { key: "thruplays",        label: "Reprod. completas", source: "meta" },
      { key: "video_plays_50",   label: "Video al 50%",      source: "meta" },
      { key: "video_plays_75",   label: "Video al 75%",      source: "meta" },
      { key: "video_plays_95",   label: "Video al 95%",      source: "meta" },
      { key: "video_plays_100",  label: "Video completo",    source: "meta" },
    ],
  },
  {
    title: "Métricas de conversión",
    metrics: [
      { key: "purchases",       label: "Compras",           source: "meta" },
      { key: "cost_purchase",   label: "Costo por compra",  source: "meta" },
      { key: "roas",            label: "ROAS",              source: "meta" },
      { key: "adds_to_cart",    label: "Carritos añadidos", source: "meta" },
      { key: "checkouts",       label: "Checkouts iniciados", source: "meta" },
      { key: "purchase_value",  label: "Valor de compras",  source: "meta" },
    ],
  },
];

const DEFAULT_METRICS = ["spend", "impressions", "cpm", "ctr", "clicks", "purchases", "cost_purchase", "roas"];

const DATE_PRESETS = [
  { value: "today",      label: "Hoy" },
  { value: "yesterday",  label: "Ayer" },
  { value: "last_7d",    label: "7 días" },
  { value: "last_14d",   label: "14 días" },
  { value: "last_30d",   label: "30 días" },
  { value: "last_90d",   label: "90 días" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes anterior" },
];

interface Campaign {
  campaign_name: string;
  spend: string;
  impressions: string;
  reach?: string;
  frequency?: string;
  clicks: string;
  ctr: string;
  cpc?: string;
  cpm?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  cost_per_action_type?: { action_type: string; value: string }[];
  video_play_actions?: { action_type: string; value: string }[];
  video_p50_watched_actions?: { action_type: string; value: string }[];
  video_p75_watched_actions?: { action_type: string; value: string }[];
  video_p95_watched_actions?: { action_type: string; value: string }[];
  video_p100_watched_actions?: { action_type: string; value: string }[];
  website_ctr?: { action_type: string; value: string }[];
  unique_link_clicks_ctr?: { action_type: string; value: string }[];
  outbound_clicks?: { action_type: string; value: string }[];
}

function getActionValue(actions: { action_type: string; value: string }[] | undefined, type: string): number {
  return parseFloat(actions?.find((a) => a.action_type === type)?.value ?? "0") || 0;
}

function extractMetric(c: Campaign, key: string): number {
  switch (key) {
    case "spend":        return parseFloat(c.spend) || 0;
    case "impressions":  return parseInt(c.impressions) || 0;
    case "reach":        return parseInt(c.reach ?? "0") || 0;
    case "frequency":    return parseFloat(c.frequency ?? "0") || 0;
    case "clicks":       return parseInt(c.clicks) || 0;
    case "ctr":          return parseFloat(c.ctr) || 0;
    case "cpc":          return parseFloat(c.cpc ?? "0") || 0;
    case "cpm":          return parseFloat(c.cpm ?? "0") || 0;
    case "link_clicks":      return getActionValue(c.actions, "link_click");
    case "unique_link_clicks": return getActionValue(c.outbound_clicks, "outbound_click");
    case "unique_ctr":   return getActionValue(c.unique_link_clicks_ctr, "outbound_click");
    case "video_plays":  return getActionValue(c.video_play_actions, "video_view");
    case "thruplays":    return getActionValue(c.actions, "video_thruplay_watched");
    case "video_plays_50":  return getActionValue(c.video_p50_watched_actions, "video_view");
    case "video_plays_75":  return getActionValue(c.video_p75_watched_actions, "video_view");
    case "video_plays_95":  return getActionValue(c.video_p95_watched_actions, "video_view");
    case "video_plays_100": return getActionValue(c.video_p100_watched_actions, "video_view");
    case "purchases":     return getActionValue(c.actions, "purchase");
    case "purchase_value": return getActionValue(c.action_values, "purchase");
    case "adds_to_cart":  return getActionValue(c.actions, "add_to_cart");
    case "checkouts":     return getActionValue(c.actions, "initiate_checkout");
    case "cost_purchase": {
      const purchases = getActionValue(c.actions, "purchase");
      const spend = parseFloat(c.spend) || 0;
      return purchases > 0 ? spend / purchases : 0;
    }
    case "roas": {
      const value = getActionValue(c.action_values, "purchase");
      const spend = parseFloat(c.spend) || 0;
      return spend > 0 ? value / spend : 0;
    }
    default: return 0;
  }
}

function formatMetric(key: string, value: number): string {
  if (value === 0) return "—";
  switch (key) {
    case "spend":
    case "cpc":
    case "cpm":
    case "cost_purchase":
    case "purchase_value":
      return `$${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "ctr":
    case "unique_ctr":
    case "frequency":
      return `${value.toFixed(2)}%`;
    case "roas":
      return `${value.toFixed(2)}x`;
    case "impressions":
    case "reach":
    case "clicks":
    case "link_clicks":
    case "unique_link_clicks":
    case "video_plays":
    case "thruplays":
    case "video_plays_50":
    case "video_plays_75":
    case "video_plays_95":
    case "video_plays_100":
    case "purchases":
    case "adds_to_cart":
    case "checkouts":
      return value.toLocaleString("es-AR");
    default:
      return value.toFixed(2);
  }
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span
      className="text-[9px] font-bold rounded px-1"
      style={{
        background: "rgba(24,119,242,0.15)",
        color: "#1877F2",
        border: "1px solid rgba(24,119,242,0.25)",
      }}
    >
      ∞
    </span>
  );
}

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.2)" }}>
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.03em" }}>{value}</p>
      {sub && <p className="text-xs text-[#64748B]">{sub}</p>}
    </div>
  );
}

export default function MetaAdsClient({ connected }: { connected: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_METRICS));
  const [datePreset, setDatePreset] = useState("last_30d");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("nova-meta-metrics");
    if (saved) {
      try { setSelected(new Set(JSON.parse(saved))); } catch { /* ignore */ }
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/meta/insights?date_preset=${datePreset}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cargar datos de Meta");
      } else {
        setCampaigns(data.campaigns ?? []);
        if (data.account?.name) setAccountName(data.account.name);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [connected, datePreset]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const selectedMetrics = METRIC_GROUPS.flatMap((g) => g.metrics).filter((m) => selected.has(m.key));

  // Totales
  const totalSpend = campaigns.reduce((s, c) => s + (parseFloat(c.spend) || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (parseInt(c.impressions) || 0), 0);
  const totalPurchases = campaigns.reduce((s, c) => s + getActionValue(c.actions, "purchase"), 0);
  const totalPurchaseValue = campaigns.reduce((s, c) => s + getActionValue(c.action_values, "purchase"), 0);
  const globalROAS = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
  const globalCPA = totalPurchases > 0 ? totalSpend / totalPurchases : 0;

  if (!connected) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Meta Ads</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Métricas de campañas Facebook e Instagram</p>
        </div>
        <div className="rounded-2xl p-10 flex flex-col items-center gap-5 text-center"
          style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.25)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(24,119,242,0.12)" }}>
            <Target size={28} color="#1877F2" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F1F5F9]">Meta Ads no conectado</h2>
            <p className="text-sm text-[#94A3B8] mt-2 max-w-md">
              Conectá tu cuenta de Meta Ads para ver ROAS, CPA, inversión y el rendimiento de cada campaña.
            </p>
          </div>
          <Link href="/app/configuracion/integraciones"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(24,119,242,0.15)", color: "#1877F2", border: "1px solid rgba(24,119,242,0.3)" }}>
            <ExternalLink size={14} strokeWidth={2.5} /> Conectar en Integraciones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Meta Ads</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {accountName ? accountName : "Métricas de campañas Facebook e Instagram"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date preset */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm font-semibold outline-none transition-all"
            style={{ background: "#111118", color: "#F1F5F9", border: "1px solid rgba(24,119,242,0.25)" }}
          >
            {DATE_PRESETS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: "rgba(24,119,242,0.1)", color: "#1877F2", border: "1px solid rgba(24,119,242,0.25)" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} strokeWidth={2.5} />}
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(24,119,242,0.1)", color: "#1877F2", border: "1px solid rgba(24,119,242,0.25)" }}
          >
            <SlidersHorizontal size={14} strokeWidth={2.5} />
            Métricas ({selected.size})
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-[#ef4444] flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={15} strokeWidth={2} /> {error}
        </div>
      )}

      {/* KPIs globales */}
      {!loading && campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard label="Inversión total" value={`$${totalSpend.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
          <KPICard label="Impresiones" value={totalImpressions.toLocaleString("es-AR")} />
          <KPICard label="ROAS" value={globalROAS > 0 ? `${globalROAS.toFixed(2)}x` : "—"} />
          <KPICard label="Costo por compra" value={globalCPA > 0 ? `$${globalCPA.toFixed(0)}` : "—"} sub={`${totalPurchases} compras`} />
        </div>
      )}

      {/* Tabla de campañas */}
      {loading ? (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-3"
          style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.2)" }}>
          <Loader2 size={28} color="#1877F2" className="animate-spin" />
          <p className="text-sm text-[#64748B]">Cargando campañas...</p>
        </div>
      ) : campaigns.length === 0 && !error ? (
        <div className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.2)" }}>
          <Target size={28} color="#1877F2" strokeWidth={1.5} />
          <p className="text-sm text-[#94A3B8]">No hay campañas con datos para el período seleccionado.</p>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.2)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(24,119,242,0.12)", background: "rgba(24,119,242,0.04)" }}>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
                    Campaña
                  </th>
                  {selectedMetrics.map((m) => (
                    <th key={m.key} className="text-right px-4 py-3 text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < campaigns.length - 1 ? "1px solid rgba(24,119,242,0.08)" : "none",
                    }}
                    className="hover:bg-[rgba(24,119,242,0.03)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#F1F5F9] font-medium max-w-[240px] truncate">
                      {c.campaign_name}
                    </td>
                    {selectedMetrics.map((m) => {
                      const val = extractMetric(c, m.key);
                      return (
                        <td key={m.key} className="px-4 py-3 text-right text-[#94A3B8] font-mono text-xs whitespace-nowrap">
                          {formatMetric(m.key, val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Modal de métricas */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)" }}>

            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">Métricas</h3>
                <p className="text-xs text-[#64748B] mt-0.5">{selected.size} seleccionadas</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

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
                              background: isSelected ? "rgba(139,92,246,0.08)" : "transparent",
                              border: `1px solid ${isSelected ? "rgba(139,92,246,0.2)" : "transparent"}`,
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                background: isSelected ? "#8b5cf6" : "transparent",
                                border: `1.5px solid ${isSelected ? "#8b5cf6" : "rgba(100,116,139,0.4)"}`,
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

            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 gap-3"
              style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }}>
              <button
                onClick={() => setSelected(new Set(DEFAULT_METRICS))}
                className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors"
              >
                Restaurar por defecto
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-[#64748B] transition-all hover:text-[#F1F5F9]"
                  style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  Cancelar
                </button>
                <button onClick={saveMetrics}
                  className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-80"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }}>
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

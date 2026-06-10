"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { Loader2, Store, ArrowRight, Calendar, ChevronDown, Check } from "lucide-react";
import type { TNOrder } from "@/lib/tiendanube/client";

// ── Currencies ───────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "ARS", symbol: "$",  label: "Pesos arg." },
  { code: "USD", symbol: "U$", label: "Dólar USA" },
  { code: "EUR", symbol: "€",  label: "Euro" },
  { code: "BRL", symbol: "R$", label: "Real bras." },
  { code: "UYU", symbol: "$U", label: "Peso uru." },
];
const USD_TO_CURRENCY: Record<string, number> = { ARS: 1, USD: 1, EUR: 0.92, BRL: 5.0, UYU: 39 };

// ── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "paid" | "pending" | "cancelled" | "all";

interface Props {
  initialOrders: TNOrder[];
  since: string;
  until: string;
  activePreset: string;
  usdRate: number;
  isConnected: boolean;
}

// ── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  { key: "hoy",  label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "7d",   label: "7 días" },
  { key: "15d",  label: "15 días" },
  { key: "30d",  label: "30 días" },
  { key: "60d",  label: "60 días" },
  { key: "90d",  label: "90 días" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFmt(currency: string, usdRate: number, redondeo: boolean) {
  const cur = CURRENCIES.find((c) => c.code === currency);
  const sym = cur?.symbol ?? "$";

  return function fmt(arsAmount: number): string {
    // Convertir
    let val = arsAmount;
    if (currency !== "ARS") {
      const inUsd = arsAmount / usdRate;
      val = currency === "USD" ? inUsd : inUsd * (USD_TO_CURRENCY[currency] ?? 1);
    }

    if (redondeo) {
      if (Math.abs(val) >= 1_000_000) return `${sym}${(val / 1_000_000).toFixed(1)}M`;
      if (Math.abs(val) >= 1_000)     return `${sym}${(val / 1_000).toFixed(0)}k`;
      return `${sym}${Math.round(val)}`;
    }
    return `${sym}${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: currency === "ARS" ? 0 : 2,
      maximumFractionDigits: currency === "ARS" ? 0 : 2,
    }).format(val)}`;
  };
}

function filterByStatus(orders: TNOrder[], filter: StatusFilter): TNOrder[] {
  if (filter === "all") return orders;
  if (filter === "paid")
    return orders.filter((o) => o.payment_status === "paid" || o.status === "closed");
  if (filter === "pending")
    return orders.filter((o) => o.payment_status === "pending" && o.status !== "cancelled");
  if (filter === "cancelled")
    return orders.filter(
      (o) => o.status === "cancelled" || o.payment_status === "voided" || o.payment_status === "refunded"
    );
  return orders;
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function filterByDateRange(orders: TNOrder[], since: string, until: string): TNOrder[] {
  return orders.filter((o) => {
    const dateStr = toLocalDateStr(new Date(o.created_at));
    return dateStr >= since && dateStr <= until;
  });
}

function computeMonthlyData(orders: TNOrder[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
    const mo = orders.filter((o) => {
      const date = new Date(o.created_at);
      return date >= d && date < next;
    });
    return {
      month: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      ventas: mo.reduce((acc, o) => acc + parseFloat(o.total || "0"), 0),
      ordenes: mo.length,
    };
  });
}

function computeByWeekday(orders: TNOrder[]) {
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return weekDays.map((day, idx) => {
    const dayOrders = orders.filter((o) => new Date(o.created_at).getDay() === idx);
    return {
      day,
      ventas: dayOrders.reduce((acc, o) => acc + parseFloat(o.total || "0"), 0),
      ordenes: dayOrders.length,
    };
  });
}

function computeByHour(orders: TNOrder[]) {
  return Array.from({ length: 24 }, (_, h) => {
    const ho = orders.filter((o) => new Date(o.created_at).getHours() === h);
    return { hora: `${String(h).padStart(2, "0")}:00`, ordenes: ho.length };
  });
}

// ── Chart Card ────────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
        <p className="font-semibold text-[#F1F5F9] text-sm">{title}</p>
        {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── DateRangeSelector ────────────────────────────────────────────────────────

function DateRangeSelector({
  activePreset,
  since,
  until,
  onChange,
}: {
  activePreset: string;
  since: string;
  until: string;
  onChange: (preset: string, since?: string, until?: string) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customSince, setCustomSince] = useState(since);
  const [customUntil, setCustomUntil] = useState(until);

  const today = new Date().toISOString().split("T")[0];
  const isCustomActive = activePreset === "custom";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      {/* Preset pills — scroll horizontal en mobile */}
      <div className="flex gap-0.5 rounded-xl p-1 overflow-x-auto max-w-full" style={{ background: "#0D0D12", border: "1px solid rgba(139,92,246,0.2)" }}>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => { onChange(p.key); setShowCustom(false); }}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
            style={{
              background: activePreset === p.key && !showCustom ? "#8b5cf6" : "transparent",
              color: activePreset === p.key && !showCustom ? "#fff" : "#94A3B8",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range — chip + popover prolijo */}
      <div className="relative">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: isCustomActive ? "#8b5cf6" : showCustom ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.06)",
            border: `1px solid ${isCustomActive ? "#8b5cf6" : showCustom ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.2)"}`,
            color: isCustomActive ? "#fff" : showCustom ? "#a78bfa" : "#94A3B8",
          }}
        >
          <Calendar size={12} strokeWidth={2.5} />
          {isCustomActive
            ? <span className="font-bold">{since} → {until}</span>
            : "Personalizado"}
          <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform ${showCustom ? "rotate-180" : ""}`} />
        </button>

        {showCustom && (
          <>
            {/* Backdrop para cerrar al click fuera */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowCustom(false)}
            />

            <div
              className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-20"
              style={{
                background: "#111118",
                border: "1px solid rgba(139,92,246,0.35)",
                minWidth: "320px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)",
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.04)" }}
              >
                <Calendar size={14} color="#a78bfa" strokeWidth={2.5} />
                <p className="text-sm font-bold text-[#F1F5F9]">Rango personalizado</p>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Desde</label>
                    <input
                      type="date"
                      value={customSince}
                      max={customUntil || today}
                      onChange={(e) => setCustomSince(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-[#F1F5F9] outline-none transition-all focus:border-purple-500"
                      style={{
                        background: "#0D0D12",
                        border: "1px solid rgba(139,92,246,0.25)",
                        colorScheme: "dark",
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Hasta</label>
                    <input
                      type="date"
                      value={customUntil}
                      min={customSince || undefined}
                      max={today}
                      onChange={(e) => setCustomUntil(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-[#F1F5F9] outline-none transition-all focus:border-purple-500"
                      style={{
                        background: "#0D0D12",
                        border: "1px solid rgba(139,92,246,0.25)",
                        colorScheme: "dark",
                      }}
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-1 rounded-xl py-2.5 text-xs font-semibold text-[#94A3B8] transition-all hover:text-[#F1F5F9]"
                    style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (customSince && customUntil) {
                        onChange("custom", customSince, customUntil);
                        setShowCustom(false);
                      }
                    }}
                    disabled={!customSince || !customUntil}
                    className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalisisClient({ initialOrders, since, until, activePreset, usdRate, isConnected }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [allOrders,    setAllOrders]    = useState<TNOrder[]>(initialOrders);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [loadedPages,  setLoadedPages]  = useState(initialOrders.length > 0 ? 1 : 0);
  const [fullyLoaded,  setFullyLoaded]  = useState(initialOrders.length < 100);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("paid");
  const [fetchError,   setFetchError]   = useState(false);
  const [currency,     setCurrency]     = useState("ARS");
  const [showCurr,     setShowCurr]     = useState(false);
  const [redondeo,     setRedondeo]     = useState(true);

  // Sincronizar preferencias globales (Navbar)
  useEffect(() => {
    const r = localStorage.getItem("nova-redondeo");
    if (r !== null) setRedondeo(r === "true");
    function onR(e: Event) { setRedondeo((e as CustomEvent).detail); }
    window.addEventListener("nova-redondeo-change", onR);
    return () => window.removeEventListener("nova-redondeo-change", onR);
  }, []);

  const fmt = useMemo(() => makeFmt(currency, usdRate, redondeo), [currency, usdRate, redondeo]);

  // Carga progresiva
  const loadNextPage = useCallback(async (page: number) => {
    if (loadingMore || fullyLoaded || !isConnected) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/tiendanube/orders?page=${page}&since=${since}`);
      if (!res.ok) { setFetchError(true); return; }
      const data = await res.json() as { orders: TNOrder[]; hasMore: boolean };
      setAllOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        return [...prev, ...data.orders.filter((o) => !existingIds.has(o.id))];
      });
      setLoadedPages(page);
      if (!data.hasMore || page >= 20) setFullyLoaded(true);
    } catch {
      setFetchError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, fullyLoaded, isConnected, since]);

  useEffect(() => {
    if (initialOrders.length === 100 && !fullyLoaded) loadNextPage(2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loadingMore && !fullyLoaded && loadedPages >= 1 && allOrders.length === loadedPages * 100) {
      loadNextPage(loadedPages + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, fullyLoaded, loadedPages]);

  function handleRangeChange(preset: string, customSince?: string, customUntil?: string) {
    if (preset === "custom" && customSince && customUntil) {
      router.push(`${pathname}?preset=custom&since=${customSince}&until=${customUntil}`);
    } else {
      router.push(`${pathname}?preset=${preset}`);
    }
  }

  // Para hoy/ayer recalcular en LOCAL timezone (el servidor usa UTC y puede desfasar un día)
  const { effectiveSince, effectiveUntil } = useMemo(() => {
    if (activePreset === "hoy" || activePreset === "ayer") {
      const now = new Date();
      const offset = activePreset === "ayer" ? 1 : 0;
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      const s = toLocalDateStr(d);
      return { effectiveSince: s, effectiveUntil: s };
    }
    return { effectiveSince: since, effectiveUntil: until };
  }, [activePreset, since, until]);

  // Filtrar por rango de fechas Y estado
  const ordersInRange = useMemo(() => filterByDateRange(allOrders, effectiveSince, effectiveUntil), [allOrders, effectiveSince, effectiveUntil]);
  const filtered      = useMemo(() => filterByStatus(ordersInRange, statusFilter), [ordersInRange, statusFilter]);
  const monthlyData   = useMemo(() => computeMonthlyData(filtered), [filtered]);
  const byWeekday     = useMemo(() => computeByWeekday(filtered), [filtered]);
  const byHour        = useMemo(() => computeByHour(filtered), [filtered]);

  const counts = useMemo(() => ({
    paid:      ordersInRange.filter((o) => o.payment_status === "paid" || o.status === "closed").length,
    pending:   ordersInRange.filter((o) => o.payment_status === "pending" && o.status !== "cancelled").length,
    cancelled: ordersInRange.filter((o) => o.status === "cancelled" || o.payment_status === "voided" || o.payment_status === "refunded").length,
    all:       ordersInRange.length,
  }), [ordersInRange]);

  const totalRevenue = useMemo(
    () => filtered.reduce((acc, o) => acc + parseFloat(o.total || "0"), 0),
    [filtered]
  );

  // ── Sin conexión ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9] mb-2" style={{ letterSpacing: "-0.02em" }}>Análisis</h1>
        <div className="rounded-2xl p-10 text-center" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
          <Store size={40} color="#8b5cf6" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conectá tu TiendaNube</p>
          <p className="text-sm text-[#64748B] mb-4">Necesitás conectar tu tienda para ver el análisis de ventas.</p>
          <a
            href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#8b5cf6" }}
          >
            Ir a integraciones <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  const STATUS_TABS: { key: StatusFilter; label: string; color: string }[] = [
    { key: "paid",      label: "Pagadas",    color: "#22c55e" },
    { key: "pending",   label: "Pendientes", color: "#f59e0b" },
    { key: "cancelled", label: "Canceladas", color: "#ef4444" },
    { key: "all",       label: "Todas",      color: "#a78bfa" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Análisis</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Evolución histórica y patrones de ventas</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency selector */}
          <div className="relative">
            <button
              onClick={() => setShowCurr(!showCurr)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:bg-[rgba(139,92,246,0.15)]"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}
            >
              {currency}
              <ChevronDown size={11} strokeWidth={2.5} className={`transition-transform ${showCurr ? "rotate-180" : ""}`} />
            </button>
            {showCurr && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCurr(false)} />
                <div
                  className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-20 py-1"
                  style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", minWidth: "160px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                >
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrency(c.code); setShowCurr(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-[rgba(139,92,246,0.08)]"
                      style={{ color: c.code === currency ? "#a78bfa" : "#94A3B8" }}
                    >
                      <span>{c.code} — {c.label}</span>
                      {c.code === currency && <Check size={11} strokeWidth={2.5} color="#8b5cf6" />}
                    </button>
                  ))}
                  {currency !== "ARS" && (
                    <p className="px-4 py-1.5 text-[10px] text-[#475569] border-t" style={{ borderColor: "rgba(139,92,246,0.12)" }}>
                      {currency === "USD" ? `1 USD = ${usdRate.toLocaleString("es-AR")} ARS` : "Tasa aprox. vs USD"}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DateRangeSelector
            activePreset={activePreset}
            since={since}
            until={until}
            onChange={handleRangeChange}
          />
        </div>
      </div>

      {/* Tabs de estado */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: active ? `${tab.color}18` : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? tab.color + "40" : "rgba(255,255,255,0.08)"}`,
                color: active ? tab.color : "#64748B",
              }}
            >
              {tab.label}
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: active ? `${tab.color}25` : "rgba(255,255,255,0.06)",
                  color: active ? tab.color : "#475569",
                }}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}

        {loadingMore && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}
          >
            <Loader2 size={11} className="animate-spin" />
            Cargando más datos...
          </div>
        )}
        {fullyLoaded && allOrders.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}
          >
            ✓ {allOrders.length} órdenes cargadas
          </div>
        )}
        {fetchError && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
          >
            Error parcial — mostrando datos disponibles
          </div>
        )}
      </div>

      {/* Sin datos */}
      {filtered.length === 0 && !loadingMore && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}
        >
          <p className="text-[#64748B] text-sm">
            {allOrders.length === 0
              ? "No se encontraron órdenes en este período."
              : `No hay órdenes con estado "${STATUS_TABS.find((t) => t.key === statusFilter)?.label?.toLowerCase()}" en este período.`}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Órdenes",      value: String(filtered.length),                                         color: "#a78bfa", bg: "rgba(139,92,246,0.08)" },
              { label: "Ingresos",     value: fmt(totalRevenue),                                               color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
              { label: "Ticket prom.", value: filtered.length > 0 ? fmt(totalRevenue / filtered.length) : "$0",color: "#c084fc", bg: "rgba(192,132,252,0.08)" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-3 sm:p-4 flex flex-col gap-1" style={{ background: s.bg, border: `1px solid ${s.color}25` }}>
                <p className="text-[10px] sm:text-xs font-medium" style={{ color: s.color + "aa" }}>{s.label}</p>
                <p className="text-lg sm:text-2xl font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Ventas por mes */}
          <ChartCard
            title="Ventas por mes"
            subtitle={`Últimos 6 meses · ${STATUS_TABS.find((t) => t.key === statusFilter)?.label?.toLowerCase() ?? "todas"}`}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "12px", fontSize: "12px" }}
                  labelStyle={{ color: "#F1F5F9", fontWeight: 700 }}
                  formatter={(v) => [fmt(Number(v)), "Ventas"]}
                />
                <Area type="monotone" dataKey="ventas" stroke="#c084fc" strokeWidth={2} fill="url(#gVentas)" dot={false} activeDot={{ r: 4, fill: "#c084fc", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Ventas por día de la semana" subtitle="Distribución semanal">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byWeekday} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v) => [fmt(Number(v)), "Ventas"]}
                  />
                  <Bar dataKey="ventas" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Órdenes por hora del día" subtitle="Distribución horaria">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byHour} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" vertical={false} />
                  <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v) => [Number(v), "Órdenes"]}
                  />
                  <Bar dataKey="ordenes" fill="#c084fc" radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Insight automático */}
          {byWeekday.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(37,99,235,0.05))", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              {(() => {
                const bestDay  = byWeekday.reduce((best, d) => d.ventas  > best.ventas  ? d : best, byWeekday[0]);
                const bestHour = byHour.reduce((best, h)   => h.ordenes  > best.ordenes ? h : best, byHour[0]);
                return (
                  <p className="text-sm text-[#94A3B8]">
                    🔥 Tu mejor día de la semana es{" "}
                    <span className="text-[#c084fc] font-bold">{bestDay.day}</span> con {fmt(bestDay.ventas)} en ventas.
                    El horario pico de órdenes es{" "}
                    <span className="text-[#8b5cf6] font-bold">{bestHour.hora}</span> hs.
                  </p>
                );
              })()}
            </div>
          )}

          {/* Lista de órdenes */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
              <p className="text-sm font-semibold text-[#F1F5F9]">
                Lista de órdenes
                {statusFilter !== "all" && (
                  <span
                    className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                    style={{
                      background: `${STATUS_TABS.find((t) => t.key === statusFilter)?.color ?? "#a78bfa"}15`,
                      color: STATUS_TABS.find((t) => t.key === statusFilter)?.color ?? "#a78bfa",
                    }}
                  >
                    {STATUS_TABS.find((t) => t.key === statusFilter)?.label}
                  </span>
                )}
              </p>
              <span className="text-xs text-[#64748B]">{filtered.length} órdenes</span>
            </div>

            {filtered.slice(0, 150).map((o, i) => {
              const isPaid      = o.payment_status === "paid" || o.status === "closed";
              const isCancelled = o.status === "cancelled" || o.payment_status === "voided" || o.payment_status === "refunded";
              const dotColor    = isPaid ? "#22c55e" : isCancelled ? "#ef4444" : "#f59e0b";
              const statusText  = isPaid ? "Pagada" : isCancelled ? "Cancelada" : "Pendiente";
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[rgba(139,92,246,0.04)] transition-colors"
                  style={{ borderBottom: i < Math.min(filtered.length, 150) - 1 ? "1px solid rgba(139,92,246,0.06)" : "none" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#a78bfa]">#{o.number ?? o.id}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${dotColor}15`, color: dotColor }}
                      >
                        {statusText}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate">
                      {o.customer?.name ?? "Anónimo"}{o.customer?.email ? ` · ${o.customer.email}` : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#F1F5F9]">{fmt(parseFloat(o.total || "0"))}</p>
                    <p className="text-xs text-[#64748B]">
                      {new Date(o.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}

            {filtered.length > 150 && (
              <div className="px-5 py-3 text-center" style={{ borderTop: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-xs text-[#64748B]">
                  Mostrando 150 de {filtered.length} — achicá el rango o filtrá por estado
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

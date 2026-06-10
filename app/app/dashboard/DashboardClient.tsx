"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart, DollarSign, TrendingUp, BarChart2, Target,
  Users, ArrowRight, Brain, Store, Zap, AlertCircle, ChevronDown, Check,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import Link from "next/link";
import InfoTooltip from "@/components/ui/InfoTooltip";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import type { TNOrder } from "@/lib/tiendanube/client";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface DashboardData {
  userName: string;
  isSuperAdmin: boolean;
  tnConnected: boolean;
  storeName: string | null;
  usdRate: number;
  taxRate: number;
  platformFee: number;
  agencyFee: number;
  rawOrders: TNOrder[];
  customerCount: number;
  recurrenteCount: number;
}

type ChartMode = "profit" | "revenue" | "orders";

// ── Monedas ──────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: "ARS", symbol: "$",  label: "Pesos arg." },
  { code: "USD", symbol: "U$", label: "Dólar USA" },
  { code: "EUR", symbol: "€",  label: "Euro" },
  { code: "BRL", symbol: "R$", label: "Real bras." },
  { code: "UYU", symbol: "$U", label: "Peso uru." },
];
const USD_TO_CURRENCY: Record<string, number> = { ARS: 1, USD: 1, EUR: 0.92, BRL: 5.0, UYU: 39 };

// ── Presets ──────────────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { key: "hoy",  label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "7d",   label: "7 días" },
  { key: "30d",  label: "30 días" },
];

const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ── Helpers de fecha ─────────────────────────────────────────────────────────

function getDateRange(preset: string): { from: Date; to: Date } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86_400_000 - 1);

  if (preset === "hoy") {
    return { from: todayStart, to: todayEnd };
  }
  if (preset === "ayer") {
    const d = new Date(todayStart); d.setDate(d.getDate() - 1);
    return { from: d, to: new Date(d.getTime() + 86_400_000 - 1) };
  }
  if (preset === "7d") {
    const d = new Date(todayStart); d.setDate(d.getDate() - 6);
    return { from: d, to: todayEnd };
  }
  if (preset === "30d") {
    const d = new Date(todayStart); d.setDate(d.getDate() - 29);
    return { from: d, to: todayEnd };
  }
  // mes-N: N=0 es este mes, N=1 es el anterior, etc.
  if (preset.startsWith("mes-")) {
    const offset = parseInt(preset.replace("mes-", ""), 10);
    const from = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const to   = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59);
    return { from, to };
  }
  // fallback: hoy
  return { from: todayStart, to: todayEnd };
}

// ── Formateo ─────────────────────────────────────────────────────────────────

function makeFmt(currency: string, usdRate: number, redondeo: boolean) {
  const cur = CURRENCIES.find((c) => c.code === currency);
  const sym = cur?.symbol ?? "$";

  return function fmt(arsAmount: number): string {
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

function calcPct(a: number, b: number): number {
  if (b === 0) return a > 0 ? 100 : 0;
  return ((a - b) / b) * 100;
}

function StatusDot({ status }: { status: string }) {
  const color = status === "paid" ? "#22c55e" : status === "cancelled" ? "#ef4444" : "#f59e0b";
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />;
}

// Mini sparkline para las tarjetas KPI — sin ejes, con gradiente neon
function Sparkline({ data, color, id }: { data: number[]; color: string; id: string }) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-8 -mx-1 mt-1 neon-chart" style={{ opacity: 0.9 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#spark-${id})`} dot={false} animationDuration={1200} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [chartMode, setChartMode] = useState<ChartMode>("profit");
  const [redondeo,  setRedondeo]  = useState(true);
  const [currency,  setCurrency]  = useState("ARS");
  const [modoSimple, setModoSimple] = useState(false);
  const [preset,    setPreset]    = useState("hoy");
  const [showCurr,  setShowCurr]  = useState(false);

  // Leer preferencias guardadas y escuchar cambios globales
  useEffect(() => {
    const r = localStorage.getItem("nova-redondeo");
    if (r !== null) setRedondeo(r === "true");
    const c = localStorage.getItem("nova-currency");
    if (c) setCurrency(c);
    const s = localStorage.getItem("nova-modo-simple");
    if (s !== null) setModoSimple(s === "true");

    function onRedondeo(e: Event) { setRedondeo((e as CustomEvent).detail); }
    function onModo(e: Event)     { setModoSimple((e as CustomEvent).detail === "simple"); }
    window.addEventListener("nova-redondeo-change", onRedondeo);
    window.addEventListener("nova-modo-change", onModo);
    return () => {
      window.removeEventListener("nova-redondeo-change", onRedondeo);
      window.removeEventListener("nova-modo-change", onModo);
    };
  }, []);

  function handleCurrencyChange(code: string) {
    setCurrency(code);
    localStorage.setItem("nova-currency", code);
    window.dispatchEvent(new CustomEvent("nova-currency-change", { detail: code }));
    setShowCurr(false);
  }

  // ── Métricas computadas según preset ────────────────────────────────────────

  const { from, to } = useMemo(() => getDateRange(preset), [preset]);

  const { from: prevFrom, to: prevTo } = useMemo(() => {
    const span = to.getTime() - from.getTime();
    return { from: new Date(from.getTime() - span - 1), to: new Date(from.getTime() - 1) };
  }, [from, to]);

  const paidOrders = useMemo(
    () => data.rawOrders.filter((o) => o.payment_status === "paid" || o.status === "closed"),
    [data.rawOrders]
  );

  function filterRange(orders: TNOrder[], f: Date, t: Date) {
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= f && d <= t;
    });
  }

  const periodOrders = useMemo(() => filterRange(paidOrders, from, to), [paidOrders, from, to]);
  const prevOrders   = useMemo(() => filterRange(paidOrders, prevFrom, prevTo), [paidOrders, prevFrom, prevTo]);

  const { revenue, orders, aov, netRevenue, netProfit, profitPct, cambio } = useMemo(() => {
    const revenue     = periodOrders.reduce((a, o) => a + parseFloat(o.total), 0);
    const orders      = periodOrders.length;
    const aov         = orders > 0 ? revenue / orders : 0;
    // Mismo cálculo que rentabilidad: quitar IVA, luego fee plataforma y fee agencia
    const netRevenue  = revenue / (1 + data.taxRate / 100);
    const netProfit   = netRevenue * (1 - data.platformFee / 100 - (data.agencyFee ?? 0) / 100);
    const profitPct   = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const prevRevenue = prevOrders.reduce((a, o) => a + parseFloat(o.total), 0);
    const cambio      = calcPct(revenue, prevRevenue);
    return { revenue, orders, aov, netRevenue, netProfit, profitPct, cambio };
  }, [periodOrders, prevOrders, data.taxRate, data.platformFee, data.agencyFee]);

  // Chart: últimos 30 días siempre (contexto de tendencia)
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const day = new Date(now); day.setDate(day.getDate() - (29 - i));
      const ds  = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const de  = new Date(ds.getTime() + 86_400_000);
      const dayOrders  = paidOrders.filter((o) => { const d = new Date(o.created_at); return d >= ds && d < de; });
      const dayRevenue = dayOrders.reduce((a, o) => a + parseFloat(o.total), 0);
      const dayProfit  = (dayRevenue / (1 + data.taxRate / 100)) * (1 - data.platformFee / 100 - (data.agencyFee ?? 0) / 100);
      return {
        date: `${String(ds.getDate()).padStart(2,"0")}/${String(ds.getMonth()+1).padStart(2,"0")}`,
        revenue: dayRevenue,
        orders:  dayOrders.length,
        profit:  dayProfit,
      };
    });
  }, [paidOrders, data.taxRate, data.platformFee]);

  // Ventas por día de semana (últimos 30 días)
  const weekdayData = useMemo(() => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const acc = days.map((d) => ({ day: d, revenue: 0, orders: 0 }));
    const cutoff = Date.now() - 30 * 86_400_000;
    for (const o of paidOrders) {
      const d = new Date(o.created_at);
      if (d.getTime() < cutoff) continue;
      const idx = d.getDay();
      acc[idx].revenue += parseFloat(o.total);
      acc[idx].orders += 1;
    }
    // Semana empezando en lunes
    return [...acc.slice(1), acc[0]];
  }, [paidOrders]);

  // Revenue acumulado de los últimos 30 días
  const cumulativeData = useMemo(() => {
    let sum = 0;
    return chartData.map((d) => {
      sum += d.revenue;
      return { date: d.date, acumulado: sum };
    });
  }, [chartData]);

  // Distribución de estados de órdenes (todas las cargadas)
  const statusData = useMemo(() => {
    let paid = 0, pending = 0, cancelled = 0;
    for (const o of data.rawOrders) {
      if (o.payment_status === "paid" || o.status === "closed") paid++;
      else if (o.status === "cancelled") cancelled++;
      else pending++;
    }
    return [
      { name: "Pagadas",    value: paid,      color: "#22c55e" },
      { name: "Pendientes", value: pending,   color: "#f59e0b" },
      { name: "Canceladas", value: cancelled, color: "#ef4444" },
    ].filter((s) => s.value > 0);
  }, [data.rawOrders]);

  const totalStatusOrders = statusData.reduce((a, s) => a + s.value, 0);

  const recentOrders = useMemo(() => data.rawOrders.slice(0, 8).map((o) => ({
    id:             String(o.id),
    number:         String(o.number ?? o.id),
    customer_name:  o.customer?.name ?? "Anónimo",
    customer_email: o.customer?.email ?? null,
    total:          parseFloat(o.total),
    status:         o.payment_status === "paid" || o.status === "closed" ? "paid"
                    : o.status === "cancelled" ? "cancelled"
                    : o.payment_status === "pending" ? "pending" : o.status,
    created_at:     o.created_at,
  })), [data.rawOrders]);

  // ── Formato moneda ───────────────────────────────────────────────────────────

  const fmt  = useMemo(() => makeFmt(currency, data.usdRate, redondeo), [currency, data.usdRate, redondeo]);
  const fmtC = (n: number) => fmt(n);

  const now = new Date();

  // Tabs de meses: últimos 4 meses visibles
  const monthTabs = Array.from({ length: 4 }, (_, i) => {
    const offset = 3 - i;
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { key: `mes-${offset}`, label: MONTHS_ES[d.getMonth()], offset };
  });

  const chartKey   = chartMode === "orders" ? "orders" : chartMode === "profit" ? "profit" : "revenue";
  const chartColor = chartMode === "orders" ? "#c026d3" : chartMode === "profit" ? "#22c55e" : "#8b5cf6";
  const isOrders   = chartMode === "orders";

  const curSymbol  = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "$";

  // ── KPIs ─────────────────────────────────────────────────────────────────────

  const sparkRevenue = chartData.map((d) => d.revenue);
  const sparkOrders  = chartData.map((d) => d.orders);
  const sparkProfit  = chartData.map((d) => d.profit);
  const sparkAov     = chartData.map((d) => (d.orders > 0 ? d.revenue / d.orders : 0));
  const sparkNetRev  = chartData.map((d) => d.revenue / (1 + data.taxRate / 100));
  const sparkPct     = chartData.map((d) => (d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0));

  const TIENDA_METRICS = [
    {
      label: modoSimple ? "Pedidos"         : "Orders",
      rawValue: orders, format: (n: number) => String(Math.round(n)),
      icon: ShoppingCart, color: "#c026d3", spark: sparkOrders,
      tip: "Cantidad total de órdenes pagas en el período seleccionado.",
      tipSimple: "Cuántos pedidos te hicieron en total.",
    },
    {
      label: modoSimple ? "Ventas"          : "Revenue",
      rawValue: revenue, format: fmtC,
      icon: DollarSign,  color: "#8b5cf6", spark: sparkRevenue,
      tip: "Facturación bruta de las órdenes pagas (antes de impuestos y comisiones).",
      tipSimple: "Plata total que entró por tus ventas.",
    },
    {
      label: modoSimple ? "Ticket promedio" : "AOV",
      rawValue: aov, format: fmtC,
      icon: TrendingUp,  color: "#a78bfa", spark: sparkAov,
      tip: "Revenue ÷ órdenes. Cuánto gasta un cliente por compra.",
      tipSimple: "Cuánto te gasta en promedio cada cliente.",
    },
    {
      label: modoSimple ? "Ganancia neta"   : "Net Profit",
      rawValue: netProfit, format: fmtC,
      icon: BarChart2,   color: "#22c55e", spark: sparkProfit,
      tip: "Ingresos sin IVA, descontando fee de plataforma y fee de agencia (según tu configuración de rentabilidad).",
      tipSimple: "La plata real que te queda después de pagar impuestos, la plataforma y la agencia.",
    },
    {
      label: modoSimple ? "% Ganancia"      : "Profit %",
      rawValue: profitPct, format: (n: number) => `${n.toFixed(1)}%`,
      icon: Target,      color: "#f59e0b", spark: sparkPct,
      tip: "Net Profit ÷ Revenue × 100. Margen porcentual sobre tu facturación.",
      tipSimple: "Qué porcentaje de tus ventas se convierte en ganancia.",
    },
    {
      label: modoSimple ? "Sin impuestos"   : "Net Rev.",
      rawValue: netRevenue, format: fmtC,
      icon: DollarSign,  color: "#c084fc", spark: sparkNetRev,
      tip: "Revenue ÷ (1 + IVA). Tu facturación sin impuestos.",
      tipSimple: "Lo que ganaste sin contar el IVA.",
    },
  ];

  const ANUNCIOS_METRICS = [
    { label: modoSimple ? "Inversión Ads" : "Ad Spend",  value: "—", icon: DollarSign, color: "#1877F2",
      tip: "Cuánto gastaste en publicidad de Meta en el período.", tipSimple: "Plata invertida en publicidad de Facebook e Instagram." },
    { label: "MER",       value: "—", icon: BarChart2,  color: "#22c55e",
      tip: "Marketing Efficiency Ratio: Revenue ÷ Ad Spend.", tipSimple: "Cuántas veces te volvió la plata invertida en publicidad." },
    { label: "ROAS",      value: "—", icon: TrendingUp, color: "#a78bfa",
      tip: "Return on Ad Spend: Revenue atribuible a ads ÷ Ad Spend.", tipSimple: "Por cada peso en ads, cuántos te vuelven en ventas." },
    { label: modoSimple ? "Costo x venta" : "CPA", value: "—", icon: Target, color: "#f59e0b",
      tip: "Cost Per Acquisition: Ad Spend ÷ órdenes de ads.", tipSimple: "Cuánto te cuesta conseguir un cliente nuevo desde los anuncios." },
    { label: "Net AOV",   value: "—", icon: DollarSign, color: "#c084fc",
      tip: "Ticket promedio neto de ventas que vinieron de ads.", tipSimple: "Ticket promedio real de clientes que vienen por publicidad." },
    { label: "True CPA",  value: "—", icon: Zap,        color: "#c026d3",
      tip: "CPA ajustado a Net Profit.", tipSimple: "El costo real de cada cliente nuevo considerando la ganancia que deja." },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-screen-2xl">

      {/* Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              Buen día, {data.userName.split(" ")[0]} 👋
            </h2>
            {data.isSuperAdmin && (
              <a href="/admin/hq"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                ⚡ Nova HQ
              </a>
            )}
          </div>
          <p className="text-sm text-[#94A3B8] mt-1">
            {data.tnConnected
              ? <span className="flex items-center gap-1.5 text-[#22c55e] text-sm"><span className="live-dot" />{data.storeName ?? "TiendaNube"} · tiempo real</span>
              : <a href="/app/configuracion/integraciones" className="text-yellow-400 hover:underline">⚠ TiendaNube no conectado</a>}
          </p>
        </div>

        {/* Controles ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Selector moneda */}
          <div className="relative">
            <button
              onClick={() => setShowCurr(!showCurr)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.25)", color: "#F1F5F9" }}
            >
              {curSymbol} {currency} <ChevronDown size={13} color="#64748B" />
            </button>
            {showCurr && (
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-xl py-1 min-w-[140px]"
                style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              >
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleCurrencyChange(c.code)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all hover:bg-[rgba(139,92,246,0.08)] text-left"
                    style={{ color: currency === c.code ? "#a78bfa" : "#CBD5E1" }}
                  >
                    <span className="w-5 font-bold">{c.symbol}</span>
                    <span>{c.label}</span>
                    {currency === c.code && <Check size={12} className="ml-auto" color="#a78bfa" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Presets fecha */}
          <div className="flex items-center gap-0.5 rounded-xl p-1 flex-wrap"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
            {DATE_PRESETS.map(({ key, label }) => {
              const active = preset === key;
              return (
                <button key={key} onClick={() => setPreset(key)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{ background: active ? "#8b5cf6" : "transparent", color: active ? "white" : "#94A3B8" }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tabs de meses */}
          <div className="hidden md:flex items-center gap-0.5 rounded-xl p-1"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
            {monthTabs.map(({ key, label }) => {
              const active = preset === key;
              return (
                <button key={key} onClick={() => setPreset(key)}
                  className="rounded-lg px-3 py-1.5 text-xs transition-all"
                  style={{ fontWeight: active ? 700 : 400, color: active ? "white" : "#94A3B8", background: active ? "#8b5cf6" : "transparent" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Badge de cambio vs período anterior */}
      {cambio !== 0 && orders > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: cambio > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: cambio > 0 ? "#22c55e" : "#ef4444" }}>
            {cambio > 0 ? "↑" : "↓"} {Math.abs(cambio).toFixed(1)}% vs período anterior
          </span>
        </div>
      )}

      {/* TIENDA ─────────────────────────────────────────────────────────────── */}
      <div className="anim-up rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: "0.05s" }}>
        <div className="flex items-center gap-2 px-5 py-3"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.12)", background: "rgba(139,92,246,0.04)" }}>
          <Store size={14} color="#8b5cf6" strokeWidth={2.5} />
          <p className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase">Tienda</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 divide-x-0 sm:divide-x" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
          {TIENDA_METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="metric-card p-3 sm:p-4 flex flex-col gap-1 anim-up"
                style={{ borderBottom: i < TIENDA_METRICS.length - 2 ? "1px solid rgba(139,92,246,0.1)" : undefined, animationDelay: `${0.08 + i * 0.06}s` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] text-[#64748B] font-medium">{m.label}</p>
                    <InfoTooltip text={m.tip} simpleText={m.tipSimple} size={11} />
                  </div>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center anim-scale" style={{ background: `${m.color}15`, animationDelay: `${0.15 + i * 0.06}s` }}>
                    <Icon size={11} color={m.color} strokeWidth={2} />
                  </div>
                </div>
                <AnimatedNumber value={m.rawValue} format={m.format} duration={900} className="text-xl font-black text-[#F1F5F9] leading-none" />
                <Sparkline data={m.spark} color={m.color} id={`m${i}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ANUNCIOS ───────────────────────────────────────────────────────────── */}
      <div className="anim-up rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.15)", animationDelay: "0.18s" }}>
        <div className="flex items-center gap-2 px-5 py-3"
          style={{ borderBottom: "1px solid rgba(24,119,242,0.1)", background: "rgba(24,119,242,0.04)" }}>
          <Target size={14} color="#1877F2" strokeWidth={2.5} />
          <p className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase">Anuncios</p>
          <div className="flex items-center gap-1.5 ml-auto">
            <AlertCircle size={11} color="#64748B" strokeWidth={2} />
            <span className="text-[11px] text-[#64748B]">Conectá Meta Ads para ver datos reales</span>
            <Link href="/app/configuracion/integraciones" className="text-[11px] font-semibold hover:underline" style={{ color: "#1877F2" }}>
              Conectar →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {ANUNCIOS_METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="p-3 sm:p-4 flex flex-col gap-1"
                style={{ borderRight: i < ANUNCIOS_METRICS.length - 1 ? "1px solid rgba(24,119,242,0.08)" : "none" }}>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#64748B] font-medium">{m.label}</p>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${m.color}12` }}>
                    <Icon size={11} color={m.color} strokeWidth={2} />
                  </div>
                </div>
                <p className="text-xl font-black text-[#475569] leading-none">{m.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRÁFICO últimos 30 días ─────────────────────────────────────────────── */}
      <div className="anim-up rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.25s" }}>
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Últimos 30 días</p>
          <div className="flex items-center gap-0.5 rounded-lg p-1"
            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
            {(["profit","revenue","orders"] as ChartMode[]).map((mode) => {
              const labels = { profit: "Profit", revenue: "Revenue", orders: "Orders" };
              const active = chartMode === mode;
              return (
                <button key={mode} onClick={() => setChartMode(mode)}
                  className="rounded-md px-3 py-1 text-xs font-semibold transition-all"
                  style={{ background: active ? "#8b5cf6" : "transparent", color: active ? "white" : "#64748B" }}>
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            {isOrders ? (
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#F1F5F9" }}
                  cursor={{ fill: "rgba(139,92,246,0.05)" }} />
                <Bar dataKey="orders" fill={chartColor} radius={[3,3,0,0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={42}
                  tickFormatter={(v) => redondeo ? `${curSymbol}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}` : `${curSymbol}${v}`} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#F1F5F9" }}
                  formatter={(v) => [fmt(Number(v)), chartMode === "profit" ? "Profit" : "Revenue"]} />
                <Area type="monotone" dataKey={chartKey} stroke={chartColor} strokeWidth={2}
                  fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: chartColor }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICOS secundarios ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Ventas por día de semana */}
        <div className="anim-up metric-card rounded-2xl overflow-hidden neon-chart-fuchsia"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.28s" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Ventas por día de semana</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Últimos 30 días</p>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={weekdayData} margin={{ top: 8, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weekdayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#d946ef" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={38}
                  tickFormatter={(v) => `${curSymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(217,70,239,0.3)", borderRadius: "10px", color: "#F1F5F9" }}
                  cursor={{ fill: "rgba(139,92,246,0.05)" }}
                  formatter={(v) => [fmt(Number(v)), "Ventas"]} />
                <Bar dataKey="revenue" fill="url(#weekdayGrad)" radius={[4, 4, 0, 0]} animationDuration={1100} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acumulado 30 días */}
        <div className="anim-up metric-card rounded-2xl overflow-hidden neon-chart"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.34s" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Revenue acumulado</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Suma progresiva · 30 días</p>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={cumulativeData} margin={{ top: 8, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={42}
                  tickFormatter={(v) => `${curSymbol}${v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "10px", color: "#F1F5F9" }}
                  formatter={(v) => [fmt(Number(v)), "Acumulado"]} />
                <Area type="monotone" dataKey="acumulado" stroke="#a855f7" strokeWidth={2}
                  fill="url(#cumGrad)" dot={false} activeDot={{ r: 4, fill: "#c084fc" }} animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado de órdenes (dona) */}
        <div className="anim-up metric-card rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.40s" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Estado de órdenes</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">{totalStatusOrders} órdenes cargadas</p>
          </div>
          <div className="p-3 flex items-center gap-4">
            <div className="relative" style={{ width: 150, height: 150, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name"
                    innerRadius={48} outerRadius={68} paddingAngle={3}
                    stroke="none" animationDuration={1200}>
                    {statusData.map((s) => (
                      <Cell key={s.name} fill={s.color}
                        style={{ filter: `drop-shadow(0 0 5px ${s.color}66)` }} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#F1F5F9" }}
                    formatter={(v, n) => [`${v} órdenes`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-black text-[#F1F5F9] leading-none">{totalStatusOrders}</p>
                <p className="text-[9px] text-[#64748B] uppercase tracking-widest mt-0.5">total</p>
              </div>
            </div>
            <div className="flex-1 space-y-2.5 min-w-0">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                  <span className="text-xs text-[#94A3B8] flex-1 truncate">{s.name}</span>
                  <span className="text-xs font-bold text-[#F1F5F9]">
                    {totalStatusOrders > 0 ? `${((s.value / totalStatusOrders) * 100).toFixed(0)}%` : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insight IA ─────────────────────────────────────────────────────────── */}
      <div className="anim-up flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-2xl p-4 sm:p-5"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(37,99,235,0.05))", border: "1px solid rgba(139,92,246,0.25)", animationDelay: "0.32s" }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(139,92,246,0.15)" }}>
            <Brain size={20} color="#a78bfa" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#F1F5F9] text-sm mb-1">Insight IA del día</p>
            <p className="text-sm text-[#94A3B8]">
              {data.tnConnected
                ? `${preset === "hoy" ? "Hoy llevás" : "En el período seleccionado:"} ${fmtC(revenue)} en ${orders} orden${orders !== 1 ? "es" : ""}. Ticket promedio: ${fmtC(aov)}. Margen neto: ${profitPct.toFixed(1)}%.`
                : "Conectá TiendaNube para recibir insights de IA basados en tus datos reales de ventas."}
            </p>
          </div>
        </div>
        <Link href="/app/ia"
          className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ color: "#a78bfa", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
          Ver análisis <ArrowRight size={14} />
        </Link>
      </div>

      {/* Últimas órdenes + Clientes ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {recentOrders.length > 0 && (
          <div className="anim-up xl:col-span-2 rounded-2xl overflow-hidden"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.38s" }}>
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
              <p className="text-sm font-semibold text-[#F1F5F9]">Últimas órdenes</p>
              <Link href="/app/ordenes" className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">Ver todas →</Link>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(139,92,246,0.07)" }}>
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-2.5">
                  <StatusDot status={o.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#CBD5E1] truncate">{o.customer_name}</p>
                    <p className="text-xs text-[#64748B]">#{o.number}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#F1F5F9]">{fmtC(o.total)}</p>
                    <p className="text-xs text-[#64748B]">
                      {new Date(o.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Clientes</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Recurrentes", value: data.recurrenteCount, color: "#22c55e" },
              { label: "Nuevos",      value: data.customerCount - data.recurrenteCount, color: "#8b5cf6" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.color}12` }}>
                  <Users size={15} color={c.color} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#64748B]">{c.label}</p>
                  <p className="text-2xl font-black text-[#F1F5F9] leading-none">{c.value}</p>
                </div>
              </div>
            ))}
            <Link href="/app/clientes"
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-[#a78bfa]"
              style={{ color: "#8b5cf6" }}>
              Ver todos los clientes <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

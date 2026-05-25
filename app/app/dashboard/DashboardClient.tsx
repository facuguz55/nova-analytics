"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart, DollarSign, TrendingUp, BarChart2, Target,
  Users, ArrowRight, Brain, Store, Zap, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import InfoTooltip from "@/components/ui/InfoTooltip";

type ChartPoint = { date: string; revenue: number; orders: number; profit: number };
type Order = {
  id: string; number: string; customer_name: string; customer_email: string | null;
  total: number; status: string; created_at: string;
};

interface DashboardData {
  userName: string; isSuperAdmin: boolean; tnConnected: boolean; storeName: string | null;
  usdRate: number;
  revenue: number; orders: number; aov: number; netRevenue: number; netProfit: number;
  profitPct: number; cambioMes: number;
  recurrentes: number; nuevos: number;
  chartData: ChartPoint[]; recentOrders: Order[];
}

type ChartMode = "profit" | "revenue" | "orders";

function fmt(n: number, redondeo: boolean, currency = "ARS") {
  if (redondeo) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
    return `$${Math.round(n)}`;
  }
  // Sin redondeo: número completo con separadores
  const cur = currency === "USD" ? "USD" : "ARS";
  return formatCurrency(n, cur as "ARS" | "USD");
}

function StatusDot({ status }: { status: string }) {
  const color = status === "paid" ? "#22c55e" : status === "cancelled" ? "#ef4444" : "#f59e0b";
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [chartMode, setChartMode] = useState<ChartMode>("profit");
  const [redondeo, setRedondeo] = useState(true);
  const [currency, setCurrency] = useState("ARS");
  const [modoSimple, setModoSimple] = useState(false);

  useEffect(() => {
    const r = localStorage.getItem("nova-redondeo");
    if (r !== null) setRedondeo(r === "true");
    const c = localStorage.getItem("nova-currency");
    if (c) setCurrency(c);
    const s = localStorage.getItem("nova-modo-simple");
    if (s !== null) setModoSimple(s === "true");

    function onRedondeo(e: Event) { setRedondeo((e as CustomEvent).detail); }
    function onCurrency(e: Event) { setCurrency((e as CustomEvent).detail); }
    function onModo(e: Event)     { setModoSimple((e as CustomEvent).detail === "simple"); }
    window.addEventListener("nova-redondeo-change", onRedondeo);
    window.addEventListener("nova-currency-change", onCurrency);
    window.addEventListener("nova-modo-change", onModo);
    return () => {
      window.removeEventListener("nova-redondeo-change", onRedondeo);
      window.removeEventListener("nova-currency-change", onCurrency);
      window.removeEventListener("nova-modo-change", onModo);
    };
  }, []);

  // Conversión de moneda
  const rate = currency === "ARS" ? 1 : currency === "USD" ? 1 / data.usdRate : 1 / data.usdRate;
  function convert(n: number) { return n * rate; }
  function fmtC(n: number)    { return fmt(convert(n), redondeo, currency); }

  const now = new Date();
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Chart data según modo
  const chartKey   = chartMode === "orders" ? "orders" : chartMode === "profit" ? "profit" : "revenue";
  const chartColor = chartMode === "orders" ? "#2563EB" : chartMode === "profit" ? "#22c55e" : "#7C3AED";
  const isOrders   = chartMode === "orders";

  // Métricas Tienda con labels dual (Pro/Simple) y tooltips explicativos
  const TIENDA_METRICS = [
    {
      label: modoSimple ? "Pedidos"          : "Orders",
      value: String(data.orders),
      icon: ShoppingCart, color: "#2563EB",
      tip:  "Cantidad total de órdenes recibidas en este período (incluye pagadas, pendientes y canceladas).",
      tipSimple: "Cuántos pedidos te hicieron en total este mes.",
    },
    {
      label: modoSimple ? "Ventas"           : "Revenue",
      value: fmtC(data.revenue),
      icon: DollarSign,  color: "#7C3AED",
      tip:  "Facturación bruta de las órdenes pagas (incluye impuestos y antes de comisiones).",
      tipSimple: "Plata total que entró por tus ventas, antes de descontar impuestos.",
    },
    {
      label: modoSimple ? "Ticket promedio"  : "AOV",
      value: fmtC(data.aov),
      icon: TrendingUp,  color: "#8B5CF6",
      tip:  "Average Order Value: Revenue ÷ cantidad de órdenes pagas. Indica cuánto gasta un cliente por compra.",
      tipSimple: "Cuánto te gasta en promedio cada cliente en una compra.",
    },
    {
      label: modoSimple ? "Ganancia neta"    : "Net Profit",
      value: fmtC(data.netProfit),
      icon: BarChart2,   color: "#22c55e",
      tip:  "Net Revenue × (1 − fee de plataforma). Lo que te queda después de impuestos y comisiones de la plataforma.",
      tipSimple: "La plata real que te queda después de pagar impuestos y comisiones.",
    },
    {
      label: modoSimple ? "% Ganancia"       : "Profit %",
      value: `${data.profitPct.toFixed(1)}%`,
      icon: Target,      color: "#f59e0b",
      tip:  "Net Profit ÷ Revenue × 100. Margen porcentual sobre tu facturación bruta.",
      tipSimple: "Qué porcentaje de tus ventas se convierte en ganancia real.",
    },
    {
      label: modoSimple ? "Sin impuestos"    : "Net Rev.",
      value: fmtC(data.netRevenue),
      icon: DollarSign,  color: "#e1691e",
      tip:  "Net Revenue: Revenue ÷ (1 + IVA). Tu facturación sin impuestos.",
      tipSimple: "Lo que ganaste sin contar el IVA que tenés que pagar.",
    },
  ];

  // Métricas Anuncios
  const ANUNCIOS_METRICS = [
    {
      label: modoSimple ? "Inversión Ads" : "Ad Spend",
      value: "—", icon: DollarSign,  color: "#1877F2",
      tip:  "Cuánto gastaste en publicidad de Meta (Facebook + Instagram) en el período.",
      tipSimple: "Plata que invertiste en publicidad de Facebook e Instagram.",
    },
    {
      label: "MER", value: "—", icon: BarChart2,   color: "#22c55e",
      tip:  "Marketing Efficiency Ratio: Revenue total ÷ Ad Spend total. Mide cuánto vendiste por cada peso invertido en ads.",
      tipSimple: "Cuántas veces te volvió la plata que invertiste en publicidad.",
    },
    {
      label: "ROAS", value: "—", icon: TrendingUp,  color: "#8B5CF6",
      tip:  "Return on Ad Spend: Revenue atribuible a ads ÷ Ad Spend. Diferencia con MER: solo cuenta ventas que vinieron de los ads.",
      tipSimple: "Por cada peso que invertís en ads, cuántos pesos te vuelven en ventas atribuibles.",
    },
    {
      label: modoSimple ? "Costo x venta" : "CPA",
      value: "—", icon: Target,      color: "#f59e0b",
      tip:  "Cost Per Acquisition: Ad Spend ÷ órdenes generadas por ads.",
      tipSimple: "Cuánto te cuesta conseguir un cliente nuevo desde los anuncios.",
    },
    {
      label: "Net AOV", value: "—", icon: DollarSign,  color: "#e1691e",
      tip:  "Ticket promedio neto de las ventas que vinieron de ads (sin impuestos ni comisiones).",
      tipSimple: "Ticket promedio real de los clientes que vienen por publicidad.",
    },
    {
      label: "True CPA", value: "—", icon: Zap,         color: "#2563EB",
      tip:  "CPA ajustado a Net Profit: cuánto cuesta un cliente nuevo en relación a la ganancia neta que deja.",
      tipSimple: "El costo real de cada cliente nuevo, considerando lo que te deja de ganancia.",
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              Buen día, {data.userName.split(" ")[0]} 👋
            </h2>
            {data.isSuperAdmin && (
              <a href="/admin/hq" className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                ⚡ Nova HQ
              </a>
            )}
          </div>
          <p className="text-sm text-[#94A3B8] mt-1">
            {data.tnConnected
              ? <span className="text-green-400">● {data.storeName ?? "TiendaNube"} conectado</span>
              : <a href="/app/configuracion/integraciones" className="text-yellow-400 hover:underline">⚠ TiendaNube no conectado</a>
            }
          </p>
        </div>

        {/* Selector mes */}
        <div className="hidden md:flex items-center gap-0.5 rounded-xl p-1"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          {months.slice(0, now.getMonth() + 1).slice(-6).map((m) => {
            const active = m === months[now.getMonth()];
            return (
              <button key={m} className="rounded-lg px-3 py-1.5 text-sm transition-all"
                style={{ fontWeight: active ? 700 : 400, color: active ? "white" : "#94A3B8", background: active ? "#7C3AED" : "transparent", cursor: "default" }}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* TIENDA */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)", background: "rgba(124,58,237,0.04)" }}>
          <Store size={14} color="#7C3AED" strokeWidth={2.5} />
          <p className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase">Tienda</p>
          {data.cambioMes !== 0 && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: data.cambioMes > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: data.cambioMes > 0 ? "#22c55e" : "#ef4444" }}>
              {data.cambioMes > 0 ? "+" : ""}{data.cambioMes.toFixed(1)}% vs mes anterior
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {TIENDA_METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={m.label}
                className="p-4 flex flex-col gap-1"
                style={{ borderRight: i < TIENDA_METRICS.length - 1 ? "1px solid rgba(124,58,237,0.1)" : "none" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] text-[#64748B] font-medium">{m.label}</p>
                    <InfoTooltip text={m.tip} simpleText={m.tipSimple} size={11} />
                  </div>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15` }}>
                    <Icon size={11} color={m.color} strokeWidth={2} />
                  </div>
                </div>
                <p className="text-xl font-black text-[#F1F5F9] leading-none">{m.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ANUNCIOS */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.15)" }}>
        <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(24,119,242,0.1)", background: "rgba(24,119,242,0.04)" }}>
          <Target size={14} color="#1877F2" strokeWidth={2.5} />
          <p className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase">Anuncios</p>
          <div className="flex items-center gap-1.5 ml-auto">
            <AlertCircle size={11} color="#64748B" strokeWidth={2} />
            <span className="text-[11px] text-[#64748B]">Conectá Meta Ads para ver datos reales</span>
            <Link href="/app/configuracion/integraciones"
              className="text-[11px] font-semibold hover:underline" style={{ color: "#1877F2" }}>
              Conectar →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {ANUNCIOS_METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={m.label}
                className="p-4 flex flex-col gap-1"
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

      {/* Gráfico con toggle */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Últimos 30 días</p>

          {/* Toggle chart mode */}
          <div className="flex items-center gap-0.5 rounded-lg p-1"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            {(["profit","revenue","orders"] as ChartMode[]).map((mode) => {
              const labels = { profit: "Profit", revenue: "Revenue", orders: "Orders" };
              const active = chartMode === mode;
              return (
                <button key={mode} onClick={() => setChartMode(mode)}
                  className="rounded-md px-3 py-1 text-xs font-semibold transition-all"
                  style={{ background: active ? "#7C3AED" : "transparent", color: active ? "white" : "#64748B" }}>
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            {isOrders ? (
              <BarChart data={data.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.07)" />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "10px", color: "#F1F5F9" }}
                  cursor={{ fill: "rgba(124,58,237,0.05)" }} />
                <Bar dataKey="orders" fill={chartColor} radius={[3,3,0,0]} />
              </BarChart>
            ) : (
              <AreaChart data={data.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.07)" />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={42}
                  tickFormatter={(v) => redondeo ? `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}` : `$${v}`} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "10px", color: "#F1F5F9" }}
                  formatter={(v) => [fmt(Number(v) * rate, redondeo), chartMode === "profit" ? "Profit" : "Revenue"]} />
                <Area type="monotone" dataKey={chartKey} stroke={chartColor} strokeWidth={2}
                  fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: chartColor }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight IA */}
      <div className="flex items-center gap-4 rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.05))", border: "1px solid rgba(124,58,237,0.25)" }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.15)" }}>
          <Brain size={20} color="#8B5CF6" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[#F1F5F9] text-sm mb-1">Insight IA del día</p>
          <p className="text-sm text-[#94A3B8]">
            {data.tnConnected
              ? `Tus ventas del mes son ${fmtC(data.revenue)} con ${data.orders} órdenes. Ticket promedio: ${fmtC(data.aov)}. Margen neto estimado: ${data.profitPct.toFixed(1)}%.`
              : "Conectá TiendaNube para recibir insights de IA basados en tus datos reales de ventas."}
          </p>
        </div>
        <Link href="/app/ia"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ color: "#8B5CF6", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
          Ver análisis <ArrowRight size={14} />
        </Link>
      </div>

      {/* Órdenes recientes + Clientes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Órdenes recientes — 2/3 */}
        {data.recentOrders.length > 0 && (
          <div className="xl:col-span-2 rounded-2xl overflow-hidden"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
              <p className="text-sm font-semibold text-[#F1F5F9]">Últimas órdenes</p>
              <Link href="/app/ordenes" className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">Ver todas →</Link>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.07)" }}>
              {data.recentOrders.map((o) => (
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

        {/* Clientes — 1/3 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Clientes</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Recurrentes", value: data.recurrentes, color: "#22c55e", icon: Users },
              { label: "Nuevos",      value: data.nuevos,      color: "#7C3AED", icon: Users },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.color}12` }}>
                    <Icon size={15} color={c.color} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#64748B]">{c.label}</p>
                    <p className="text-2xl font-black text-[#F1F5F9] leading-none">{c.value}</p>
                  </div>
                </div>
              );
            })}
            <Link href="/app/clientes"
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-[#8B5CF6]"
              style={{ color: "#7C3AED" }}>
              Ver todos los clientes <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

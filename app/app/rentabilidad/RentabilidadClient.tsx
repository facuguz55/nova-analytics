"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, DollarSign, Percent, Store, ArrowRight, AlertTriangle,
  ChevronDown, HelpCircle, Package, Coins, Receipt,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import Link from "next/link";
import type { TNOrder, TNProduct } from "@/lib/tiendanube/client";

interface FinConfig {
  tax_rate: number;
  platform_fee: number;
  custom_commission: number;
  usd_rate: number;
}

export interface LocalSalesData {
  linked: boolean;
  sales: { id: string; total: number; created_at: string; medio_pago: string }[];
  products: { id: string; name: string; cost: number; price: number }[];
  costs: { fixedMonthly: number; variablePct: number };
}

interface Props {
  connected: boolean;
  rawOrders: TNOrder[];
  products: TNProduct[];
  cfg: FinConfig;
  avgShippingCost: number;
  totalFixedMonthly: number;
  totalVariablePct: number;
  localData?: LocalSalesData | null;
}

const DATE_PRESETS = [
  { key: "hoy",  label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "7d",   label: "7 días" },
  { key: "30d",  label: "30 días" },
];

const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getDateRange(preset: string): { from: Date; to: Date } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86_400_000 - 1);

  if (preset === "hoy")  return { from: todayStart, to: todayEnd };
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
  if (preset.startsWith("mes-")) {
    const offset = parseInt(preset.replace("mes-", ""), 10);
    const from = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const to   = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59);
    return { from, to };
  }
  return { from: todayStart, to: todayEnd };
}

function prodName(p: TNProduct): string {
  return typeof p.name === "string" ? p.name : (p.name?.es ?? "Producto");
}

export default function RentabilidadClient({ connected, rawOrders, products, cfg, avgShippingCost, totalFixedMonthly, totalVariablePct, localData }: Props) {
  const [preset, setPreset] = useState("30d");
  const [showHow, setShowHow] = useState(false);

  const now = new Date();
  const monthTabs = [0, 1, 2].map((offset) => ({
    key: `mes-${offset}`,
    label: MONTHS_ES[new Date(now.getFullYear(), now.getMonth() - offset, 1).getMonth()],
  }));

  // product_id → { costo promedio, nombre }
  const productMap = useMemo(() => {
    const map = new Map<number, { cost: number; name: string }>();
    for (const p of products) {
      const variants = p.variants.filter((v) => parseFloat(v.cost ?? "0") > 0);
      const avg = variants.length
        ? variants.reduce((acc, v) => acc + parseFloat(v.cost ?? "0"), 0) / variants.length
        : 0;
      map.set(p.id, { cost: avg, name: prodName(p) });
    }
    return map;
  }, [products]);

  const { from, to } = useMemo(() => getDateRange(preset), [preset]);

  const paidOrders = useMemo(
    () => rawOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= from && d <= to && (o.payment_status === "paid" || o.status === "closed");
    }),
    [rawOrders, from, to]
  );

  const m = useMemo(() => {
    const totalRevenue = paidOrders.reduce((acc, o) => acc + parseFloat(o.total), 0);
    const taxFactor = 1 + cfg.tax_rate / 100;
    const revenuePreTax = totalRevenue / taxFactor;
    const taxAmount = totalRevenue - revenuePreTax;
    const platformFeeAmount = revenuePreTax * (cfg.platform_fee / 100);
    const extraFeeAmount = revenuePreTax * ((cfg.custom_commission ?? 0) / 100);

    const netRevenue = revenuePreTax - platformFeeAmount - extraFeeAmount;

    let cogs = 0, noCostCount = 0;
    for (const order of paidOrders) {
      for (const item of order.products) {
        const info = productMap.get(item.product_id);
        if (info && info.cost > 0) cogs += info.cost * item.quantity;
        else noCostCount++;
      }
    }

    const totalShippingCost = avgShippingCost * paidOrders.length;

    const periodDays = Math.max(Math.ceil((to.getTime() - from.getTime()) / 86_400_000), 1);
    const fixedCostsAmount = totalFixedMonthly * (periodDays / 30);
    const variableCostsAmount = revenuePreTax * (totalVariablePct / 100);
    const additionalCostsAmount = fixedCostsAmount + variableCostsAmount;

    const netProfit = netRevenue - cogs - totalShippingCost - additionalCostsAmount;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue, revenuePreTax, taxAmount, platformFeeAmount, extraFeeAmount,
      netRevenue, cogs, totalShippingCost, fixedCostsAmount, variableCostsAmount, additionalCostsAmount,
      netProfit, netMarginPct,
      ordersCount: paidOrders.length, noCostCount,
    };
  }, [paidOrders, productMap, cfg, from, to, totalFixedMonthly, totalVariablePct]);

  // Ganancia diaria dentro del período (para el área)
  const dailyProfit = useMemo(() => {
    const dayMs = 86_400_000;
    const spanDays = Math.min(Math.max(Math.ceil((to.getTime() - from.getTime()) / dayMs), 1), 60);
    const start = new Date(to.getTime() - (spanDays - 1) * dayMs);
    const base = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const arr = Array.from({ length: spanDays }, (_, i) => {
      const d = new Date(base.getTime() + i * dayMs);
      return { date: `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`, ganancia: 0, ts: d.getTime() };
    });
    const taxFactor = 1 + cfg.tax_rate / 100;
    const feeFactor = 1 - cfg.platform_fee / 100 - (cfg.custom_commission ?? 0) / 100 - totalVariablePct / 100;
    const fixedCostPerDay = totalFixedMonthly / 30;
    for (const o of paidOrders) {
      const t = new Date(o.created_at).getTime();
      const idx = Math.floor((t - base.getTime()) / dayMs);
      if (idx < 0 || idx >= arr.length) continue;
      let cogs = 0;
      for (const item of o.products) {
        const info = productMap.get(item.product_id);
        if (info && info.cost > 0) cogs += info.cost * item.quantity;
      }
      arr[idx].ganancia += (parseFloat(o.total) / taxFactor) * feeFactor - cogs - avgShippingCost;
    }
    for (const day of arr) day.ganancia -= fixedCostPerDay;
    return arr;
  }, [paidOrders, productMap, cfg, from, to, totalFixedMonthly, totalVariablePct]);

  // Top productos por ganancia
  const topProducts = useMemo(() => {
    const agg = new Map<number, { name: string; units: number; revenue: number; cost: number }>();
    for (const o of paidOrders) {
      for (const item of o.products) {
        const info = productMap.get(item.product_id);
        const name = info?.name ?? item.name ?? "Producto";
        const cur = agg.get(item.product_id) ?? { name, units: 0, revenue: 0, cost: 0 };
        cur.units += item.quantity;
        cur.revenue += parseFloat(item.price) * item.quantity;
        cur.cost += (info?.cost ?? 0) * item.quantity;
        agg.set(item.product_id, cur);
      }
    }
    return Array.from(agg.values())
      .map((p) => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0 }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [paidOrders, productMap]);

  // Composición: a dónde va cada peso de la venta bruta
  const donutData = useMemo(() => [
    { name: "Ganancia neta",   value: Math.max(m.netProfit, 0),              color: "#22c55e" },
    { name: "Costo productos", value: m.cogs,                                 color: "#c026d3" },
    { name: "Costo envíos",    value: m.totalShippingCost,                    color: "#22d3ee" },
    { name: "Costos adicionales", value: m.additionalCostsAmount,             color: "#f472b6" },
    { name: `IVA ${cfg.tax_rate}%`, value: m.taxAmount,                       color: "#f59e0b" },
    { name: "Comisiones",      value: m.platformFeeAmount + m.extraFeeAmount, color: "#8b5cf6" },
  ].filter((d) => d.value > 0), [m, cfg.tax_rate]);

  const waterfall = [
    { label: "Ingresos brutos", value: m.totalRevenue, kind: "in" as const },
    { label: `IVA (${cfg.tax_rate}%)`, value: -m.taxAmount, kind: "out" as const },
    { label: `Comisión plataforma (${cfg.platform_fee}%)`, value: -m.platformFeeAmount, kind: "out" as const },
    ...((cfg.custom_commission ?? 0) > 0 ? [{ label: `Comisión extra (${cfg.custom_commission}%)`, value: -m.extraFeeAmount, kind: "out" as const }] : []),
    ...(m.cogs > 0 ? [{ label: "Costo de productos", value: -m.cogs, kind: "out" as const }] : []),
    ...(m.totalShippingCost > 0 ? [{ label: "Costo de envíos", value: -m.totalShippingCost, kind: "out" as const }] : []),
    ...(m.additionalCostsAmount > 0 ? [{ label: "Costos adicionales (fijos + variables)", value: -m.additionalCostsAmount, kind: "out" as const }] : []),
    { label: "Ganancia neta", value: m.netProfit, kind: "total" as const },
  ];

  if (!connected) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Rentabilidad</h1>
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(139,92,246,0.3)" }}>
          <Store size={40} color="#8b5cf6" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conectá tu TiendaNube</p>
          <p className="text-sm text-[#94A3B8] mb-3">Necesitamos tus ventas y costos para calcular la rentabilidad.</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#8b5cf6", boxShadow: "0 0 16px rgba(139,92,246,0.4)" }}>
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const fmt = formatCurrency;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-screen-xl">

      {/* Header + filtros */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Rentabilidad</h1>
          <p className="text-sm text-[#94A3B8] mt-1 flex items-center gap-1.5">
            <span className="live-dot" /> Calculado en tiempo real desde tus ventas y costos
          </p>
        </div>
        <Link href="/app/configuracion/financiera" className="text-xs font-semibold flex items-center gap-1 self-center px-3 py-1.5 rounded-lg neon-text"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
          Ajustar parámetros <ArrowRight size={12} />
        </Link>
      </div>

      {/* Selector de período */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-0.5 rounded-xl p-1" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
          {DATE_PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: preset === p.key ? "#8b5cf6" : "transparent", color: preset === p.key ? "#fff" : "#64748B" }}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex gap-0.5 rounded-xl p-1" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
          {monthTabs.map((mt) => (
            <button key={mt.key} onClick={() => setPreset(mt.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: preset === mt.key ? "#8b5cf6" : "transparent", color: preset === mt.key ? "#fff" : "#64748B" }}>
              {mt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cómo se calcula — explicador */}
      <div className="anim-up rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(192,38,211,0.04))", border: "1px solid rgba(139,92,246,0.22)" }}>
        <button onClick={() => setShowHow(!showHow)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
            <HelpCircle size={16} color="#a78bfa" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#F1F5F9]">¿Cómo se calcula tu rentabilidad?</p>
            <p className="text-xs text-[#94A3B8]">Tocá para ver la fórmula aplicada a tus números reales</p>
          </div>
          <ChevronDown size={16} color="#94A3B8" className="transition-transform" style={{ transform: showHow ? "rotate(180deg)" : "none" }} />
        </button>
        {showHow && (
          <div className="px-5 pb-5 anim-up">
            <div className="space-y-2">
              {[
                { n: "1", t: "Partimos de tus ingresos brutos", d: `Suma de todas las órdenes pagas del período: ${fmt(m.totalRevenue)}`, c: "#F1F5F9" },
                { n: "2", t: `Restamos el IVA (${cfg.tax_rate}%)`, d: `El precio incluye IVA. Lo sacamos: −${fmt(m.taxAmount)} → quedan ${fmt(m.revenuePreTax)} netos`, c: "#f59e0b" },
                { n: "3", t: `Restamos comisiones (${cfg.platform_fee + (cfg.custom_commission ?? 0)}%)`, d: `Plataforma + comisión extra sobre el neto: −${fmt(m.platformFeeAmount + m.extraFeeAmount)}`, c: "#8b5cf6" },
                { n: "4", t: "Restamos el costo de los productos", d: m.cogs > 0 ? `Costo de lo vendido (desde TiendaNube): −${fmt(m.cogs)}` : "Sin costos cargados — cargalos en TiendaNube para incluirlos", c: "#c026d3" },
                { n: "5", t: "Restamos el costo de envíos", d: m.totalShippingCost > 0 ? `Promedio por envío $${Math.round(avgShippingCost).toLocaleString("es-AR")} × ${m.ordersCount} órdenes = −${fmt(m.totalShippingCost)}` : "Sin costos de envío configurados — configuralos en Costos de Envío", c: "#22d3ee" },
                { n: "6", t: "Restamos costos adicionales", d: m.additionalCostsAmount > 0 ? `Fijos prorrateados por el período + variables sobre facturación: −${fmt(m.additionalCostsAmount)}` : "Sin costos adicionales configurados — cargalos en Costos Adicionales", c: "#f472b6" },
                { n: "=", t: "Tu ganancia neta", d: `${fmt(m.netProfit)} — un margen del ${m.netMarginPct.toFixed(1)}% sobre la venta`, c: "#22c55e" },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: `${s.c}1e`, color: s.c }}>{s.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#F1F5F9]">{s.t}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alerta productos sin costo */}
      {m.noCostCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <AlertTriangle size={15} color="#f59e0b" strokeWidth={2.5} className="flex-shrink-0" />
          <p className="text-xs text-[#f59e0b]">
            {m.noCostCount} ítems sin costo cargado en TiendaNube — la ganancia está <strong>sobreestimada</strong>. Cargá el costo de cada producto para un cálculo exacto.
          </p>
        </div>
      )}

      {m.ordersCount === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(139,92,246,0.3)" }}>
          <p className="text-[#94A3B8] text-sm">Sin órdenes pagas en este período</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Ingresos brutos", value: m.totalRevenue, format: fmt, icon: Receipt, color: "#a78bfa" },
              { label: "Ganancia neta",   value: m.netProfit,    format: fmt, icon: Coins, color: "#22c55e" },
              { label: "Margen neto",     value: m.netMarginPct, format: (n: number) => `${n.toFixed(1)}%`, icon: Percent, color: "#c084fc" },
              { label: "Costo productos", value: m.cogs,         format: fmt, icon: Package, color: "#c026d3" },
            ].map((s, i) => (
              <div key={s.label} className="metric-card anim-up rounded-2xl p-4" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: `${0.05 + i * 0.06}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center anim-scale" style={{ background: `${s.color}1e`, animationDelay: `${0.12 + i * 0.06}s` }}>
                    <s.icon size={15} color={s.color} strokeWidth={2} />
                  </div>
                </div>
                <AnimatedNumber value={s.value} format={s.format} className="text-xl font-black text-[#F1F5F9] leading-none" />
                <p className="text-xs text-[#94A3B8] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Dona "a dónde va cada peso" + Ganancia diaria */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="anim-up metric-card lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.3s" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                <p className="text-sm font-semibold text-[#F1F5F9]">A dónde va cada peso</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">De cada venta bruta</p>
              </div>
              <div className="p-3 flex items-center gap-4">
                <div className="relative" style={{ width: 150, height: 150, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={3} stroke="none" animationDuration={1100}>
                        {donutData.map((d) => <Cell key={d.name} fill={d.color} style={{ filter: `drop-shadow(0 0 5px ${d.color}66)` }} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#F1F5F9" }} formatter={(v) => fmt(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-lg font-black text-[#22c55e] leading-none">{m.netMarginPct.toFixed(0)}%</p>
                    <p className="text-[9px] text-[#64748B] uppercase tracking-widest mt-0.5">ganancia</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                      <span className="text-xs text-[#94A3B8] flex-1 truncate">{d.name}</span>
                      <span className="text-xs font-bold text-[#F1F5F9]">{m.totalRevenue > 0 ? `${((d.value / m.totalRevenue) * 100).toFixed(0)}%` : "0%"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="anim-up metric-card lg:col-span-3 rounded-2xl overflow-hidden neon-chart-green" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.36s" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                <p className="text-sm font-semibold text-[#F1F5F9]">Ganancia por día</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Evolución en el período</p>
              </div>
              <div className="p-3">
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart data={dailyProfit} margin={{ top: 8, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={42}
                      tickFormatter={(v) => `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", color: "#F1F5F9" }} formatter={(v) => [fmt(Number(v)), "Ganancia"]} />
                    <Area type="monotone" dataKey="ganancia" stroke="#22c55e" strokeWidth={2} fill="url(#profitGrad)" dot={false} activeDot={{ r: 4, fill: "#22c55e" }} animationDuration={1300} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Desglose (waterfall) + Top productos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="anim-up rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: "0.42s" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                <p className="text-sm font-semibold text-[#F1F5F9]">Desglose financiero</p>
                <p className="text-xs text-[#64748B] mt-0.5">{m.ordersCount} órdenes pagas</p>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(139,92,246,0.08)" }}>
                {waterfall.map((row, i) => {
                  const pct = m.totalRevenue > 0 ? Math.abs(row.value) / m.totalRevenue * 100 : 0;
                  const barColor = row.kind === "in" ? "#a78bfa" : row.kind === "out" ? "#ef4444" : "#22c55e";
                  return (
                    <div key={row.label} className="anim-up px-5 py-3" style={{ animationDelay: `${0.46 + i * 0.05}s` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-[#94A3B8]">{row.label}</span>
                        <span className="text-sm font-bold" style={{ color: row.kind === "in" ? "#F1F5F9" : row.kind === "out" ? "#ef4444" : "#22c55e" }}>
                          {row.value < 0 ? "−" : ""}{fmt(Math.abs(row.value))}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full w-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="bar-fill h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: barColor, boxShadow: `0 0 8px ${barColor}99`, opacity: 0.8, animationDelay: `${0.5 + i * 0.05}s` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="anim-up rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: "0.48s" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                <div>
                  <p className="text-sm font-semibold text-[#F1F5F9]">Productos más rentables</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Por ganancia en el período</p>
                </div>
                <TrendingUp size={15} color="#22c55e" />
              </div>
              {topProducts.length === 0 ? (
                <div className="p-8 text-center"><p className="text-sm text-[#64748B]">Sin datos de productos</p></div>
              ) : (
                <div className="divide-y" style={{ borderColor: "rgba(139,92,246,0.08)" }}>
                  {topProducts.map((p, i) => (
                    <div key={i} className="anim-up px-5 py-3 flex items-center gap-3" style={{ animationDelay: `${0.52 + i * 0.05}s` }}>
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0" style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa" }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F1F5F9] truncate">{p.name}</p>
                        <p className="text-xs text-[#64748B]">{p.units} u · margen {p.margin.toFixed(0)}%</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#22c55e]">{fmt(p.profit)}</p>
                        <p className="text-[10px] text-[#64748B]">de {fmt(p.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Resumen combinado: Online + Local Físico */}
      {localData?.linked && localData.sales.length > 0 && (
        <LocalSummarySection localData={localData} onlineRevenue={m.totalRevenue} onlineProfit={m.netProfit} from={from} to={to} />
      )}

      {localData && !localData.linked && (
        <div className="anim-up rounded-2xl p-5" style={{ background: "#111118", border: "1px dashed rgba(225,105,30,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(225,105,30,0.12)" }}>
              <Store size={18} color="#e1691e" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F1F5F9]">Conectá Nova Local</p>
              <p className="text-xs text-[#94A3B8]">Vinculá tu local físico para ver la rentabilidad combinada (online + local) en un solo lugar.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LocalSummarySection({ localData, onlineRevenue, onlineProfit, from, to }: {
  localData: LocalSalesData;
  onlineRevenue: number;
  onlineProfit: number;
  from: Date;
  to: Date;
}) {
  const fmt = formatCurrency;

  const filteredSales = localData.sales.filter((s) => {
    const d = new Date(s.created_at);
    return d >= from && d <= to;
  });

  const localRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const localCosts = localData.costs;
  const periodDays = Math.max(Math.ceil((to.getTime() - from.getTime()) / 86_400_000), 1);
  const localFixedProrated = localCosts.fixedMonthly * (periodDays / 30);
  const localVariableAmount = localRevenue * (localCosts.variablePct / 100);
  const localProfit = localRevenue - localFixedProrated - localVariableAmount;

  const combinedRevenue = onlineRevenue + localRevenue;
  const combinedProfit = onlineProfit + localProfit;
  const combinedMargin = combinedRevenue > 0 ? (combinedProfit / combinedRevenue) * 100 : 0;

  const onlinePct = combinedRevenue > 0 ? (onlineRevenue / combinedRevenue) * 100 : 0;
  const localPct = combinedRevenue > 0 ? (localRevenue / combinedRevenue) * 100 : 0;

  return (
    <div className="anim-up space-y-4" style={{ animationDelay: "0.55s" }}>
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: "#e1691e" }} />
        <h2 className="text-lg font-bold text-[#F1F5F9]">Rentabilidad combinada</h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(225,105,30,0.12)", color: "#e1691e" }}>
          Online + Local
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ingresos totales", value: combinedRevenue, color: "#a78bfa" },
          { label: "Ganancia total", value: combinedProfit, color: "#22c55e" },
          { label: "Margen combinado", value: combinedMargin, color: "#c084fc", isMg: true },
          { label: "Ventas local", value: filteredSales.length, color: "#e1691e", isCount: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "#111118", border: "1px solid rgba(225,105,30,0.2)" }}>
            <AnimatedNumber
              value={s.value}
              format={s.isMg ? ((n: number) => `${n.toFixed(1)}%`) : s.isCount ? ((n: number) => String(Math.round(n))) : fmt}
              className="text-xl font-black text-[#F1F5F9] leading-none"
            />
            <p className="text-xs text-[#94A3B8] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(225,105,30,0.15)" }}>
        <p className="text-sm font-semibold text-[#F1F5F9] mb-3">Distribución de ingresos</p>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="h-full transition-all" style={{ width: `${onlinePct}%`, background: "#8b5cf6" }} />
          <div className="h-full transition-all" style={{ width: `${localPct}%`, background: "#e1691e" }} />
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6" }} />
            <span className="text-xs text-[#94A3B8]">Online {onlinePct.toFixed(0)}%</span>
            <span className="text-xs font-bold text-[#F1F5F9]">{fmt(onlineRevenue)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#e1691e" }} />
            <span className="text-xs text-[#94A3B8]">Local {localPct.toFixed(0)}%</span>
            <span className="text-xs font-bold text-[#F1F5F9]">{fmt(localRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

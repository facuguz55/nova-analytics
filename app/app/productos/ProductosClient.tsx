"use client";

import { useState, useMemo } from "react";
import {
  Package, AlertTriangle, DollarSign, Boxes, Search, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

export interface ProdRow {
  id: number;
  name: string;
  variants: { price: number; cost: number; stock: number }[];
}

type StockFilter = "all" | "low" | "out";
type SortKey = "value" | "margin" | "stock" | "name";

const fmtNum = (n: number) => String(Math.round(n));

export default function ProductosClient({ products }: { products: ProdRow[] }) {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortKey>("value");

  // Derivados por producto
  const enriched = useMemo(() => products.map((p) => {
    const price = p.variants[0]?.price ?? 0;
    const stock = p.variants.reduce((s, v) => s + Math.max(v.stock, 0), 0);
    const withCost = p.variants.filter((v) => v.cost > 0);
    const avgCost = withCost.length ? withCost.reduce((a, v) => a + v.cost, 0) / withCost.length : 0;
    const margin = price > 0 && avgCost > 0 ? ((price - avgCost) / price) * 100 : null;
    const invValue = price * stock;
    return { ...p, price, stock, avgCost, margin, invValue };
  }), [products]);

  const totals = useMemo(() => {
    const low = enriched.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const out = enriched.filter((p) => p.stock <= 0).length;
    const inStock = enriched.length - low - out;
    const value = enriched.reduce((a, p) => a + p.invValue, 0);
    const margins = enriched.filter((p) => p.margin !== null).map((p) => p.margin as number);
    const avgMargin = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
    return { low, out, inStock, value, avgMargin };
  }, [enriched]);

  const filtered = useMemo(() => {
    let r = enriched;
    if (search.trim()) r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (stockFilter === "low") r = r.filter((p) => p.stock > 0 && p.stock <= 5);
    if (stockFilter === "out") r = r.filter((p) => p.stock <= 0);
    return [...r].sort((a, b) => {
      if (sort === "value")  return b.invValue - a.invValue;
      if (sort === "margin") return (b.margin ?? -1) - (a.margin ?? -1);
      if (sort === "stock")  return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });
  }, [enriched, search, stockFilter, sort]);

  const stockDist = [
    { name: "En stock", value: totals.inStock, color: "#22c55e" },
    { name: "Stock bajo", value: totals.low, color: "#f59e0b" },
    { name: "Sin stock", value: totals.out, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const topValue = useMemo(() =>
    [...enriched].sort((a, b) => b.invValue - a.invValue).slice(0, 6)
      .map((p) => ({ name: p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name, valor: p.invValue })),
    [enriched]);

  const KPIS = [
    { label: "Productos", value: enriched.length, format: fmtNum, icon: Package, color: "#8b5cf6" },
    { label: "Stock bajo", value: totals.low, format: fmtNum, icon: AlertTriangle, color: "#f59e0b" },
    { label: "Sin stock", value: totals.out, format: fmtNum, icon: AlertTriangle, color: "#ef4444" },
    { label: "Valor inventario", value: totals.value, format: formatCurrency, icon: DollarSign, color: "#22c55e" },
  ];

  return (
    <div className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((s, i) => (
          <div key={s.label} className="metric-card anim-up rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: `${0.05 + i * 0.06}s` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 anim-scale" style={{ background: `${s.color}1a`, animationDelay: `${0.12 + i * 0.06}s` }}>
              <s.icon size={18} color={s.color} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <AnimatedNumber value={s.value} format={s.format} className="text-lg font-black text-[#F1F5F9] leading-none" />
              <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="anim-up metric-card lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.28s" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Distribución de stock</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">{enriched.length} productos</p>
          </div>
          <div className="p-3 flex items-center gap-4">
            <div className="relative" style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockDist} dataKey="value" nameKey="name" innerRadius={44} outerRadius={62} paddingAngle={3} stroke="none" animationDuration={1100}>
                    {stockDist.map((d) => <Cell key={d.name} fill={d.color} style={{ filter: `drop-shadow(0 0 5px ${d.color}66)` }} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#F1F5F9" }} formatter={(v, n) => [`${v} prod.`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-lg font-black text-[#22c55e] leading-none">{totals.inStock}</p>
                <p className="text-[9px] text-[#64748B] uppercase tracking-widest mt-0.5">ok</p>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {stockDist.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                  <span className="text-xs text-[#94A3B8] flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-bold text-[#F1F5F9]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="anim-up metric-card lg:col-span-3 rounded-2xl overflow-hidden neon-chart-fuchsia" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.34s" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <div>
              <p className="text-sm font-semibold text-[#F1F5F9]">Mayor valor de inventario</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Precio × stock</p>
            </div>
            {totals.avgMargin > 0 && <span className="text-xs text-[#64748B]">Margen prom. {totals.avgMargin.toFixed(0)}%</span>}
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={topValue} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#d946ef" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(217,70,239,0.3)", borderRadius: "10px", color: "#F1F5F9" }} cursor={{ fill: "rgba(139,92,246,0.05)" }} formatter={(v) => [formatCurrency(Number(v)), "Inventario"]} />
                <Bar dataKey="valor" fill="url(#invGrad)" radius={[0, 5, 5, 0]} animationDuration={1100} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-0" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
          <Search size={13} color="#64748B" strokeWidth={2} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..."
            className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]" />
        </div>
        <div className="flex gap-0.5 rounded-xl p-1" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
          {([["all","Todos"],["low","Stock bajo"],["out","Sin stock"]] as [StockFilter,string][]).map(([v, l]) => (
            <button key={v} onClick={() => setStockFilter(v)} className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: stockFilter === v ? "#8b5cf6" : "transparent", color: stockFilter === v ? "#fff" : "#94A3B8" }}>{l}</button>
          ))}
        </div>
        <div className="flex gap-0.5 rounded-xl p-1" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
          {([["value","Valor"],["margin","Margen"],["stock","Stock"],["name","A-Z"]] as [SortKey,string][]).map(([v, l]) => (
            <button key={v} onClick={() => setSort(v)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
              style={{ background: sort === v ? "#8b5cf6" : "transparent", color: sort === v ? "#fff" : "#94A3B8" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
          <span className="text-sm text-[#94A3B8]">{filtered.length} producto{filtered.length !== 1 ? "s" : ""}</span>
          <TrendingUp size={14} color="#64748B" />
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(139,92,246,0.07)" }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#64748B]">Sin productos que coincidan</div>
          ) : filtered.slice(0, 100).map((p) => {
            const stockColor = p.stock <= 0 ? "#ef4444" : p.stock <= 5 ? "#f59e0b" : "#22c55e";
            const marginColor = p.margin === null ? "#64748B" : p.margin >= 40 ? "#22c55e" : p.margin >= 20 ? "#f59e0b" : "#ef4444";
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-[rgba(139,92,246,0.04)]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.1)" }}>
                  <Boxes size={14} color="#8b5cf6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F1F5F9] truncate">{p.name}</p>
                  <p className="text-xs text-[#64748B]">{p.variants.length} variante{p.variants.length !== 1 ? "s" : ""}{p.avgCost > 0 ? ` · costo ${formatCurrency(p.avgCost)}` : ""}</p>
                </div>
                <div className="text-right flex-shrink-0 min-w-[90px]">
                  <p className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(p.price)}</p>
                  <p className="text-xs font-medium" style={{ color: stockColor }}>{p.stock <= 0 ? "Sin stock" : `${p.stock} u`}</p>
                </div>
                <div className="text-right flex-shrink-0 w-16">
                  {p.margin !== null
                    ? <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: marginColor, background: `${marginColor}14` }}>{p.margin.toFixed(0)}%</span>
                    : <span className="text-[10px] text-[#475569]">sin costo</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {filtered.length > 100 && <p className="text-xs text-center text-[#64748B]">Mostrando 100 de {filtered.length} — usá el buscador</p>}
    </div>
  );
}

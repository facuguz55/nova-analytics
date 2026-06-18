"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ShoppingBag, TrendingUp, Calendar, DollarSign, Plus } from "lucide-react";

interface Props {
  kpis: {
    today:    { revenue: number; count: number };
    week:     { revenue: number; count: number };
    month:    { revenue: number; count: number };
    avgTicket: number;
  };
  dailyData:    { date: string; revenue: number; profit: number }[];
  paymentData:  { name: string; value: number }[];
  topProducts:  { name: string; units: number; revenue: number }[];
}

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${Math.round(n).toLocaleString("es-AR")}`;

const PAYMENT_LABELS: Record<string, string> = {
  efectivo:       "Efectivo",
  transferencia:  "Transferencia",
  debito:         "Débito",
  credito:        "Crédito",
  cuotas:         "Cuotas",
};

const PAYMENT_COLORS = ["#e1691e", "#a855f7", "#22c55e", "#2563eb", "#f59e0b"];

const CARD_STYLE: React.CSSProperties = {
  background: "#111118",
  border: "1px solid rgba(124,58,237,0.15)",
  borderRadius: "16px",
  padding: "20px",
};

export default function LocalDashboardClient({ kpis, dailyData, paymentData, topProducts }: Props) {
  const [period, setPeriod] = useState<"revenue" | "profit">("revenue");

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Local Físico</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Resumen de tu negocio presencial</p>
        </div>
        <Link
          href="/app/local/ventas/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}
        >
          <Plus size={16} />
          Registrar venta
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Ventas hoy"
          value={fmt(kpis.today.revenue)}
          sub={`${kpis.today.count} venta${kpis.today.count !== 1 ? "s" : ""}`}
          icon={<ShoppingBag size={18} />}
          color="#e1691e"
        />
        <KPICard
          label="Esta semana"
          value={fmt(kpis.week.revenue)}
          sub={`${kpis.week.count} ventas`}
          icon={<Calendar size={18} />}
          color="#a855f7"
        />
        <KPICard
          label="Este mes"
          value={fmt(kpis.month.revenue)}
          sub={`${kpis.month.count} ventas`}
          icon={<TrendingUp size={18} />}
          color="#22c55e"
        />
        <KPICard
          label="Ticket promedio"
          value={fmt(kpis.avgTicket)}
          sub="este mes"
          icon={<DollarSign size={18} />}
          color="#2563eb"
        />
      </div>

      {/* Gráfico ventas por día */}
      <div style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#F1F5F9] font-semibold">Últimos 30 días</h2>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
            {(["revenue", "profit"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: period === p ? (p === "revenue" ? "#e1691e" : "#a855f7") : "transparent",
                  color: period === p ? "#fff" : "#94A3B8",
                }}
              >
                {p === "revenue" ? "Ventas" : "Ganancia"}
              </button>
            ))}
          </div>
        </div>
        {dailyData.length === 0 ? (
          <EmptyState text="Sin ventas en los últimos 30 días" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="localGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={period === "revenue" ? "#e1691e" : "#a855f7"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={period === "revenue" ? "#e1691e" : "#a855f7"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => fmt(v)} width={56} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8 }}
                labelStyle={{ color: "#F1F5F9" }}
                formatter={(v) => [fmt(Number(v)), period === "revenue" ? "Ventas" : "Ganancia"]}
              />
              <Area
                type="monotone"
                dataKey={period}
                stroke={period === "revenue" ? "#e1691e" : "#a855f7"}
                strokeWidth={2}
                fill="url(#localGrad)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart métodos de pago */}
        <div style={CARD_STYLE}>
          <h2 className="text-[#F1F5F9] font-semibold mb-4">Métodos de pago</h2>
          {paymentData.length === 0 ? (
            <EmptyState text="Sin datos de pago" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {paymentData.map((_, i) => (
                      <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8 }}
                    formatter={(v) => [fmt(Number(v))]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {paymentData.map((d, i) => {
                  const total = paymentData.reduce((a, x) => a + x.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }}
                      />
                      <span className="text-xs text-[#94A3B8] flex-1">
                        {PAYMENT_LABELS[d.name] ?? d.name}
                      </span>
                      <span className="text-xs font-medium text-[#F1F5F9]">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top 5 productos */}
        <div style={CARD_STYLE}>
          <h2 className="text-[#F1F5F9] font-semibold mb-4">Top productos vendidos</h2>
          {topProducts.length === 0 ? (
            <EmptyState text="Sin ventas registradas" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8 }}
                  formatter={(v) => [fmt(Number(v)), "Ingresos"]}
                />
                <Bar dataKey="revenue" fill="#e1691e" radius={[0, 4, 4, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Botón flotante mobile */}
      <Link
        href="/app/local/ventas/nueva"
        className="fixed bottom-20 right-4 sm:hidden flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white z-50 transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}

function KPICard({
  label, value, sub, icon, color,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div style={CARD_STYLE}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#F1F5F9]">{value}</p>
      <p className="text-xs text-[#64748B] mt-0.5">{label}</p>
      <p className="text-xs text-[#94A3B8] mt-1">{sub}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-[#64748B] text-sm">
      {text}
    </div>
  );
}

"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

interface Props {
  monthlyData: { month: string; ventas: number; ordenes: number }[];
  byWeekday: { day: string; ventas: number; ordenes: number }[];
  byHour: { hora: string; ordenes: number }[];
  totalOrders: number;
  hasData: boolean;
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
        <p className="font-semibold text-[#F1F5F9] text-sm">{title}</p>
        {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AnalisisClient({ monthlyData, byWeekday, byHour, hasData }: Props) {
  if (!hasData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-black text-[#F1F5F9] mb-2" style={{ letterSpacing: "-0.02em" }}>Análisis</h1>
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <p className="text-[#64748B] text-sm">Sin datos — conectá TiendaNube para ver el análisis</p>
          <a href="/app/configuracion/integraciones" className="mt-3 inline-block text-sm text-[#7C3AED] hover:text-[#8B5CF6]">
            Ir a integraciones →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Análisis</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Evolución histórica y patrones de ventas</p>
      </div>

      {/* Ventas por mes */}
      <ChartCard title="Ventas por mes" subtitle="Últimos 6 meses · órdenes pagadas">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e1691e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#e1691e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", fontSize: "12px" }}
              labelStyle={{ color: "#F1F5F9", fontWeight: 700 }}
              formatter={(v) => [fmt(Number(v)), "Ventas"]}
            />
            <Area type="monotone" dataKey="ventas" stroke="#e1691e" strokeWidth={2} fill="url(#gVentas)" dot={false} activeDot={{ r: 4, fill: "#e1691e", strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Por día de la semana */}
        <ChartCard title="Ventas por día de la semana" subtitle="Total histórico">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byWeekday} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v) => [fmt(Number(v)), "Ventas"]}
              />
              <Bar dataKey="ventas" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Por hora */}
        <ChartCard title="Órdenes por hora del día" subtitle="Distribución horaria">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byHour} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
              <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v) => [Number(v), "Órdenes"]}
              />
              <Bar dataKey="ordenes" fill="#e1691e" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Insight */}
      {byWeekday.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.05))", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          {(() => {
            const bestDay = byWeekday.reduce((best, d) => d.ventas > best.ventas ? d : best, byWeekday[0]);
            const bestHour = byHour.reduce((best, h) => h.ordenes > best.ordenes ? h : best, byHour[0]);
            return (
              <p className="text-sm text-[#94A3B8]">
                🔥 Tu mejor día de la semana es <span className="text-[#e1691e] font-bold">{bestDay.day}</span> con {fmt(bestDay.ventas)} en ventas.
                El horario pico de órdenes es <span className="text-[#7C3AED] font-bold">{bestHour.hora}</span> hs.
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
}

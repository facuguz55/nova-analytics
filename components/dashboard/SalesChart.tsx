"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const generateData = () => {
  const seed = [
    310000, 280000, 420000, 390000, 510000, 470000, 320000,
    290000, 380000, 450000, 530000, 490000, 270000, 300000,
    610000, 580000, 430000, 390000, 720000, 680000, 350000,
    310000, 490000, 540000, 620000, 590000, 340000, 360000,
    780000, 820000,
  ];
  const metaSeed = [
    28000, 28000, 35000, 35000, 42000, 42000, 28000,
    28000, 32000, 38000, 45000, 42000, 25000, 25000,
    52000, 49000, 38000, 35000, 61000, 58000, 30000,
    28000, 42000, 46000, 53000, 50000, 30000, 32000,
    67000, 70000,
  ];
  return seed.map((v, i) => {
    const day = i + 1;
    return {
      day: day <= 9 ? `0${day}/05` : `${day}/05`,
      ventas: v,
      meta: metaSeed[i],
    };
  });
};

const DATA = generateData();

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div
      className="rounded-xl p-3 shadow-xl"
      style={{
        background: "#111118",
        border: "1px solid rgba(124,58,237,0.3)",
        minWidth: "180px",
      }}
    >
      <p className="mb-2 text-[11px] text-[#94A3B8] font-semibold">
        {label} — Mayo 2026
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-[#94A3B8]">
              {entry.name === "ventas" ? "Ventas" : "Inversion Meta"}
            </span>
          </div>
          <span className="text-xs font-bold text-[#F1F5F9]">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function SalesChart() {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n}`;
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className="font-bold text-[#F1F5F9]"
            style={{ fontFamily: "var(--font-syne)", fontSize: "15px" }}
          >
            Ventas vs Inversion Meta
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Mayo 2026 — ultimos 30 dias</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "#e1691e" }} />
            <span className="text-xs text-[#94A3B8]">Ventas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "#7C3AED" }} />
            <span className="text-xs text-[#94A3B8]">Meta Ads</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e1691e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#e1691e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMeta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="ventas"
            stroke="#e1691e"
            strokeWidth={2}
            fill="url(#gradVentas)"
            dot={false}
            activeDot={{ r: 4, fill: "#e1691e", strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="meta"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="url(#gradMeta)"
            dot={false}
            activeDot={{ r: 4, fill: "#7C3AED", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

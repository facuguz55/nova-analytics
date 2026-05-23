"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ─────────────────────────────────────────────
// Mock data — últimos 30 días (Mayo 2026)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Custom tooltip
// ─────────────────────────────────────────────
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
        background: "#0d1424",
        border: "1px solid #1e293b",
        fontFamily: "var(--font-barlow)",
        minWidth: "180px",
      }}
    >
      <p
        className="mb-2"
        style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}
      >
        {label} — Mayo 2026
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full"
              style={{
                width: "8px",
                height: "8px",
                background: entry.color,
              }}
            />
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {entry.name === "ventas" ? "Ventas" : "Inversión Meta"}
            </span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>
            {fmt(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Chart component
// ─────────────────────────────────────────────
export default function SalesChart() {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n}`;
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Ventas vs Inversión Meta
          </h3>
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
            Mayo 2026 — últimos 30 días
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "#e1691e" }} />
            <span
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              Ventas
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "#a855f7" }} />
            <span
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              Meta Ads
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e1691e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#e1691e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMeta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e293b"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            tick={{
              fontFamily: "var(--font-barlow)",
              fontSize: 11,
              fill: "#64748b",
            }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />

          <YAxis
            tickFormatter={fmt}
            tick={{
              fontFamily: "var(--font-barlow)",
              fontSize: 11,
              fill: "#64748b",
            }}
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
            stroke="#a855f7"
            strokeWidth={2}
            fill="url(#gradMeta)"
            dot={false}
            activeDot={{ r: 4, fill: "#a855f7", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

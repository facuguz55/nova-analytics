import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  change?: number;        // % cambio vs período anterior
  icon?: LucideIcon;
  iconColor?: string;     // e.g. "#e1691e"
  accentBottom?: string;  // color del borde bottom
}

export default function MetricCard({
  label,
  value,
  subtext,
  change,
  icon: Icon,
  iconColor = "#e1691e",
  accentBottom,
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className="relative rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 group"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Subtle hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{
          background: `radial-gradient(600px circle at 50% 0%, ${iconColor}08, transparent 60%)`,
        }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between">
        <p
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
        {Icon && (
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
              width: "32px",
              height: "32px",
              background: `${iconColor}18`,
            }}
          >
            <Icon size={15} color={iconColor} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p
          className="leading-none"
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
        {subtext && (
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            {subtext}
          </p>
        )}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{
              background: isPositive
                ? "rgba(34,197,94,0.12)"
                : isNegative
                ? "rgba(239,68,68,0.12)"
                : "rgba(100,116,139,0.12)",
            }}
          >
            {isPositive ? (
              <TrendingUp size={11} color="#22c55e" strokeWidth={2.5} />
            ) : isNegative ? (
              <TrendingDown size={11} color="#ef4444" strokeWidth={2.5} />
            ) : (
              <Minus size={11} color="#64748b" strokeWidth={2.5} />
            )}
            <span
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "12px",
                fontWeight: 600,
                color: isPositive ? "#22c55e" : isNegative ? "#ef4444" : "#64748b",
              }}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            vs semana pasada
          </span>
        </div>
      )}

      {/* Accent bottom line */}
      {accentBottom && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl"
          style={{ background: accentBottom }}
        />
      )}
    </div>
  );
}

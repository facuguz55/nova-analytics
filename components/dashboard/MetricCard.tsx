import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  change?: number;
  icon?: LucideIcon;
  iconColor?: string;
}

export default function MetricCard({
  label,
  value,
  subtext,
  change,
  icon: Icon,
  iconColor = "#7C3AED",
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-[#111118] border border-[rgba(124,58,237,0.2)] rounded-2xl p-5 hover:border-[rgba(124,58,237,0.4)] transition-all group">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${iconColor}20` }}
        >
          {Icon && <Icon size={18} strokeWidth={2} color={iconColor} />}
        </div>
        {change !== undefined && (
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{
              background: isPositive
                ? "rgba(34,197,94,0.1)"
                : isNegative
                ? "rgba(239,68,68,0.1)"
                : "rgba(100,116,139,0.1)",
            }}
          >
            {isPositive ? (
              <TrendingUp size={10} color="#22c55e" strokeWidth={2.5} />
            ) : isNegative ? (
              <TrendingDown size={10} color="#ef4444" strokeWidth={2.5} />
            ) : (
              <Minus size={10} color="#64748b" strokeWidth={2.5} />
            )}
            <span
              className="text-xs font-semibold"
              style={{ color: isPositive ? "#22c55e" : isNegative ? "#ef4444" : "#64748b" }}
            >
              {isPositive ? "+" : ""}{change?.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p
          className="text-2xl font-black text-[#F1F5F9] leading-none mb-0.5"
        >
          {value}
        </p>
        <p className="text-xs text-[#94A3B8] mt-1">{label}</p>
        {subtext && <p className="text-xs text-[#64748b] mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}


"use client";

import { useState, useMemo } from "react";
import { TrendingUp, DollarSign, Percent, Store, ArrowRight, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import Link from "next/link";
import type { TNOrder, TNProduct } from "@/lib/tiendanube/client";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface FinConfig {
  tax_rate: number;
  platform_fee: number;
  agency_fee: number;
  usd_rate: number;
}

interface Props {
  connected: boolean;
  rawOrders: TNOrder[];
  products: TNProduct[];
  cfg: FinConfig;
}

// ── Presets ───────────────────────────────────────────────────────────────────

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

// ── Componente ────────────────────────────────────────────────────────────────

export default function RentabilidadClient({ connected, rawOrders, products, cfg }: Props) {
  const [preset, setPreset] = useState("hoy");

  const now = new Date();
  const monthTabs = [0, 1, 2].map((offset) => ({
    key: `mes-${offset}`,
    label: MONTHS_ES[new Date(now.getFullYear(), now.getMonth() - offset, 1).getMonth()],
  }));

  // costMap: product_id → costo promedio de variantes con costo
  const costMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of products) {
      const variants = p.variants.filter((v) => parseFloat(v.cost ?? "0") > 0);
      if (variants.length === 0) continue;
      const avg = variants.reduce((acc, v) => acc + parseFloat(v.cost ?? "0"), 0) / variants.length;
      map.set(p.id, avg);
    }
    return map;
  }, [products]);

  const metrics = useMemo(() => {
    const { from, to } = getDateRange(preset);
    const paidOrders = rawOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= from && d <= to && (o.payment_status === "paid" || o.status === "closed");
    });

    const totalRevenue = paidOrders.reduce((acc, o) => acc + parseFloat(o.total), 0);
    const taxFactor = 1 + cfg.tax_rate / 100;
    const revenuePreTax = totalRevenue / taxFactor;
    const taxAmount = totalRevenue - revenuePreTax;
    const platformFeeAmount = revenuePreTax * (cfg.platform_fee / 100);
    const agencyFeeAmount = revenuePreTax * ((cfg.agency_fee ?? 0) / 100);
    const netRevenue = revenuePreTax - platformFeeAmount - agencyFeeAmount;

    // COGS por ítem de orden × costo de la variante
    let cogs = 0;
    let noCostCount = 0;
    for (const order of paidOrders) {
      for (const item of order.products) {
        const cost = costMap.get(item.product_id);
        if (cost != null) {
          cogs += cost * item.quantity;
        } else {
          noCostCount++;
        }
      }
    }

    const grossProfit = netRevenue - cogs;
    const netMarginPct = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;
    const grossMarginPct = netRevenue > 0 && cogs > 0 ? (grossProfit / netRevenue) * 100 : 0;

    return {
      totalRevenue, taxAmount, platformFeeAmount, agencyFeeAmount,
      netRevenue, cogs, grossProfit, netMarginPct, grossMarginPct,
      ordersCount: paidOrders.length, noCostCount,
    };
  }, [preset, rawOrders, costMap, cfg]);

  const waterfall = [
    { label: "Ingresos brutos", value: metrics.totalRevenue, type: "positive" as const },
    { label: `IVA / Impuesto (${cfg.tax_rate}%)`, value: -metrics.taxAmount, type: "negative" as const },
    { label: `Fee plataforma (${cfg.platform_fee}%)`, value: -metrics.platformFeeAmount, type: "negative" as const },
    ...(cfg.agency_fee > 0 ? [{ label: `Fee agencia (${cfg.agency_fee}%)`, value: -metrics.agencyFeeAmount, type: "negative" as const }] : []),
    ...(metrics.cogs > 0 ? [{ label: "Costo de productos", value: -metrics.cogs, type: "negative" as const }] : []),
    { label: "Ganancia neta", value: metrics.cogs > 0 ? metrics.grossProfit : metrics.netRevenue, type: "total" as const },
  ];

  if (!connected) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-3xl">
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Rentabilidad</h1>
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(124,58,237,0.3)" }}>
          <Store size={40} color="#7C3AED" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conecta tu TiendaNube</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
            style={{ background: "#7C3AED" }}>
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-3xl">
      {/* Header + filtros */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Rentabilidad</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Datos en tiempo real desde TiendaNube</p>
        </div>
        <Link href="/app/configuracion/financiera" className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] flex items-center gap-1 self-center">
          Editar config <ArrowRight size={12} />
        </Link>
      </div>

      {/* Selector de período */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.2)" }}>
          {DATE_PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: preset === p.key ? "#7C3AED" : "transparent", color: preset === p.key ? "#fff" : "#64748B" }}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.2)" }}>
          {monthTabs.map((m) => (
            <button key={m.key} onClick={() => setPreset(m.key)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: preset === m.key ? "#7C3AED" : "transparent", color: preset === m.key ? "#fff" : "#64748B" }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerta de productos sin costo */}
      {metrics.noCostCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <AlertTriangle size={15} color="#f59e0b" strokeWidth={2.5} className="flex-shrink-0" />
          <p className="text-xs text-[#f59e0b]">
            {metrics.noCostCount} ítems sin costo cargado en TiendaNube — el &ldquo;Costo de productos&rdquo; está subestimado.
          </p>
        </div>
      )}

      {metrics.ordersCount === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(124,58,237,0.3)" }}>
          <p className="text-[#94A3B8] text-sm">Sin órdenes en este período</p>
        </div>
      ) : (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Ingresos brutos", rawValue: metrics.totalRevenue, format: formatCurrency, icon: DollarSign, color: "#F1F5F9" },
              { label: "Ingresos netos",  rawValue: metrics.netRevenue,   format: formatCurrency, icon: TrendingUp, color: "#22c55e" },
              { label: "Margen neto",     rawValue: metrics.netMarginPct,  format: (n: number) => `${n.toFixed(1)}%`, icon: Percent, color: "#e1691e" },
              { label: "Margen bruto",    rawValue: metrics.grossMarginPct, format: (n: number) => metrics.grossMarginPct > 0 ? `${n.toFixed(1)}%` : "Sin costo", icon: Percent, color: "#7C3AED" },
            ].map((s, i) => (
              <div key={s.label} className="metric-card anim-up rounded-2xl p-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)", animationDelay: `${0.05 + i * 0.07}s` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 anim-scale" style={{ background: "rgba(124,58,237,0.12)", animationDelay: `${0.12 + i * 0.07}s` }}>
                  <s.icon size={15} color={s.color} strokeWidth={2} />
                </div>
                <AnimatedNumber value={s.rawValue} format={s.format} className="text-lg sm:text-xl font-black text-[#F1F5F9]" />
                <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Desglose financiero (waterfall) */}
          <div className="anim-up rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)", animationDelay: "0.33s" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
              <p className="text-sm font-semibold text-[#F1F5F9]">Desglose financiero</p>
              <p className="text-xs text-[#64748B] mt-0.5">{metrics.ordersCount} órdenes pagas</p>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
              {waterfall.map((row, i) => {
                const pct = metrics.totalRevenue > 0 ? Math.abs(row.value) / metrics.totalRevenue * 100 : 0;
                const barColor = row.type === "positive" ? "#2563EB" : row.type === "negative" ? "#ef4444" : "#22c55e";
                return (
                <div key={row.label} className="anim-up px-5 py-3" style={{ animationDelay: `${0.38 + i * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: barColor }} />
                      <span className="text-sm text-[#94A3B8]">{row.label}</span>
                    </div>
                    <span className="text-sm font-bold"
                      style={{ color: row.type === "positive" ? "#F1F5F9" : row.type === "negative" ? "#ef4444" : "#22c55e" }}>
                      {row.value < 0 ? "-" : ""}{formatCurrency(Math.abs(row.value))}
                    </span>
                  </div>
                  <div className="h-1 rounded-full w-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="bar-fill h-1 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: barColor, opacity: 0.6, animationDelay: `${0.45 + i * 0.05}s` }} />
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

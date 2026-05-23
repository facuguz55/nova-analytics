import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TrendingUp, DollarSign, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Rentabilidad" };

export default async function RentabilidadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  type OrderRow = { total: number; status: string | null; created_at: string | null };
  type ProductRow = { price: number; cost: number; stock: number };
  type FinConfig = { tax_rate: number; platform_fee: number; agency_fee: number; usd_rate: number };

  const { data: rawUserRow } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const userRow = rawUserRow as unknown as { workspace_id: string | null } | null;

  const [{ data: rawOrders }, { data: rawProducts }, { data: rawConfig }] = await Promise.all([
    supabase.from("tn_orders").select("total, status, created_at").limit(1000),
    supabase.from("tn_products").select("price, cost, stock").limit(200),
    supabase.from("financial_config").select("*").eq("workspace_id", userRow?.workspace_id ?? "").single(),
  ]);

  const orders = (rawOrders ?? []) as unknown as OrderRow[];
  const allProducts = (rawProducts ?? []) as unknown as ProductRow[];
  const cfg = (rawConfig as unknown as FinConfig | null) ?? { tax_rate: 21, platform_fee: 2, agency_fee: 0, usd_rate: 1200 };

  const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "closed");
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);

  // Cálculos de rentabilidad
  const taxFactor = 1 + cfg.tax_rate / 100;
  const revenuePreTax = totalRevenue / taxFactor;
  const taxAmount = totalRevenue - revenuePreTax;
  const platformFeeAmount = revenuePreTax * (cfg.platform_fee / 100);
  const agencyFeeAmount = revenuePreTax * (cfg.agency_fee / 100);
  const netRevenue = revenuePreTax - platformFeeAmount - agencyFeeAmount;
  const avgCostRatio = allProducts.filter((p) => p.price > 0 && p.cost > 0).length > 0
    ? allProducts.filter((p) => p.price > 0 && p.cost > 0).reduce((acc, p) => acc + p.cost / p.price, 0) / allProducts.filter((p) => p.price > 0 && p.cost > 0).length
    : 0;
  const cogs = avgCostRatio > 0 ? netRevenue * avgCostRatio : 0;
  const grossProfit = netRevenue - cogs;
  const netMarginPct = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;
  const grossMarginPct = netRevenue > 0 && cogs > 0 ? ((netRevenue - cogs) / netRevenue) * 100 : 0;

  // Mensual actual
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const monthOrders = paidOrders.filter((o) => (o.created_at ?? "") >= monthStart);
  const prevMonthOrders = paidOrders.filter((o) => (o.created_at ?? "") >= prevMonthStart && (o.created_at ?? "") < monthStart);
  const salesMes = monthOrders.reduce((acc, o) => acc + o.total, 0);
  const salesMesAnterior = prevMonthOrders.reduce((acc, o) => acc + o.total, 0);
  const changePct = salesMesAnterior > 0 ? ((salesMes - salesMesAnterior) / salesMesAnterior) * 100 : 0;

  const waterfall = [
    { label: "Ingresos brutos", value: totalRevenue, type: "positive" as const },
    { label: `IVA / Impuesto (${cfg.tax_rate}%)`, value: -taxAmount, type: "negative" as const },
    { label: `Fee plataforma (${cfg.platform_fee}%)`, value: -platformFeeAmount, type: "negative" as const },
    ...(cfg.agency_fee > 0 ? [{ label: `Fee agencia (${cfg.agency_fee}%)`, value: -agencyFeeAmount, type: "negative" as const }] : []),
    ...(cogs > 0 ? [{ label: "Costo de mercadería (COGS)", value: -cogs, type: "negative" as const }] : []),
    { label: "Ganancia neta", value: cogs > 0 ? grossProfit : netRevenue, type: "total" as const },
  ];

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Rentabilidad</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Análisis financiero basado en tus configuraciones</p>
        </div>
        <Link
          href="/app/configuracion/financiera"
          className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] flex items-center gap-1"
        >
          Editar config financiera →
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ingresos brutos", value: formatCurrency(totalRevenue), icon: DollarSign, color: "#F1F5F9" },
          { label: "Ingresos netos", value: formatCurrency(netRevenue), icon: TrendingUp, color: "#22c55e" },
          { label: "Margen neto", value: `${netMarginPct.toFixed(1)}%`, icon: Percent, color: "#e1691e" },
          { label: "Margen bruto", value: grossMarginPct > 0 ? `${grossMarginPct.toFixed(1)}%` : "—", icon: Percent, color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(124,58,237,0.12)" }}>
              <s.icon size={15} color={s.color} strokeWidth={2} />
            </div>
            <p className="text-xl font-black text-[#F1F5F9]">{s.value}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mes actual vs anterior */}
      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <p className="text-sm font-semibold text-[#F1F5F9] mb-4">Comparación mensual</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#94A3B8] mb-1">Mes actual</p>
            <p className="text-2xl font-black text-[#F1F5F9]">{formatCurrency(salesMes)}</p>
            <div className="flex items-center gap-1 mt-1">
              {changePct >= 0 ? (
                <ArrowUpRight size={13} color="#22c55e" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight size={13} color="#ef4444" strokeWidth={2.5} />
              )}
              <span className="text-xs font-semibold" style={{ color: changePct >= 0 ? "#22c55e" : "#ef4444" }}>
                {changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}% vs mes anterior
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8] mb-1">Mes anterior</p>
            <p className="text-2xl font-black text-[#F1F5F9]">{formatCurrency(salesMesAnterior)}</p>
            <p className="text-xs text-[#64748B] mt-1">{prevMonthOrders.length} órdenes</p>
          </div>
        </div>
      </div>

      {/* Waterfall */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Desglose financiero (acumulado)</p>
        </div>
        <div className="divide-y divide-[rgba(124,58,237,0.08)]">
          {waterfall.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: row.type === "positive" ? "#2563EB" : row.type === "negative" ? "#ef4444" : "#22c55e",
                  }}
                />
                <span className="text-sm text-[#94A3B8]">{row.label}</span>
              </div>
              <span
                className="text-sm font-bold"
                style={{
                  color: row.type === "positive" ? "#F1F5F9" : row.type === "negative" ? "#ef4444" : "#22c55e",
                }}
              >
                {row.value < 0 ? "-" : ""}{formatCurrency(Math.abs(row.value))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      {paidOrders.length === 0 && (
        <div className="rounded-2xl p-5 text-center" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <p className="text-sm text-[#64748B]">Sin órdenes — conectá TiendaNube y sincronizá datos</p>
          <Link href="/app/configuracion/integraciones" className="text-sm text-[#7C3AED] hover:text-[#8B5CF6] mt-2 block">
            Ir a integraciones →
          </Link>
        </div>
      )}
    </div>
  );
}

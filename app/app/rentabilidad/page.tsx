import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { TrendingUp, DollarSign, Percent, ArrowUpRight, ArrowDownRight, Store, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getProducts } from "@/lib/tiendanube/client";

export const metadata: Metadata = { title: "Rentabilidad" };

export default async function RentabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = ([30, 60, 90].includes(Number(params.days)) ? Number(params.days) : 30) as 30 | 60 | 90;

  // getUser() usa React cache() — misma llamada que getTiendaNubeConnection() ya hizo
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();

  type FinConfig = { tax_rate: number; platform_fee: number; agency_fee: number; usd_rate: number };
  const { data: rawUserRow } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const userRow = rawUserRow as unknown as { workspace_id: string | null } | null;

  const [connectionResult, configResult] = await Promise.allSettled([
    getTiendaNubeConnection(),
    supabase.from("financial_config").select("*").eq("workspace_id", userRow?.workspace_id ?? "").single(),
  ]);

  const connection = connectionResult.status === "fulfilled" ? connectionResult.value : null;
  const rawConfig = configResult.status === "fulfilled" ? configResult.value.data : null;
  const cfg = (rawConfig as unknown as FinConfig | null) ?? { tax_rate: 21, platform_fee: 2, agency_fee: 0, usd_rate: 1200 };

  let allOrders: Awaited<ReturnType<typeof getOrdersForRange>> = [];
  let allProducts: Awaited<ReturnType<typeof getProducts>> = [];

  if (connection) {
    const [ordersRes, productsRes] = await Promise.allSettled([
      getOrdersForRange(connection.opts, { days }, 3),
      getProducts(connection.opts, 1, 100),
    ]);
    if (ordersRes.status === "fulfilled") allOrders = ordersRes.value;
    if (productsRes.status === "fulfilled") allProducts = productsRes.value;
  }

  const paidOrders = allOrders.filter((o) => o.payment_status === "paid" || o.status === "closed");
  const totalRevenue = paidOrders.reduce((acc, o) => acc + parseFloat(o.total), 0);

  const taxFactor = 1 + cfg.tax_rate / 100;
  const revenuePreTax = totalRevenue / taxFactor;
  const taxAmount = totalRevenue - revenuePreTax;
  const platformFeeAmount = revenuePreTax * (cfg.platform_fee / 100);
  const agencyFeeAmount = revenuePreTax * (cfg.agency_fee / 100);
  const netRevenue = revenuePreTax - platformFeeAmount - agencyFeeAmount;

  const productsWithCost = allProducts.filter((p) => {
    const price = parseFloat(p.variants[0]?.price ?? "0");
    const cost = parseFloat(p.variants[0]?.cost_price ?? "0");
    return price > 0 && cost > 0;
  });
  const avgCostRatio = productsWithCost.length > 0
    ? productsWithCost.reduce((acc, p) => {
        const price = parseFloat(p.variants[0]?.price ?? "0");
        const cost = parseFloat(p.variants[0]?.cost_price ?? "0");
        return acc + cost / price;
      }, 0) / productsWithCost.length
    : 0;
  const cogs = avgCostRatio > 0 ? netRevenue * avgCostRatio : 0;
  const grossProfit = netRevenue - cogs;
  const netMarginPct = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;
  const grossMarginPct = netRevenue > 0 && cogs > 0 ? ((netRevenue - cogs) / netRevenue) * 100 : 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthOrders = paidOrders.filter((o) => new Date(o.created_at) >= monthStart);
  const prevMonthOrders = paidOrders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= prevMonthStart && d < monthStart;
  });
  const salesMes = monthOrders.reduce((acc, o) => acc + parseFloat(o.total), 0);
  const salesMesAnterior = prevMonthOrders.reduce((acc, o) => acc + parseFloat(o.total), 0);
  const changePct = salesMesAnterior > 0 ? ((salesMes - salesMesAnterior) / salesMesAnterior) * 100 : 0;

  const waterfall = [
    { label: "Ingresos brutos", value: totalRevenue, type: "positive" as const },
    { label: `IVA / Impuesto (${cfg.tax_rate}%)`, value: -taxAmount, type: "negative" as const },
    { label: `Fee plataforma (${cfg.platform_fee}%)`, value: -platformFeeAmount, type: "negative" as const },
    ...(cfg.agency_fee > 0 ? [{ label: `Fee agencia (${cfg.agency_fee}%)`, value: -agencyFeeAmount, type: "negative" as const }] : []),
    ...(cogs > 0 ? [{ label: "Costo mercaderia (COGS)", value: -cogs, type: "negative" as const }] : []),
    { label: "Ganancia neta", value: cogs > 0 ? grossProfit : netRevenue, type: "total" as const },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Rentabilidad</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {connection ? `Datos en tiempo real desde TiendaNube (${days}d)` : "Conecta TiendaNube para ver analisis"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-1 rounded-xl p-1" style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.2)" }}>
            {([30, 60, 90] as const).map((d) => (
              <Link key={d} href={`?days=${d}`}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: days === d ? "#7C3AED" : "transparent", color: days === d ? "#fff" : "#64748B" }}
              >{d}d</Link>
            ))}
          </div>
          <Link href="/app/configuracion/financiera" className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] flex items-center gap-1">
            Editar config <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {!connection && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(124,58,237,0.3)" }}>
          <Store size={40} color="#7C3AED" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conecta tu TiendaNube</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
            style={{ background: "#7C3AED" }}>
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {connection && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Ingresos brutos", value: formatCurrency(totalRevenue), icon: DollarSign, color: "#F1F5F9" },
              { label: "Ingresos netos", value: formatCurrency(netRevenue), icon: TrendingUp, color: "#22c55e" },
              { label: "Margen neto", value: `${netMarginPct.toFixed(1)}%`, icon: Percent, color: "#e1691e" },
              { label: "Margen bruto", value: grossMarginPct > 0 ? `${grossMarginPct.toFixed(1)}%` : "Sin costo", icon: Percent, color: "#7C3AED" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(124,58,237,0.12)" }}>
                  <s.icon size={15} color={s.color} strokeWidth={2} />
                </div>
                <p className="text-lg sm:text-xl font-black text-[#F1F5F9]">{s.value}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9] mb-4">Comparacion mensual</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Mes actual</p>
                <p className="text-xl sm:text-2xl font-black text-[#F1F5F9]">{formatCurrency(salesMes)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {changePct >= 0 ? <ArrowUpRight size={13} color="#22c55e" strokeWidth={2.5} /> : <ArrowDownRight size={13} color="#ef4444" strokeWidth={2.5} />}
                  <span className="text-xs font-semibold" style={{ color: changePct >= 0 ? "#22c55e" : "#ef4444" }}>
                    {changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}% vs mes anterior
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Mes anterior</p>
                <p className="text-xl sm:text-2xl font-black text-[#F1F5F9]">{formatCurrency(salesMesAnterior)}</p>
                <p className="text-xs text-[#64748B] mt-1">{prevMonthOrders.length} ordenes</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
              <p className="text-sm font-semibold text-[#F1F5F9]">Desglose financiero ({days}d)</p>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
              {waterfall.map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: row.type === "positive" ? "#2563EB" : row.type === "negative" ? "#ef4444" : "#22c55e" }} />
                    <span className="text-sm text-[#94A3B8]">{row.label}</span>
                  </div>
                  <span className="text-sm font-bold"
                    style={{ color: row.type === "positive" ? "#F1F5F9" : row.type === "negative" ? "#ef4444" : "#22c55e" }}>
                    {row.value < 0 ? "-" : ""}{formatCurrency(Math.abs(row.value))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

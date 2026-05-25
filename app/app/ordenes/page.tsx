import type { Metadata } from "next";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, calcOrderRevenue, type TNOrder } from "@/lib/tiendanube/client";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ShoppingCart, DollarSign, TrendingUp, ArrowRight, AlertTriangle, Store } from "lucide-react";

export const metadata: Metadata = { title: "Ordenes" };

function statusLabel(o: TNOrder) {
  if (o.payment_status === "paid" || o.status === "closed") return { label: "Pagada", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (o.status === "cancelled") return { label: "Cancelada", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  if (o.payment_status === "pending") return { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return { label: o.status, color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
}

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; q?: string }>;
}) {
  const params = await searchParams;
  const days = ([30, 60, 90].includes(Number(params.days)) ? Number(params.days) : 30) as 30 | 60 | 90;
  const q = (params.q ?? "").toLowerCase();

  const connection = await getTiendaNubeConnection();

  let allOrders: TNOrder[] = [];
  let error: string | null = null;

  if (connection) {
    const result = await Promise.allSettled([getOrdersForRange(connection.opts, { days }, 3)]);
    if (result[0].status === "fulfilled") allOrders = result[0].value;
    else error = "Error al conectar con TiendaNube";
  }

  const filtered = q
    ? allOrders.filter((o) =>
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        String(o.number).includes(q)
      )
    : allOrders;

  const paid = allOrders.filter((o) => o.payment_status === "paid" || o.status === "closed");
  const totalRevenue = calcOrderRevenue(allOrders);
  const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0;
  const pending = allOrders.filter((o) => o.payment_status === "pending").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Ordenes</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Directo desde TiendaNube &middot; sin almacenamiento</p>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.2)" }}>
          {([30, 60, 90] as const).map((d) => (
            <Link key={d} href={`?days=${d}${q ? `&q=${q}` : ""}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: days === d ? "#7C3AED" : "transparent", color: days === d ? "#fff" : "#64748B" }}
            >{d}d</Link>
          ))}
        </div>
      </div>

      {!connection && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(124,58,237,0.3)" }}>
          <Store size={40} color="#7C3AED" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conecta tu TiendaNube</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
            style={{ background: "#7C3AED" }}
          >Ir a Integraciones <ArrowRight size={14} /></Link>
        </div>
      )}

      {connection && error && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={18} color="#ef4444" />
          <p className="text-sm text-[#fca5a5]">{error}</p>
        </div>
      )}

      {connection && !error && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: `Ingresos ${days}d`, value: formatCurrency(totalRevenue), icon: DollarSign, color: "#7C3AED" },
              { label: "Ordenes pagas", value: String(paid.length), icon: ShoppingCart, color: "#22c55e" },
              { label: "Ticket promedio", value: formatCurrency(avgTicket), icon: TrendingUp, color: "#2563EB" },
              { label: "Pendientes de pago", value: String(pending), icon: AlertTriangle, color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                  <s.icon size={18} color={s.color} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{s.label}</p>
                  <p className="text-lg font-bold text-[#F1F5F9]">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
              <input
                type="text"
                placeholder="Buscar por cliente o numero..."
                defaultValue={q}
                className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#64748B]"
                readOnly
              />
              <span className="text-xs text-[#64748B]">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#64748B]">Sin ordenes en este periodo</div>
              ) : (
                filtered.slice(0, 100).map((o) => {
                  const { label, color, bg } = statusLabel(o);
                  return (
                    <div key={o.id} className="flex items-center gap-3 p-3 hover:bg-[rgba(124,58,237,0.04)] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#F1F5F9]">#{o.number ?? o.id}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color, background: bg }}>{label}</span>
                        </div>
                        <p className="text-xs text-[#64748B] truncate">{o.customer?.name ?? "Anonimo"} &middot; {o.customer?.email ?? ""}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(parseFloat(o.total))}</p>
                        <p className="text-xs text-[#64748B]">{new Date(o.created_at).toLocaleDateString("es-AR")}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

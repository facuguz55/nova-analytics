import type { Metadata } from "next";
import { Store, Users, DollarSign, TrendingUp, ShoppingCart, ArrowRight, AlertTriangle, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import {
  getOrdersForRange,
  getProducts,
  getCustomers,
  getProductName,
  calcOrderRevenue,
  type TNOrder,
  type TNProduct,
  type TNCustomer,
} from "@/lib/tiendanube/client";

export const metadata: Metadata = { title: "Tienda Web" };

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon size={18} color={color} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xs text-[#64748B]">{label}</p>
        <p className="text-lg font-bold text-[#F1F5F9]">{value}</p>
        {sub && <p className="text-xs text-[#64748B]">{sub}</p>}
      </div>
    </div>
  );
}

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = ([30, 60, 90].includes(Number(params.days)) ? Number(params.days) : 30) as 30 | 60 | 90;

  const connection = await getTiendaNubeConnection();
  const isConnected = !!connection;

  let allOrders: TNOrder[] = [];
  let products: TNProduct[] = [];
  let customers: TNCustomer[] = [];
  let error: string | null = null;

  if (isConnected && connection) {
    const [ordersRes, productsRes, customersRes] = await Promise.allSettled([
      getOrdersForRange(connection.opts, { days }, 3),
      getProducts(connection.opts, 1, 100),
      getCustomers(connection.opts, 1, 100),
    ]);
    if (ordersRes.status === "fulfilled") allOrders = ordersRes.value;
    else error = "Error al cargar ordenes desde TiendaNube";
    if (productsRes.status === "fulfilled") products = productsRes.value;
    if (customersRes.status === "fulfilled") customers = customersRes.value;
  }

  const paidOrders = allOrders.filter((o) => o.payment_status === "paid" || o.status === "closed");
  const totalRevenue = calcOrderRevenue(allOrders);
  const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const lowStock = products.filter((p) => p.variants.some((v) => (v.stock ?? 0) <= 5 && (v.stock ?? 0) > 0));
  const outOfStock = products.filter((p) => p.variants.every((v) => (v.stock ?? 0) <= 0));
  const recurrentes = customers.filter((c) => c.orders_count > 1);
  const convRate = allOrders.length > 0 ? ((paidOrders.length / allOrders.length) * 100).toFixed(1) : "0";
  const topProducts = [...products]
    .sort((a, b) => parseFloat(b.variants[0]?.price ?? "0") - parseFloat(a.variants[0]?.price ?? "0"))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Tienda Web</h1>
          {isConnected && connection && (
            <p className="text-sm text-[#94A3B8] mt-0.5">
              <span className="text-green-400">&#9679;</span>{" "}
              {connection.storeName ?? `Store #${connection.storeId}`} &middot; Datos en tiempo real
            </p>
          )}
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.2)" }}>
          {([30, 60, 90] as const).map((d) => (
            <Link
              key={d}
              href={`?days=${d}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: days === d ? "#7C3AED" : "transparent", color: days === d ? "#fff" : "#64748B" }}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      {!isConnected && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(124,58,237,0.3)" }}>
          <Store size={40} color="#7C3AED" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conecta tu TiendaNube</p>
          <p className="text-sm text-[#64748B] mb-4">Para ver tus ventas, productos y clientes en tiempo real</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#7C3AED" }}
          >
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {isConnected && error && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={18} color="#ef4444" />
          <p className="text-sm text-[#fca5a5]">{error}</p>
        </div>
      )}

      {isConnected && !error && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label={`Ingresos (${days}d)`} value={formatCurrency(totalRevenue)} icon={DollarSign} color="#7C3AED" sub={`${paidOrders.length} ordenes pagas`} />
            <StatCard label="Ticket promedio" value={formatCurrency(avgTicket)} icon={ShoppingCart} color="#22c55e" />
            <StatCard label="Clientes" value={String(customers.length)} icon={Users} color="#2563EB" sub={`${recurrentes.length} recurrentes`} />
            <StatCard label="Conversion" value={`${convRate}%`} icon={TrendingUp} color="#f59e0b" sub={`${allOrders.length} ordenes`} />
          </div>

          {(lowStock.length > 0 || outOfStock.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outOfStock.length > 0 && (
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <AlertTriangle size={18} color="#ef4444" className="flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#fca5a5]">{outOfStock.length} productos sin stock</p>
                    <p className="text-xs text-[#64748B]">Revisa el inventario urgente</p>
                  </div>
                </div>
              )}
              {lowStock.length > 0 && (
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a00", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <Package size={18} color="#f59e0b" className="flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#fcd34d]">{lowStock.length} con stock bajo</p>
                    <p className="text-xs text-[#64748B]">Menos de 5 unidades</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Top Productos</h2>
              {topProducts.length === 0 ? (
                <p className="text-sm text-[#64748B]">Sin datos de productos</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p) => {
                    const name = getProductName(p);
                    const price = parseFloat(p.variants[0]?.price ?? "0");
                    const stock = p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
                    return (
                      <div key={p.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.1)" }}>
                            <Package size={14} color="#7C3AED" />
                          </div>
                          <span className="text-sm text-[#CBD5E1] truncate max-w-[160px]">{name}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(price)}</p>
                          <p className="text-xs text-[#64748B]">{stock} en stock</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link href="/app/productos" className="flex items-center gap-1 text-xs text-[#7C3AED] font-medium">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            <div className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Ordenes Recientes</h2>
              {allOrders.length === 0 ? (
                <p className="text-sm text-[#64748B]">Sin ordenes en el periodo</p>
              ) : (
                <div className="space-y-2">
                  {allOrders.slice(0, 10).map((o) => {
                    const isPaid = o.payment_status === "paid" || o.status === "closed";
                    const sc = isPaid ? "#22c55e" : o.status === "cancelled" ? "#ef4444" : "#f59e0b";
                    return (
                      <div key={o.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc }} />
                          <div className="min-w-0">
                            <p className="text-sm text-[#CBD5E1] truncate">{o.customer?.name ?? "Anonimo"}</p>
                            <p className="text-xs text-[#64748B]">{new Date(o.created_at).toLocaleDateString("es-AR")}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#F1F5F9] flex-shrink-0">{formatCurrency(parseFloat(o.total))}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link href="/app/ordenes" className="flex items-center gap-1 text-xs text-[#7C3AED] font-medium">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

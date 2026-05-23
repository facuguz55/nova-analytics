import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Store, Users, DollarSign, TrendingUp, ShoppingCart, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Tienda Web" };

export default async function TiendaPage() {
  const supabase = await createClient();

  type TnOrder = { total: number; status: string | null; created_at: string | null };
  type TnProduct = { id: string; name: string; stock: number; price: number };
  type TnCustomer = { id: string; orders_count: number; total_spent: number };
  type IntRow = { status: string; metadata: Record<string, string> | null; updated_at: string; store_id: string | null };

  const [
    { data: rawOrders },
    { data: rawProducts },
    { data: rawCustomers },
    { data: rawIntegration },
  ] = await Promise.all([
    supabase.from("tn_orders").select("total, status, created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("tn_products").select("id, name, stock, price").order("stock", { ascending: true }).limit(200),
    supabase.from("tn_customers").select("id, orders_count, total_spent").limit(1000),
    supabase.from("integrations").select("status, metadata, updated_at, store_id").eq("provider", "tiendanube").maybeSingle(),
  ]);

  const allOrders = (rawOrders ?? []) as unknown as TnOrder[];
  const allProducts = (rawProducts ?? []) as unknown as TnProduct[];
  const allCustomers = (rawCustomers ?? []) as unknown as TnCustomer[];
  const integration = rawIntegration as unknown as IntRow | null;

  const paidOrders = allOrders.filter((o) => o.status === "paid" || o.status === "closed");
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);

  const lowStockProducts = allProducts.filter((p) => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = allProducts.filter((p) => p.stock <= 0);
  const recurrentes = allCustomers.filter((c) => c.orders_count > 1);
  const conversionRate = allOrders.length > 0 ? ((paidOrders.length / allOrders.length) * 100).toFixed(1) : "0";
  const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Top 5 productos más vendidos (por precio más alto — proxy sin info de volumen exacto)
  const topProducts = [...allProducts].sort((a, b) => b.price - a.price).slice(0, 5);

  const isConnected = integration?.status === "active";
  const storeMeta = integration?.metadata ?? null;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Tienda Web
          </h1>
          {isConnected && integration?.store_id && (
            <p className="text-sm text-[#94A3B8] mt-0.5">
              <span className="text-green-400">●</span>{" "}
              {storeMeta?.store_name ?? `Store #${integration.store_id}`} · Conectado
            </p>
          )}
          {!isConnected && (
            <Link href="/app/configuracion/integraciones" className="text-sm text-yellow-400 hover:underline mt-0.5 block">
              ⚠ TiendaNube no conectado — hacé clic para conectar
            </Link>
          )}
        </div>
        {isConnected && (
          <p className="text-xs text-[#64748B]">
            Última sync: {integration?.updated_at ? new Date(integration.updated_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
          </p>
        )}
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Total órdenes", value: String(allOrders.length), icon: ShoppingCart, color: "#7C3AED" },
          { label: "Órdenes pagadas", value: String(paidOrders.length), icon: TrendingUp, color: "#22c55e" },
          { label: "Facturación", value: formatCurrency(totalRevenue), icon: DollarSign, color: "#e1691e" },
          { label: "Ticket promedio", value: formatCurrency(avgTicket), icon: DollarSign, color: "#2563EB" },
          { label: "Conversión", value: `${conversionRate}%`, icon: TrendingUp, color: "#f59e0b" },
          { label: "Total clientes", value: String(allCustomers.length), icon: Users, color: "#8B5CF6" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.color}18` }}>
              <s.icon size={15} color={s.color} strokeWidth={2} />
            </div>
            <p className="text-xl font-black text-[#F1F5F9]">{s.value}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stock crítico */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
            <div>
              <p className="font-semibold text-[#F1F5F9] text-sm">Stock crítico</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {outOfStockProducts.length} sin stock · {lowStockProducts.length} stock bajo
              </p>
            </div>
            <Link href="/app/productos" className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] flex items-center gap-1">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-[rgba(124,58,237,0.08)]">
            {[...outOfStockProducts, ...lowStockProducts].slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.stock <= 0 ? "#ef4444" : "#f59e0b" }} />
                  <span className="text-sm text-[#F1F5F9] truncate max-w-[200px]">{p.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: p.stock <= 0 ? "#ef4444" : "#f59e0b" }}>
                    {p.stock <= 0 ? "Sin stock" : `${p.stock} u.`}
                  </span>
                </div>
              </div>
            ))}
            {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[#64748B]">
                ✓ Todo el stock en niveles normales
              </div>
            )}
          </div>
        </div>

        {/* Top productos + clientes */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
            <div>
              <p className="font-semibold text-[#F1F5F9] text-sm">Resumen de clientes</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{recurrentes.length} recurrentes / {allCustomers.length} totales</p>
            </div>
            <Link href="/app/clientes" className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] flex items-center gap-1">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "Nuevos clientes (1 compra)", value: allCustomers.filter((c) => c.orders_count === 1).length, color: "#7C3AED" },
              { label: "Clientes recurrentes (2+ compras)", value: recurrentes.length, color: "#e1691e" },
              { label: "Clientes VIP (5+ compras)", value: allCustomers.filter((c) => c.orders_count >= 5).length, color: "#22c55e" },
            ].map((row) => {
              const pct = allCustomers.length > 0 ? (row.value / allCustomers.length) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#94A3B8]">{row.label}</span>
                    <span className="text-sm font-bold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(124,58,237,0.1)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: row.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Products highlight */}
          <div className="px-5 pb-5">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">Top productos por precio</p>
            <div className="space-y-1">
              {topProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-[#F1F5F9] max-w-[200px]">{p.name}</span>
                  <span className="text-[#e1691e] font-semibold flex-shrink-0 ml-2">{formatCurrency(p.price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Integraciones info */}
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <Store size={13} color="#7C3AED" strokeWidth={2} />
              <span className="text-xs text-[#94A3B8]">
                {isConnected
                  ? `TiendaNube conectado · ${allProducts.length} productos · ${allOrders.length} órdenes`
                  : "Conectá TiendaNube para ver datos reales"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

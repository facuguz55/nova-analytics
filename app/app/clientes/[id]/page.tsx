import type { Metadata } from "next";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getCustomers, getOrders, type TNCustomer, type TNOrder } from "@/lib/tiendanube/client";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Crown, ShoppingCart, DollarSign, Calendar,
  MapPin, Phone, Mail, TrendingUp, Package,
} from "lucide-react";

export const metadata: Metadata = { title: "Perfil de cliente" };

function statusInfo(o: TNOrder) {
  if (o.payment_status === "paid" || o.status === "closed")
    return { label: "Pagada",    color: "#22c55e", bg: "rgba(34,197,94,0.1)"  };
  if (o.status === "cancelled")
    return { label: "Cancelada", color: "#ef4444", bg: "rgba(239,68,68,0.1)"  };
  if (o.payment_status === "pending")
    return { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return   { label: o.status,   color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
}

export default async function ClientePerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (isNaN(customerId)) notFound();

  const connection = await getTiendaNubeConnection();
  if (!connection) {
    return (
      <div className="p-4 sm:p-6">
        <Link href="/app/clientes" className="flex items-center gap-2 text-sm text-[#64748B] mb-6 hover:text-[#94A3B8]">
          <ArrowLeft size={14} /> Volver a Clientes
        </Link>
        <p className="text-[#94A3B8]">Conectá TiendaNube para ver el perfil del cliente.</p>
      </div>
    );
  }

  // Buscar el cliente por ID (TiendaNube no tiene endpoint GET /customers/:id en la API pública v1 auth básica)
  // Cargamos las primeras páginas y filtramos
  const [p1, p2, p3] = await Promise.allSettled([
    getCustomers(connection.opts, 1, 100),
    getCustomers(connection.opts, 2, 100),
    getCustomers(connection.opts, 3, 100),
  ]);
  const allCustomers: TNCustomer[] = [
    ...(p1.status === "fulfilled" ? p1.value : []),
    ...(p2.status === "fulfilled" ? p2.value : []),
    ...(p3.status === "fulfilled" ? p3.value : []),
  ];

  const customer = allCustomers.find((c) => c.id === customerId);
  if (!customer) notFound();

  // Cargar órdenes y filtrar por cliente
  const [o1, o2, o3] = await Promise.allSettled([
    getOrders(connection.opts, 1, 100),
    getOrders(connection.opts, 2, 100),
    getOrders(connection.opts, 3, 100),
  ]);
  const allOrders: TNOrder[] = [
    ...(o1.status === "fulfilled" ? o1.value : []),
    ...(o2.status === "fulfilled" ? o2.value : []),
    ...(o3.status === "fulfilled" ? o3.value : []),
  ];
  const customerOrders = allOrders
    .filter((o) => o.customer?.id === customerId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalSpent  = customerOrders
    .filter((o) => o.payment_status === "paid" || o.status === "closed")
    .reduce((acc, o) => acc + parseFloat(o.total), 0);
  const paidCount   = customerOrders.filter((o) => o.payment_status === "paid" || o.status === "closed").length;
  const avgTicket   = paidCount > 0 ? totalSpent / paidCount : 0;
  const firstOrder  = customerOrders.at(-1);
  const lastOrder   = customerOrders.at(0);
  const isVIP       = customer.orders_count > 1;

  // Productos más comprados
  const productCount: Record<string, number> = {};
  for (const o of customerOrders) {
    for (const p of o.products ?? []) {
      productCount[p.name] = (productCount[p.name] ?? 0) + p.quantity;
    }
  }
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-3xl">
      {/* Back */}
      <Link href="/app/clientes"
        className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors">
        <ArrowLeft size={14} strokeWidth={2} />
        Volver a Clientes
      </Link>

      {/* Header */}
      <div className="rounded-2xl p-4 sm:p-5 flex items-start gap-4"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-[#7C3AED] flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.15)" }}>
          {customer.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              {customer.name}
            </h1>
            {isVIP && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(225,105,30,0.15)", color: "#e1691e" }}>
                <Crown size={10} strokeWidth={2.5} />
                VIP
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {customer.email && (
              <a href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                <Mail size={12} strokeWidth={2} />
                {customer.email}
              </a>
            )}
            {customer.phone && (
              <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <Phone size={12} strokeWidth={2} />
                {customer.phone}
              </span>
            )}
            {customer.default_address?.city && (
              <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <MapPin size={12} strokeWidth={2} />
                {customer.default_address.city}
                {customer.default_address.province ? `, ${customer.default_address.province}` : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Cliente desde {new Date(customer.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total gastado",  value: formatCurrency(totalSpent), icon: DollarSign,   color: "#7C3AED" },
          { label: "Órdenes pagas",  value: String(paidCount),          icon: ShoppingCart,  color: "#22c55e" },
          { label: "Ticket promedio",value: formatCurrency(avgTicket),  icon: TrendingUp,    color: "#2563EB" },
          { label: "Total órdenes",  value: String(customerOrders.length), icon: Calendar,  color: "#e1691e" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.18)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${s.color}18` }}>
              <s.icon size={15} color={s.color} strokeWidth={2} />
            </div>
            <div>
              <p className="text-lg font-black text-[#F1F5F9]">{s.value}</p>
              <p className="text-xs text-[#64748B]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Productos más comprados */}
        {topProducts.length > 0 && (
          <div className="rounded-2xl p-5"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.18)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Package size={14} color="#8B5CF6" strokeWidth={2} />
              <p className="text-sm font-semibold text-[#F1F5F9]">Productos más comprados</p>
            </div>
            <div className="space-y-2.5">
              {topProducts.map(([name, qty], i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[#CBD5E1] truncate flex-1">{name}</p>
                  <span className="text-xs font-bold text-[#8B5CF6] flex-shrink-0">{qty}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fechas importantes */}
        <div className="rounded-2xl p-5"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.18)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} color="#8B5CF6" strokeWidth={2} />
            <p className="text-sm font-semibold text-[#F1F5F9]">Historial</p>
          </div>
          <div className="space-y-3">
            {firstOrder && (
              <div>
                <p className="text-xs text-[#64748B]">Primera compra</p>
                <p className="text-sm text-[#F1F5F9]">
                  {new Date(firstOrder.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            )}
            {lastOrder && (
              <div>
                <p className="text-xs text-[#64748B]">Última compra</p>
                <p className="text-sm text-[#F1F5F9]">
                  {new Date(lastOrder.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            )}
            {firstOrder && lastOrder && firstOrder.id !== lastOrder.id && (
              <div>
                <p className="text-xs text-[#64748B]">Frecuencia promedio</p>
                <p className="text-sm text-[#F1F5F9]">
                  {(() => {
                    const days = Math.round(
                      (new Date(lastOrder.created_at).getTime() - new Date(firstOrder.created_at).getTime()) /
                      (86400000 * Math.max(customerOrders.length - 1, 1))
                    );
                    return `cada ${days} día${days !== 1 ? "s" : ""}`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de órdenes */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.18)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">
            Historial de órdenes ({customerOrders.length})
          </p>
        </div>
        {customerOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            Sin órdenes encontradas para este cliente
          </div>
        ) : (
          <div>
            {customerOrders.map((o, i) => {
              const st = statusInfo(o);
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: i < customerOrders.length - 1 ? "1px solid rgba(124,58,237,0.07)" : "none" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#8B5CF6]">#{o.number ?? o.id}</p>
                    {o.products?.length > 0 && (
                      <p className="text-xs text-[#64748B] truncate mt-0.5">
                        {o.products.slice(0, 2).map((p) => p.name).join(", ")}
                        {o.products.length > 2 && ` +${o.products.length - 2} más`}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: st.color, background: st.bg }}>
                    {st.label}
                  </span>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#F1F5F9]">{formatCurrency(parseFloat(o.total))}</p>
                    <p className="text-xs text-[#64748B]">
                      {new Date(o.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

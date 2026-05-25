import type { Metadata } from "next";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getCustomers, type TNCustomer } from "@/lib/tiendanube/client";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Users, Crown, ShoppingCart, DollarSign, Store, ArrowRight, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").toLowerCase();

  const connection = await getTiendaNubeConnection();
  let customers: TNCustomer[] = [];
  let error: string | null = null;

  if (connection) {
    const [c1, c2] = await Promise.allSettled([
      getCustomers(connection.opts, 1, 100),
      getCustomers(connection.opts, 2, 100),
    ]);
    if (c1.status === "fulfilled") customers = [...customers, ...c1.value];
    if (c2.status === "fulfilled") customers = [...customers, ...c2.value];
    if (c1.status === "rejected") error = "Error al cargar clientes desde TiendaNube";
  }

  const filtered = q
    ? customers.filter((c) =>
        c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
      )
    : customers;

  const recurrentes = customers.filter((c) => c.orders_count > 1);
  const topClient = customers[0];
  const totalSpent = customers.reduce((acc, c) => acc + parseFloat(c.total_spent || "0"), 0);
  const avgSpent = customers.length > 0 ? totalSpent / customers.length : 0;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Clientes</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          {connection ? `${customers.length} clientes en tiempo real desde TiendaNube` : "Conecta tu TiendaNube"}
        </p>
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
              { label: "Total clientes", value: String(customers.length), icon: Users, color: "#7C3AED" },
              { label: "Recurrentes", value: String(recurrentes.length), icon: Crown, color: "#e1691e" },
              { label: "Gasto promedio", value: formatCurrency(avgSpent), icon: ShoppingCart, color: "#22c55e" },
              { label: "Facturacion total", value: formatCurrency(totalSpent), icon: DollarSign, color: "#2563EB" },
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

          {topClient && (
            <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <Crown size={20} color="#7C3AED" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#64748B]">Top cliente</p>
                <p className="text-sm font-semibold text-[#F1F5F9]">{topClient.name}</p>
                <p className="text-xs text-[#64748B]">{topClient.email} &middot; {topClient.orders_count} ordenes</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-[#7C3AED]">{formatCurrency(parseFloat(topClient.total_spent))}</p>
                <p className="text-xs text-[#64748B]">gastado total</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
              <span className="text-sm text-[#94A3B8]">{filtered.length} cliente{filtered.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#64748B]">Sin clientes que coincidan</div>
              ) : (
                filtered.slice(0, 100).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 hover:bg-[rgba(124,58,237,0.04)] transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#7C3AED]"
                      style={{ background: "rgba(124,58,237,0.12)" }}>
                      {c.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F1F5F9] truncate">{c.name}</p>
                      <p className="text-xs text-[#64748B] truncate">{c.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(parseFloat(c.total_spent || "0"))}</p>
                      <p className="text-xs text-[#64748B]">{c.orders_count} orden{c.orders_count !== 1 ? "es" : ""}</p>
                    </div>
                    {c.orders_count > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                        style={{ background: "rgba(225,105,30,0.15)", color: "#e1691e" }}>
                        VIP
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

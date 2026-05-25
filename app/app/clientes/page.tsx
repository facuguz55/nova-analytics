import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Users, Crown, ShoppingCart, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("tn_customers")
    .select("id, external_id, name, email, orders_count, total_spent")
    .order("total_spent", { ascending: false })
    .limit(200);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%`);
  }

  type CustomerRow = { id: string; external_id: string; name: string | null; email: string | null; orders_count: number; total_spent: number };
  const { data: customers } = await query;
  const all = (customers ?? []) as unknown as CustomerRow[];

  const recurrentes = all.filter((c) => c.orders_count > 1);
  const topClient = all[0];
  const avgSpent = all.length > 0 ? all.reduce((acc, c) => acc + c.total_spent, 0) / all.length : 0;
  const totalSpent = all.reduce((acc, c) => acc + c.total_spent, 0);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Clientes
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">{all.length} clientes sincronizados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total clientes", value: String(all.length), icon: Users, color: "#7C3AED" },
          { label: "Recurrentes", value: String(recurrentes.length), icon: Crown, color: "#e1691e" },
          { label: "Ticket promedio", value: formatCurrency(avgSpent), icon: ShoppingCart, color: "#22c55e" },
          { label: "Facturación total", value: formatCurrency(totalSpent), icon: DollarSign, color: "#2563EB" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
              <s.icon size={18} color={s.color} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xl font-black text-[#F1F5F9]">{s.value}</p>
              <p className="text-xs text-[#94A3B8]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top client */}
      {topClient && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#111118", border: "1px solid rgba(225,105,30,0.3)" }}
        >
          <Crown size={16} color="#e1691e" strokeWidth={2} />
          <span className="text-sm text-[#94A3B8]">Top cliente:</span>
          <span className="text-sm font-bold text-[#F1F5F9]">{topClient.name ?? "Sin nombre"}</span>
          <span className="text-sm text-[#64748B]">·</span>
          <span className="text-sm font-semibold text-[#e1691e]">{formatCurrency(topClient.total_spent)}</span>
          <span className="text-xs text-[#64748B]">en {topClient.orders_count} órdenes</span>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
                {["CLIENTE", "EMAIL", "ÓRDENES", "FACTURACIÓN TOTAL", "PERFIL"].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#64748B]">
                    Sin clientes — conectá TiendaNube para sincronizar
                  </td>
                </tr>
              ) : all.map((c, i) => {
                const isRecurrente = c.orders_count > 1;
                const isTop = i === 0;
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-[rgba(124,58,237,0.04)] transition-colors"
                    style={{ borderBottom: i < all.length - 1 ? "1px solid rgba(124,58,237,0.08)" : "none" }}
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isTop && <Crown size={13} color="#e1691e" strokeWidth={2} />}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
                        >
                          {(c.name ?? "?")[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#F1F5F9]">{c.name ?? "Sin nombre"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <span className="block truncate text-xs text-[#94A3B8]">{c.email ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-[#F1F5F9]">{c.orders_count}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-black text-[#F1F5F9]">{formatCurrency(c.total_spent)}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {isRecurrente ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border" style={{ background: "rgba(225,105,30,0.1)", color: "#e1691e", borderColor: "rgba(225,105,30,0.3)" }}>
                          <Crown size={10} strokeWidth={2.5} /> Recurrente
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border" style={{ background: "rgba(100,116,139,0.1)", color: "#94A3B8", borderColor: "rgba(100,116,139,0.2)" }}>
                          Nuevo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

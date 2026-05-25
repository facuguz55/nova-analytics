import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Productos / Stock" };

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("tn_products")
    .select("id, external_id, name, stock, price, cost")
    .order("stock", { ascending: true });

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }
  if (params.stock === "low") {
    query = query.lte("stock", 5);
  }

  type ProductRow = { id: string; external_id: string; name: string; stock: number; price: number; cost: number };
  const { data: rawProducts } = await query.limit(200);
  const all = (rawProducts ?? []) as unknown as ProductRow[];

  const lowStock = all.filter((p) => p.stock <= 5 && p.stock >= 0);
  const outOfStock = all.filter((p) => p.stock <= 0);
  const totalValue = all.reduce((acc, p) => acc + p.price * Math.max(p.stock, 0), 0);
  const avgMargin = all.length > 0
    ? all.filter((p) => p.price > 0).reduce((acc, p) => acc + ((p.price - p.cost) / p.price) * 100, 0) / Math.max(all.filter((p) => p.price > 0).length, 1)
    : 0;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Productos / Stock
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">{all.length} productos sincronizados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total productos", value: String(all.length), icon: Package, color: "#7C3AED" },
          { label: "Stock bajo (≤5)", value: String(lowStock.length), icon: AlertTriangle, color: "#f59e0b", alert: lowStock.length > 0 },
          { label: "Sin stock", value: String(outOfStock.length), icon: AlertTriangle, color: "#ef4444", alert: outOfStock.length > 0 },
          { label: "Valor del inventario", value: formatCurrency(totalValue), icon: DollarSign, color: "#22c55e" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: "#111118",
              border: `1px solid ${s.alert ? `${s.color}40` : "rgba(124,58,237,0.2)"}`,
            }}
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

      {/* Avg margin */}
      {avgMargin > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(225,105,30,0.12)" }}>
            <TrendingUp size={16} color="#e1691e" strokeWidth={2} />
          </div>
          <div>
            <span className="text-sm text-[#94A3B8]">Margen bruto promedio: </span>
            <span className="text-sm font-bold text-[#e1691e]">{avgMargin.toFixed(1)}%</span>
          </div>
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
                {["PRODUCTO", "STOCK", "PRECIO VENTA", "COSTO", "MARGEN", "ESTADO"].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#64748B]">
                    Sin productos — conectá TiendaNube para sincronizar
                  </td>
                </tr>
              ) : all.map((product, i) => {
                const margin = product.price > 0 ? ((product.price - product.cost) / product.price * 100) : 0;
                const isLow = product.stock > 0 && product.stock <= 5;
                const isOut = product.stock <= 0;
                const stockColor = isOut ? "#ef4444" : isLow ? "#f59e0b" : "#22c55e";

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-[rgba(124,58,237,0.04)] transition-colors"
                    style={{ borderBottom: i < all.length - 1 ? "1px solid rgba(124,58,237,0.08)" : "none" }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#475569] font-mono">#{product.external_id}</span>
                        <span className="text-sm font-medium text-[#F1F5F9] truncate max-w-[240px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold" style={{ color: stockColor }}>
                        {product.stock <= 0 ? "Sin stock" : product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm text-[#94A3B8]">{product.cost > 0 ? formatCurrency(product.cost) : "—"}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: margin >= 30 ? "#22c55e" : margin >= 10 ? "#f59e0b" : "#ef4444" }}
                      >
                        {product.cost > 0 ? `${margin.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>
                          <AlertTriangle size={10} strokeWidth={2.5} /> Sin stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)" }}>
                          <AlertTriangle size={10} strokeWidth={2.5} /> Stock bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" }}>
                          OK
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

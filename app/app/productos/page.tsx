import type { Metadata } from "next";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getProducts, getProductName, type TNProduct } from "@/lib/tiendanube/client";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Package, AlertTriangle, DollarSign, TrendingUp, Store, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Productos / Stock" };

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").toLowerCase();
  const stockFilter = params.stock ?? "all";

  const connection = await getTiendaNubeConnection();
  let products: TNProduct[] = [];
  let error: string | null = null;

  if (connection) {
    const [p1, p2, p3, p4] = await Promise.allSettled([
      getProducts(connection.opts, 1, 100),
      getProducts(connection.opts, 2, 100),
      getProducts(connection.opts, 3, 100),
      getProducts(connection.opts, 4, 100),
    ]);
    if (p1.status === "fulfilled") products = [...products, ...p1.value];
    if (p2.status === "fulfilled") products = [...products, ...p2.value];
    if (p3.status === "fulfilled") products = [...products, ...p3.value];
    if (p4.status === "fulfilled") products = [...products, ...p4.value];
    if (p1.status === "rejected") error = "Error al cargar productos desde TiendaNube";
  }

  let filtered = products;
  if (q) filtered = filtered.filter((p) => getProductName(p).toLowerCase().includes(q));
  if (stockFilter === "low") filtered = filtered.filter((p) => p.variants.some((v) => (v.stock ?? 0) > 0 && (v.stock ?? 0) <= 5));
  if (stockFilter === "out") filtered = filtered.filter((p) => p.variants.every((v) => (v.stock ?? 0) <= 0));

  const lowStock = products.filter((p) => p.variants.some((v) => (v.stock ?? 0) > 0 && (v.stock ?? 0) <= 5));
  const outOfStock = products.filter((p) => p.variants.every((v) => (v.stock ?? 0) <= 0));
  const totalValue = products.reduce((acc, p) => {
    const price = parseFloat(p.variants[0]?.price ?? "0");
    const stock = p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
    return acc + price * Math.max(stock, 0);
  }, 0);
  const avgMargin = (() => {
    const withCost = products.filter((p) => p.variants[0]?.cost);
    if (withCost.length === 0) return 0;
    const sum = withCost.reduce((acc, p) => {
      const price = parseFloat(p.variants[0]?.price ?? "0");
      const cost = parseFloat(p.variants[0]?.cost ?? "0");
      return acc + (price > 0 ? ((price - cost) / price) * 100 : 0);
    }, 0);
    return sum / withCost.length;
  })();

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Productos / Stock</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          {connection ? `${products.length} productos en tiempo real desde TiendaNube` : "Conecta tu TiendaNube"}
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
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total productos", value: String(products.length), icon: Package, color: "#7C3AED" },
              { label: "Stock bajo (<=5)", value: String(lowStock.length), icon: AlertTriangle, color: "#f59e0b" },
              { label: "Sin stock", value: String(outOfStock.length), icon: AlertTriangle, color: "#ef4444" },
              { label: "Valor inventario", value: formatCurrency(totalValue), icon: DollarSign, color: "#22c55e" },
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

          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Todos", value: "all" },
              { label: "Stock bajo", value: "low" },
              { label: "Sin stock", value: "out" },
            ].map((f) => (
              <Link key={f.value} href={`?stock=${f.value}${q ? `&q=${q}` : ""}`}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: stockFilter === f.value ? "#7C3AED" : "rgba(124,58,237,0.1)",
                  color: stockFilter === f.value ? "#fff" : "#94A3B8",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              >{f.label}</Link>
            ))}
          </div>

          <div className="rounded-2xl overflow-x-auto" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
              <span className="text-sm text-[#94A3B8]">{filtered.length} producto{filtered.length !== 1 ? "s" : ""}</span>
              {avgMargin > 0 && <span className="text-xs text-[#64748B]">Margen prom: {avgMargin.toFixed(1)}%</span>}
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#64748B]">Sin productos que coincidan</div>
              ) : (
                filtered.slice(0, 150).map((p) => {
                  const name = getProductName(p);
                  const totalStock = p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
                  const price = parseFloat(p.variants[0]?.price ?? "0");
                  const cost = parseFloat(p.variants[0]?.cost ?? "0");
                  const margin = price > 0 && cost > 0 ? ((price - cost) / price * 100).toFixed(1) : null;
                  const stockColor = totalStock <= 0 ? "#ef4444" : totalStock <= 5 ? "#f59e0b" : "#22c55e";
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-[rgba(124,58,237,0.04)] transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.1)" }}>
                        <Package size={14} color="#7C3AED" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F1F5F9] truncate">{name}</p>
                        <p className="text-xs text-[#64748B]">{p.variants.length} variante{p.variants.length !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(price)}</p>
                        <p className="text-xs font-medium" style={{ color: stockColor }}>
                          {totalStock <= 0 ? "Sin stock" : `${totalStock} en stock`}
                        </p>
                        {margin && <p className="text-xs text-[#64748B]">Margen: {margin}%</p>}
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

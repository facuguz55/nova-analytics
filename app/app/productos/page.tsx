import type { Metadata } from "next";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getAllProducts, getProductName, type TNProduct } from "@/lib/tiendanube/client";
import Link from "next/link";
import { AlertTriangle, Store, ArrowRight } from "lucide-react";
import ProductosClient, { type ProdRow } from "./ProductosClient";

export const metadata: Metadata = { title: "Productos / Stock" };

export default async function ProductosPage() {
  const connection = await getTiendaNubeConnection();
  let products: TNProduct[] = [];
  let error: string | null = null;

  if (connection) {
    const result = await getAllProducts(connection.opts).catch(() => null);
    if (result) products = result;
    else error = "Error al cargar productos desde TiendaNube";
  }

  const rows: ProdRow[] = products.map((p) => ({
    id: p.id,
    name: getProductName(p),
    variants: p.variants.map((v) => ({
      price: parseFloat(v.price ?? "0") || 0,
      cost: parseFloat(v.cost ?? "0") || 0,
      stock: v.stock ?? 0,
    })),
  }));

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Productos / Stock</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          {connection ? `${products.length} productos en tiempo real desde TiendaNube` : "Conectá tu TiendaNube"}
        </p>
      </div>

      {!connection && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(139,92,246,0.3)" }}>
          <Store size={40} color="#8b5cf6" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conectá tu TiendaNube</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
            style={{ background: "#8b5cf6", boxShadow: "0 0 16px rgba(139,92,246,0.4)" }}>
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {connection && error && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={18} color="#ef4444" />
          <p className="text-sm text-[#fca5a5]">{error}</p>
        </div>
      )}

      {connection && !error && <ProductosClient products={rows} />}
    </div>
  );
}

import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { getUser, getCachedUserRow } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getAllProducts, getProductName } from "@/lib/tiendanube/client";
import Link from "next/link";
import { AlertTriangle, Store, ArrowRight } from "lucide-react";
import ProductosClient, { type ProdRow } from "./ProductosClient";

export const metadata: Metadata = { title: "Productos / Stock" };

export default async function ProductosPage() {
  const user = await getUser();
  if (!user) return null;

  const userRow = await getCachedUserRow(user.id);
  if (!userRow) return null;

  const workspaceId = userRow.workspace_id;
  const db = createServiceClient() as any;

  let rows: ProdRow[] = [];
  let error: string | null = null;
  let isConnected = false;

  // ¿Hay datos sincronizados?
  const { count: syncedCount } = await db
    .from("tn_products")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const hasSyncedData = (syncedCount ?? 0) > 0;

  if (hasSyncedData) {
    // ── Leer de Supabase (~30ms) ──────────────────────────────────────
    const { data, error: dbErr } = await db
      .from("tn_products")
      .select("external_id, name, price, cost, stock, variants")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    if (dbErr) {
      error = "Error al cargar productos";
    } else {
      rows = (data ?? []).map((p: any) => {
        const variants: any[] = Array.isArray(p.variants)
          ? p.variants
          : typeof p.variants === "string"
            ? JSON.parse(p.variants)
            : [];

        return {
          id: parseInt(p.external_id),
          name: p.name ?? "Sin nombre",
          variants: variants.length > 0
            ? variants.map((v: any) => ({
                price: parseFloat(v.price ?? p.price ?? "0") || 0,
                cost:  parseFloat(v.cost  ?? p.cost  ?? "0") || 0,
                stock: v.stock ?? 0,
              }))
            : [{ price: parseFloat(p.price ?? "0") || 0, cost: parseFloat(p.cost ?? "0") || 0, stock: p.stock ?? 0 }],
        };
      });
      isConnected = true;
    }
  } else {
    // ── Fallback: API de TiendaNube ───────────────────────────────────
    const connection = await getTiendaNubeConnection();
    isConnected = !!connection;

    if (connection) {
      const products = await getAllProducts(connection.opts).catch(() => null);
      if (products) {
        rows = products.map((p) => ({
          id: p.id,
          name: getProductName(p),
          variants: p.variants.map((v) => ({
            price: parseFloat(v.price ?? "0") || 0,
            cost:  parseFloat(v.cost  ?? "0") || 0,
            stock: v.stock ?? 0,
          })),
        }));
      } else {
        error = "Error al cargar productos desde TiendaNube";
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Productos / Stock
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          {isConnected
            ? `${rows.length} productos · ${hasSyncedData ? "desde tu base de datos" : "en tiempo real desde TiendaNube"}`
            : "Conectá tu TiendaNube"}
        </p>
      </div>

      {!isConnected && (
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

      {isConnected && error && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={18} color="#ef4444" />
          <p className="text-sm text-[#fca5a5]">{error}</p>
        </div>
      )}

      {isConnected && !error && <ProductosClient products={rows} />}
    </div>
  );
}

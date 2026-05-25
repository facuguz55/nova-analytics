import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AlertasClient from "./AlertasClient";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getProducts } from "@/lib/tiendanube/client";

export const metadata: Metadata = { title: "Alertas" };

export default async function AlertasPage() {
  const supabase = await createClient();

  // Alertas de la DB (tabla `alerts` -- solo alertas del sistema, no datos de TN)
  const { data: dbAlerts } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Alertas automaticas de stock -- cargar DIRECTO desde TiendaNube API
  let autoAlerts: Array<{
    id: string; type: string; title: string; body: string; read: boolean; created_at: string; auto: boolean;
  }> = [];

  const connection = await getTiendaNubeConnection();
  if (connection) {
    const productsRes = await Promise.allSettled([getProducts(connection.opts, 1, 100)]);
    if (productsRes[0].status === "fulfilled") {
      const products = productsRes[0].value;
      const lowStock = products.filter((p) => p.variants.some((v) => (v.stock ?? 0) <= 5));
      autoAlerts = lowStock.map((p) => {
        const name = typeof p.name === "string" ? p.name : (p.name as { es: string })?.es ?? "Producto";
        const totalStock = p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
        return {
          id: `stock-${p.id}`,
          type: totalStock <= 0 ? "danger" : "warning",
          title: totalStock <= 0 ? `Sin stock: ${name}` : `Stock bajo: ${name}`,
          body: totalStock <= 0
            ? "Este producto no tiene unidades disponibles. Reabastecer urgente."
            : `Quedan ${totalStock} unidades. Considerar reponer pronto.`,
          read: false,
          created_at: new Date().toISOString(),
          auto: true,
        };
      });
    }
  }

  type AlertItem = { id: string; type: string; title: string; body: string | null; read: boolean; created_at: string; auto: boolean };

  const allAlerts: AlertItem[] = [
    ...autoAlerts,
    ...(dbAlerts ?? []).map((a) => ({
      id: String((a as Record<string, unknown>).id ?? ""),
      type: String((a as Record<string, unknown>).type ?? "info"),
      title: String((a as Record<string, unknown>).title ?? ""),
      body: ((a as Record<string, unknown>).body as string | null) ?? null,
      read: Boolean((a as Record<string, unknown>).read),
      created_at: String((a as Record<string, unknown>).created_at ?? new Date().toISOString()),
      auto: false,
    })),
  ];

  return <AlertasClient alerts={allAlerts} />;
}

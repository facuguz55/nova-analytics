import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AlertasClient from "./AlertasClient";

export const metadata: Metadata = { title: "Alertas" };

export default async function AlertasPage() {
  const supabase = await createClient();

  // Alertas de la DB
  const { data: dbAlerts } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Alertas automáticas de stock
  const { data: lowStockProducts } = await supabase
    .from("tn_products")
    .select("id, name, stock")
    .lte("stock", 5)
    .order("stock", { ascending: true })
    .limit(10);

  const autoAlerts = ((lowStockProducts ?? []) as any[]).map((p) => ({
    id: `stock-${p.id}`,
    type: p.stock <= 0 ? "danger" : "warning",
    title: p.stock <= 0 ? `Sin stock: ${p.name}` : `Stock bajo: ${p.name}`,
    body: p.stock <= 0
      ? "Este producto no tiene unidades disponibles. Reabastecé urgente."
      : `Quedan ${p.stock} unidades. Considerá reponer pronto.`,
    read: false,
    created_at: new Date().toISOString(),
    auto: true,
  }));

  type AlertItem = {
    id: string;
    type: string;
    title: string;
    body: string | null;
    read: boolean;
    created_at: string;
    auto: boolean;
  };

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

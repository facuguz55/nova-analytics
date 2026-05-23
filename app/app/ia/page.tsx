import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import IAClient from "./IAClient";

export const metadata: Metadata = { title: "IA Assistant" };

export default async function IAPage() {
  const supabase = await createClient();

  type OrderRow = { total: number; status: string | null; created_at: string | null };
  type ProductRow = { name: string; stock: number; price: number };
  type CustomerRow = { orders_count: number; total_spent: number };

  const [{ data: rawOrders }, { data: rawProducts }, { data: rawCustomers }] = await Promise.all([
    supabase.from("tn_orders").select("total, status, created_at").limit(500),
    supabase.from("tn_products").select("name, stock, price").limit(100),
    supabase.from("tn_customers").select("orders_count, total_spent").limit(500),
  ]);

  const orders = (rawOrders ?? []) as unknown as OrderRow[];
  const products = (rawProducts ?? []) as unknown as ProductRow[];
  const customers = (rawCustomers ?? []) as unknown as CustomerRow[];

  const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "closed");
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const salesMes = paidOrders.filter((o) => (o.created_at ?? "") >= monthStart).reduce((acc, o) => acc + o.total, 0);
  const ordenesMes = paidOrders.filter((o) => (o.created_at ?? "") >= monthStart).length;

  const lowStockProducts = products.filter((p) => p.stock <= 5);
  const totalCustomers = customers.length;
  const recurrentes = customers.filter((c) => c.orders_count > 1).length;

  const businessContext = `
Eres el asistente IA de Nova Analytics, especializado en e-commerce y marketing digital para el mercado argentino.
Datos actuales del negocio:
- Facturación total histórica: $${totalRevenue.toLocaleString("es-AR")} ARS
- Ventas del mes actual: $${salesMes.toLocaleString("es-AR")} ARS (${ordenesMes} órdenes)
- Total clientes: ${totalCustomers} (${recurrentes} recurrentes)
- Productos con stock crítico (≤5 unidades): ${lowStockProducts.length}
- Moneda: ARS (pesos argentinos)
Responde siempre en español, con un tono profesional pero cercano. Sé conciso y accionable.
`.trim();

  return <IAClient businessContext={businessContext} />;
}

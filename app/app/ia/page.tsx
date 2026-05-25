import type { Metadata } from "next";
import IAClient from "./IAClient";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getProducts, getCustomers, getProductName } from "@/lib/tiendanube/client";

export const metadata: Metadata = { title: "IA Assistant" };

export default async function IAPage() {
  const connection = await getTiendaNubeConnection();

  let businessContext = "Eres el asistente IA de Nova Analytics para e-commerce argentino. TiendaNube no esta conectado aun.";

  if (connection) {
    const [ordersRes, productsRes, customersRes] = await Promise.allSettled([
      getOrdersForRange(connection.opts, { days: 30 }, 3),
      getProducts(connection.opts, 1, 100),
      getCustomers(connection.opts, 1, 100),
    ]);

    const orders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
    const products = productsRes.status === "fulfilled" ? productsRes.value : [];
    const customers = customersRes.status === "fulfilled" ? customersRes.value : [];

    const paidOrders = orders.filter((o) => o.payment_status === "paid" || o.status === "closed");
    const totalRevenue = paidOrders.reduce((acc, o) => acc + parseFloat(o.total), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const salesMes = paidOrders.filter((o) => new Date(o.created_at) >= monthStart).reduce((acc, o) => acc + parseFloat(o.total), 0);
    const ordenesMes = paidOrders.filter((o) => new Date(o.created_at) >= monthStart).length;
    const lowStock = products.filter((p) => p.variants.some((v) => (v.stock ?? 0) <= 5));
    const recurrentes = customers.filter((c) => c.orders_count > 1).length;

    businessContext = `Eres el asistente IA de Nova Analytics, especializado en e-commerce y marketing digital para el mercado argentino.
Datos actuales del negocio (ultimos 30 dias):
- Facturacion total: $${totalRevenue.toLocaleString("es-AR")} ARS
- Ventas del mes actual: $${salesMes.toLocaleString("es-AR")} ARS (${ordenesMes} ordenes)
- Total clientes: ${customers.length} (${recurrentes} recurrentes)
- Productos con stock critico: ${lowStock.length}
- Tienda: ${connection.storeName ?? "TiendaNube"}
- Moneda: ARS (pesos argentinos)
Responde siempre en espanol rioplatense, con tono profesional y cercano. Se conciso y accionable.`.trim();
  }

  return <IAClient businessContext={businessContext} />;
}

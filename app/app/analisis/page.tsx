import type { Metadata } from "next";
import AnalisisClient from "./AnalisisClient";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrders } from "@/lib/tiendanube/client";
import type { TNOrder } from "@/lib/tiendanube/client";

export const metadata: Metadata = { title: "Análisis" };

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = ([30, 60, 90].includes(Number(params.days)) ? Number(params.days) : 90) as 30 | 60 | 90;

  const connection = await getTiendaNubeConnection();

  if (!connection) {
    return <AnalisisClient initialOrders={[]} days={days} isConnected={false} />;
  }

  // Cargar solo la primera página (100 órdenes) en el servidor — rápido.
  // El cliente carga el resto de manera progresiva via /api/tiendanube/orders.
  const since = new Date();
  since.setDate(since.getDate() - days);

  let initialOrders: TNOrder[] = [];
  try {
    initialOrders = await getOrders(connection.opts, 1, 100, {
      since: since.toISOString().split("T")[0],
    });
  } catch {
    // Si falla la primera carga, el cliente mostrará su propia pantalla de error
  }

  return (
    <AnalisisClient
      initialOrders={initialOrders}
      days={days}
      isConnected={true}
    />
  );
}

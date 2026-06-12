import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import {
  getOrdersForRange,
  getProducts,
  getCustomers,
  type TNOrder,
  type TNProduct,
  type TNCustomer,
} from "@/lib/tiendanube/client";
import TiendaClient from "./TiendaClient";

export const metadata: Metadata = { title: "Tienda Web" };

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = ([30, 60, 90].includes(Number(params.days)) ? Number(params.days) : 30) as 30 | 60 | 90;

  const connection = await getTiendaNubeConnection();
  const isConnected = !!connection;

  // Obtener usd_rate del workspace para conversiones
  const supabase = await createClient();
  const user = await getUser();
  let usdRate = 1100;
  if (user) {
    const { data: rawUserRow } = await supabase
      .from("users").select("workspace_id").eq("id", user.id).single();
    const workspaceId = (rawUserRow as unknown as { workspace_id: string | null } | null)?.workspace_id;
    if (workspaceId) {
      const { data: rawCfg } = await supabase
        .from("financial_config").select("usd_rate").eq("workspace_id", workspaceId).single();
      usdRate = (rawCfg as unknown as { usd_rate: number } | null)?.usd_rate ?? 1100;
    }
  }

  let allOrders: TNOrder[]    = [];
  let products: TNProduct[]   = [];
  let customers: TNCustomer[] = [];
  let error: string | null    = null;

  if (isConnected && connection) {
    const [ordersRes, productsRes, customersRes] = await Promise.allSettled([
      getOrdersForRange(connection.opts, { days }),
      getProducts(connection.opts, 1, 100),
      getCustomers(connection.opts, 1, 100),
    ]);
    if (ordersRes.status === "fulfilled") allOrders = ordersRes.value;
    else error = "Error al cargar órdenes desde TiendaNube";
    if (productsRes.status === "fulfilled")  products  = productsRes.value;
    if (customersRes.status === "fulfilled") customers = customersRes.value;
  }

  return (
    <TiendaClient
      isConnected={isConnected}
      storeName={connection?.storeName ?? null}
      usdRate={usdRate}
      days={days}
      allOrders={allOrders}
      products={products}
      customers={customers}
      error={error}
    />
  );
}

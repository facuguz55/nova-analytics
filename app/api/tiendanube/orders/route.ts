import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrders } from "@/lib/tiendanube/client";
import { checkUserRateLimit } from "@/lib/rate-limit";

// GET /api/tiendanube/orders?page=1&days=90
// Endpoint de paginación para carga progresiva en el cliente.
// Devuelve 100 órdenes por página — el cliente llama sucesivamente hasta hasMore=false.
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit — 60 requests/hora por usuario (6 páginas × 10 recargas = margen amplio)
  const rl = await checkUserRateLimit(user.id, "tn_orders_paginate", 60, 3600);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const { searchParams } = new URL(request.url);

  // Validar parámetros para evitar abuso
  const rawPage = parseInt(searchParams.get("page") ?? "1");
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : Math.min(rawPage, 20); // máx 20 páginas (2000 órdenes)

  const rawDays = parseInt(searchParams.get("days") ?? "90");
  const days = ([30, 60, 90].includes(rawDays) ? rawDays : 90) as 30 | 60 | 90;

  const connection = await getTiendaNubeConnection();
  if (!connection) return NextResponse.json({ error: "TiendaNube no conectado" }, { status: 404 });

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await getOrders(connection.opts, page, 100, {
      since: since.toISOString().split("T")[0],
    });

    return NextResponse.json({
      orders,
      page,
      hasMore: orders.length === 100, // si recibimos 100 exactos, probablemente hay más
    });
  } catch (err) {
    console.error("TiendaNube orders fetch error:", err);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

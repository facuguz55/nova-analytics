import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrders } from "@/lib/tiendanube/client";
import { checkUserRateLimit } from "@/lib/rate-limit";

// GET /api/tiendanube/orders?page=1&since=YYYY-MM-DD[&until=YYYY-MM-DD]
// También acepta ?page=1&days=90 para compatibilidad hacia atrás.
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkUserRateLimit(user.id, "tn_orders_paginate", 60, 3600);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const { searchParams } = new URL(request.url);

  const rawPage = parseInt(searchParams.get("page") ?? "1");
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : Math.min(rawPage, 20);

  // Soportar since directo o days para retrocompat
  let since: string;
  const rawSince = searchParams.get("since");
  if (rawSince && /^\d{4}-\d{2}-\d{2}$/.test(rawSince)) {
    since = rawSince;
  } else {
    const rawDays = parseInt(searchParams.get("days") ?? "90");
    const days = isNaN(rawDays) || rawDays < 1 || rawDays > 365 ? 90 : rawDays;
    const d = new Date();
    d.setDate(d.getDate() - days);
    since = d.toISOString().split("T")[0];
  }

  const rawUntil = searchParams.get("until");
  const until = rawUntil && /^\d{4}-\d{2}-\d{2}$/.test(rawUntil) ? rawUntil : undefined;

  const connection = await getTiendaNubeConnection();
  if (!connection) return NextResponse.json({ error: "TiendaNube no conectado" }, { status: 404 });

  try {
    const orders = await getOrders(connection.opts, page, 100, { since, until });

    return NextResponse.json({
      orders,
      page,
      hasMore: orders.length === 100,
    });
  } catch (err) {
    console.error("TiendaNube orders fetch error:", err);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

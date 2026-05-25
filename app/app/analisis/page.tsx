import type { Metadata } from "next";
import AnalisisClient from "./AnalisisClient";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange } from "@/lib/tiendanube/client";

export const metadata: Metadata = { title: "Analisis" };

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = ([30, 60, 90].includes(Number(params.days)) ? Number(params.days) : 90) as 30 | 60 | 90;

  const connection = await getTiendaNubeConnection();

  let paidOrders: Array<{ total: string; status: string; payment_status: string; created_at: string }> = [];

  if (connection) {
    const result = await Promise.allSettled([getOrdersForRange(connection.opts, { days }, 3)]);
    if (result[0].status === "fulfilled") {
      paidOrders = result[0].value.filter((o) => o.payment_status === "paid" || o.status === "closed");
    }
  }

  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthOrders = paidOrders.filter((o) => {
      const date = new Date(o.created_at);
      return date >= d && date < nextD;
    });
    monthlyData.push({
      month: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      ventas: monthOrders.reduce((acc, o) => acc + parseFloat(o.total), 0),
      ordenes: monthOrders.length,
    });
  }

  const weekDays = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const byWeekday = weekDays.map((day, idx) => {
    const dayOrders = paidOrders.filter((o) => new Date(o.created_at).getDay() === idx);
    return {
      day,
      ventas: dayOrders.reduce((acc, o) => acc + parseFloat(o.total), 0),
      ordenes: dayOrders.length,
    };
  });

  const byHour = Array.from({ length: 24 }, (_, h) => {
    const hourOrders = paidOrders.filter((o) => new Date(o.created_at).getHours() === h);
    return { hora: `${String(h).padStart(2, "0")}:00`, ordenes: hourOrders.length };
  });

  return (
    <AnalisisClient
      monthlyData={monthlyData}
      byWeekday={byWeekday}
      byHour={byHour}
      totalOrders={paidOrders.length}
      hasData={paidOrders.length > 0}
    />
  );
}

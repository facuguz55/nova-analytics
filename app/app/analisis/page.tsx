import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AnalisisClient from "./AnalisisClient";

export const metadata: Metadata = { title: "Análisis" };

export default async function AnalisisPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("tn_orders")
    .select("total, status, created_at")
    .order("created_at", { ascending: true })
    .limit(1000);

  type OrderRow = { total: number; status: string | null; created_at: string | null };
  const allOrders = (orders ?? []) as unknown as OrderRow[];
  const paidOrders = allOrders.filter((o) => o.status === "paid" || o.status === "closed");

  // Agrupar por mes (últimos 6 meses)
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthOrders = paidOrders.filter((o) => {
      if (!o.created_at) return false;
      const date = new Date(o.created_at);
      return date >= d && date < nextD;
    });
    monthlyData.push({
      month: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      ventas: monthOrders.reduce((acc, o) => acc + o.total, 0),
      ordenes: monthOrders.length,
    });
  }

  // Distribución por día de la semana
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const byWeekday = weekDays.map((day, idx) => {
    const dayOrders = paidOrders.filter((o) => {
      if (!o.created_at) return false;
      return new Date(o.created_at).getDay() === idx;
    });
    return {
      day,
      ventas: dayOrders.reduce((acc, o) => acc + o.total, 0),
      ordenes: dayOrders.length,
    };
  });

  // Distribución por hora
  const byHour = Array.from({ length: 24 }, (_, h) => {
    const hourOrders = paidOrders.filter((o) => {
      if (!o.created_at) return false;
      return new Date(o.created_at).getHours() === h;
    });
    return {
      hora: `${String(h).padStart(2, "0")}:00`,
      ordenes: hourOrders.length,
    };
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

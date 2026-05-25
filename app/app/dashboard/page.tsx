import type { Metadata } from "next";
import { DollarSign, ShoppingCart, TrendingUp, Users, Activity, Brain, ArrowRight } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import SalesChart, { type ChartDataPoint } from "@/components/dashboard/SalesChart";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, calcPercentChange } from "@/lib/utils";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, getCustomers, calcOrderRevenue, type TNOrder } from "@/lib/tiendanube/client";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  type UserRow = { name: string | null; workspace_id: string | null; role: string };
  const { data: rawUserRow } = await supabase
    .from("users")
    .select("name, workspace_id, role")
    .eq("id", user.id)
    .single();
  const userRow = rawUserRow as unknown as UserRow | null;

  // Cargar datos DIRECTO desde TiendaNube API
  const connection = await getTiendaNubeConnection();
  let allOrders60: TNOrder[] = [];
  let customerCount = 0;
  let recurrenteCount = 0;
  const tnConnected = !!connection;

  if (connection) {
    const [ordersRes, customersRes] = await Promise.allSettled([
      getOrdersForRange(connection.opts, { days: 60 }, 2),
      getCustomers(connection.opts, 1, 100),
    ]);
    if (ordersRes.status === "fulfilled") allOrders60 = ordersRes.value;
    if (customersRes.status === "fulfilled") {
      customerCount = customersRes.value.length;
      recurrenteCount = customersRes.value.filter((c) => c.orders_count > 1).length;
    }
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const paidOrders = allOrders60.filter((o) => o.payment_status === "paid" || o.status === "closed");

  const todayPaid = paidOrders.filter((o) => new Date(o.created_at) >= todayStart);
  const weekPaid = paidOrders.filter((o) => new Date(o.created_at) >= weekStart);
  const monthPaid = paidOrders.filter((o) => new Date(o.created_at) >= monthStart);
  const prevMonthPaid = paidOrders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= prevMonthStart && d < monthStart;
  });

  const salesHoy = todayPaid.reduce((acc, o) => acc + parseFloat(o.total), 0);
  const salesSemana = weekPaid.reduce((acc, o) => acc + parseFloat(o.total), 0);
  const salesMes = monthPaid.reduce((acc, o) => acc + parseFloat(o.total), 0);
  const salesMesAnterior = prevMonthPaid.reduce((acc, o) => acc + parseFloat(o.total), 0);
  const ordenesMes = monthPaid.length;
  const ticketPromedio = ordenesMes > 0 ? salesMes / ordenesMes : 0;
  const cambioMes = calcPercentChange(salesMes, salesMesAnterior);

  // Chart data ultimos 30 dias
  const chartData: ChartDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayOrders = paidOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= dayStart && d < dayEnd;
    });
    chartData.push({
      date: `${String(dayStart.getDate()).padStart(2, "0")}/${String(dayStart.getMonth() + 1).padStart(2, "0")}`,
      ventas: dayOrders.reduce((acc, o) => acc + parseFloat(o.total), 0),
      ordenes: dayOrders.length,
    });
  }

  // Ordenes recientes para tabla (max 10)
  const recentOrders = allOrders60.slice(0, 10).map((o) => ({
    id: String(o.id),
    external_id: String(o.number ?? o.id),
    customer_name: o.customer?.name ?? null,
    customer_email: o.customer?.email ?? null,
    total: parseFloat(o.total),
    status: o.payment_status === "paid" || o.status === "closed" ? "paid" : o.status,
    created_at: o.created_at,
  }));

  return {
    userName: userRow?.name ?? user.email?.split("@")[0] ?? "Usuario",
    isSuperAdmin: userRow?.role === "super_admin",
    salesHoy,
    salesSemana,
    salesMes,
    ordenesMes,
    ticketPromedio,
    recurrentes: recurrenteCount,
    nuevos: customerCount - recurrenteCount,
    cambioMes,
    todayCount: todayPaid.length,
    weekCount: weekPaid.length,
    chartData,
    recentOrders,
    tnConnected,
    storeName: connection?.storeName ?? null,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return null;

  const {
    userName, isSuperAdmin, salesHoy, salesSemana, salesMes, ordenesMes,
    ticketPromedio, recurrentes, nuevos, cambioMes,
    todayCount, weekCount, chartData, recentOrders, tnConnected, storeName,
  } = data;

  const METRICS = [
    { label: "Ventas hoy", value: formatCurrency(salesHoy), subtext: `${todayCount} orden${todayCount !== 1 ? "es" : ""} · actualizado ahora`, change: 0, icon: DollarSign, iconColor: "#e1691e" },
    { label: "Ventas semana", value: formatCurrency(salesSemana), subtext: `${weekCount} ordenes · ultimos 7 dias`, change: 0, icon: TrendingUp, iconColor: "#22c55e" },
    { label: "Ventas mes", value: formatCurrency(salesMes), subtext: `${ordenesMes} ordenes · mes actual`, change: cambioMes, icon: Activity, iconColor: "#7C3AED" },
    { label: "Ordenes pagadas", value: String(ordenesMes), subtext: "Acumulado del mes", change: 0, icon: ShoppingCart, iconColor: "#2563EB" },
  ];

  const KPI_SECONDARY = [
    { label: "Clientes recurrentes", value: String(recurrentes), sub: "Ver lista", href: "/app/clientes", icon: Users, iconColor: "#e1691e" },
    { label: "Ticket promedio", value: formatCurrency(ticketPromedio), sub: "Por orden pagada", href: null as null, icon: DollarSign, iconColor: "#7C3AED" },
    { label: "Nuevos clientes", value: String(nuevos), sub: "Primera compra", href: "/app/clientes", icon: Users, iconColor: "#22c55e" },
  ];

  const now = new Date();
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const currentMonth = months[now.getMonth()];

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              Buen dia, {userName.split(" ")[0]} &#128075;
            </h2>
            {isSuperAdmin && (
              <a href="/admin/hq"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                &#9889; Nova HQ
              </a>
            )}
          </div>
          <p className="text-sm text-[#94A3B8] mt-1" suppressHydrationWarning>
            {now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs &#183;{" "}
            {tnConnected ? (
              <span className="text-green-400">&#9679; {storeName ?? "TiendaNube"} conectado</span>
            ) : (
              <a href="/app/configuracion/integraciones" className="text-yellow-400 hover:underline">
                &#9888; TiendaNube no conectado
              </a>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1 hidden md:flex"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          {months.slice(0, now.getMonth() + 1).slice(-6).map((m) => (
            <button key={m} className="rounded-lg px-3 py-1.5 text-sm transition-all duration-150"
              style={{ fontWeight: m === currentMonth ? 700 : 400, color: m === currentMonth ? "white" : "#94A3B8", background: m === currentMonth ? "#7C3AED" : "transparent", cursor: "default" }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {METRICS.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-[11px] font-semibold tracking-widest text-[#94A3B8] uppercase">Actividad y conversion</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {KPI_SECONDARY.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="p-5"
                style={{ borderRight: i < KPI_SECONDARY.length - 1 ? "1px solid rgba(124,58,237,0.15)" : "none" }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-semibold tracking-widest text-[#94A3B8] uppercase">{k.label}</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.iconColor}20` }}>
                    <Icon size={13} color={k.iconColor} strokeWidth={2} />
                  </div>
                </div>
                <p className="text-3xl font-black text-[#F1F5F9] leading-none mb-1">{k.value}</p>
                {k.href ? (
                  <a href={k.href} className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">{k.sub}</a>
                ) : (
                  <p className="text-xs text-[#64748B]">{k.sub}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SalesChart data={chartData} />

      <div className="flex items-center gap-4 rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.05))", border: "1px solid rgba(124,58,237,0.25)" }}>
        <div className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: "44px", height: "44px", background: "rgba(124,58,237,0.15)" }}>
          <Brain size={20} color="#8B5CF6" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[#F1F5F9] mb-1" style={{ fontSize: "14px" }}>Insight IA del dia</p>
          <p className="text-sm text-[#94A3B8]">
            {tnConnected
              ? `Tus ventas del mes son ${formatCurrency(salesMes)} con ${ordenesMes} ordenes. Ticket promedio: ${formatCurrency(ticketPromedio)}. Consulta el asistente IA para recomendaciones personalizadas.`
              : "Conecta TiendaNube para recibir insights de IA basados en tus datos reales de ventas."}
          </p>
        </div>
        <a href="/app/ia"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ color: "#8B5CF6", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
          Ver analisis <ArrowRight size={14} />
        </a>
      </div>

      {recentOrders.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Ordenes recientes</p>
            <Link href="/app/ordenes" className="text-xs text-[#7C3AED]">Ver todas</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
            {recentOrders.map((o) => {
              const isPaid = o.status === "paid";
              const sc = isPaid ? "#22c55e" : o.status === "cancelled" ? "#ef4444" : "#f59e0b";
              return (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#CBD5E1] truncate">{o.customer_name ?? "Anonimo"}</p>
                    <p className="text-xs text-[#64748B]">{o.customer_email ?? ""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(o.total)}</p>
                    <p className="text-xs text-[#64748B]">{new Date(o.created_at ?? "").toLocaleDateString("es-AR")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

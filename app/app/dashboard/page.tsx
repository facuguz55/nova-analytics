import type { Metadata } from "next";
import { DollarSign, ShoppingCart, TrendingUp, Users, Activity, Brain, ArrowRight } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import SalesChart, { type ChartDataPoint } from "@/components/dashboard/SalesChart";
import OrdersTable from "@/components/dashboard/OrdersTable";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, calcPercentChange } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const last60Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60).toISOString();

  type UserRow = { name: string | null; workspace_id: string | null; role: string };
  type OrderShort = { total: number; status: string | null; created_at: string | null };
  type OrderFull = { id: string; external_id: string; customer_name: string | null; customer_email: string | null; total: number; status: string | null; created_at: string | null };
  type CustomerRow = { id: string; orders_count: number };
  type IntRow = { status: string; updated_at: string };

  const [
    { data: rawUserRow },
    { data: rawOrders60 },
    { data: rawRecentOrders },
    { data: rawCustomers },
    { data: rawTnIntegration },
  ] = await Promise.all([
    supabase.from("users").select("name, workspace_id, role").eq("id", user.id).single(),
    supabase.from("tn_orders").select("total, status, created_at").gte("created_at", last60Start).order("created_at", { ascending: false }),
    supabase.from("tn_orders").select("id, external_id, customer_name, customer_email, total, status, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("tn_customers").select("id, orders_count").order("orders_count", { ascending: false }).limit(1000),
    supabase.from("integrations").select("status, updated_at").eq("provider", "tiendanube").limit(1).maybeSingle(),
  ]);

  const userRow = rawUserRow as unknown as UserRow | null;
  const allOrders = (rawOrders60 ?? []) as unknown as OrderShort[];
  const recentOrders = (rawRecentOrders ?? []) as unknown as OrderFull[];
  const customers = (rawCustomers ?? []) as unknown as CustomerRow[];
  const tnIntegration = rawTnIntegration as unknown as IntRow | null;

  const paidOrders = allOrders.filter((o) => o.status === "paid" || o.status === "closed");

  // Métricas hoy
  const todayPaid = paidOrders.filter((o) => (o.created_at ?? "") >= todayStart);
  const salesHoy = todayPaid.reduce((acc, o) => acc + o.total, 0);

  // Métricas semana
  const weekPaid = paidOrders.filter((o) => (o.created_at ?? "") >= weekStart);
  const salesSemana = weekPaid.reduce((acc, o) => acc + o.total, 0);

  // Mes actual
  const monthPaid = paidOrders.filter((o) => (o.created_at ?? "") >= monthStart);
  const salesMes = monthPaid.reduce((acc, o) => acc + o.total, 0);

  // Mes anterior (para % cambio)
  const prevMonthPaid = paidOrders.filter(
    (o) => (o.created_at ?? "") >= prevMonthStart && (o.created_at ?? "") < monthStart
  );
  const salesMesAnterior = prevMonthPaid.reduce((acc, o) => acc + o.total, 0);

  // Órdenes pagadas mes
  const ordenesMes = monthPaid.length;

  // Ticket promedio
  const ticketPromedio = ordenesMes > 0 ? salesMes / ordenesMes : 0;

  // Clientes recurrentes (>1 orden)
  const recurrentes = customers.filter((c) => c.orders_count > 1).length;

  // Nuevos clientes (aproximado por clientes con 1 orden)
  const nuevos = customers.filter((c) => c.orders_count === 1).length;

  // Chart data: últimos 30 días
  const chartData: ChartDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayOrders = paidOrders.filter((o) => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d >= dayStart && d < dayEnd;
    });
    chartData.push({
      date: `${String(dayStart.getDate()).padStart(2, "0")}/${String(dayStart.getMonth() + 1).padStart(2, "0")}`,
      ventas: dayOrders.reduce((acc, o) => acc + o.total, 0),
      ordenes: dayOrders.length,
    });
  }

  const cambioMes = calcPercentChange(salesMes, salesMesAnterior);

  return {
    userName: userRow?.name ?? user.email?.split("@")[0] ?? "Usuario",
    isSuperAdmin: userRow?.role === "super_admin",
    salesHoy,
    salesSemana,
    salesMes,
    ordenesMes,
    ticketPromedio,
    recurrentes,
    nuevos,
    cambioMes,
    todayCount: todayPaid.length,
    weekCount: weekPaid.length,
    chartData,
    recentOrders,
    tnConnected: tnIntegration?.status === "active",
    lastSync: tnIntegration?.updated_at ?? null,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return null;

  const {
    userName, isSuperAdmin, salesHoy, salesSemana, salesMes, ordenesMes,
    ticketPromedio, recurrentes, nuevos, cambioMes,
    todayCount, weekCount, chartData, recentOrders, tnConnected,
  } = data;

  const METRICS = [
    {
      label: "Ventas hoy",
      value: formatCurrency(salesHoy),
      subtext: `${todayCount} orden${todayCount !== 1 ? "es" : ""} · actualizado ahora`,
      change: 0,
      icon: DollarSign,
      iconColor: "#e1691e",
    },
    {
      label: "Ventas semana",
      value: formatCurrency(salesSemana),
      subtext: `${weekCount} órdenes · últimos 7 días`,
      change: 0,
      icon: TrendingUp,
      iconColor: "#22c55e",
    },
    {
      label: "Ventas mes",
      value: formatCurrency(salesMes),
      subtext: `${ordenesMes} órdenes · mes actual`,
      change: cambioMes,
      icon: Activity,
      iconColor: "#7C3AED",
    },
    {
      label: "Órdenes pagadas",
      value: String(ordenesMes),
      subtext: "Acumulado del mes",
      change: 0,
      icon: ShoppingCart,
      iconColor: "#2563EB",
    },
  ];

  const KPI_SECONDARY = [
    {
      label: "Clientes recurrentes",
      value: String(recurrentes),
      sub: "Ver lista →",
      href: "/app/clientes",
      icon: Users,
      iconColor: "#e1691e",
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(ticketPromedio),
      sub: "Por orden pagada",
      href: null,
      icon: DollarSign,
      iconColor: "#7C3AED",
    },
    {
      label: "Nuevos clientes",
      value: String(nuevos),
      sub: "Primera compra",
      href: "/app/clientes",
      icon: Users,
      iconColor: "#22c55e",
    },
  ];

  const now = new Date();
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const currentMonth = months[now.getMonth()];

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2
              className="text-3xl font-black text-[#F1F5F9]"
              style={{ letterSpacing: "-0.02em" }}
            >
              Buen día, {userName.split(" ")[0]} 👋
            </h2>
            {isSuperAdmin && (
              <a
                href="/admin/hq"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                ⚡ Nova HQ
              </a>
            )}
          </div>
          <p className="text-sm text-[#94A3B8] mt-1" suppressHydrationWarning>
            {now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs ·{" "}
            {tnConnected ? (
              <span className="text-green-400">● TiendaNube conectado</span>
            ) : (
              <a href="/app/configuracion/integraciones" className="text-yellow-400 hover:underline">
                ⚠ TiendaNube no conectado
              </a>
            )}
          </p>
        </div>

        {/* Selector mes */}
        <div
          className="flex items-center gap-1 rounded-xl p-1 hidden md:flex"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          {months.slice(0, now.getMonth() + 1).slice(-6).map((m) => (
            <button
              key={m}
              className="rounded-lg px-3 py-1.5 text-sm transition-all duration-150"
              style={{
                fontWeight: m === currentMonth ? 700 : 400,
                color: m === currentMonth ? "white" : "#94A3B8",
                background: m === currentMonth ? "#7C3AED" : "transparent",
                cursor: "pointer",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* KPI principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* KPI secundarios */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-[11px] font-semibold tracking-widest text-[#94A3B8] uppercase">
            Actividad y conversión
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {KPI_SECONDARY.map((k, i) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="p-5"
                style={{
                  borderRight: i < KPI_SECONDARY.length - 1 ? "1px solid rgba(124,58,237,0.15)" : "none",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-semibold tracking-widest text-[#94A3B8] uppercase">
                    {k.label}
                  </p>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${k.iconColor}20` }}
                  >
                    <Icon size={13} color={k.iconColor} strokeWidth={2} />
                  </div>
                </div>
                <p className="text-3xl font-black text-[#F1F5F9] leading-none mb-1">{k.value}</p>
                {k.href ? (
                  <a href={k.href} className="text-xs text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
                    {k.sub}
                  </a>
                ) : (
                  <p className="text-xs text-[#64748B]">{k.sub}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico */}
      <SalesChart data={chartData} />

      {/* IA insight */}
      <div
        className="flex items-center gap-4 rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.05))",
          border: "1px solid rgba(124,58,237,0.25)",
        }}
      >
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: "44px", height: "44px", background: "rgba(124,58,237,0.15)" }}
        >
          <Brain size={20} color="#8B5CF6" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[#F1F5F9] mb-1" style={{ fontSize: "14px" }}>
            Insight IA del día
          </p>
          <p className="text-sm text-[#94A3B8]">
            {tnConnected
              ? <>Tus ventas del mes son <span className="text-[#e1691e] font-semibold">{formatCurrency(salesMes)}</span> con {ordenesMes} órdenes. Ticket promedio: <span className="text-green-400 font-semibold">{formatCurrency(ticketPromedio)}</span>. Consultá el asistente IA para recomendaciones personalizadas.</>
              : "Conectá TiendaNube para recibir insights de IA basados en tus datos reales de ventas."}
          </p>
        </div>
        <a
          href="/app/ia"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{
            color: "#8B5CF6",
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.25)",
          }}
        >
          Ver análisis
          <ArrowRight size={14} />
        </a>
      </div>

      {/* Tabla de órdenes */}
      <OrdersTable orders={recentOrders} />
    </div>
  );
}

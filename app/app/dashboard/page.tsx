import type { Metadata } from "next";
import {
  DollarSign, ShoppingCart, TrendingUp, Users,
  Activity, Brain, ArrowRight,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import SalesChart from "@/components/dashboard/SalesChart";
import OrdersTable from "@/components/dashboard/OrdersTable";

export const metadata: Metadata = { title: "Dashboard" };

const METRICS = [
  {
    label: "Ventas hoy",
    value: "$ 127.400",
    subtext: "2 ordenes · Se reinicia en 6h",
    change: +12.4,
    icon: DollarSign,
    iconColor: "#e1691e",
  },
  {
    label: "Ventas semana",
    value: "$ 892.300",
    subtext: "26 ordenes · Se reinicia en 1d 6h",
    change: +8.7,
    icon: TrendingUp,
    iconColor: "#22c55e",
  },
  {
    label: "Ventas mes",
    value: "$ 7.838.909",
    subtext: "86 ordenes · Mayo 2026",
    change: +23.1,
    icon: Activity,
    iconColor: "#7C3AED",
  },
  {
    label: "Ordenes pagadas",
    value: "284",
    subtext: "Acumulado del mes",
    change: -3.2,
    icon: ShoppingCart,
    iconColor: "#2563EB",
  },
];

const KPI_SECONDARY = [
  {
    label: "Clientes recurrentes",
    value: "55",
    sub: "Ver lista",
    icon: Users,
    iconColor: "#e1691e",
  },
  {
    label: "Ticket promedio",
    value: "$ 27.601",
    sub: "Por orden pagada",
    icon: DollarSign,
    iconColor: "#7C3AED",
  },
  {
    label: "Nuevos clientes",
    value: "38",
    sub: "Este mes",
    icon: Users,
    iconColor: "#22c55e",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-black text-[#F1F5F9]"
            style={{ letterSpacing: "-0.02em" }}
          >
            Buen dia, Facundo 👋
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Actualizado: 12:56 hs ·{" "}
            <span className="text-green-400">● TiendaNube conectado</span>
          </p>
        </div>

        {/* Selector de mes */}
        <div
          className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          {["Ene", "Feb", "Mar", "Abr", "May", "Jun"].map((m) => (
            <button
              key={m}
              className="rounded-lg px-3 py-1.5 text-sm transition-all duration-150"
              style={{
                fontWeight: m === "May" ? 700 : 400,
                color: m === "May" ? "white" : "#94A3B8",
                background: m === "May" ? "#7C3AED" : "transparent",
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
        <div
          className="px-5 py-3"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}
        >
          <p className="text-[11px] font-semibold tracking-widest text-[#94A3B8] uppercase">
            Actividad y conversion
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
                <p
                  className="text-3xl font-black text-[#F1F5F9] leading-none mb-1"
                >
                  {k.value}
                </p>
                <p className="text-xs text-[#7C3AED] cursor-pointer hover:text-[#8B5CF6] transition-colors">
                  {k.sub} →
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grafico */}
      <SalesChart />

      {/* IA insight banner */}
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
          <p
            className="font-bold text-[#F1F5F9] mb-1"
            style={{ fontSize: "14px" }}
          >
            Insight IA del dia
          </p>
          <p className="text-sm text-[#94A3B8]">
            Tus ventas subieron{" "}
            <span className="text-green-400 font-semibold">+23%</span> vs el mes pasado.
            Los{" "}
            <span className="text-[#e1691e] font-semibold">viernes y sabados</span>{" "}
            generan el 38% de la facturacion. Considerar aumentar la inversion Meta esos dias.
          </p>
        </div>
        <button
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{
            color: "#8B5CF6",
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.25)",
          }}
        >
          Ver analisis
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Tabla de ordenes */}
      <OrdersTable />
    </div>
  );
}


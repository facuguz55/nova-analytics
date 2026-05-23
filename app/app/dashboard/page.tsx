import type { Metadata } from "next";
import {
  DollarSign, ShoppingCart, TrendingUp, Users,
  Activity, Zap,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import SalesChart from "@/components/dashboard/SalesChart";
import OrdersTable from "@/components/dashboard/OrdersTable";

export const metadata: Metadata = { title: "Dashboard" };

// ─────────────────────────────────────────────
// Mock metrics
// ─────────────────────────────────────────────
const METRICS = [
  {
    label: "Ventas hoy",
    value: "$ 127.400",
    subtext: "2 órdenes · Se reinicia en 6h",
    change: +12.4,
    icon: DollarSign,
    iconColor: "#e1691e",
    accentBottom: "#e1691e",
  },
  {
    label: "Ventas semana",
    value: "$ 892.300",
    subtext: "26 órdenes · Se reinicia en 1d 6h",
    change: +8.7,
    icon: TrendingUp,
    iconColor: "#22c55e",
    accentBottom: "#22c55e",
  },
  {
    label: "Ventas mes",
    value: "$ 7.838.909",
    subtext: "86 órdenes · Mayo 2026",
    change: +23.1,
    icon: Activity,
    iconColor: "#a855f7",
    accentBottom: "#a855f7",
  },
  {
    label: "Órdenes pagadas",
    value: "284",
    subtext: "Acumulado del mes",
    change: -3.2,
    icon: ShoppingCart,
    iconColor: "#1e3c69",
    accentBottom: "#1e3c69",
  },
];

const KPI_SECONDARY = [
  {
    label: "Clientes recurrentes",
    value: "55",
    subtext: "Ver lista →",
    icon: Users,
    iconColor: "#e1691e",
  },
  {
    label: "Ticket promedio",
    value: "$ 27.601",
    subtext: "Por orden pagada",
    icon: DollarSign,
    iconColor: "#a855f7",
  },
  {
    label: "Nuevos clientes",
    value: "38",
    subtext: "Este mes",
    icon: Users,
    iconColor: "#22c55e",
  },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">

      {/* ── Header del dashboard ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            Buen día, Facundo 👋
          </h2>
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "14px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            Actualizado: 12:56 hs ·{" "}
            <span style={{ color: "#22c55e" }}>● TiendaNube conectado</span>
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {["Ene", "Feb", "Mar", "Abr", "May", "Jun"].map((m) => (
            <button
              key={m}
              className="rounded-lg px-3 py-1.5 transition-all duration-150"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "13px",
                fontWeight: m === "May" ? 700 : 400,
                color: m === "May" ? "white" : "var(--text-muted)",
                background: m === "May" ? "#e1691e" : "transparent",
                cursor: "pointer",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI cards principales ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* ── KPI secundarios ── */}
      <div
        className="rounded-xl p-1"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div
          className="px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            Actividad y conversión
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
          {KPI_SECONDARY.map((k, i) => (
            <div
              key={k.label}
              className="p-5"
              style={{
                borderRight:
                  i < KPI_SECONDARY.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div className="flex items-start justify-between">
                <p
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {k.label}
                </p>
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: "28px",
                    height: "28px",
                    background: `${k.iconColor}18`,
                  }}
                >
                  <k.icon size={13} color={k.iconColor} strokeWidth={2} />
                </div>
              </div>
              <p
                className="mt-2 leading-none"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text)",
                  letterSpacing: "-0.03em",
                }}
              >
                {k.value}
              </p>
              <p
                className="mt-1"
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "12px",
                  color: "#e1691e",
                  cursor: "pointer",
                }}
              >
                {k.subtext}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gráfico y tabla ── */}
      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <SalesChart />

        {/* IA insight banner */}
        <div
          className="flex items-center gap-4 rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(225,105,30,0.06))",
            border: "1px solid rgba(168,85,247,0.2)",
          }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(225,105,30,0.2))",
            }}
          >
            <Zap size={18} color="#a855f7" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              Insight IA del día
            </p>
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "13px",
                color: "var(--text-subtle)",
                marginTop: "2px",
              }}
            >
              Tus ventas subieron un{" "}
              <span style={{ color: "#22c55e", fontWeight: 600 }}>+23%</span> vs el mes pasado.
              Los{" "}
              <span style={{ color: "#e1691e", fontWeight: 600 }}>
                viernes y sábados
              </span>{" "}
              generan el 38% de la facturación. Considerar aumentar la inversión Meta esos días.
            </p>
          </div>
          <div
            className="flex-shrink-0 px-3 py-1.5 rounded-lg cursor-pointer"
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#a855f7",
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.2)",
            }}
          >
            Ver análisis completo →
          </div>
        </div>

        {/* Orders table */}
        <OrdersTable />
      </div>
    </div>
  );
}

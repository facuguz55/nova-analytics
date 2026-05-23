"use client";

import { ExternalLink } from "lucide-react";

// ─────────────────────────────────────────────
// Mock orders data
// ─────────────────────────────────────────────
const ORDERS = [
  { id: "#3961", customer: "Miguel González", product: "Zapatillas Nike Air Max — Talle 42", date: "23/5 · 11:12", amount: 78788, status: "paid" },
  { id: "#3960", customer: "Virginia Wells", product: "Zapatillas Adidas Ultraboost — Talle 39", date: "23/5 · 10:51", amount: 73500, status: "paid" },
  { id: "#3959", customer: "Nazareno González", product: "Campera The North Face — Talle M", date: "22/5 · 10:41", amount: 99000, status: "paid" },
  { id: "#3958", customer: "Thomas Barrera", product: "Campera The North Face — Talle L", date: "22/5 · 06:38", amount: 99000, status: "paid" },
  { id: "#3957", customer: "Joaquín Heredia", product: "Remera Oversize Premium — Talle XL", date: "22/5 · 01:47", amount: 29800, status: "pending" },
  { id: "#3956", customer: "Sonia Anglada", product: "Buzo Canguro Unisex — Talle S", date: "21/5 · 09:30", amount: 45000, status: "paid" },
  { id: "#3955", customer: "Erica Hoffmann", product: "Jean Slim Fit — Talle 30", date: "21/5 · 11:02", amount: 67900, status: "paid" },
  { id: "#3953", customer: "Matías Albarracín", product: "Remera Oversize Premium — Talle M", date: "21/5 · 09:06", amount: 29800, status: "cancelled" },
  { id: "#3952", customer: "Laura Díaz", product: "Zapatillas Puma RS-X — Talle 37", date: "20/5 · 16:22", amount: 58400, status: "paid" },
  { id: "#3951", customer: "Rodrigo Mendoza", product: "Pantalón Cargo — Talle 34", date: "20/5 · 14:55", amount: 54200, status: "pending" },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  paid:      { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", label: "Pagado"    },
  pending:   { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Pendiente" },
  cancelled: { bg: "rgba(239,68,68,0.12)",  color: "#ef4444", label: "Cancelado" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function OrdersTable() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Últimas órdenes
          </h3>
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
            Mayo 2026
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-150"
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "12px",
            fontWeight: 600,
            color: "#e1691e",
            background: "rgba(225,105,30,0.08)",
            border: "1px solid rgba(225,105,30,0.2)",
            cursor: "pointer",
          }}
        >
          Ver todas
          <ExternalLink size={11} strokeWidth={2.5} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["PEDIDO", "CLIENTE", "PRODUCTO", "FECHA", "MONTO", "ESTADO"].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3"
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((order, i) => {
              const st = STATUS_STYLES[order.status];
              return (
                <tr
                  key={order.id}
                  className="group transition-colors duration-100"
                  style={{
                    borderBottom:
                      i < ORDERS.length - 1 ? "1px solid var(--border-muted)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "rgba(255,255,255,0.025)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  {/* Pedido */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      style={{
                        fontFamily: "var(--font-barlow)",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#e1691e",
                      }}
                    >
                      {order.id}
                    </span>
                  </td>

                  {/* Cliente */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      style={{
                        fontFamily: "var(--font-barlow)",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--text)",
                      }}
                    >
                      {order.customer}
                    </span>
                  </td>

                  {/* Producto */}
                  <td className="px-5 py-3 max-w-[280px]">
                    <span
                      className="block truncate"
                      style={{
                        fontFamily: "var(--font-barlow)",
                        fontSize: "13px",
                        color: "var(--text-subtle)",
                      }}
                    >
                      {order.product}
                    </span>
                  </td>

                  {/* Fecha */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      style={{
                        fontFamily: "var(--font-barlow)",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {order.date}
                    </span>
                  </td>

                  {/* Monto */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      style={{
                        fontFamily: "var(--font-barlow)",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {fmt(order.amount)}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1"
                      style={{
                        background: st.bg,
                        fontFamily: "var(--font-barlow)",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: st.color,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

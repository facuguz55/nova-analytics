"use client";

import { ExternalLink } from "lucide-react";

const ORDERS = [
  { id: "#3961", customer: "Miguel Gonzalez", product: "Zapatillas Nike Air Max — Talle 42", date: "23/5 · 11:12", amount: 78788, status: "paid" },
  { id: "#3960", customer: "Virginia Wells", product: "Zapatillas Adidas Ultraboost — Talle 39", date: "23/5 · 10:51", amount: 73500, status: "paid" },
  { id: "#3959", customer: "Nazareno Gonzalez", product: "Campera The North Face — Talle M", date: "22/5 · 10:41", amount: 99000, status: "paid" },
  { id: "#3958", customer: "Thomas Barrera", product: "Campera The North Face — Talle L", date: "22/5 · 06:38", amount: 99000, status: "paid" },
  { id: "#3957", customer: "Joaquin Heredia", product: "Remera Oversize Premium — Talle XL", date: "22/5 · 01:47", amount: 29800, status: "pending" },
  { id: "#3956", customer: "Sonia Anglada", product: "Buzo Canguro Unisex — Talle S", date: "21/5 · 09:30", amount: 45000, status: "paid" },
  { id: "#3955", customer: "Erica Hoffmann", product: "Jean Slim Fit — Talle 30", date: "21/5 · 11:02", amount: 67900, status: "paid" },
  { id: "#3953", customer: "Matias Albarracin", product: "Remera Oversize Premium — Talle M", date: "21/5 · 09:06", amount: 29800, status: "cancelled" },
  { id: "#3952", customer: "Laura Diaz", product: "Zapatillas Puma RS-X — Talle 37", date: "20/5 · 16:22", amount: 58400, status: "paid" },
  { id: "#3951", customer: "Rodrigo Mendoza", product: "Pantalon Cargo — Talle 34", date: "20/5 · 14:55", amount: 54200, status: "pending" },
];

const STATUS: Record<string, { bg: string; color: string; label: string; border: string }> = {
  paid:      { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",  color: "#22c55e", label: "Pagado"    },
  pending:   { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)", color: "#f59e0b", label: "Pendiente" },
  cancelled: { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",  color: "#ef4444", label: "Cancelado" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

export default function OrdersTable() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}
      >
        <div>
          <h3 className="font-bold text-[#F1F5F9]" style={{ fontSize: "15px" }}>
            Ultimas ordenes
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Mayo 2026</p>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
          style={{
            color: "#8B5CF6",
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          Ver todas
          <ExternalLink size={11} strokeWidth={2.5} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
              {["PEDIDO", "CLIENTE", "PRODUCTO", "FECHA", "MONTO", "ESTADO"].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((order, i) => {
              const st = STATUS[order.status];
              return (
                <tr
                  key={order.id}
                  className="transition-colors duration-100"
                  style={{ borderBottom: i < ORDERS.length - 1 ? "1px solid rgba(124,58,237,0.08)" : "none" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "rgba(124,58,237,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-[#8B5CF6]">{order.id}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-[#F1F5F9]">{order.customer}</span>
                  </td>
                  <td className="px-5 py-3 max-w-[280px]">
                    <span className="block truncate text-sm text-[#94A3B8]">{order.product}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-xs text-[#64748b]">{order.date}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm font-black text-[#F1F5F9]">{fmt(order.amount)}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border"
                      style={{ background: st.bg, color: st.color, borderColor: st.border }}
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


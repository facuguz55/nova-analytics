"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

export interface OrderRow {
  id: string;
  external_id: string;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  status: string | null;
  created_at: string | null;
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string; border: string }> = {
  paid:         { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",  color: "#22c55e", label: "Pagado"    },
  pending:      { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)", color: "#f59e0b", label: "Pendiente" },
  cancelled:    { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",  color: "#ef4444", label: "Cancelado" },
  refunded:     { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",  color: "#ef4444", label: "Reembolsado" },
  abandoned:    { bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)", color: "#64748B", label: "Abandonado" },
  open:         { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)", color: "#f59e0b", label: "Abierta"   },
  closed:       { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",  color: "#22c55e", label: "Cerrada"   },
};

function getStatus(s: string | null) {
  if (!s) return STATUS_MAP["pending"];
  return STATUS_MAP[s] ?? { bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)", color: "#64748B", label: s };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

function fmtDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) + " · " + date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

interface OrdersTableProps {
  orders?: OrderRow[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const rows = orders ?? [];
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
        <Link
          href="/app/ordenes"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
          style={{
            color: "#8B5CF6",
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          Ver todas
          <ExternalLink size={11} strokeWidth={2.5} />
        </Link>
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#64748B]">
                  Sin órdenes — conectá TiendaNube para sincronizar
                </td>
              </tr>
            ) : rows.map((order, i) => {
              const st = getStatus(order.status);
              return (
                <tr
                  key={order.id}
                  className="transition-colors duration-100"
                  style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(124,58,237,0.08)" : "none" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "rgba(124,58,237,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-[#8B5CF6]">#{order.external_id}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-[#F1F5F9]">{order.customer_name ?? "Sin nombre"}</span>
                  </td>
                  <td className="px-5 py-3 max-w-[220px]">
                    <span className="block truncate text-xs text-[#94A3B8]">{order.customer_email ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-xs text-[#64748b]">{fmtDate(order.created_at)}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-sm font-black text-[#F1F5F9]">{fmt(order.total)}</span>
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


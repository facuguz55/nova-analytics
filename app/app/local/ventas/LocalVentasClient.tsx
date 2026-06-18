"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, X, ChevronDown, ShoppingBag } from "lucide-react";

type ItemRow = { product_name: string; unit_price: number; unit_cost: number; quantity: number };
type SaleRow = {
  id: string;
  total: number;
  payment_method: string;
  installments: number | null;
  notes: string | null;
  created_at: string;
  local_sale_items: ItemRow[];
};

const PAYMENT_LABELS: Record<string, string> = {
  efectivo:      "Efectivo",
  transferencia: "Transferencia",
  debito:        "Débito",
  credito:       "Crédito",
  cuotas:        "Cuotas",
};

const PAYMENT_COLORS: Record<string, string> = {
  efectivo:      "#22c55e",
  transferencia: "#2563eb",
  debito:        "#f59e0b",
  credito:       "#a855f7",
  cuotas:        "#e1691e",
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

function saleProfit(sale: SaleRow) {
  return sale.local_sale_items.reduce(
    (a, it) => a + (Number(it.unit_price) - Number(it.unit_cost)) * Number(it.quantity),
    0
  );
}

export default function LocalVentasClient({ sales }: { sales: SaleRow[] }) {
  const [search, setSearch]   = useState("");
  const [method, setMethod]   = useState("all");
  const [detail, setDetail]   = useState<SaleRow | null>(null);

  const filtered = useMemo(() => {
    let list = sales;
    if (method !== "all") list = list.filter((s) => s.payment_method === method);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.local_sale_items.some((it) => it.product_name.toLowerCase().includes(q)) ||
          s.notes?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [sales, method, search]);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Historial de ventas</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">{sales.length} ventas registradas</p>
        </div>
        <Link
          href="/app/local/ventas/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}
        >
          <Plus size={16} /> Nueva venta
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto o nota…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          />
        </div>
        <div className="relative">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2.5 rounded-xl text-sm text-[#F1F5F9] focus:outline-none cursor-pointer"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <option value="all">Todos los métodos</option>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
        </div>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <ShoppingBag size={40} className="text-[#334155] mb-3" />
          <p className="text-[#64748B] text-sm">No hay ventas que coincidan</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Fecha", "Productos", "Método", "Ganancia", "Total"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[#64748B] font-medium text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const profit = saleProfit(s);
                const itemSummary = s.local_sale_items
                  .map((it) => `${it.product_name} x${it.quantity}`)
                  .join(", ");
                return (
                  <tr
                    key={s.id}
                    onClick={() => setDetail(s)}
                    className="cursor-pointer hover:bg-white/[0.03] transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td className="px-4 py-3 text-[#94A3B8] whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-[#F1F5F9] max-w-[220px] truncate">
                      {itemSummary || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${PAYMENT_COLORS[s.payment_method] ?? "#64748B"}20`,
                          color: PAYMENT_COLORS[s.payment_method] ?? "#64748B",
                        }}
                      >
                        {PAYMENT_LABELS[s.payment_method] ?? s.payment_method}
                        {s.payment_method === "cuotas" && s.installments ? ` ${s.installments}x` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: profit >= 0 ? "#22c55e" : "#ef4444" }}>
                      {fmt(profit)}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#F1F5F9]">
                      {fmt(Number(s.total))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalle */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setDetail(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#F1F5F9]">Detalle de venta</h3>
              <button onClick={() => setDetail(null)} className="text-[#64748B] hover:text-[#94A3B8]">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-[#64748B] mb-4">
              {new Date(detail.created_at).toLocaleString("es-AR")}
            </p>
            <div className="space-y-2 mb-4">
              {detail.local_sale_items.map((it, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-sm text-[#F1F5F9]">{it.product_name}</p>
                    <p className="text-xs text-[#64748B]">x{it.quantity} · costo {fmt(Number(it.unit_cost))}</p>
                  </div>
                  <p className="text-sm font-medium text-[#F1F5F9]">
                    {fmt(Number(it.unit_price) * Number(it.quantity))}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#94A3B8]">Ganancia</span>
              <span className="font-medium text-[#22c55e]">{fmt(saleProfit(detail))}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[#94A3B8] text-sm">Método</span>
              <span
                className="text-sm font-medium"
                style={{ color: PAYMENT_COLORS[detail.payment_method] ?? "#94A3B8" }}
              >
                {PAYMENT_LABELS[detail.payment_method] ?? detail.payment_method}
                {detail.payment_method === "cuotas" && detail.installments ? ` — ${detail.installments} cuotas` : ""}
              </span>
            </div>
            {detail.notes && (
              <p className="text-xs text-[#64748B] mt-2 italic">"{detail.notes}"</p>
            )}
            <div className="flex justify-between mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="font-bold text-[#F1F5F9]">Total</span>
              <span className="font-bold text-xl text-[#F1F5F9]">{fmt(Number(detail.total))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante mobile */}
      <Link
        href="/app/local/ventas/nueva"
        className="fixed bottom-20 right-4 sm:hidden flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white z-40"
        style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}

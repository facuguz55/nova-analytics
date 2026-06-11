"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, ChevronLeft, ChevronRight, DollarSign, ShoppingCart, CheckCircle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

interface OrderRow {
  id: string;
  external_id: string;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  status: string | null;
  created_at: string | null;
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string; border: string }> = {
  paid:      { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",  color: "#22c55e", label: "Pagado"     },
  pending:   { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)", color: "#f59e0b", label: "Pendiente"  },
  cancelled: { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",  color: "#ef4444", label: "Cancelado"  },
  refunded:  { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",  color: "#ef4444", label: "Reembolsado"},
  abandoned: { bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)", color: "#64748B", label: "Abandonado"},
  open:      { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)", color: "#f59e0b", label: "Abierta"    },
  closed:    { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",  color: "#22c55e", label: "Cerrada"    },
};

function getStatus(s: string | null) {
  if (!s) return STATUS_MAP["pending"];
  return STATUS_MAP[s] ?? { bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)", color: "#64748B", label: s };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const STATUS_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "paid", label: "Pagadas" },
  { value: "pending", label: "Pendientes" },
  { value: "cancelled", label: "Canceladas" },
  { value: "abandoned", label: "Abandonadas" },
];

interface Props {
  orders: OrderRow[];
  totalRevenue: number;
  totalOrders: number;
  totalPaid: number;
  currentPage: number;
  totalPages: number;
  count: number;
  q: string;
  statusFilter: string;
}

export default function OrdenesClient({
  orders,
  totalRevenue,
  totalOrders,
  totalPaid,
  currentPage,
  totalPages,
  count,
  q,
  statusFilter,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(q);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: search });
  }

  function goPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const STATS = [
    { label: "Total órdenes",     value: totalOrders,  format: (n: number) => String(Math.round(n)), icon: ShoppingCart, color: "#8b5cf6" },
    { label: "Órdenes pagadas",   value: totalPaid,    format: (n: number) => String(Math.round(n)), icon: CheckCircle,  color: "#22c55e" },
    { label: "Facturación total", value: totalRevenue, format: fmt, icon: DollarSign, color: "#c084fc" },
  ];

  const payRate = totalOrders > 0 ? (totalPaid / totalOrders) * 100 : 0;
  const payData = [
    { name: "Pagadas", value: totalPaid, color: "#22c55e" },
    { name: "Resto",   value: Math.max(totalOrders - totalPaid, 0), color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Órdenes
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">{count} resultado{count !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Stats + dona tasa de pago */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div key={s.label} className="metric-card anim-up rounded-2xl p-4 flex items-center gap-4"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: `${0.05 + i * 0.06}s` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center anim-scale" style={{ background: `${s.color}1a`, animationDelay: `${0.12 + i * 0.06}s` }}>
              <s.icon size={18} color={s.color} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <AnimatedNumber value={s.value} format={s.format} className="text-xl font-black text-[#F1F5F9] leading-none" />
              <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
        <div className="metric-card anim-up rounded-2xl p-3 flex items-center gap-3" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: "0.23s" }}>
          <div className="relative" style={{ width: 64, height: 64, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payData} dataKey="value" nameKey="name" innerRadius={20} outerRadius={30} paddingAngle={2} stroke="none" animationDuration={1000}>
                  {payData.map((d) => <Cell key={d.name} fill={d.color} style={{ filter: `drop-shadow(0 0 4px ${d.color}66)` }} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#F1F5F9", fontSize: "12px" }} formatter={(v, n) => [`${v}`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0">
            <p className="text-xl font-black text-[#22c55e] leading-none">{payRate.toFixed(0)}%</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Tasa de pago</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
          >
            <Search size={13} color="#64748B" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, email, #orden..."
              className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white flex-shrink-0"
            style={{ background: "#8b5cf6" }}
          >
            Buscar
          </button>
        </form>

        {/* Status filter */}
        <div
          className="flex items-center gap-1 rounded-xl p-1 overflow-x-auto"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateParams({ status: f.value === "all" ? "" : f.value })}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: statusFilter === f.value || (f.value === "all" && statusFilter === "all") ? "#8b5cf6" : "transparent",
                color: statusFilter === f.value || (f.value === "all" && statusFilter === "all") ? "white" : "#94A3B8",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                {["PEDIDO", "CLIENTE", "EMAIL", "FECHA", "MONTO", "ESTADO"].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold tracking-widest text-[#94A3B8] uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#64748B]">
                    {q || statusFilter !== "all" ? "Sin resultados para ese filtro" : "Sin órdenes — conectá TiendaNube para sincronizar"}
                  </td>
                </tr>
              ) : orders.map((order, i) => {
                const st = getStatus(order.status);
                return (
                  <tr
                    key={order.id}
                    style={{ borderBottom: i < orders.length - 1 ? "1px solid rgba(139,92,246,0.08)" : "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(139,92,246,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-[#a78bfa]">#{order.external_id}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-[#F1F5F9]">{order.customer_name ?? "Sin nombre"}</span>
                    </td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <span className="block truncate text-xs text-[#94A3B8]">{order.customer_email ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-xs text-[#64748B]">{fmtDate(order.created_at)}</span>
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

        {/* Paginación */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid rgba(139,92,246,0.15)" }}
          >
            <p className="text-xs text-[#64748B]">
              Página {currentPage} de {totalPages} · {count} resultados
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:bg-[rgba(139,92,246,0.1)]"
                style={{ border: "1px solid rgba(139,92,246,0.2)", color: "#94A3B8" }}
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => goPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:bg-[rgba(139,92,246,0.1)]"
                style={{ border: "1px solid rgba(139,92,246,0.2)", color: "#94A3B8" }}
              >
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

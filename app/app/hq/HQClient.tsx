"use client";

import { useState, useMemo } from "react";
import { Search, User, X, Phone, ShoppingBag, CreditCard, Store, Building2 } from "lucide-react";

type SaleMini    = { id: string; total: number; created_at: string };
type CustomerRow = {
  id: string; name: string; dni: string | null; phone: string | null;
  email: string | null; created_at: string; workspace_id: string;
  workspaces: { name: string } | null;
  local_sales: SaleMini[];
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
const CARD: React.CSSProperties = { background: "#111118", border: "1px solid rgba(124,58,237,0.15)" };

function stats(c: CustomerRow) {
  const s = c.local_sales ?? [];
  return {
    count: s.length,
    total: s.reduce((a, x) => a + Number(x.total), 0),
    lastAt: s.length > 0 ? s.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at : null,
  };
}

export default function HQClient({
  customers,
  workspaces,
}: {
  customers: CustomerRow[];
  workspaces: { id: string; name: string }[];
}) {
  const [search,    setSearch]    = useState("");
  const [wsFilter,  setWsFilter]  = useState("all");
  const [detail,    setDetail]    = useState<CustomerRow | null>(null);

  const filtered = useMemo(() => {
    let list = customers;
    if (wsFilter !== "all") list = list.filter((c) => c.workspace_id === wsFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.dni ?? "").includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.workspaces?.name ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, wsFilter, search]);

  // Stats globales
  const totalCustomers = customers.length;
  const totalSpent     = customers.reduce((a, c) => a + stats(c).total, 0);
  const totalSales     = customers.reduce((a, c) => a + stats(c).count, 0);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={20} className="text-[#f59e0b]" />
          <h1 className="text-2xl font-bold text-[#F1F5F9]">HQ — Clientes</h1>
        </div>
        <p className="text-sm text-[#94A3B8]">Vista global de todos los clientes del local físico</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Tiendas activas", value: workspaces.length, color: "#f59e0b" },
          { label: "Clientes totales",  value: totalCustomers,    color: "#e1691e" },
          { label: "Ventas registradas", value: totalSales,       color: "#22c55e" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={CARD}>
            <p className="text-2xl font-bold text-[#F1F5F9]">{value.toLocaleString("es-AR")}</p>
            <p className="text-xs text-[#64748B] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, DNI, teléfono o tienda…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          />
        </div>
        <select
          value={wsFilter}
          onChange={(e) => setWsFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] focus:outline-none"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <option value="all">Todas las tiendas</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={CARD}>
          <User size={40} className="text-[#334155] mb-3" />
          <p className="text-[#64748B] text-sm">No hay clientes que coincidan</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Tienda", "Cliente", "DNI", "Contacto", "Compras", "Total", "Última visita"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[#64748B] font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const { count, total, lastAt } = stats(c);
                return (
                  <tr key={c.id} onClick={() => setDetail(c)}
                    className="cursor-pointer hover:bg-white/[0.03] transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Store size={12} className="text-[#f59e0b] flex-shrink-0" />
                        <span className="text-xs text-[#94A3B8] truncate max-w-[100px]">{c.workspaces?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}>
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-[#F1F5F9] truncate max-w-[140px]">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">{c.dni || "—"}</td>
                    <td className="px-4 py-3 text-[#94A3B8] text-xs">{c.phone || c.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold" style={{ color: count > 0 ? "#e1691e" : "#64748B" }}>{count}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#F1F5F9]">{total > 0 ? fmt(total) : "—"}</td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">
                      {lastAt ? new Date(lastAt).toLocaleDateString("es-AR") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setDetail(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[85vh] overflow-y-auto"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)" }}>
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}>
                  {detail.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-[#F1F5F9] text-lg">{detail.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Store size={11} className="text-[#f59e0b]" />
                    <span className="text-xs text-[#94A3B8]">{detail.workspaces?.name}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="text-[#64748B] hover:text-[#94A3B8]"><X size={20} /></button>
            </div>
            <p className="text-xs text-[#64748B] mb-4 ml-[60px]">Desde {new Date(detail.created_at).toLocaleDateString("es-AR")}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {detail.dni && (
                <div className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] text-[#64748B] uppercase tracking-wide">DNI</p>
                  <p className="text-sm font-mono text-[#F1F5F9]">{detail.dni}</p>
                </div>
              )}
              {detail.phone && (
                <div className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Teléfono</p>
                  <div className="flex items-center gap-1"><Phone size={11} className="text-[#64748B]" /><p className="text-sm text-[#F1F5F9]">{detail.phone}</p></div>
                </div>
              )}
            </div>

            {(() => {
              const { count, total } = stats(detail);
              return (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="px-3 py-3 rounded-xl text-center" style={{ background: "rgba(225,105,30,0.08)", border: "1px solid rgba(225,105,30,0.2)" }}>
                    <ShoppingBag size={16} className="text-[#e1691e] mx-auto mb-1" />
                    <p className="text-xl font-bold text-[#F1F5F9]">{count}</p>
                    <p className="text-xs text-[#94A3B8]">compra{count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="px-3 py-3 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <CreditCard size={16} className="text-[#22c55e] mx-auto mb-1" />
                    <p className="text-xl font-bold text-[#F1F5F9]">{fmt(total)}</p>
                    <p className="text-xs text-[#94A3B8]">total gastado</p>
                  </div>
                </div>
              );
            })()}

            {detail.local_sales.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Historial</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {detail.local_sales
                    .slice()
                    .sort((a, b) => b.created_at.localeCompare(a.created_at))
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <p className="text-xs text-[#94A3B8]">
                          {new Date(s.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </p>
                        <p className="text-sm font-semibold text-[#F1F5F9]">{fmt(Number(s.total))}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

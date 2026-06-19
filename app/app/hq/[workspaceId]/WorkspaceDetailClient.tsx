"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, ShoppingCart, DollarSign, Users,
  TrendingUp, ShoppingBag, CheckCircle2, XCircle, Package, X,
  Crown, Zap, Clock,
} from "lucide-react";
import type { TNOrder, TNCustomer } from "@/lib/tiendanube/client";

const CARD: React.CSSProperties = { background: "#111118", border: "1px solid rgba(124,58,237,0.15)" };
const AMBER = "#f59e0b";

const fmt  = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
const fmtN = (n: number) => n.toLocaleString("es-AR");

function calcRevenue(orders: TNOrder[]) {
  return orders
    .filter((o) => o.payment_status === "paid" || o.status === "closed")
    .reduce((a, o) => a + parseFloat(o.total || "0"), 0);
}

const PLAN_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  agency: { label: "Agency", color: "#f59e0b", icon: <Crown size={10} /> },
  pro:    { label: "Pro",    color: "#8B5CF6", icon: <Zap size={10} /> },
  trial:  { label: "Trial", color: "#3b82f6", icon: <Clock size={10} /> },
  free:   { label: "Free",  color: "#64748B", icon: null },
};

type Tab = "resumen" | "ordenes" | "clientes";

export default function WorkspaceDetailClient({
  workspace,
  orders,
  customers,
  hasTN,
  storeName,
}: {
  workspace: { id: string; name: string; plan: string; status: string; created_at: string };
  orders: TNOrder[];
  customers: TNCustomer[];
  hasTN: boolean;
  storeName: string | null;
}) {
  const router  = useRouter();
  const [tab, setTab] = useState<Tab>("resumen");
  const [detail, setDetail] = useState<TNOrder | null>(null);

  const revenue   = calcRevenue(orders);
  const paidCount = orders.filter((o) => o.payment_status === "paid" || o.status === "closed").length;
  const aov       = paidCount > 0 ? revenue / paidCount : 0;
  const planInfo  = PLAN_BADGE[workspace.plan] ?? PLAN_BADGE.free;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/app/hq")}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", color: "#94A3B8" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${AMBER}18`; (e.currentTarget as HTMLButtonElement).style.color = AMBER; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            {workspace.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#F1F5F9]">{workspace.name}</h1>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: `${planInfo.color}18`, color: planInfo.color, border: `1px solid ${planInfo.color}33` }}
              >
                {planInfo.icon}{planInfo.label}
              </span>
              {workspace.status === "active"
                ? <CheckCircle2 size={13} className="text-[#22c55e]" />
                : <XCircle size={13} className="text-[#64748B]" />}
            </div>
            {storeName && <p className="text-xs text-[#64748B]">{storeName}</p>}
          </div>
        </div>
      </div>

      {!hasTN ? (
        /* Sin TiendaNube */
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={CARD}>
          <ShoppingBag size={44} className="text-[#334155] mb-3" />
          <p className="text-[#94A3B8] font-medium mb-1">Esta tienda no tiene TiendaNube conectado</p>
          <p className="text-xs text-[#475569]">Una vez que conecten la integración, los datos aparecerán aquí.</p>
        </div>
      ) : (
        <>
          {/* KPIs 30d */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Revenue 30d",  value: fmt(revenue),       icon: <DollarSign size={16} />, color: "#22c55e" },
              { label: "Órdenes 30d",  value: fmtN(orders.length), icon: <ShoppingCart size={16} />, color: "#2563EB" },
              { label: "AOV",          value: fmt(aov),            icon: <TrendingUp size={16} />,  color: "#8B5CF6" },
              { label: "Clientes cargados", value: fmtN(customers.length), icon: <Users size={16} />, color: AMBER },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="rounded-2xl p-4" style={CARD}>
                <div className="flex items-center gap-2 mb-2" style={{ color }}>
                  {icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</span>
                </div>
                <p className="text-2xl font-bold text-[#F1F5F9]">{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)" }}>
            {(["resumen", "ordenes", "clientes"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  background: tab === t ? "rgba(245,158,11,0.15)" : "transparent",
                  color: tab === t ? AMBER : "#64748B",
                  border: tab === t ? `1px solid ${AMBER}33` : "1px solid transparent",
                }}
              >
                {t === "resumen" ? "Resumen" : t === "ordenes" ? "Órdenes" : "Clientes"}
              </button>
            ))}
          </div>

          {/* ---- RESUMEN ---- */}
          {tab === "resumen" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Últimas 5 órdenes */}
              <div className="rounded-2xl overflow-hidden" style={CARD}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-sm font-semibold text-[#F1F5F9]">Últimas órdenes</p>
                </div>
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div>
                      <p className="text-sm text-[#F1F5F9] font-medium">#{o.number}</p>
                      <p className="text-xs text-[#64748B]">{o.customer?.name ?? "Sin cliente"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#F1F5F9]">{fmt(parseFloat(o.total))}</p>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: o.payment_status === "paid" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.12)",
                          color:      o.payment_status === "paid" ? "#22c55e" : "#f59e0b",
                        }}
                      >
                        {o.payment_status === "paid" ? "Pagado" : o.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top clientes */}
              <div className="rounded-2xl overflow-hidden" style={CARD}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-sm font-semibold text-[#F1F5F9]">Top clientes por gasto</p>
                </div>
                {customers.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                      >
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-[#F1F5F9] font-medium">{c.name}</p>
                        <p className="text-xs text-[#64748B]">{c.orders_count} orden{c.orders_count !== 1 ? "es" : ""}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[#F1F5F9]">{fmt(parseFloat(c.total_spent))}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- ÓRDENES ---- */}
          {tab === "ordenes" && (
            <div className="rounded-2xl overflow-hidden" style={CARD}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["#", "Cliente", "Estado pago", "Estado", "Total", "Fecha"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[#64748B] font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setDetail(o)}
                      className="cursor-pointer hover:bg-white/[0.03] transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">#{o.number}</td>
                      <td className="px-4 py-3">
                        <p className="text-[#F1F5F9] font-medium truncate max-w-[160px]">{o.customer?.name ?? "—"}</p>
                        <p className="text-xs text-[#64748B] truncate max-w-[160px]">{o.customer?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: o.payment_status === "paid" ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)",
                            color:      o.payment_status === "paid" ? "#22c55e" : "#94A3B8",
                          }}
                        >
                          {o.payment_status === "paid" ? "Pagado" : o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#94A3B8] capitalize">{o.status}</td>
                      <td className="px-4 py-3 font-semibold text-[#F1F5F9]">{fmt(parseFloat(o.total))}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">
                        {new Date(o.created_at).toLocaleDateString("es-AR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <ShoppingCart size={36} className="text-[#334155] mb-2" />
                  <p className="text-[#64748B] text-sm">Sin órdenes en los últimos 30 días</p>
                </div>
              )}
            </div>
          )}

          {/* ---- CLIENTES ---- */}
          {tab === "clientes" && (
            <div className="rounded-2xl overflow-hidden" style={CARD}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Cliente", "Email", "Órdenes", "Total gastado", "Ciudad", "Desde"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[#64748B] font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.03] transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                          >
                            {c.name[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-[#F1F5F9] truncate max-w-[140px]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#94A3B8] max-w-[160px] truncate">{c.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold" style={{ color: c.orders_count > 0 ? AMBER : "#64748B" }}>
                          {c.orders_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#F1F5F9]">
                        {parseFloat(c.total_spent) > 0 ? fmt(parseFloat(c.total_spent)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#94A3B8]">{c.default_address?.city ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">
                        {new Date(c.created_at).toLocaleDateString("es-AR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Users size={36} className="text-[#334155] mb-2" />
                  <p className="text-[#64748B] text-sm">Sin clientes cargados</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal detalle orden */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setDetail(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ background: "#111118", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-[#F1F5F9] text-lg">Orden #{detail.number}</p>
                <p className="text-xs text-[#64748B]">{new Date(detail.created_at).toLocaleString("es-AR")}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-[#64748B] hover:text-[#94A3B8]">
                <X size={18} />
              </button>
            </div>

            {detail.customer && (
              <div className="px-3 py-2.5 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-xs text-[#64748B] mb-0.5">Cliente</p>
                <p className="text-sm font-medium text-[#F1F5F9]">{detail.customer.name}</p>
                <p className="text-xs text-[#64748B]">{detail.customer.email}</p>
              </div>
            )}

            {detail.products.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Productos</p>
                <div className="space-y-1.5">
                  {detail.products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex items-center gap-2">
                        <Package size={12} className="text-[#64748B]" />
                        <p className="text-xs text-[#F1F5F9] truncate max-w-[160px]">{p.name}</p>
                      </div>
                      <p className="text-xs text-[#94A3B8]">x{p.quantity} · {fmt(parseFloat(p.price))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm text-[#94A3B8]">Total</p>
              <p className="text-xl font-bold text-[#F1F5F9]">{fmt(parseFloat(detail.total))}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

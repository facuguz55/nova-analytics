"use client";

import { useState } from "react";
import { Store, Users, DollarSign, TrendingUp, ShoppingCart, ArrowRight, AlertTriangle, Package, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import type { TNOrder, TNProduct, TNCustomer } from "@/lib/tiendanube/client";

// ── Tipos ────────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: "ARS", symbol: "$",  label: "Pesos arg." },
  { code: "USD", symbol: "U$", label: "Dólar USA" },
  { code: "EUR", symbol: "€",  label: "Euro"       },
  { code: "BRL", symbol: "R$", label: "Real bras." },
  { code: "UYU", symbol: "$U", label: "Peso uru."  },
];

// Tasas aproximadas vs USD (para convertir)
const USD_TO_CURRENCY: Record<string, number> = {
  ARS: 1,     // se reemplaza con usd_rate
  USD: 1,
  EUR: 0.92,
  BRL: 5.0,
  UYU: 39,
};

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}

interface Props {
  isConnected: boolean;
  storeName: string | null;
  usdRate: number;
  days: 30 | 60 | 90;
  allOrders: TNOrder[];
  products: TNProduct[];
  customers: TNCustomer[];
  error: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getProductName(p: TNProduct): string {
  const v = p.name;
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    return (v as Record<string, string>)["es"] ?? Object.values(v as Record<string, string>)[0] ?? String(p.id);
  }
  return String(p.id);
}

export default function TiendaClient({
  isConnected, storeName, usdRate, days, allOrders, products, customers, error,
}: Props) {
  const [currency,     setCurrency]     = useState("ARS");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDays, setSelectedDays] = useState<30 | 60 | 90>(days);

  // Función de conversión
  function convert(arsAmount: number): number {
    if (currency === "ARS") return arsAmount;
    // ARS → USD
    const inUsd = arsAmount / usdRate;
    if (currency === "USD") return inUsd;
    // USD → otra moneda
    const rate = USD_TO_CURRENCY[currency] ?? 1;
    return inUsd * rate;
  }

  function fmt(arsAmount: number): string {
    const val = convert(arsAmount);
    const cur = CURRENCIES.find((c) => c.code === currency);
    const sym = cur?.symbol ?? "$";

    // ARS: número completo con separadores ($1.740.000)
    if (currency === "ARS") {
      return `${sym}${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(val)}`;
    }

    // Otras monedas: dos decimales con separador
    return `${sym}${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
  }

  const paidOrders  = allOrders.filter((o) => o.payment_status === "paid" || o.status === "closed");
  const totalRevenue = paidOrders.reduce((a, o) => a + parseFloat(o.total), 0);
  const avgTicket   = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const lowStock    = products.filter((p) => p.variants.some((v) => (v.stock ?? 0) <= 5 && (v.stock ?? 0) > 0));
  const outOfStock  = products.filter((p) => p.variants.every((v) => (v.stock ?? 0) <= 0));
  const recurrentes = customers.filter((c) => c.orders_count > 1);
  const convRate    = allOrders.length > 0 ? ((paidOrders.length / allOrders.length) * 100).toFixed(1) : "0";
  const topProducts = [...products]
    .sort((a, b) => parseFloat(b.variants[0]?.price ?? "0") - parseFloat(a.variants[0]?.price ?? "0"))
    .slice(0, 5);

  const statCards: StatCard[] = [
    { label: `Ingresos (${selectedDays}d)`, value: fmt(totalRevenue), icon: DollarSign, color: "#8b5cf6", sub: `${paidOrders.length} órdenes pagas` },
    { label: "Ticket promedio",             value: fmt(avgTicket),     icon: ShoppingCart, color: "#22c55e" },
    { label: "Clientes",                    value: String(customers.length), icon: Users, color: "#c026d3", sub: `${recurrentes.length} recurrentes` },
    { label: "Conversión",                  value: `${convRate}%`,     icon: TrendingUp, color: "#f59e0b", sub: `${allOrders.length} órdenes` },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Tienda Web</h1>
          {isConnected && storeName && (
            <p className="text-sm text-[#94A3B8] mt-0.5">
              <span className="text-green-400">●</span>{" "}
              {storeName} · Datos en tiempo real
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency selector */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:bg-[rgba(139,92,246,0.15)]"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}
            >
              {currency}
              <ChevronDown size={11} strokeWidth={2.5} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDropdown && (
              <div
                className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-20 py-1"
                style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", minWidth: "150px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              >
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.code); setShowDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-[rgba(139,92,246,0.08)]"
                    style={{ color: c.code === currency ? "#a78bfa" : "#94A3B8" }}
                  >
                    <span>{c.code} — {c.label}</span>
                    {c.code === currency && <Check size={11} strokeWidth={2.5} color="#8b5cf6" />}
                  </button>
                ))}
                {currency !== "ARS" && (
                  <p className="px-4 py-1.5 text-[10px] text-[#475569] border-t" style={{ borderColor: "rgba(139,92,246,0.12)" }}>
                    {currency === "USD" ? `1 USD = ${usdRate.toLocaleString("es-AR")} ARS` : `Tasa aprox. vs USD`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Days selector */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: "#0D0D12", border: "1px solid rgba(139,92,246,0.2)" }}>
            {([30, 60, 90] as const).map((d) => (
              <Link
                key={d}
                href={`?days=${d}`}
                onClick={() => setSelectedDays(d)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: selectedDays === d ? "#8b5cf6" : "transparent", color: selectedDays === d ? "#fff" : "#64748B" }}
              >
                {d}d
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Sin conexión */}
      {!isConnected && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(139,92,246,0.3)" }}>
          <Store size={40} color="#8b5cf6" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conecta tu TiendaNube</p>
          <p className="text-sm text-[#64748B] mb-4">Para ver tus ventas, productos y clientes en tiempo real</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#8b5cf6" }}
          >
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Error */}
      {isConnected && error && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={18} color="#ef4444" />
          <p className="text-sm text-[#fca5a5]">{error}</p>
        </div>
      )}

      {/* Contenido */}
      {isConnected && !error && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                  <s.icon size={18} color={s.color} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{s.label}</p>
                  <p className="text-lg font-bold text-[#F1F5F9]">{s.value}</p>
                  {s.sub && <p className="text-xs text-[#64748B]">{s.sub}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Alertas de stock */}
          {(lowStock.length > 0 || outOfStock.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outOfStock.length > 0 && (
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <AlertTriangle size={18} color="#ef4444" className="flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#fca5a5]">{outOfStock.length} productos sin stock</p>
                    <p className="text-xs text-[#64748B]">Revisa el inventario urgente</p>
                  </div>
                </div>
              )}
              {lowStock.length > 0 && (
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a00", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <Package size={18} color="#f59e0b" className="flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#fcd34d]">{lowStock.length} con stock bajo</p>
                    <p className="text-xs text-[#64748B]">Menos de 5 unidades</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top productos */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Top Productos</h2>
              {topProducts.length === 0 ? (
                <p className="text-sm text-[#64748B]">Sin datos de productos</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p) => {
                    const name  = getProductName(p);
                    const price = parseFloat(p.variants[0]?.price ?? "0");
                    const stock = p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
                    return (
                      <div key={p.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.1)" }}>
                            <Package size={14} color="#8b5cf6" />
                          </div>
                          <span className="text-sm text-[#CBD5E1] truncate max-w-[120px] sm:max-w-[160px]">{name}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-[#F1F5F9]">{fmt(price)}</p>
                          <p className="text-xs text-[#64748B]">{stock} en stock</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link href="/app/productos" className="flex items-center gap-1 text-xs text-[#8b5cf6] font-medium">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            {/* Órdenes recientes */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Órdenes Recientes</h2>
              {allOrders.length === 0 ? (
                <p className="text-sm text-[#64748B]">Sin órdenes en el periodo</p>
              ) : (
                <div className="space-y-2">
                  {allOrders.slice(0, 10).map((o) => {
                    const isPaid = o.payment_status === "paid" || o.status === "closed";
                    const sc = isPaid ? "#22c55e" : o.status === "cancelled" ? "#ef4444" : "#f59e0b";
                    return (
                      <div key={o.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc }} />
                          <div className="min-w-0">
                            <p className="text-sm text-[#CBD5E1] truncate">{o.customer?.name ?? "Anónimo"}</p>
                            <p className="text-xs text-[#64748B]">{new Date(o.created_at).toLocaleDateString("es-AR")}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#F1F5F9] flex-shrink-0">
                          {fmt(parseFloat(o.total))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link href="/app/ordenes" className="flex items-center gap-1 text-xs text-[#8b5cf6] font-medium">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

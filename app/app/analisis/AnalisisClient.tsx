"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { Loader2, Store, ArrowRight } from "lucide-react";
import type { TNOrder } from "@/lib/tiendanube/client";

// ── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "paid" | "pending" | "cancelled" | "all";

interface Props {
  initialOrders: TNOrder[];
  days: 30 | 60 | 90;
  isConnected: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
};

function filterByStatus(orders: TNOrder[], filter: StatusFilter): TNOrder[] {
  if (filter === "all") return orders;
  if (filter === "paid")
    return orders.filter((o) => o.payment_status === "paid" || o.status === "closed");
  if (filter === "pending")
    return orders.filter((o) => o.payment_status === "pending" && o.status !== "cancelled");
  if (filter === "cancelled")
    return orders.filter(
      (o) => o.status === "cancelled" || o.payment_status === "voided" || o.payment_status === "refunded"
    );
  return orders;
}

function computeMonthlyData(orders: TNOrder[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
    const mo = orders.filter((o) => {
      const date = new Date(o.created_at);
      return date >= d && date < next;
    });
    return {
      month: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      ventas: mo.reduce((acc, o) => acc + parseFloat(o.total || "0"), 0),
      ordenes: mo.length,
    };
  });
}

function computeByWeekday(orders: TNOrder[]) {
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return weekDays.map((day, idx) => {
    const dayOrders = orders.filter((o) => new Date(o.created_at).getDay() === idx);
    return {
      day,
      ventas: dayOrders.reduce((acc, o) => acc + parseFloat(o.total || "0"), 0),
      ordenes: dayOrders.length,
    };
  });
}

function computeByHour(orders: TNOrder[]) {
  return Array.from({ length: 24 }, (_, h) => {
    const ho = orders.filter((o) => new Date(o.created_at).getHours() === h);
    return { hora: `${String(h).padStart(2, "0")}:00`, ordenes: ho.length };
  });
}

// ── Chart Card ────────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
        <p className="font-semibold text-[#F1F5F9] text-sm">{title}</p>
        {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalisisClient({ initialOrders, days, isConnected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allOrders, setAllOrders] = useState<TNOrder[]>(initialOrders);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedPages, setLoadedPages] = useState(initialOrders.length > 0 ? 1 : 0);
  const [fullyLoaded, setFullyLoaded] = useState(initialOrders.length < 100);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("paid");
  const [fetchError, setFetchError] = useState(false);

  // Carga progresiva — auto-fetch siguiente página si la anterior devolvió 100
  const loadNextPage = useCallback(async (page: number) => {
    if (loadingMore || fullyLoaded || !isConnected) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/tiendanube/orders?page=${page}&days=${days}`);
      if (!res.ok) { setFetchError(true); return; }
      const data = await res.json() as { orders: TNOrder[]; hasMore: boolean };
      setAllOrders((prev) => {
        // Deduplicar por id (por si hay overlap entre páginas)
        const existingIds = new Set(prev.map((o) => o.id));
        const newOrders = data.orders.filter((o) => !existingIds.has(o.id));
        return [...prev, ...newOrders];
      });
      setLoadedPages(page);
      if (!data.hasMore || page >= 20) setFullyLoaded(true); // máx 20 páginas
    } catch {
      setFetchError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, fullyLoaded, isConnected, days]);

  // Arrancar carga progresiva cuando el componente monta (si hay más datos)
  useEffect(() => {
    if (initialOrders.length === 100 && !fullyLoaded) {
      loadNextPage(2);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar siguiente página automáticamente cuando termina la anterior
  useEffect(() => {
    if (!loadingMore && !fullyLoaded && loadedPages >= 1 && allOrders.length === loadedPages * 100) {
      loadNextPage(loadedPages + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, fullyLoaded, loadedPages]);

  // Cambio de período
  function handleDaysChange(d: 30 | 60 | 90) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(d));
    router.push(`${pathname}?${params.toString()}`);
  }

  // Datos filtrados para los gráficos
  const filtered = useMemo(() => filterByStatus(allOrders, statusFilter), [allOrders, statusFilter]);
  const monthlyData = useMemo(() => computeMonthlyData(filtered), [filtered]);
  const byWeekday = useMemo(() => computeByWeekday(filtered), [filtered]);
  const byHour = useMemo(() => computeByHour(filtered), [filtered]);

  // Contadores por estado (para los badges del tab)
  const counts = useMemo(() => ({
    paid: allOrders.filter((o) => o.payment_status === "paid" || o.status === "closed").length,
    pending: allOrders.filter((o) => o.payment_status === "pending" && o.status !== "cancelled").length,
    cancelled: allOrders.filter(
      (o) => o.status === "cancelled" || o.payment_status === "voided" || o.payment_status === "refunded"
    ).length,
    all: allOrders.length,
  }), [allOrders]);

  const totalRevenue = useMemo(
    () => filtered.reduce((acc, o) => acc + parseFloat(o.total || "0"), 0),
    [filtered]
  );

  // ── Pantalla: TiendaNube no conectado ──────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-black text-[#F1F5F9] mb-2" style={{ letterSpacing: "-0.02em" }}>Análisis</h1>
        <div className="rounded-2xl p-10 text-center" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <Store size={40} color="#7C3AED" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conectá tu TiendaNube</p>
          <p className="text-sm text-[#64748B] mb-4">Necesitás conectar tu tienda para ver el análisis de ventas.</p>
          <a
            href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#7C3AED" }}
          >
            Ir a integraciones <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  // ── Layout principal ───────────────────────────────────────────────────────
  const STATUS_TABS: { key: StatusFilter; label: string; color: string }[] = [
    { key: "paid",      label: "Pagadas",    color: "#22c55e" },
    { key: "pending",   label: "Pendientes", color: "#f59e0b" },
    { key: "cancelled", label: "Canceladas", color: "#ef4444" },
    { key: "all",       label: "Todas",      color: "#8B5CF6" },
  ];

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Análisis</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Evolución histórica y patrones de ventas</p>
        </div>

        {/* Selector de período */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "#0D0D12", border: "1px solid rgba(124,58,237,0.2)" }}>
          {([30, 60, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => handleDaysChange(d)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: days === d ? "#7C3AED" : "transparent",
                color: days === d ? "#fff" : "#64748B",
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Tabs de estado de órdenes */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: active ? `${tab.color}18` : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? tab.color + "40" : "rgba(255,255,255,0.08)"}`,
                color: active ? tab.color : "#64748B",
              }}
            >
              {tab.label}
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: active ? `${tab.color}25` : "rgba(255,255,255,0.06)",
                  color: active ? tab.color : "#475569",
                }}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}

        {/* Indicador de carga progresiva */}
        {loadingMore && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#8B5CF6" }}
          >
            <Loader2 size={11} className="animate-spin" />
            Cargando más datos...
          </div>
        )}
        {fullyLoaded && allOrders.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}
          >
            ✓ {allOrders.length} órdenes cargadas
          </div>
        )}
        {fetchError && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
          >
            Error parcial — mostrando datos disponibles
          </div>
        )}
      </div>

      {/* Sin datos para este filtro */}
      {filtered.length === 0 && !loadingMore && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <p className="text-[#64748B] text-sm">
            {allOrders.length === 0
              ? "No se encontraron órdenes en este período."
              : `No hay órdenes con estado "${STATUS_TABS.find(t => t.key === statusFilter)?.label?.toLowerCase()}" en este período.`}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* Resumen rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Órdenes", value: String(filtered.length), color: "#8B5CF6" },
              { label: "Ingresos", value: fmt(totalRevenue), color: "#22c55e" },
              {
                label: "Ticket promedio",
                value: filtered.length > 0 ? fmt(totalRevenue / filtered.length) : "$0",
                color: "#e1691e",
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
                <p className="text-xs text-[#94A3B8] mb-1">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Ventas por mes */}
          <ChartCard
            title="Ventas por mes"
            subtitle={`Últimos 6 meses · ${STATUS_TABS.find(t => t.key === statusFilter)?.label?.toLowerCase() ?? "todas"}`}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e1691e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#e1691e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", fontSize: "12px" }}
                  labelStyle={{ color: "#F1F5F9", fontWeight: 700 }}
                  formatter={(v) => [fmt(Number(v)), "Ventas"]}
                />
                <Area type="monotone" dataKey="ventas" stroke="#e1691e" strokeWidth={2} fill="url(#gVentas)" dot={false} activeDot={{ r: 4, fill: "#e1691e", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Por día de la semana */}
            <ChartCard title="Ventas por día de la semana" subtitle="Distribución semanal">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byWeekday} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v) => [fmt(Number(v)), "Ventas"]}
                  />
                  <Bar dataKey="ventas" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Por hora */}
            <ChartCard title="Órdenes por hora del día" subtitle="Distribución horaria">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byHour} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
                  <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v) => [Number(v), "Órdenes"]}
                  />
                  <Bar dataKey="ordenes" fill="#e1691e" radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Insight automático */}
          {byWeekday.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.05))", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              {(() => {
                const bestDay = byWeekday.reduce((best, d) => d.ventas > best.ventas ? d : best, byWeekday[0]);
                const bestHour = byHour.reduce((best, h) => h.ordenes > best.ordenes ? h : best, byHour[0]);
                return (
                  <p className="text-sm text-[#94A3B8]">
                    🔥 Tu mejor día de la semana es{" "}
                    <span className="text-[#e1691e] font-bold">{bestDay.day}</span> con {fmt(bestDay.ventas)} en ventas.
                    El horario pico de órdenes es{" "}
                    <span className="text-[#7C3AED] font-bold">{bestHour.hora}</span> hs.
                  </p>
                );
              })()}
            </div>
          )}

          {/* Lista de órdenes filtradas */}
          {(() => {
            const tab = STATUS_TABS.find(t => t.key === statusFilter);
            return (
              <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
                  <p className="text-sm font-semibold text-[#F1F5F9]">
                    Lista de órdenes
                    {tab && statusFilter !== "all" && (
                      <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{ background: `${tab.color}15`, color: tab.color }}>
                        {tab.label}
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-[#64748B]">{filtered.length} órdenes</span>
                </div>

                {filtered.slice(0, 150).map((o, i) => {
                  const isPaid = o.payment_status === "paid" || o.status === "closed";
                  const isCancelled = o.status === "cancelled" || o.payment_status === "voided" || o.payment_status === "refunded";
                  const dotColor = isPaid ? "#22c55e" : isCancelled ? "#ef4444" : "#f59e0b";
                  const statusText = isPaid ? "Pagada" : isCancelled ? "Cancelada" : "Pendiente";
                  return (
                    <div
                      key={o.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[rgba(124,58,237,0.04)] transition-colors"
                      style={{ borderBottom: i < Math.min(filtered.length, 150) - 1 ? "1px solid rgba(124,58,237,0.06)" : "none" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#8B5CF6]">#{o.number ?? o.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${dotColor}15`, color: dotColor }}>
                            {statusText}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] truncate">
                          {o.customer?.name ?? "Anónimo"}
                          {o.customer?.email ? ` · ${o.customer.email}` : ""}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#F1F5F9]">{fmt(parseFloat(o.total || "0"))}</p>
                        <p className="text-xs text-[#64748B]">
                          {new Date(o.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {filtered.length > 150 && (
                  <div className="px-5 py-3 text-center" style={{ borderTop: "1px solid rgba(124,58,237,0.08)" }}>
                    <p className="text-xs text-[#64748B]">Mostrando 150 de {filtered.length} — achicá el rango de días o filtrá por estado para ver menos</p>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

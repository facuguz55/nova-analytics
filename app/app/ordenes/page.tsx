import type { Metadata } from "next";
import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/service";
import { getUser, getCachedUserRow } from "@/lib/supabase/cached-queries";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrdersForRange, calcOrderRevenue, type TNOrder } from "@/lib/tiendanube/client";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  ShoppingCart, DollarSign, TrendingUp, ArrowRight,
  AlertTriangle, Store,
} from "lucide-react";
import DateRangeSelector from "./DateRangeSelector";
import { presetToDates, type Preset } from "./date-utils";
import ExportCSVButton from "./ExportCSVButton";

export const metadata: Metadata = { title: "Órdenes" };

function statusLabel(o: TNOrder) {
  if (o.payment_status === "paid" || o.status === "closed")
    return { label: "Pagada",    color: "#22c55e", bg: "rgba(34,197,94,0.1)"  };
  if (o.status === "cancelled")
    return { label: "Cancelada", color: "#ef4444", bg: "rgba(239,68,68,0.1)"  };
  if (o.payment_status === "voided" || o.payment_status === "refunded")
    return { label: "Reembolso", color: "#ef4444", bg: "rgba(239,68,68,0.1)"  };
  if (o.payment_status === "pending")
    return { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return { label: o.status,     color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
}

function resolveDateRange(params: { preset?: string; since?: string; until?: string }): {
  since: string; until: string; preset: Preset;
} {
  const validPresets: Preset[] = ["today", "yesterday", "7d", "15d", "30d", "60d", "90d", "custom"];
  const preset = validPresets.includes(params.preset as Preset)
    ? (params.preset as Preset)
    : "30d";

  if (preset === "custom" && params.since && params.until) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (re.test(params.since) && re.test(params.until))
      return { since: params.since, until: params.until, preset: "custom" };
  }

  if (preset !== "custom" && params.since && params.until) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (re.test(params.since) && re.test(params.until))
      return { since: params.since, until: params.until, preset };
  }

  const dates = presetToDates(preset === "custom" ? "30d" : preset);
  return { ...dates, preset: preset === "custom" ? "30d" : preset };
}

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; since?: string; until?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { since, until, preset } = resolveDateRange(params);
  const q = (params.q ?? "").toLowerCase();
  const statusFilter = params.status ?? "all";

  const user = await getUser();
  if (!user) return null;

  const userRow = await getCachedUserRow(user.id);
  if (!userRow) return null;

  const workspaceId = userRow.workspace_id;
  const db = createServiceClient() as any;

  let allOrders: TNOrder[] = [];
  let error: string | null = null;
  let isConnected = false;

  // ¿Hay datos sincronizados?
  const { count: syncedCount } = await db
    .from("tn_orders")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const hasSyncedData = (syncedCount ?? 0) > 0;

  if (hasSyncedData) {
    // ── Leer de Supabase (~50ms) ──────────────────────────────────────
    const { data, error: dbErr } = await db
      .from("tn_orders")
      .select("external_id, number, customer_name, customer_email, total, subtotal, discount, shipping, status, payment_status, currency, created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", `${since}T00:00:00.000Z`)
      .lte("created_at", `${until}T23:59:59.999Z`)
      .order("created_at", { ascending: false });

    if (dbErr) {
      error = "Error al leer órdenes";
    } else {
      allOrders = (data ?? []).map((o: any) => ({
        id:             parseInt(o.external_id),
        number:         o.number,
        status:         o.status,
        payment_status: o.payment_status,
        total:          String(o.total),
        subtotal:       String(o.subtotal ?? 0),
        discount:       String(o.discount ?? 0),
        shipping:       String(o.shipping ?? 0),
        currency:       o.currency ?? "ARS",
        customer:       o.customer_name
          ? { id: 0, name: o.customer_name, email: o.customer_email ?? "", phone: undefined }
          : null,
        products:       [],
        created_at:     o.created_at,
        updated_at:     o.created_at,
        paid_at:        null,
        cancelled_at:   null,
      }));
      isConnected = true;
    }
  } else {
    // ── Fallback: API de TiendaNube ───────────────────────────────────
    const connection = await getTiendaNubeConnection();
    isConnected = !!connection;

    if (connection) {
      const result = await Promise.allSettled([
        getOrdersForRange(connection.opts, { since, until }),
      ]);
      if (result[0].status === "fulfilled") allOrders = result[0].value;
      else error = "Error al conectar con TiendaNube";
    }
  }

  // Filtrar por búsqueda
  let filtered = q
    ? allOrders.filter(
        (o) =>
          o.customer?.name?.toLowerCase().includes(q) ||
          o.customer?.email?.toLowerCase().includes(q) ||
          String(o.number).includes(q)
      )
    : allOrders;

  // Filtrar por estado
  if (statusFilter === "paid")
    filtered = filtered.filter((o) => o.payment_status === "paid" || o.status === "closed");
  else if (statusFilter === "pending")
    filtered = filtered.filter((o) => o.payment_status === "pending" && o.status !== "cancelled");
  else if (statusFilter === "cancelled")
    filtered = filtered.filter(
      (o) => o.status === "cancelled" || o.payment_status === "voided" || o.payment_status === "refunded"
    );

  const paid = allOrders.filter((o) => o.payment_status === "paid" || o.status === "closed");
  const totalRevenue = calcOrderRevenue(allOrders);
  const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0;
  const pendingCount = allOrders.filter((o) => o.payment_status === "pending" && o.status !== "cancelled").length;

  const STATUS_FILTERS = [
    { value: "all",       label: "Todas",      count: allOrders.length },
    { value: "paid",      label: "Pagadas",    count: paid.length },
    { value: "pending",   label: "Pendientes", count: pendingCount },
    { value: "cancelled", label: "Canceladas", count: allOrders.filter((o) => o.status === "cancelled" || o.payment_status === "voided" || o.payment_status === "refunded").length },
  ];

  function statusHref(status: string) {
    const p = new URLSearchParams();
    p.set("preset", preset); p.set("since", since); p.set("until", until);
    if (q) p.set("q", q);
    if (status !== "all") p.set("status", status);
    return `?${p.toString()}`;
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Órdenes</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {since === until ? since : `${since} → ${until}`}
            {" · "}
            {hasSyncedData ? "desde tu base de datos" : "directo desde TiendaNube"}
          </p>
        </div>
      </div>

      {/* Selector de fechas — client component */}
      <Suspense>
        <DateRangeSelector activePreset={preset} since={since} until={until} />
      </Suspense>

      {!isConnected && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#111118", border: "1px dashed rgba(139,92,246,0.3)" }}>
          <Store size={40} color="#8b5cf6" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conectá tu TiendaNube</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
            style={{ background: "#8b5cf6" }}>
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {isConnected && error && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={18} color="#ef4444" />
          <p className="text-sm text-[#fca5a5]">{error}</p>
        </div>
      )}

      {isConnected && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Ingresos periodo", value: formatCurrency(totalRevenue), icon: DollarSign,    color: "#8b5cf6" },
              { label: "Órdenes pagas",    value: String(paid.length),           icon: ShoppingCart,  color: "#22c55e" },
              { label: "Ticket promedio",  value: formatCurrency(avgTicket),     icon: TrendingUp,    color: "#c026d3" },
              { label: "Pendientes",       value: String(pendingCount),           icon: AlertTriangle, color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}18` }}>
                  <s.icon size={18} color={s.color} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{s.label}</p>
                  <p className="text-lg font-bold text-[#F1F5F9]">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros de estado + búsqueda */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-xl p-1"
              style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.value;
                return (
                  <Link key={f.value} href={statusHref(f.value)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{ background: active ? "#8b5cf6" : "transparent", color: active ? "white" : "#94A3B8" }}>
                    {f.label}
                    <span className="rounded-full px-1.5 text-[10px] font-bold"
                      style={{ background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)", color: active ? "white" : "#64748B" }}>
                      {f.count}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Búsqueda */}
            <form action="" method="get" className="flex items-center gap-2">
              <input type="hidden" name="preset" value={preset} />
              <input type="hidden" name="since" value={since} />
              <input type="hidden" name="until" value={until} />
              {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", minWidth: "220px" }}>
                <ShoppingCart size={12} color="#64748B" strokeWidth={2} />
                <input type="text" name="q" defaultValue={q}
                  placeholder="Cliente, email, #orden..."
                  className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]" />
              </div>
              <button type="submit" className="rounded-xl px-3 py-2 text-xs font-semibold text-white"
                style={{ background: "#8b5cf6" }}>
                Buscar
              </button>
            </form>

            <ExportCSVButton orders={filtered as any} />
            <span className="text-xs text-[#64748B] ml-auto">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tabla de órdenes */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
            {filtered.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-[#64748B]">
                  {q
                    ? `Sin resultados para "${q}"`
                    : `Sin órdenes${statusFilter !== "all" ? ` con estado "${STATUS_FILTERS.find(f => f.value === statusFilter)?.label}"` : ""} en este período`}
                </p>
              </div>
            ) : (
              filtered.slice(0, 200).map((o, i) => {
                const { label, color, bg } = statusLabel(o);
                return (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(139,92,246,0.04)] transition-colors"
                    style={{ borderBottom: i < Math.min(filtered.length, 200) - 1 ? "1px solid rgba(139,92,246,0.07)" : "none" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#a78bfa]">#{o.number ?? o.id}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color, background: bg }}>
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] truncate mt-0.5">
                        {o.customer?.name ?? "Anónimo"}
                        {o.customer?.email ? ` · ${o.customer.email}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#F1F5F9]">{formatCurrency(parseFloat(o.total))}</p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(o.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filtered.length > 200 && (
            <p className="text-xs text-[#64748B] text-center">
              Mostrando 200 de {filtered.length} — usá la búsqueda o achicá el rango de fechas para ver más
            </p>
          )}
        </>
      )}
    </div>
  );
}

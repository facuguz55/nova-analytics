"use client";

import { useState, useMemo } from "react";
import {
  Search, Users, Store, Phone, Mail, CreditCard,
  ShoppingBag, MapPin, Loader2, AlertCircle, X,
  Crown, Zap, Clock,
} from "lucide-react";

type WsRow = { id: string; name: string; plan: string };
type LocalCustomer = {
  id: string; workspace_id: string; name: string;
  phone: string | null; email: string | null;
  dni: string | null; notes: string | null; created_at: string;
};
type TNCustomer = {
  id: number; name: string; email: string; phone?: string;
  total_spent: string; orders_count: number; created_at: string;
  default_address?: { city?: string; province?: string };
};

type Tab = "local" | "tiendanube";

const CARD: React.CSSProperties = { background: "#111118", border: "1px solid rgba(139,92,246,0.15)" };
const AMBER = "#f59e0b";
const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

const PLAN_STYLE: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  agency: { color: "#f59e0b", label: "Agency", icon: <Crown size={9} /> },
  pro:    { color: "#8B5CF6", label: "Pro",    icon: <Zap size={9} /> },
  trial:  { color: "#3b82f6", label: "Prueba",    icon: <Clock size={9} /> },
  free:   { color: "#64748B", label: "Gratuito", icon: null },
};

export default function ClientesHQClient({
  workspaces,
  customers,
}: {
  workspaces: WsRow[];
  customers: LocalCustomer[];
}) {
  const [selectedWs, setSelectedWs]   = useState<string | null>(null);
  const [tab, setTab]                 = useState<Tab>("local");
  const [wsSearch, setWsSearch]       = useState("");
  const [custSearch, setCustSearch]   = useState("");
  const [tnCustomers, setTnCustomers] = useState<TNCustomer[]>([]);
  const [tnLoading, setTnLoading]     = useState(false);
  const [tnLoaded, setTnLoaded]       = useState<string | null>(null);
  const [tnError, setTnError]         = useState<string | null>(null);
  const [detail, setDetail]           = useState<LocalCustomer | null>(null);

  // Mapa workspace_id → clientes locales
  const custByWs = useMemo(() => {
    const map = new Map<string, LocalCustomer[]>();
    customers.forEach((c) => {
      const prev = map.get(c.workspace_id) ?? [];
      map.set(c.workspace_id, [...prev, c]);
    });
    return map;
  }, [customers]);

  const filteredWs = useMemo(() => {
    if (!wsSearch.trim()) return workspaces;
    const q = wsSearch.toLowerCase();
    return workspaces.filter((w) => w.name.toLowerCase().includes(q));
  }, [workspaces, wsSearch]);

  async function selectWorkspace(wsId: string) {
    setSelectedWs(wsId);
    setTab("local");
    setCustSearch("");
  }

  async function loadTN(wsId: string) {
    if (tnLoaded === wsId) return;
    setTnLoading(true);
    setTnError(null);
    setTnCustomers([]);
    try {
      const res = await fetch(`/api/admin/tn-customers/${wsId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error del servidor");
      setTnCustomers(json.customers ?? []);
      setTnLoaded(wsId);
    } catch (e) {
      setTnError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setTnLoading(false);
    }
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "tiendanube" && selectedWs) loadTN(selectedWs);
  }

  const localList = selectedWs ? (custByWs.get(selectedWs) ?? []) : [];
  const filteredLocal = useMemo(() => {
    if (!custSearch.trim()) return localList;
    const q = custSearch.toLowerCase();
    return localList.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.dni ?? "").includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  }, [localList, custSearch]);

  const filteredTN = useMemo(() => {
    if (!custSearch.trim()) return tnCustomers;
    const q = custSearch.toLowerCase();
    return tnCustomers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [tnCustomers, custSearch]);

  const selectedWsData = workspaces.find((w) => w.id === selectedWs);
  const totalLocal = customers.length;
  const totalWs    = workspaces.length;

  return (
    <div className="flex h-full" style={{ height: "calc(100vh - 0px)" }}>

      {/* ── Panel izquierdo: selector de tiendas ── */}
      <div
        className="flex flex-col flex-shrink-0 h-full"
        style={{ width: "260px", borderRight: "1px solid rgba(139,92,246,0.15)", background: "rgba(13,13,20,0.5)" }}
      >
        {/* Header panel */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
          <p className="text-sm font-bold text-[#F1F5F9] mb-0.5">Clientes por Tienda</p>
          <p className="text-[10px] text-[#64748B]">
            {totalWs} tiendas · {totalLocal} locales registrados
          </p>
          <div className="relative mt-3">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              value={wsSearch}
              onChange={(e) => setWsSearch(e.target.value)}
              placeholder="Buscar tienda…"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs text-[#F1F5F9] placeholder-[#475569] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}
            />
          </div>
        </div>

        {/* Lista de workspaces */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredWs.map((ws) => {
            const localCount = custByWs.get(ws.id)?.length ?? 0;
            const isSelected = selectedWs === ws.id;
            const planInfo = PLAN_STYLE[ws.plan] ?? PLAN_STYLE.free;

            return (
              <button
                key={ws.id}
                onClick={() => selectWorkspace(ws.id)}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-all"
                style={{
                  background: isSelected
                    ? `linear-gradient(90deg, ${AMBER}20, ${AMBER}08)`
                    : "transparent",
                  borderLeft: isSelected ? `2px solid ${AMBER}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: isSelected ? `linear-gradient(135deg, ${AMBER}, #d97706)` : "rgba(255,255,255,0.08)" }}
                >
                  {ws.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#F1F5F9] truncate">{ws.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: planInfo.color, background: `${planInfo.color}18` }}
                    >
                      {planInfo.icon}{planInfo.label}
                    </span>
                    <span className="text-[9px] text-[#475569]">{localCount} local</span>
                  </div>
                </div>
              </button>
            );
          })}
          {filteredWs.length === 0 && (
            <p className="text-center text-xs text-[#475569] py-8">Sin resultados</p>
          )}
        </div>
      </div>

      {/* ── Panel derecho: clientes de la tienda seleccionada ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedWs ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Store size={48} className="text-[#1e1e2e]" />
            <p className="text-[#475569] text-sm">Seleccioná una tienda para ver sus clientes</p>
          </div>
        ) : (
          <>
            {/* Header del workspace seleccionado */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
              <div>
                <p className="font-bold text-[#F1F5F9]">{selectedWsData?.name}</p>
                <p className="text-xs text-[#64748B]">
                  {localList.length} clientes locales
                  {tnLoaded === selectedWs ? ` · ${tnCustomers.length} en TiendaNube` : ""}
                </p>
              </div>
              {/* Buscador de clientes */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  placeholder="Buscar cliente…"
                  className="pl-9 pr-4 py-2 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] outline-none w-56"
                  style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
              <button
                onClick={() => handleTabChange("local")}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === "local" ? `${AMBER}18` : "transparent",
                  color: tab === "local" ? AMBER : "#64748B",
                  border: `1px solid ${tab === "local" ? `${AMBER}33` : "transparent"}`,
                }}
              >
                Local Físico ({localList.length})
              </button>
              <button
                onClick={() => handleTabChange("tiendanube")}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === "tiendanube" ? "rgba(37,99,235,0.15)" : "transparent",
                  color: tab === "tiendanube" ? "#2563EB" : "#64748B",
                  border: `1px solid ${tab === "tiendanube" ? "rgba(37,99,235,0.3)" : "transparent"}`,
                }}
              >
                TiendaNube
                {tnLoaded === selectedWs ? ` (${tnCustomers.length})` : ""}
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* ── Tab LOCAL FÍSICO ── */}
              {tab === "local" && (
                filteredLocal.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20" style={CARD}>
                    <Users size={36} className="text-[#334155] mb-2" />
                    <p className="text-[#64748B] text-sm">
                      {localList.length === 0 ? "Esta tienda no tiene clientes locales registrados" : "Sin coincidencias"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={CARD}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {["Cliente", "DNI", "Teléfono", "Correo", "Notas", "Registrado"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wide whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLocal.map((c) => (
                          <tr
                            key={c.id}
                            onClick={() => setDetail(c)}
                            className="cursor-pointer hover:bg-white/[0.03] transition-colors"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{ background: `linear-gradient(135deg, ${AMBER}, #d97706)` }}
                                >
                                  {c.name[0]?.toUpperCase()}
                                </div>
                                <span className="font-medium text-[#F1F5F9] truncate max-w-[140px]">{c.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs" style={{ color: c.dni ? "#F1F5F9" : "#475569" }}>
                              {c.dni || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: c.phone ? "#94A3B8" : "#475569" }}>
                              {c.phone || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#94A3B8] max-w-[160px] truncate">
                              {c.email || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#64748B] max-w-[120px] truncate">
                              {c.notes || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">
                              {new Date(c.created_at).toLocaleDateString("es-AR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ── Tab TIENDANUBE ── */}
              {tab === "tiendanube" && (
                tnLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={32} className="text-[#2563EB] animate-spin mb-3" />
                    <p className="text-[#64748B] text-sm">Cargando clientes de TiendaNube…</p>
                  </div>
                ) : tnError ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <AlertCircle size={36} className="text-[#ef4444]" />
                    <p className="text-[#94A3B8] text-sm font-medium">Error al cargar</p>
                    <p className="text-xs text-[#64748B]">{tnError}</p>
                    <button
                      onClick={() => { setTnLoaded(null); if (selectedWs) loadTN(selectedWs); }}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium text-[#2563EB]"
                      style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)" }}
                    >
                      Reintentar
                    </button>
                  </div>
                ) : tnLoaded === selectedWs && filteredTN.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20" style={CARD}>
                    <ShoppingBag size={36} className="text-[#334155] mb-2" />
                    <p className="text-[#64748B] text-sm">
                      {tnCustomers.length === 0 ? "Esta tienda no tiene clientes en TiendaNube o no tiene integración activa" : "Sin coincidencias"}
                    </p>
                  </div>
                ) : tnLoaded === selectedWs ? (
                  <div className="rounded-2xl overflow-hidden" style={CARD}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {["Cliente", "Correo", "Teléfono", "Órdenes", "Total gastado", "Ciudad", "Desde"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wide whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTN.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-white/[0.03] transition-colors"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
                                >
                                  {c.name[0]?.toUpperCase()}
                                </div>
                                <span className="font-medium text-[#F1F5F9] truncate max-w-[140px]">{c.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#94A3B8] max-w-[160px] truncate">{c.email || "—"}</td>
                            <td className="px-4 py-3 text-xs text-[#94A3B8]">{c.phone || "—"}</td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-[#2563EB]">{c.orders_count}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-[#F1F5F9]">
                              {parseFloat(c.total_spent) > 0 ? fmt(parseFloat(c.total_spent)) : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#94A3B8]">
                              {c.default_address?.city ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">
                              {new Date(c.created_at).toLocaleDateString("es-AR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal detalle cliente local */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setDetail(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: "#111118", border: `1px solid ${AMBER}33` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${AMBER}, #d97706)` }}
                >
                  {detail.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[#F1F5F9]">{detail.name}</p>
                  <p className="text-xs text-[#64748B]">Desde {new Date(detail.created_at).toLocaleDateString("es-AR")}</p>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="text-[#64748B] hover:text-[#94A3B8]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { icon: CreditCard, label: "DNI",      value: detail.dni },
                { icon: Phone,      label: "Teléfono", value: detail.phone },
                { icon: Mail,       label: "Correo",    value: detail.email },
                { icon: MapPin,     label: "Notas",    value: detail.notes },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <Icon size={13} className="text-[#64748B] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#475569] uppercase tracking-wide">{label}</p>
                    <p className={`text-sm mt-0.5 ${value ? "text-[#F1F5F9]" : "text-[#475569]"}`}>
                      {value || "Sin datos"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

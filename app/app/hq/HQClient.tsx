"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Search, ShoppingBag, CheckCircle2, XCircle,
  ChevronRight, Mail, Target, Store, Crown, Zap, Clock,
} from "lucide-react";

type WsEnriched = {
  id: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
  providers: string[];
  hasTiendanube: boolean;
  storeName: string | null;
};

const PLAN_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  agency: { label: "Agency", color: "#f59e0b", icon: <Crown size={10} /> },
  pro:    { label: "Pro",    color: "#8B5CF6", icon: <Zap size={10} /> },
  trial:  { label: "Prueba",    color: "#3b82f6", icon: <Clock size={10} /> },
  free:   { label: "Gratuito", color: "#64748B", icon: null },
};

const PROVIDER_ICONS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  tiendanube: { label: "TiendaNube", color: "#2563EB", icon: <ShoppingBag size={11} /> },
  gmail:      { label: "Gmail",      color: "#e1691e", icon: <Mail size={11} /> },
  meta:       { label: "Meta",       color: "#1877F2", icon: <Target size={11} /> },
};

const CARD: React.CSSProperties = { background: "#111118", border: "1px solid rgba(124,58,237,0.15)" };

export default function HQClient({ workspaces }: { workspaces: WsEnriched[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = workspaces;
    if (planFilter !== "all") list = list.filter((w) => w.plan === planFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) => w.name.toLowerCase().includes(q) || (w.storeName ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [workspaces, planFilter, search]);

  const totalTN      = workspaces.filter((w) => w.hasTiendanube).length;
  const totalAgency  = workspaces.filter((w) => w.plan === "agency").length;
  const totalPro     = workspaces.filter((w) => w.plan === "pro").length;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={20} className="text-[#f59e0b]" />
          <h1 className="text-2xl font-bold text-[#F1F5F9]">HQ Admin</h1>
        </div>
        <p className="text-sm text-[#94A3B8]">Vista global de todos los negocios y sus integraciones</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Tiendas totales",      value: workspaces.length, color: "#f59e0b" },
          { label: "Con TiendaNube",        value: totalTN,           color: "#2563EB" },
          { label: "Plan Agency",           value: totalAgency,       color: "#f59e0b" },
          { label: "Plan Pro",              value: totalPro,          color: "#8B5CF6" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={CARD}>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-[#64748B] mt-0.5">{label}</p>
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
            placeholder="Buscar por nombre de tienda…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] focus:outline-none"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <option value="all">Todos los planes</option>
          <option value="agency">Agency</option>
          <option value="pro">Pro</option>
          <option value="trial">Trial</option>
          <option value="free">Free</option>
        </select>
      </div>

      {/* Grid de workspaces */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={CARD}>
          <Store size={40} className="text-[#334155] mb-3" />
          <p className="text-[#64748B] text-sm">No hay tiendas que coincidan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((ws) => {
            const planInfo = PLAN_BADGE[ws.plan] ?? PLAN_BADGE.free;
            return (
              <button
                key={ws.id}
                onClick={() => router.push(`/app/hq/${ws.id}`)}
                className="text-left rounded-2xl p-4 transition-all duration-150 group"
                style={{
                  ...CARD,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(17,17,24,0.95)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,58,237,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.background = "#111118";
                }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                    >
                      {ws.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#F1F5F9] truncate text-sm">{ws.name}</p>
                      {ws.storeName && (
                        <p className="text-[11px] text-[#64748B] truncate">{ws.storeName}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-[#475569] flex-shrink-0 mt-0.5 transition-colors group-hover:text-[#f59e0b]"
                  />
                </div>

                {/* Plan badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: `${planInfo.color}18`,
                      color: planInfo.color,
                      border: `1px solid ${planInfo.color}33`,
                    }}
                  >
                    {planInfo.icon}
                    {planInfo.label}
                  </span>
                  {ws.status === "active" ? (
                    <CheckCircle2 size={12} className="text-[#22c55e]" />
                  ) : (
                    <XCircle size={12} className="text-[#64748B]" />
                  )}
                </div>

                {/* Integraciones */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ws.providers.length === 0 ? (
                    <span className="text-[10px] text-[#475569]">Sin integraciones activas</span>
                  ) : (
                    ws.providers.map((p) => {
                      const pInfo = PROVIDER_ICONS[p];
                      if (!pInfo) return null;
                      return (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                          style={{
                            background: `${pInfo.color}14`,
                            color: pInfo.color,
                            border: `1px solid ${pInfo.color}28`,
                          }}
                        >
                          {pInfo.icon}
                          {pInfo.label}
                        </span>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[10px] text-[#475569]">
                    Desde {new Date(ws.created_at).toLocaleDateString("es-AR")}
                  </span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: ws.hasTiendanube ? "#2563EB" : "#475569" }}
                  >
                    {ws.hasTiendanube ? "Ver datos TN →" : "Sin TiendaNube"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

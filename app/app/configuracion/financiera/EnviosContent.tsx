"use client";

import { useState } from "react";
import {
  Truck, ArrowRight, Mail, Store as StoreIcon, Handshake,
  ShoppingBag, Package, CheckCircle, Save, Loader2, ToggleLeft, ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { saveShippingCosts } from "./shipping-actions";
import { type ShippingCost, DEFAULT_SHIPPING_COSTS } from "./shipping-defaults";

export type { ShippingCost };

const METHOD_ICON: Record<string, React.ElementType> = {
  andreani:         Package,
  oca:              Truck,
  correo_argentino: Mail,
  mercado_envios:   ShoppingBag,
  retiro_local:     StoreIcon,
  a_convenir:       Handshake,
};

const METHOD_COLOR: Record<string, string> = {
  andreani:         "#f59e0b",
  oca:              "#22c55e",
  correo_argentino: "#c026d3",
  mercado_envios:   "#facc15",
  retiro_local:     "#a78bfa",
  a_convenir:       "#c084fc",
};

function fmt(n: number) {
  return n.toLocaleString("es-AR");
}

export default function EnviosContent({
  isConnected,
  storeName,
  workspaceId,
  initialCosts,
}: {
  isConnected:  boolean;
  storeName:    string | null;
  workspaceId:  string;
  initialCosts: ShippingCost[];
}) {
  const [costs, setCosts] = useState<ShippingCost[]>(initialCosts);
  const [saving, setSaving] = useState(false);

  function updateCost(method: string, value: number) {
    setCosts(prev => prev.map(c => c.method === method ? { ...c, cost: value } : c));
  }

  function toggleActive(method: string) {
    setCosts(prev => prev.map(c => c.method === method ? { ...c, is_active: !c.is_active } : c));
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveShippingCosts(workspaceId, costs);
    setSaving(false);
    if (result.error) toast.error(result.error);
    else toast.success("Costos de envío guardados");
  }

  if (!isConnected) {
    return (
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Costos de envío</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Configurá los costos de cada método para calcular tu margen real</p>
        </div>
        <div className="rounded-2xl p-10 text-center" style={{ background: "#111118", border: "1px dashed rgba(139,92,246,0.3)" }}>
          <Truck size={40} color="#8b5cf6" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conectá tu TiendaNube primero</p>
          <p className="text-sm text-[#64748B] mb-4">Para configurar los costos de envío, primero necesitás conectar una tienda.</p>
          <Link href="/app/configuracion/integraciones" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#8b5cf6" }}>
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const activeCosts = costs.filter(c => c.is_active);
  const avgCost = activeCosts.length
    ? Math.round(activeCosts.reduce((s, c) => s + c.cost, 0) / activeCosts.length)
    : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Costos de envío</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Asigná el costo que vos pagás por cada método para calcular tu rentabilidad real</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
          <CheckCircle size={12} strokeWidth={2.5} />
          {storeName ?? "Tienda conectada"}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
        <Package size={13} color="#8b5cf6" strokeWidth={2} className="mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Los valores son <strong className="text-[#a78bfa]">costos de mercado de referencia</strong> para Argentina (paquete ~1 kg).
          Ajustá cada uno según lo que vos pagás realmente. Desactivá los métodos que no usás.
        </p>
      </div>

      {/* Lista de métodos */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
          <p className="text-sm font-bold text-[#F1F5F9]">Métodos de envío</p>
        </div>

        <div className="divide-y" style={{ borderColor: "rgba(139,92,246,0.07)" }}>
          {costs.map((c) => {
            const Icon  = METHOD_ICON[c.method]  ?? Truck;
            const color = METHOD_COLOR[c.method] ?? "#8b5cf6";
            return (
              <div
                key={c.method}
                className="flex items-center gap-3 px-4 py-3.5 transition-opacity"
                style={{ opacity: c.is_active ? 1 : 0.45 }}
              >
                {/* Ícono */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={16} color={color} strokeWidth={2} />
                </div>

                {/* Nombre */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#F1F5F9]">{c.label}</p>
                </div>

                {/* Input de costo */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-[#64748B]">$</span>
                  <input
                    type="number"
                    min={0}
                    value={c.cost}
                    onChange={e => updateCost(c.method, Math.max(0, Number(e.target.value)))}
                    disabled={!c.is_active}
                    className="w-24 text-right px-2 py-1.5 rounded-lg text-sm font-semibold text-[#F1F5F9] focus:outline-none disabled:opacity-40"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
                  />
                </div>

                {/* Toggle activo */}
                <button onClick={() => toggleActive(c.method)} className="flex-shrink-0 transition-opacity hover:opacity-80">
                  {c.is_active
                    ? <ToggleRight size={22} color="#8b5cf6" strokeWidth={2} />
                    : <ToggleLeft  size={22} color="#475569" strokeWidth={2} />
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Promedio */}
      {activeCosts.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <span className="text-xs text-[#94A3B8]">Costo promedio de envío (métodos activos)</span>
          <span className="text-sm font-bold text-[#a78bfa]">${fmt(avgCost)}</span>
        </div>
      )}

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }}
      >
        {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={14} /> Guardar costos</>}
      </button>
    </div>
  );
}

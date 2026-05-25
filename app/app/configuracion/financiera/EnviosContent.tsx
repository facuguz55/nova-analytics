"use client";

import { Truck, ArrowRight, Package, CheckCircle } from "lucide-react";
import Link from "next/link";

const SHIPPING_METHODS = [
  { name: "Correo Argentino",  logo: "📦", type: "nacional" },
  { name: "OCA",               logo: "🚛", type: "nacional" },
  { name: "Andreani",          logo: "📮", type: "nacional" },
  { name: "Mercado Envíos",    logo: "🟡", type: "marketplace" },
  { name: "Tu propio retiro",  logo: "🏪", type: "local" },
  { name: "A convenir",        logo: "🤝", type: "personalizado" },
];

export default function EnviosContent({
  isConnected,
  storeName,
}: {
  isConnected: boolean;
  storeName: string | null;
}) {
  if (!isConnected) {
    return (
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Costos de envío
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            Configurá los costos de cada método de envío para calcular tu margen real
          </p>
        </div>
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "#111118", border: "1px dashed rgba(124,58,237,0.3)" }}
        >
          <Truck size={40} color="#7C3AED" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conectá tu TiendaNube primero</p>
          <p className="text-sm text-[#64748B] mb-4">
            Para configurar los costos de envío, primero necesitás conectar una tienda.
          </p>
          <Link
            href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#7C3AED" }}
          >
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Costos de envío
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            Asigná el costo real de cada método de envío para calcular tu rentabilidad neta
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <CheckCircle size={12} strokeWidth={2.5} />
          {storeName ?? "Tienda conectada"}
        </div>
      </div>

      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <p className="text-sm font-semibold text-[#F1F5F9]">Métodos en tu tienda</p>

        <div className="space-y-2">
          {SHIPPING_METHODS.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)" }}
            >
              <span className="text-xl">{m.logo}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#F1F5F9]">{m.name}</p>
                <p className="text-xs text-[#64748B] capitalize">{m.type}</p>
              </div>
              <div
                className="text-xs font-semibold rounded-xl px-3 py-1.5"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", color: "#64748B" }}
              >
                Costo: —
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-start gap-2 p-3 rounded-xl mt-2"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <Package size={13} color="#7C3AED" strokeWidth={2} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#94A3B8]">
            La configuración detallada de costos por método estará disponible próximamente.
            Por ahora podés agregar el costo promedio de envío en la sección{" "}
            <strong className="text-[#8B5CF6]">Costos Adicionales</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

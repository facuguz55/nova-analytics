"use client";

import { useState } from "react";
import { CreditCard, Percent, Save, CheckCircle, Zap, Info, Settings } from "lucide-react";
import { saveComisiones } from "@/app/app/actions";
import { toast } from "sonner";

interface Config {
  tax_rate: number;
  platform_fee: number;
  custom_commission: number;
  custom_tax: number;
}

const TN_GATEWAYS = [
  { name: "MercadoPago", fee: "4.99%", extra: "+ IVA" },
  { name: "PagoNube",    fee: "2.29%", extra: "+ IVA" },
  { name: "GoCuotas",   fee: "4.50%", extra: "+ IVA" },
  { name: "Modo",        fee: "3.50%", extra: "+ IVA" },
  { name: "PayPal",      fee: "5.40%", extra: "+ IVA" },
  { name: "Mercado Crédito", fee: "6.00%", extra: "+ IVA" },
];

export default function ComisionesClient({ config, workspaceId }: { config: Config; workspaceId: string }) {
  const [tax,        setTax]        = useState(String(config.tax_rate));
  const [customCom,  setCustomCom]  = useState(String(config.custom_commission));
  const [customTax,  setCustomTax]  = useState(String(config.custom_tax));
  const [saving,     setSaving]     = useState(false);

  async function handleSave(section: "impuestos" | "personalizado") {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("workspace_id", workspaceId);
      if (section === "impuestos") {
        fd.set("tax_rate", tax || "0");
      } else {
        fd.set("custom_commission", customCom || "0");
        fd.set("custom_tax",        customTax  || "0");
      }
      await saveComisiones(fd);
      toast.success("Guardado correctamente");
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Comisiones de pago
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          Configurá los costos de los medios de pago para calcular tu rentabilidad real
        </p>
      </div>

      {/* TiendaNube automático */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div
          className="px-6 py-4 flex flex-wrap items-center justify-between gap-2"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.12)", background: "rgba(124,58,237,0.04)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
              <CreditCard size={18} color="#8B5CF6" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-[#F1F5F9] text-sm">Comisiones de pago de TiendaNube</p>
              <p className="text-xs text-[#64748B]">
                MercadoPago, PagoNube, GoCuotas, etc. — Incluye IVA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Zap size={11} strokeWidth={2.5} />
            Automático
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)" }}>
            <Info size={14} color="#7C3AED" strokeWidth={2} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Las comisiones de las pasarelas de TiendaNube se detectan automáticamente desde la API de cada orden.
              No necesitás configurarlas manualmente — ya se aplican en los cálculos de rentabilidad.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TN_GATEWAYS.map((g) => (
              <div
                key={g.name}
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)" }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} color="#22c55e" strokeWidth={2.5} />
                  <span className="text-xs font-semibold text-[#F1F5F9]">{g.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#8B5CF6]">{g.fee}</span>
                  <span className="text-[10px] text-[#64748B] ml-1">{g.extra}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impuestos de la tienda */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div
          className="px-6 py-4 flex flex-wrap items-center justify-between gap-2"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.12)", background: "rgba(124,58,237,0.04)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
              <Percent size={18} color="#f59e0b" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-[#F1F5F9] text-sm">Impuestos de la tienda</p>
              <p className="text-xs text-[#64748B]">Porcentaje del total facturado que se destina a impuestos (IVA, IIBB, otros)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Settings size={11} strokeWidth={2.5} />
            Configurado
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                Impuesto %
              </label>
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 w-full sm:w-40"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <Percent size={14} color="#64748B" strokeWidth={2} />
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  step="0.5"
                  min="0"
                  max="50"
                  placeholder="10"
                  className="flex-1 bg-transparent text-xl font-black text-[#F1F5F9] outline-none w-full"
                  style={{ appearance: "none" } as React.CSSProperties}
                />
              </div>
            </div>
            <div className="text-xs text-[#64748B] pb-3">
              Promedio Argentina: <span className="text-[#94A3B8] font-semibold">10 — 15%</span>
            </div>
          </div>
          <button
            onClick={() => handleSave("impuestos")}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
          >
            <Save size={14} strokeWidth={2.5} />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Pagos personalizados */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div
          className="px-6 py-4 flex flex-wrap items-center justify-between gap-2"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.12)", background: "rgba(124,58,237,0.04)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(225,105,30,0.12)" }}>
              <CreditCard size={18} color="#e1691e" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-[#F1F5F9] text-sm">Pagos Personalizados</p>
              <p className="text-xs text-[#64748B]">
                Comisión al usar un método de pago personalizado. Reemplaza el impuesto de la tienda.
              </p>
            </div>
          </div>
          {(parseFloat(customCom) > 0 || parseFloat(customTax) > 0) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle size={11} strokeWidth={2.5} />
              Configurado
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                Comisión %
              </label>
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 w-full sm:w-36"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <span className="text-sm text-[#64748B]">%</span>
                <input
                  type="number"
                  value={customCom}
                  onChange={(e) => setCustomCom(e.target.value)}
                  step="0.01"
                  min="0"
                  max="50"
                  placeholder="2.99"
                  className="flex-1 bg-transparent text-xl font-black text-[#F1F5F9] outline-none w-full"
                  style={{ appearance: "none" } as React.CSSProperties}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                Impuesto %
              </label>
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 w-full sm:w-36"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <span className="text-sm text-[#64748B]">%</span>
                <input
                  type="number"
                  value={customTax}
                  onChange={(e) => setCustomTax(e.target.value)}
                  step="0.01"
                  min="0"
                  max="50"
                  placeholder="1.99"
                  className="flex-1 bg-transparent text-xl font-black text-[#F1F5F9] outline-none w-full"
                  style={{ appearance: "none" } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => handleSave("personalizado")}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
          >
            <Save size={14} strokeWidth={2.5} />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

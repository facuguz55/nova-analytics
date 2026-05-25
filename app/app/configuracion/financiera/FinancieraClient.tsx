"use client";

import { useEffect, useRef, useState } from "react";
import { DollarSign, Percent, Save, TrendingUp, Info, Calculator } from "lucide-react";
import { updateFinancialConfig } from "@/app/app/actions";
import { toast } from "sonner";

interface Config {
  usd_rate: number;
  tax_rate: number;
  platform_fee: number;
}

export default function FinancieraClient({ config }: { config: Config }) {
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [live, setLive] = useState<Config>({ ...config });

  useEffect(() => { setMounted(true); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value) || 0;
    setLive((prev) => ({ ...prev, [e.target.name]: val }));
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      await updateFinancialConfig(formData);
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error("Error al guardar: " + (e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
    }
  }

  const exampleSale = 100000;
  const netAfterTax = exampleSale / (1 + live.tax_rate / 100);
  const netAfterPlatform = netAfterTax * (1 - live.platform_fee / 100);
  const margin = ((netAfterPlatform / exampleSale) * 100).toFixed(1);
  const usdValue = (exampleSale / (live.usd_rate || 1)).toFixed(2);

  const fmt = (n: number) => {
    if (!mounted) return `$${Math.round(n).toLocaleString()}`;
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  };

  const fields = [
    {
      label: "Cotización USD aplicada",
      name: "usd_rate",
      value: live.usd_rate,
      suffix: "ARS por 1 USD",
      description: "Valor de 1 dólar en pesos. Ej: si ponés 1200, significa 1 USD = $1.200 ARS. Lo usamos para convertir el gasto de Meta Ads (en USD) a tu moneda.",
      icon: DollarSign,
      iconColor: "#22c55e",
      step: "1",
      placeholder: "1200",
    },
    {
      label: "IVA / Impuesto sobre ventas",
      name: "tax_rate",
      value: live.tax_rate,
      suffix: "% del precio",
      description: "Porcentaje de IVA incluido en tus precios de venta. En Argentina suele ser 21%. Si vendés solo a consumidor final, dejá 0.",
      icon: Percent,
      iconColor: "#f59e0b",
      step: "0.1",
      placeholder: "21",
    },
    {
      label: "Comisión global de plataforma",
      name: "platform_fee",
      value: live.platform_fee,
      suffix: "% de la venta",
      description: "Fee fijo extra sobre cada venta (ej. mensualidad de TiendaNube prorrateada o comisión de un marketplace). Dejá 0 si solo usás MercadoPago/PagoNube — esas comisiones se configuran aparte en la tab Comisiones.",
      icon: Percent,
      iconColor: "#7C3AED",
      step: "0.1",
      placeholder: "0",
    },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Parámetros generales
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 max-w-2xl">
            Configurá los tres valores base que se usan en TODOS los cálculos: cotización del dólar, IVA y comisión global de plataforma.
            Después podés afinar comisiones de pago y costos extras en las otras pestañas.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
        >
          <Calculator size={14} strokeWidth={2.5} />
          Margen neto: {margin}%
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-6">

        {/* Campos — 3 columnas (1 por cada parámetro) para que ocupen toda la pantalla */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {fields.map((f) => (
            <div
              key={f.name}
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${f.iconColor}15` }}
                >
                  <f.icon size={18} color={f.iconColor} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-[#F1F5F9] text-sm">{f.label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{f.description}</p>
                </div>
              </div>

              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <input
                  type="number"
                  name={f.name}
                  value={f.value}
                  onChange={handleChange}
                  step={f.step}
                  min="0"
                  placeholder={f.placeholder}
                  className="flex-1 min-w-0 bg-transparent text-xl font-black text-[#F1F5F9] outline-none"
                  style={{ appearance: "none", MozAppearance: "textfield" } as React.CSSProperties}
                />
                <span className="flex-shrink-0 text-xs font-semibold text-[#64748B] whitespace-nowrap">{f.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Preview + guardar en la misma fila */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Vista previa — ocupa 2 columnas */}
          <div
            className="xl:col-span-2 rounded-2xl overflow-hidden"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <div
              className="px-6 py-4 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.04)" }}
            >
              <TrendingUp size={15} color="#7C3AED" strokeWidth={2.5} />
              <p className="text-sm font-bold text-[#F1F5F9]">
                Vista previa — venta de {fmt(exampleSale)}
              </p>
              <span className="text-xs text-[#64748B] ml-auto">Actualización en tiempo real</span>
            </div>
            <div className="p-5 space-y-0">
              {[
                { label: "Venta bruta", value: fmt(exampleSale), sub: null, color: "#F1F5F9", highlight: false },
                { label: `Neto después de IVA (${live.tax_rate}%)`, value: fmt(netAfterTax), sub: `− ${fmt(exampleSale - netAfterTax)}`, color: "#94A3B8", highlight: false },
                { label: `Neto después de plataforma (${live.platform_fee}%)`, value: fmt(netAfterPlatform), sub: `− ${fmt(netAfterTax - netAfterPlatform)}`, color: "#22c55e", highlight: true },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between py-3 text-sm ${i < arr.length - 1 ? "border-b" : ""}`}
                  style={{
                    borderColor: "rgba(124,58,237,0.08)",
                    background: row.highlight ? "rgba(34,197,94,0.03)" : "transparent",
                    marginLeft: row.highlight ? "-20px" : undefined,
                    marginRight: row.highlight ? "-20px" : undefined,
                    paddingLeft: row.highlight ? "20px" : undefined,
                    paddingRight: row.highlight ? "20px" : undefined,
                  } as React.CSSProperties}
                >
                  <div>
                    <span style={{ color: row.highlight ? "#F1F5F9" : "#64748B" }}>{row.label}</span>
                    {row.sub && <span className="ml-2 text-xs text-[#ef4444]">{row.sub}</span>}
                  </div>
                  <span className="font-black text-base" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}

              <div
                className="flex items-center justify-between mt-3 pt-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(225,105,30,0.08)", border: "1px solid rgba(225,105,30,0.2)" }}
              >
                <div>
                  <p className="text-sm font-bold text-[#e1691e]">Margen neto final</p>
                  <p className="text-xs text-[#64748B]">En USD al tipo de cambio configurado</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#e1691e]">{margin}%</p>
                  <p className="text-xs text-[#64748B]">≈ USD {usdValue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guardar + info */}
          <div className="flex flex-col gap-5">
            <div
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <div className="flex items-start gap-2">
                <Info size={14} color="#7C3AED" strokeWidth={2.5} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Estos valores se aplican a <strong className="text-[#94A3B8]">todos los cálculos de rentabilidad</strong> del dashboard.
                  Actualizalos cuando cambie el dólar o las comisiones.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
            >
              <Save size={16} strokeWidth={2.5} />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

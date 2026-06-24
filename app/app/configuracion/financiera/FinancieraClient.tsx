"use client";

import { useEffect, useState } from "react";
import { DollarSign, Percent, Save, Info, Package, Building2, TrendingUp } from "lucide-react";
import { updateFinancialConfig } from "@/app/app/actions";
import { toast } from "sonner";

interface Config {
  usd_rate: number;
  tax_rate: number;
  platform_fee: number;
}

const EXAMPLE = 100000; // venta de ejemplo en ARS

export default function FinancieraClient({
  config,
  avgCostPct,
  productStats = { total: 0, withCost: 0 },
  avgShippingCost = 0,
}: {
  config: Config;
  avgCostPct: number;
  productStats?: { total: number; withCost: number };
  avgShippingCost?: number;
}) {
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [live, setLive] = useState<Config>({ ...config });

  useEffect(() => { setMounted(true); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setLive((prev) => ({ ...prev, [e.target.name]: isNaN(val) ? 0 : val }));
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

  const fmt = (n: number) => {
    if (!mounted) return `$${Math.round(n).toLocaleString()}`;
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  };

  // Cascada de la venta de ejemplo
  const tax        = EXAMPLE - EXAMPLE / (1 + live.tax_rate / 100);
  const afterTax   = EXAMPLE - tax;
  const platform   = afterTax * (live.platform_fee / 100);
  const afterPlat  = afterTax - platform;
  const cogs       = avgCostPct > 0 ? EXAMPLE * (avgCostPct / 100) : 0;
  const shipping   = avgShippingCost;
  const profit     = afterPlat - cogs - shipping;
  const marginPct  = (profit / EXAMPLE) * 100;

  const fields = [
    {
      label: "Cotización del dólar",
      name: "usd_rate",
      value: live.usd_rate,
      suffix: "ARS = 1 USD",
      help: "Cuántos pesos vale un dólar hoy. Se usa para convertir el gasto de Meta Ads (que viene en USD) a tu moneda.",
      icon: DollarSign,
      color: "#22c55e",
      step: "1",
    },
    {
      label: "IVA sobre ventas",
      name: "tax_rate",
      value: live.tax_rate,
      suffix: "%",
      help: "Porcentaje de IVA incluido en tus precios. En Argentina suele ser 21%. Lo descontamos para saber tu ingreso real.",
      icon: Percent,
      color: "#f59e0b",
      step: "0.5",
    },
    {
      label: "Comisión de plataforma",
      name: "platform_fee",
      value: live.platform_fee,
      suffix: "%",
      help: "Comisión que te cobran por vender: MercadoPago, TiendaNube, marketplace, etc. Se descuenta de cada venta.",
      icon: Building2,
      color: "#8b5cf6",
      step: "0.5",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Parámetros financieros
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 max-w-2xl">
            Estos 3 valores alimentan <strong className="text-[#c084fc]">todos</strong> los cálculos de ganancia y rentabilidad.
            Mirá cómo impactan en la simulación de la derecha mientras los cambiás.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold flex-shrink-0"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", boxShadow: "0 0 16px rgba(34,197,94,0.1)" }}>
          <TrendingUp size={15} strokeWidth={2.5} />
          Margen estimado: {marginPct.toFixed(1)}%
        </div>
      </div>

      <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Columna izquierda: campos */}
        <div className="space-y-4">
          {fields.map((f, i) => (
            <div key={f.name} className="anim-up rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: `${i * 0.07}s` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}1a` }}>
                <f.icon size={19} color={f.color} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#F1F5F9] text-sm">{f.label}</p>
                <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{f.help}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-2 flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <input
                  type="number" name={f.name} value={f.value} onChange={handleChange}
                  step={f.step} min="0"
                  className="w-20 bg-transparent text-xl font-black text-[#F1F5F9] outline-none text-right"
                  style={{ MozAppearance: "textfield" } as React.CSSProperties}
                />
                <span className="text-[10px] font-semibold text-[#64748B] whitespace-nowrap">{f.suffix}</span>
              </div>
            </div>
          ))}

          <button type="submit" disabled={saving}
            className="anim-up w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 hover:scale-[1.01]"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)", boxShadow: "0 0 20px rgba(139,92,246,0.3)", animationDelay: "0.24s" }}>
            <Save size={16} strokeWidth={2.5} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <div className="anim-up flex items-start gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.12)", animationDelay: "0.3s" }}>
            <Info size={13} color="#8b5cf6" strokeWidth={2.5} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#64748B] leading-relaxed">
              Actualizá la cotización del dólar cuando se mueva, para que tus números de Meta Ads sean exactos.
            </p>
          </div>
        </div>

        {/* Columna derecha: simulación en vivo */}
        <div className="anim-up rounded-2xl overflow-hidden h-fit lg:sticky lg:top-4" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 0 32px rgba(139,92,246,0.07)", animationDelay: "0.1s" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.15)", background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(192,38,211,0.04))" }}>
            <TrendingUp size={15} color="#a78bfa" strokeWidth={2.5} />
            <p className="text-sm font-bold text-[#F1F5F9]">Simulación: venta de {fmt(EXAMPLE)}</p>
            <span className="text-[10px] text-[#64748B] ml-auto">en vivo</span>
          </div>

          <div className="p-5 space-y-1">
            {[
              { label: "Venta bruta",                       value: EXAMPLE,    minus: false, color: "#F1F5F9", strong: true },
              { label: `IVA (${live.tax_rate}%)`,           value: -tax,       minus: true,  color: "#f59e0b" },
              { label: `Comisión plataforma (${live.platform_fee}%)`, value: -platform, minus: true, color: "#8b5cf6" },
              ...(avgCostPct > 0 ? [{ label: `Costo productos (≈${avgCostPct.toFixed(0)}%)`, value: -cogs, minus: true, color: "#c026d3" }] : []),
              ...(shipping > 0 ? [{ label: `Costo envío promedio`, value: -shipping, minus: true, color: "#22d3ee" }] : []),
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                <span className="text-sm" style={{ color: row.strong ? "#F1F5F9" : "#94A3B8", fontWeight: row.strong ? 700 : 400 }}>{row.label}</span>
                <span className="text-sm font-bold" style={{ color: row.minus ? "#ef4444" : "#F1F5F9" }}>
                  {row.minus ? "−" : ""}{fmt(Math.abs(row.value))}
                </span>
              </div>
            ))}

            {/* Barra visual de composición */}
            <div className="pt-3 pb-1">
              <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                {[
                  { v: tax, c: "#f59e0b" },
                  { v: platform, c: "#8b5cf6" },
                  { v: cogs, c: "#c026d3" },
                  { v: shipping, c: "#22d3ee" },
                  { v: Math.max(profit, 0), c: "#22c55e" },
                ].map((seg, i) => seg.v > 0 && (
                  <div key={i} className="bar-fill h-full" style={{ width: `${(seg.v / EXAMPLE) * 100}%`, background: seg.c, boxShadow: `0 0 8px ${seg.c}`, animationDelay: `${0.2 + i * 0.08}s` }} />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {[
                  { l: "IVA", c: "#f59e0b" }, { l: "Plataforma", c: "#8b5cf6" },
                  ...(avgCostPct > 0 ? [{ l: "Costo", c: "#c026d3" }] : []),
                  ...(shipping > 0 ? [{ l: "Envío", c: "#22d3ee" }] : []),
                  { l: "Ganancia", c: "#22c55e" },
                ].map((lg) => (
                  <span key={lg.l} className="flex items-center gap-1 text-[10px] text-[#64748B]">
                    <span className="w-2 h-2 rounded-full" style={{ background: lg.c }} /> {lg.l}
                  </span>
                ))}
              </div>
            </div>

            {/* Resultado */}
            <div className="flex items-center justify-between mt-3 rounded-xl px-4 py-3.5"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", boxShadow: "0 0 16px rgba(34,197,94,0.08)" }}>
              <div>
                <p className="text-sm font-bold text-[#22c55e]">Te queda de ganancia</p>
                <p className="text-[11px] text-[#64748B]">por cada {fmt(EXAMPLE)} de venta</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#22c55e] leading-none">{fmt(profit)}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">margen {marginPct.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Costo de productos desde TiendaNube */}
      <div className="anim-up rounded-2xl p-5 flex items-center gap-4" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.34s" }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(192,38,211,0.12)" }}>
          <Package size={19} color="#c026d3" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#F1F5F9] text-sm">Costo de productos</p>
          <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
            Lo tomamos del campo <strong className="text-[#94A3B8]">Costo</strong> de cada variante en TiendaNube.
            {productStats.total > 0 && (
              <span style={{ color: productStats.withCost > 0 ? "#22c55e" : "#f59e0b" }}>
                {" "}{productStats.withCost > 0
                  ? `${productStats.withCost} de ${productStats.total} con costo cargado.`
                  : `${productStats.total} productos sin costo cargado.`}
              </span>
            )}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          {avgCostPct > 0 ? (
            <>
              <p className="text-2xl font-black text-[#c026d3]">{avgCostPct.toFixed(0)}%</p>
              <p className="text-[11px] text-[#64748B]">del precio de venta</p>
            </>
          ) : (
            <p className="text-sm font-semibold text-[#f59e0b] max-w-[150px]">Cargá los costos en TiendaNube</p>
          )}
        </div>
      </div>

    </div>
  );
}

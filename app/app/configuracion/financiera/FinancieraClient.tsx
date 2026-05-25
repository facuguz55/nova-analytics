"use client";

import { useRef, useState } from "react";
import { DollarSign, Percent, Save, Info } from "lucide-react";
import { updateFinancialConfig } from "@/app/app/actions";
import { toast } from "sonner";

interface Config {
  usd_rate: number;
  tax_rate: number;
  platform_fee: number;
  agency_fee: number;
}

function FieldCard({
  label,
  name,
  value,
  suffix,
  description,
  icon: Icon,
  iconColor,
}: {
  label: string;
  name: string;
  value: number;
  suffix: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${iconColor}18` }}
          >
            <Icon size={17} color={iconColor} strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold text-[#F1F5F9] text-sm">{label}</p>
            <p className="text-xs text-[#64748B] mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3"
        style={{
          background: "rgba(124,58,237,0.06)",
          border: "1px solid rgba(124,58,237,0.2)",
        }}
      >
        <input
          type="number"
          name={name}
          defaultValue={value}
          step="0.01"
          min="0"
          className="flex-1 min-w-0 bg-transparent text-lg font-bold text-[#F1F5F9] outline-none"
          style={{ appearance: "none", MozAppearance: "textfield" } as React.CSSProperties}
        />
        <span className="flex-shrink-0 whitespace-nowrap text-sm font-semibold text-[#94A3B8]">{suffix}</span>
      </div>
    </div>
  );
}

export default function FinancieraClient({ config }: { config: Config }) {
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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

  const fields = [
    {
      label: "Tipo de cambio USD",
      name: "usd_rate",
      value: config.usd_rate,
      suffix: "ARS/USD",
      description: "Para convertir métricas en dólares",
      icon: DollarSign,
      iconColor: "#22c55e",
    },
    {
      label: "IVA / Impuesto",
      name: "tax_rate",
      value: config.tax_rate,
      suffix: "%",
      description: "Porcentaje de impuesto sobre ventas",
      icon: Percent,
      iconColor: "#f59e0b",
    },
    {
      label: "Comisión plataforma",
      name: "platform_fee",
      value: config.platform_fee,
      suffix: "%",
      description: "Fee de TiendaNube u otra plataforma",
      icon: Percent,
      iconColor: "#7C3AED",
    },
    {
      label: "Fee agencia",
      name: "agency_fee",
      value: config.agency_fee,
      suffix: "%",
      description: "Comisión de Nova Agency (si aplica)",
      icon: Percent,
      iconColor: "#e1691e",
    },
  ];

  // Vista previa de rentabilidad
  const exampleSale = 100000;
  const netAfterTax = exampleSale / (1 + config.tax_rate / 100);
  const netAfterPlatform = netAfterTax * (1 - config.platform_fee / 100);
  const netAfterAgency = netAfterPlatform * (1 - config.agency_fee / 100);
  const margin = ((netAfterAgency / exampleSale) * 100).toFixed(1);
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Configuración financiera
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Estos parámetros se usan en los cálculos de rentabilidad y margen neto.
        </p>
      </div>

      {/* Form */}
      <form ref={formRef} action={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <FieldCard key={f.name} {...f} />
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
        >
          <Save size={15} strokeWidth={2.5} />
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      {/* Preview */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info size={14} color="#7C3AED" strokeWidth={2.5} />
          <p className="text-sm font-semibold text-[#F1F5F9]">Vista previa — venta de {fmt(exampleSale)}</p>
        </div>
        <div className="space-y-2">
          {[
            { label: "Venta bruta", value: fmt(exampleSale), color: "#F1F5F9" },
            { label: `Neto (- IVA ${config.tax_rate}%)`, value: fmt(netAfterTax), color: "#94A3B8" },
            { label: `Neto (- plataforma ${config.platform_fee}%)`, value: fmt(netAfterPlatform), color: "#94A3B8" },
            { label: `Neto (- agencia ${config.agency_fee}%)`, value: fmt(netAfterAgency), color: "#22c55e" },
            { label: "Margen neto", value: `${margin}%`, color: "#e1691e" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-[#64748B]">{row.label}</span>
              <span className="font-bold" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

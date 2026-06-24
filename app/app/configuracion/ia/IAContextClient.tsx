"use client";

import { useState } from "react";
import { Sparkles, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { saveAIContext } from "./actions";

interface AIContext {
  store_name: string;
  general_info: string;
  shipping_policy: string;
  return_policy: string;
  payment_methods: string;
  tone: string;
}

const FIELDS: Array<{
  key: keyof AIContext;
  label: string;
  placeholder: string;
  rows: number;
  hint: string;
}> = [
  {
    key: "store_name",
    label: "Nombre de la tienda",
    placeholder: "Ej: Calabrese Importadas",
    rows: 1,
    hint: "Cómo se llama tu tienda",
  },
  {
    key: "general_info",
    label: "Información general",
    placeholder: "Ej: Somos una tienda de indumentaria importada con base en CABA. Vendemos ropa de temporada para mujer, con envíos a todo el país. Atendemos de lunes a viernes de 9 a 18hs.",
    rows: 4,
    hint: "Describí tu tienda, productos, ubicación y horarios",
  },
  {
    key: "shipping_policy",
    label: "Política de envíos",
    placeholder: "Ej: Enviamos por Andreani y Correo Argentino. Envío gratis en compras mayores a $50.000. El tiempo de entrega es de 3 a 7 días hábiles según la zona. Para CABA los envíos llegan en 24-48hs.",
    rows: 3,
    hint: "Tiempos, costos, zonas de envío",
  },
  {
    key: "return_policy",
    label: "Política de devoluciones y cambios",
    placeholder: "Ej: Aceptamos cambios dentro de los 30 días de recibido el producto. El artículo debe estar sin uso y con etiquetas. Los gastos de envío del cambio corren por cuenta del cliente.",
    rows: 3,
    hint: "Plazos, condiciones y cómo se gestiona",
  },
  {
    key: "payment_methods",
    label: "Medios de pago",
    placeholder: "Ej: Aceptamos Mercado Pago, tarjetas de crédito/débito (Visa, Mastercard, AMEX) y transferencia bancaria. Hasta 12 cuotas sin interés con tarjetas seleccionadas.",
    rows: 2,
    hint: "Tarjetas, billeteras, cuotas disponibles",
  },
  {
    key: "tone",
    label: "Tono y estilo de comunicación",
    placeholder: "Ej: Cercano y profesional, tuteo, en español rioplatense. Siempre positivo y resolutivo. Usar emojis con moderación.",
    rows: 2,
    hint: "Cómo querés que suenen las respuestas de la IA",
  },
];

export default function IAContextClient({ initial }: { initial: AIContext }) {
  const [values, setValues] = useState<AIContext>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    const result = await saveAIContext(formData);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setSaved(true);
      toast.success("Contexto de IA guardado");
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} color="#a78bfa" strokeWidth={2} />
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Contexto de IA
          </h1>
        </div>
        <p className="text-sm text-[#94A3B8]">
          Esta información se usa para que la IA genere respuestas precisas y coherentes con tu tienda.
        </p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}
      >
        <Sparkles size={14} color="#a78bfa" strokeWidth={2} className="mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#a78bfa] leading-relaxed">
          Cuanto más completo sea este contexto, más precisas serán las sugerencias al responder emails de clientes.
          Completá al menos la información general y las políticas más consultadas.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {FIELDS.map(({ key, label, placeholder, rows, hint }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-[#F1F5F9] mb-1">{label}</label>
            <p className="text-[11px] text-[#64748B] mb-1.5">{hint}</p>
            {rows === 1 ? (
              <input
                type="text"
                name={key}
                value={values[key]}
                onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none"
                style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
              />
            ) : (
              <textarea
                name={key}
                rows={rows}
                value={values[key]}
                onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none resize-none"
                style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }}
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Guardando...</>
          ) : saved ? (
            <><CheckCircle2 size={14} /> Guardado</>
          ) : (
            <><Save size={14} /> Guardar contexto</>
          )}
        </button>
      </form>
    </div>
  );
}

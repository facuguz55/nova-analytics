"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, CheckCircle2, Loader2, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  "Dashboard TiendaNube + Meta + Gmail centralizado",
  "IA Assistant integrado con tus datos reales",
  "Alertas inteligentes de stock y ventas",
  "Análisis avanzado y rentabilidad",
  "Soporte por WhatsApp con el equipo Nova",
];

interface Props {
  workspaceId: string;
  userEmail: string;
}

export default function PaywallCard({ workspaceId, userEmail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout/lemonsqueezy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al generar el checkout");
      window.location.href = json.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al conectar con el servidor");
      setLoading(false);
    }
  }

  return (
    <div
      className="w-full max-w-md mx-4 rounded-3xl p-8 shadow-2xl"
      style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.45)" }}
    >
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center shadow-lg shadow-[rgba(124,58,237,0.4)]">
          <Zap className="w-6 h-6 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-black text-[#F1F5F9] text-center mb-1" style={{ letterSpacing: "-0.02em" }}>
        Probá Nova Analytics gratis
      </h2>
      <p className="text-[#94A3B8] text-sm text-center mb-6">
        7 días gratis &middot; Después{" "}
        <span className="text-[#F1F5F9] font-semibold">$77.000/mes ARS</span>
      </p>

      <div className="space-y-2 mb-8">
        {FEATURES.map((f) => (
          <div key={f} className="flex items-start gap-2">
            <CheckCircle2 size={14} color="#22c55e" strokeWidth={2.5} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm text-[#94A3B8]">{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Redirigiendo a pago seguro...
          </>
        ) : (
          <>
            <CreditCard size={15} />
            Iniciar prueba gratis de 7 días
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <Lock size={11} color="#64748B" strokeWidth={2} />
        <span className="text-[11px] text-[#64748B]">
          Pago seguro vía Lemon Squeezy · Cancelás cuando quieras
        </span>
      </div>
    </div>
  );
}

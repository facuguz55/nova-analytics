"use client";

import { useState } from "react";
import { Zap, CheckCircle2, Loader2, CreditCard, Lock, MessageCircle } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout/mercadopago", {
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
      className="w-full max-w-md mx-4 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.45)" }}
    >
      {/* Animación sutil de glow de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%)",
          animation: "paywall-pulse 4s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes paywall-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>

      <div className="relative flex justify-center mb-6">
        <div
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center"
          style={{
            boxShadow: "0 0 32px rgba(124,58,237,0.5), 0 4px 16px rgba(124,58,237,0.3)",
            animation: "paywall-icon 4s ease-in-out infinite",
          }}
        >
          <Zap className="w-6 h-6 text-white" />
        </div>
        <style>{`
          @keyframes paywall-icon {
            0%, 100% { box-shadow: 0 0 24px rgba(124,58,237,0.4), 0 4px 16px rgba(124,58,237,0.25); }
            50% { box-shadow: 0 0 48px rgba(124,58,237,0.65), 0 4px 20px rgba(124,58,237,0.4); }
          }
        `}</style>
      </div>

      <h2 className="relative text-2xl font-black text-[#F1F5F9] text-center mb-1" style={{ letterSpacing: "-0.02em" }}>
        Probá Nova Analytics gratis
      </h2>
      <p className="relative text-[#94A3B8] text-sm text-center mb-6">
        7 días gratis &middot; Después{" "}
        <span className="text-[#F1F5F9] font-semibold">$77.000/mes ARS</span>
      </p>

      <div className="relative space-y-2 mb-8">
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
        className="relative w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", boxShadow: "0 4px 24px rgba(124,58,237,0.4)" }}
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Redirigiendo a MercadoPago...
          </>
        ) : (
          <>
            <CreditCard size={15} />
            Contratar Plan Pro — $77.000 ARS/mes
          </>
        )}
      </button>

      <a
        href="https://wa.me/5491100000000?text=Hola%2C%20quiero%20contratar%20Nova%20Analytics%20Pro"
        target="_blank" rel="noopener noreferrer"
        className="relative w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition-all hover:opacity-80 mt-2"
        style={{ background: "rgba(100,116,139,0.1)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.2)" }}
      >
        <MessageCircle size={13} strokeWidth={2} />
        Pago manual / WhatsApp
      </a>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        <Lock size={11} color="#64748B" strokeWidth={2} />
        <span className="text-[11px] text-[#64748B]">
          Pago seguro vía MercadoPago · Cancelás cuando quieras
        </span>
      </div>
    </div>
  );
}

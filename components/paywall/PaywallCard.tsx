"use client";

import { useState } from "react";
import { CreditCard, Lock, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { startTrial } from "@/app/app/actions";
import { toast } from "sonner";

export default function PaywallCard() {
  const [loading, setLoading] = useState(false);

  async function handleStartTrial() {
    setLoading(true);
    try {
      await startTrial();
    } catch (e) {
      // NEXT_REDIRECT no es un error real — es cómo Next.js ejecuta redirect()
      if (e instanceof Error && e.message === "NEXT_REDIRECT") return;
      toast.error("Error al activar la prueba: " + (e instanceof Error ? e.message : "Intentá de nuevo"));
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
        Prueba Nova Analytics gratis
      </h2>
      <p className="text-[#94A3B8] text-sm text-center mb-6">
        30 dias gratis &middot; Despues <span className="text-[#F1F5F9] font-semibold">$77.000/mes ARS</span>
      </p>

      <div className="space-y-2 mb-6">
        {[
          "Dashboard TiendaNube + Meta + Gmail centralizado",
          "IA Assistant integrado con tus datos reales",
          "Alertas inteligentes de stock y ventas",
          "Analisis avanzado y rentabilidad",
          "Soporte por WhatsApp con el equipo Nova",
        ].map((f) => (
          <div key={f} className="flex items-start gap-2">
            <CheckCircle2 size={14} color="#22c55e" strokeWidth={2.5} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm text-[#94A3B8]">{f}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Numero de tarjeta</label>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: "#0a0a0f", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            <CreditCard size={15} color="#64748B" strokeWidth={2} className="flex-shrink-0" />
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="flex-1 min-w-0 bg-transparent text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none"
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                e.target.value = v.replace(/(.{4})/g, "$1 ").trim();
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Vencimiento</label>
            <input
              type="text"
              placeholder="MM/AA"
              maxLength={5}
              className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none"
              style={{ background: "#0a0a0f", border: "1px solid rgba(124,58,237,0.25)" }}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                e.target.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v;
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">CVV</label>
            <input
              type="text"
              placeholder="123"
              maxLength={4}
              className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none"
              style={{ background: "#0a0a0f", border: "1px solid rgba(124,58,237,0.25)" }}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Nombre en la tarjeta</label>
          <input
            type="text"
            placeholder="Tu nombre completo"
            className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none"
            style={{ background: "#0a0a0f", border: "1px solid rgba(124,58,237,0.25)" }}
          />
        </div>
      </div>

      <button
        onClick={handleStartTrial}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? "Activando prueba..." : "Iniciar prueba gratis de 30 dias"}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <Lock size={11} color="#64748B" strokeWidth={2} />
        <span className="text-[11px] text-[#64748B]">
          No se realizara ningun cobro durante los 30 dias de prueba
        </span>
      </div>
    </div>
  );
}

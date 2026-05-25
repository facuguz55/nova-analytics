"use client";

import { useState } from "react";
import {
  BarChart2, TrendingUp, ShoppingCart, Zap,
  Check, Star, ArrowRight, Sparkles,
} from "lucide-react";
import { startTrial } from "@/app/app/actions";
import { toast } from "sonner";

const ORDER_STEPS = [50, 300, 900, 2500, 5000, 10000, 25000, 50000, 100000];

const FREE_FEATURES = [
  "Acceso completo al dashboard",
  "Métricas de canales principales",
  "Atribución básica de canales",
  "Análisis de rendimiento de tienda",
  "Sin necesidad de tarjeta de crédito",
];

const PRO_FEATURES = [
  "Todo lo del plan gratuito",
  "Órdenes ilimitadas",
  "Integración Meta Ads completa",
  "IA Assistant sin límites",
  "Cotizaciones y comisiones avanzadas",
  "Costos adicionales y envíos",
  "Soporte prioritario",
  "Exportación de reportes",
];

const WHY_FEATURES = [
  {
    icon: BarChart2,
    title: "Métricas en tiempo real",
    desc: "Visualizá el rendimiento de tu tienda con dashboards actualizados al instante.",
    color: "#7C3AED",
  },
  {
    icon: TrendingUp,
    title: "Atribución de canales",
    desc: "Entendé qué canales generan más ventas y optimizá tu inversión en marketing.",
    color: "#22c55e",
  },
  {
    icon: ShoppingCart,
    title: "Análisis de órdenes",
    desc: "Seguí cada orden y detectá patrones de compra para tomar mejores decisiones.",
    color: "#2563EB",
  },
  {
    icon: Zap,
    title: "Integración rápida",
    desc: "Conectá tu tienda en minutos, sin necesidad de conocimientos técnicos.",
    color: "#f59e0b",
  },
];

interface Props {
  plan: string;
  trialDaysLeft: number | null;
  ordersLastMonth: number;
}

export default function PlanesClient({ plan, trialDaysLeft, ordersLastMonth }: Props) {
  const [sliderIdx, setSliderIdx] = useState(
    Math.max(0, ORDER_STEPS.findIndex((s) => s >= ordersLastMonth))
  );
  const [starting, setStarting] = useState(false);

  const selectedOrders = ORDER_STEPS[sliderIdx];
  const isFree    = plan === "free";
  const isTrial   = plan === "trial";
  const isPro     = plan === "pro" || plan === "agency" || plan === "active";

  async function handleStartTrial() {
    setStarting(true);
    try {
      await startTrial();
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
      setStarting(false);
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        {isTrial && trialDaysLeft !== null ? (
          <>
            <p className="text-sm text-[#94A3B8]">Tu prueba gratuita acaba en</p>
            <h1 className="text-4xl font-black" style={{ letterSpacing: "-0.03em" }}>
              <span className="text-[#F1F5F9]">{trialDaysLeft} </span>
              <span style={{ color: "#8B5CF6" }}>día{trialDaysLeft !== 1 ? "s" : ""}</span>
            </h1>
          </>
        ) : isPro ? (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-2"
              style={{ background: "rgba(124,58,237,0.15)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.3)" }}>
              <Star size={14} strokeWidth={2.5} /> Plan activo
            </div>
            <h1 className="text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              Tu plan Nova Analytics
            </h1>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-2"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Sparkles size={14} strokeWidth={2.5} /> Sin costo · Sin tarjeta
            </div>
            <h1 className="text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              Empezá gratis, crecé cuando estés listo
            </h1>
          </>
        )}
      </div>

      {/* Slider de volumen */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#F1F5F9]">
              Plan actual: <span style={{ color: isTrial ? "#f59e0b" : isPro ? "#8B5CF6" : "#94A3B8" }}>
                {isTrial ? "Prueba gratuita" : isPro ? "Pro" : "Plan gratuito"}
              </span>
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">Órdenes últimos 30 días: <span className="text-[#F1F5F9] font-semibold">{ordersLastMonth}</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#64748B]">Volumen seleccionado</p>
            <p className="text-sm font-bold text-[#8B5CF6]">
              {selectedOrders >= 100000 ? "+100k" : selectedOrders.toLocaleString("es-AR")} órdenes
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="relative pt-2 pb-6">
          {/* Tooltip sobre el thumb */}
          <div
            className="absolute -top-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
            style={{
              left: `calc(${(sliderIdx / (ORDER_STEPS.length - 1)) * 100}% - 24px)`,
              background: "#7C3AED",
              transform: "translateX(-50%)",
            }}
          >
            {ordersLastMonth <= ORDER_STEPS[sliderIdx] ? "Tus órdenes" : `${(selectedOrders / 1000).toFixed(0)}k`}
          </div>

          <input
            type="range"
            min={0}
            max={ORDER_STEPS.length - 1}
            value={sliderIdx}
            onChange={(e) => setSliderIdx(Number(e.target.value))}
            className="w-full appearance-none cursor-pointer"
            style={{
              height: "4px",
              borderRadius: "2px",
              background: `linear-gradient(to right, #7C3AED ${(sliderIdx / (ORDER_STEPS.length - 1)) * 100}%, rgba(124,58,237,0.2) ${(sliderIdx / (ORDER_STEPS.length - 1)) * 100}%)`,
              outline: "none",
            }}
          />

          {/* Labels */}
          <div className="flex justify-between mt-2">
            {ORDER_STEPS.map((s, i) => (
              <span key={s} className="text-[9px]" style={{ color: i === sliderIdx ? "#8B5CF6" : "#475569" }}>
                {s >= 100000 ? "+100k" : s >= 1000 ? `${s / 1000}k` : s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dos columnas: ¿Por qué? + Plan card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ¿Por qué Nova Analytics? */}
        <div className="rounded-2xl p-6 space-y-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div>
            <h2 className="text-lg font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              ¿Por qué Nova Analytics?
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Todo lo que necesitás para entender y hacer crecer tu negocio, en un solo lugar.
            </p>
          </div>

          <div className="space-y-4">
            {WHY_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${f.color}15` }}>
                    <Icon size={15} color={f.color} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F1F5F9]">{f.title}</p>
                    <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Siempre incluido */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <p className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">SIEMPRE INCLUIDO</p>
            {["Acceso completo al dashboard", "Sin necesidad de tarjeta de crédito", "Soporte por email"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Check size={12} color="#22c55e" strokeWidth={2.5} />
                <span className="text-xs text-[#94A3B8]">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan card */}
        <div className="space-y-4">
          {/* Plan Gratis */}
          <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden"
            style={{ background: "#111118", border: `2px solid ${isFree || isTrial ? "#7C3AED" : "rgba(124,58,237,0.2)"}` }}>
            {(isFree || isTrial) && (
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: "#7C3AED", color: "white" }}>
                Plan actual
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-[#94A3B8]">Plan Gratis</p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Empezá sin costo y sin tarjeta de crédito. Perfecto para tiendas que recién arrancan.
              </p>
            </div>

            <div>
              <p className="text-4xl font-black text-[#F1F5F9]">Gratis</p>
              <p className="text-xs text-[#64748B] mt-1">sin límite de tiempo</p>
            </div>

            <div className="rounded-xl px-4 py-2.5 text-xs font-bold text-center"
              style={{ background: "rgba(124,58,237,0.12)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.25)" }}>
              Incluye hasta <strong>80 órdenes por mes</strong> sin costo alguno.
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#F1F5F9]">Incluye</p>
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check size={13} color="#22c55e" strokeWidth={2.5} className="flex-shrink-0" />
                  <span className="text-xs text-[#94A3B8]">{f}</span>
                </div>
              ))}
            </div>

            {isFree && (
              <button
                onClick={handleStartTrial}
                disabled={starting}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
              >
                <Sparkles size={15} strokeWidth={2.5} />
                {starting ? "Activando..." : "Activar prueba gratuita de 14 días"}
              </button>
            )}
          </div>

          {/* Plan Pro */}
          <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden"
            style={{ background: isPro ? "rgba(124,58,237,0.08)" : "#111118", border: `2px solid ${isPro ? "#7C3AED" : "rgba(124,58,237,0.15)"}` }}>
            {isPro && (
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: "#7C3AED", color: "white" }}>
                Plan actual
              </div>
            )}

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#F1F5F9]">Plan Pro</p>
                <p className="text-xs text-[#64748B] mt-0.5">Para tiendas en crecimiento que necesitan más potencia</p>
              </div>
              <Star size={16} color="#f59e0b" strokeWidth={2} className="mt-0.5 flex-shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRO_FEATURES.slice(0, 6).map((f) => (
                <div key={f} className="flex items-center gap-1.5">
                  <Check size={11} color="#8B5CF6" strokeWidth={2.5} className="flex-shrink-0" />
                  <span className="text-[11px] text-[#94A3B8]">{f}</span>
                </div>
              ))}
            </div>

            {!isPro && (
              <button
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.12)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                Contactar a Nova Agency <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

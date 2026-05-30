"use client";

import { useState } from "react";
import {
  Check, Star, ArrowRight, Sparkles, Zap,
  BarChart2, TrendingUp, ShoppingCart, Crown,
  MessageCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { startTrial } from "@/app/app/actions";
import { toast } from "sonner";

interface Props {
  plan: string;
  trialDaysLeft: number | null;
  ordersLastMonth: number;
}

const FREE_FEATURES  = ["Dashboard completo", "Hasta 80 órdenes/mes", "Métricas de tienda", "Sin tarjeta de crédito"];
const PRO_FEATURES   = ["Órdenes ilimitadas", "Meta Ads completo", "IA Assistant sin límites", "Cotizaciones y comisiones", "Costos adicionales y envíos", "Soporte prioritario", "Exportación de reportes"];

const PLAN_META: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  free:   { label: "Plan Gratuito",     color: "#94A3B8", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.25)", desc: "Acceso básico al dashboard." },
  trial:  { label: "Prueba Gratuita",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)",   desc: "Acceso completo Pro por 14 días." },
  pro:    { label: "Plan Pro",          color: "#8B5CF6", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.3)",   desc: "Acceso completo sin límites." },
  active: { label: "Plan Pro",          color: "#8B5CF6", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.3)",   desc: "Acceso completo sin límites." },
  agency: { label: "Plan Agency",       color: "#e1691e", bg: "rgba(225,105,30,0.08)",  border: "rgba(225,105,30,0.3)",   desc: "Multi-tienda y soporte dedicado." },
};

export default function PlanesClient({ plan, trialDaysLeft, ordersLastMonth }: Props) {
  const [starting, setStarting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isFree  = plan === "free";
  const isTrial = plan === "trial";
  const isPro   = plan === "pro" || plan === "agency" || plan === "active";
  const meta    = PLAN_META[plan] ?? PLAN_META.free;

  async function handleStartTrial() {
    setStarting(true);
    try { await startTrial(); }
    catch (e) {
      if (e instanceof Error && e.message === "NEXT_REDIRECT") return;
      toast.error("Error: " + (e instanceof Error ? e.message : "")); setStarting(false);
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl">

      {/* ── Tu plan actual ── */}
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Planes</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Estado de tu suscripción y opciones disponibles.</p>
      </div>

      {/* Plan status card */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: meta.bg, border: `2px solid ${meta.border}` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}20` }}
        >
          {isPro ? <Crown size={22} color={meta.color} strokeWidth={2} />
           : isTrial ? <Sparkles size={22} color={meta.color} strokeWidth={2} />
           : <Star size={22} color={meta.color} strokeWidth={2} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-[#F1F5F9]">{meta.label}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}>
              ACTIVO
            </span>
          </div>
          <p className="text-sm text-[#94A3B8] mt-0.5">{meta.desc}</p>
          {isTrial && trialDaysLeft !== null && (
            <p className="text-sm font-bold mt-1" style={{ color: trialDaysLeft <= 3 ? "#ef4444" : "#f59e0b" }}>
              {trialDaysLeft === 0 ? "Vence hoy" : `${trialDaysLeft} día${trialDaysLeft !== 1 ? "s" : ""} restante${trialDaysLeft !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[#64748B]">Órdenes este mes</p>
          <p className="text-lg font-black text-[#F1F5F9]">{ordersLastMonth.toLocaleString("es-AR")}</p>
        </div>
      </div>

      {/* Incluido en tu plan */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-5 py-3.5 flex items-center justify-between transition-all hover:bg-[rgba(124,58,237,0.04)]"
        >
          <p className="text-sm font-semibold text-[#F1F5F9]">Qué incluye tu plan</p>
          {showDetails ? <ChevronUp size={15} color="#64748B" /> : <ChevronDown size={15} color="#64748B" />}
        </button>
        {showDetails && (
          <div className="px-5 pb-5 grid grid-cols-2 gap-2">
            {(isPro || isTrial ? [...FREE_FEATURES, ...PRO_FEATURES] : FREE_FEATURES).map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Check size={13} color="#22c55e" strokeWidth={2.5} className="flex-shrink-0" />
                <span className="text-xs text-[#94A3B8]">{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Acción según plan ── */}
      {isFree && (
        <div className="space-y-3">
          {/* Trial CTA */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(124,58,237,0.06)", border: "2px solid rgba(124,58,237,0.3)" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.15)" }}>
                <Sparkles size={18} color="#8B5CF6" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F1F5F9]">Probá el Plan Pro gratis por 14 días</p>
                <p className="text-xs text-[#64748B] mt-0.5">Sin tarjeta de crédito. Cancelás cuando querés.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRO_FEATURES.slice(0, 4).map((f) => (
                <div key={f} className="flex items-center gap-1.5">
                  <Check size={11} color="#8B5CF6" strokeWidth={2.5} className="flex-shrink-0" />
                  <span className="text-[11px] text-[#94A3B8]">{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleStartTrial}
              disabled={starting}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-85 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
            >
              <Zap size={15} strokeWidth={2.5} />
              {starting ? "Activando..." : "Activar prueba gratuita"}
            </button>
          </div>
        </div>
      )}

      {isTrial && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.25)" }}>
          <p className="text-sm font-bold text-[#F1F5F9]">¿Te gusta lo que ves?</p>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Contratá el Plan Pro antes de que venza tu prueba para no perder el acceso a tus datos y configuraciones.
          </p>
          <a
            href="https://wa.me/5491100000000?text=Hola,%20quiero%20contratar%20Nova%20Analytics%20Pro"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-85"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
          >
            <MessageCircle size={15} strokeWidth={2.5} />
            Contratar Plan Pro
          </a>
        </div>
      )}

      {isPro && (
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "#111118", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.1)" }}>
            <Check size={18} color="#22c55e" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#F1F5F9]">Todo en orden</p>
            <p className="text-xs text-[#64748B] mt-0.5">Tu plan está activo. Para cambios, contactá a Nova Agency.</p>
          </div>
          <a
            href="https://wa.me/5491100000000"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.1)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            Contactar <ArrowRight size={12} />
          </a>
        </div>
      )}

      {/* ── Comparación rápida ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Comparar planes</p>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
          {[
            { feature: "Órdenes / mes",        free: "Hasta 80",     pro: "Ilimitadas",   icon: ShoppingCart },
            { feature: "Meta Ads",              free: "—",            pro: "Completo",     icon: BarChart2 },
            { feature: "IA Assistant",          free: "Básico",       pro: "Sin límites",  icon: Zap },
            { feature: "Rentabilidad real",     free: "—",            pro: "Incluida",     icon: TrendingUp },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.feature} className="grid grid-cols-3 items-center px-5 py-3 gap-4">
                <div className="flex items-center gap-2">
                  <Icon size={13} color="#64748B" strokeWidth={2} />
                  <span className="text-xs text-[#94A3B8]">{row.feature}</span>
                </div>
                <span className="text-xs text-center font-medium" style={{ color: isFree ? "#F1F5F9" : "#64748B" }}>{row.free}</span>
                <span className="text-xs text-center font-bold" style={{ color: isPro || isTrial ? "#8B5CF6" : "#475569" }}>{row.pro}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-3 px-5 py-2" style={{ borderTop: "1px solid rgba(124,58,237,0.1)", background: "rgba(124,58,237,0.04)" }}>
          <span />
          <span className="text-[10px] font-bold text-center text-[#64748B] uppercase tracking-widest">Gratis</span>
          <span className="text-[10px] font-bold text-center uppercase tracking-widest" style={{ color: "#8B5CF6" }}>Pro</span>
        </div>
      </div>

    </div>
  );
}

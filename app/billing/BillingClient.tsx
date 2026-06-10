"use client";

import { useState } from "react";
import { CheckCircle2, Clock, XCircle, Zap, AlertTriangle, Gift, MessageCircle, CreditCard, LogOut, RefreshCw, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Subscription = {
  status: string;
  next_billing_at: string | null;
  provider_subscription_id: string | null;
  cancelled_at: string | null;
} | null;

interface Props {
  workspaceId: string;
  userEmail: string;
  subscription: Subscription;
}

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

const WA_URL = `https://wa.me/5493424633285?text=Hola!%20Quiero%20suscribirme%20a%20Nova%20Analytics%20desde%20el%20exterior.`;
const FEATURES = ["Órdenes ilimitadas", "Meta Ads", "IA sin límites", "Soporte prioritario"];

export default function BillingClient({ workspaceId, userEmail, subscription }: Props) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingTrial, setLoadingTrial]       = useState(false);

  const isActive    = subscription?.status === "active";
  const isTrial     = subscription?.status === "trial";
  const isCancelled = subscription?.status === "cancelled";
  const isExpired   = subscription?.status === "expired";
  const hasAnyPlan  = isActive || isTrial;

  async function handleCheckout() {
    setLoadingCheckout(true);
    try {
      const res  = await fetch("/api/billing/checkout/mercadopago", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al generar checkout");
      window.location.href = json.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setLoadingCheckout(false);
    }
  }

  async function handleTrial() {
    setLoadingTrial(true);
    try {
      const res  = await fetch("/api/billing/trial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al activar prueba");
      toast.success("¡Prueba activada!");
      setTimeout(() => { window.location.href = "/app/dashboard"; }, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al activar la prueba");
    } finally {
      setLoadingTrial(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#06060b" }}>

      {/* Fondo con glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(139,92,246,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(6,182,212,0.06) 0%, transparent 60%)"
      }} />

      {/* Top nav */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>

        <a href={hasAnyPlan ? "/app/dashboard" : "/"}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: "#475569" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
          onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
        >
          <ArrowLeft size={13} strokeWidth={2.5} />
          {hasAnyPlan ? "Volver al dashboard" : "Página principal"}
        </a>

        <div className="flex items-center gap-1">
          <a href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: "#475569" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#94A3B8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
          >
            <RefreshCw size={12} strokeWidth={2.5} />
            <span className="hidden sm:inline">Cambiar cuenta</span>
          </a>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)" }} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: "#475569" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
          >
            <LogOut size={12} strokeWidth={2.5} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-xl space-y-4">

          {/* Header */}
          <div className="text-center space-y-1 mb-6">
            <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#8b5cf6" }}>Nova Analytics</p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.03em" }}>
              {hasAnyPlan ? "Tu plan" : "Elegí tu plan"}
            </h1>
            <p className="text-xs" style={{ color: "#334155" }}>{userEmail}</p>
          </div>

          {/* Plan activo */}
          {hasAnyPlan && (
            <div className="rounded-2xl p-5 space-y-4" style={{
              background: "rgba(139,92,246,0.05)",
              border: `1px solid ${isTrial ? "rgba(6,182,212,0.2)" : "rgba(139,92,246,0.25)"}`,
              boxShadow: `0 0 40px ${isTrial ? "rgba(6,182,212,0.04)" : "rgba(139,92,246,0.06)"}`,
            }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: isTrial ? "rgba(6,182,212,0.12)" : "rgba(139,92,246,0.15)" }}>
                  {isTrial
                    ? <Gift size={15} color="#06B6D4" strokeWidth={2} />
                    : <CheckCircle2 size={15} color="#a78bfa" strokeWidth={2} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#F1F5F9]">{isTrial ? "Prueba gratuita" : "Plan Pro"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={11} color="#475569" />
                    <p className="text-xs" style={{ color: "#475569" }}>
                      {isTrial ? "Válida hasta" : "Próximo cobro"}: {formatDate(subscription?.next_billing_at ?? null)}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                  background: isTrial ? "rgba(6,182,212,0.1)" : "rgba(34,197,94,0.1)",
                  color: isTrial ? "#06B6D4" : "#22c55e",
                  border: `1px solid ${isTrial ? "rgba(6,182,212,0.2)" : "rgba(34,197,94,0.2)"}`,
                }}>
                  {isTrial ? "PRUEBA" : "ACTIVO"}
                </span>
              </div>

              {isCancelled && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <AlertTriangle size={12} color="#f59e0b" />
                  <p className="text-xs" style={{ color: "#f59e0b" }}>
                    Cancelada · acceso hasta {formatDate(subscription?.cancelled_at ?? null)}
                  </p>
                </div>
              )}

              <a href="/app/configuracion/cuenta"
                className="block text-center text-[11px] transition-colors"
                style={{ color: "#1e293b" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#475569")}
                onMouseLeave={e => (e.currentTarget.style.color = "#1e293b")}
              >
                gestionar suscripción →
              </a>
            </div>
          )}

          {/* Cancelada o expirada */}
          {(isCancelled || isExpired) && !hasAnyPlan && (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <XCircle size={15} color="#ef4444" />
              <p className="text-xs text-[#94A3B8]">
                {isExpired ? "Suscripción expirada" : "Suscripción cancelada"} · Elegí un plan para continuar.
              </p>
            </div>
          )}

          {/* Cards de pago */}
          {!hasAnyPlan && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* MercadoPago */}
                <div className="rounded-2xl p-5 flex flex-col gap-4 group" style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(0,158,227,0.15)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,158,227,0.35)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 30px rgba(0,158,227,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,158,227,0.15)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(0,158,227,0.12)" }}>
                      <CreditCard size={14} color="#009EE3" strokeWidth={2} />
                    </div>
                    <p className="text-xs font-semibold text-[#94A3B8]">MercadoPago · Argentina</p>
                  </div>

                  <div>
                    <p className="text-3xl font-black" style={{ color: "#009EE3", letterSpacing: "-0.04em" }}>
                      $77.000
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#334155" }}>ARS / mes</p>
                  </div>

                  <ul className="space-y-1.5 flex-1">
                    {FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
                        <Zap size={10} color="#009EE3" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button onClick={handleCheckout} disabled={loadingCheckout}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    style={{ background: "rgba(0,158,227,0.12)", color: "#009EE3", border: "1px solid rgba(0,158,227,0.25)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,158,227,0.2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,158,227,0.12)")}
                  >
                    {loadingCheckout ? "Redirigiendo..." : "Suscribirse"}
                  </button>
                </div>

                {/* Exterior */}
                <div className="rounded-2xl p-5 flex flex-col gap-4" style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,92,246,0.35)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 30px rgba(139,92,246,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,92,246,0.15)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(139,92,246,0.12)" }}>
                      <MessageCircle size={14} color="#a78bfa" strokeWidth={2} />
                    </div>
                    <p className="text-xs font-semibold text-[#94A3B8]">WhatsApp · Exterior</p>
                  </div>

                  <div>
                    <p className="text-3xl font-black" style={{ color: "#a78bfa", letterSpacing: "-0.04em" }}>
                      USD 59
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#334155" }}>/ mes · coordinamos el pago</p>
                  </div>

                  <ul className="space-y-1.5 flex-1">
                    {FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
                        <Zap size={10} color="#a78bfa" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all block"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,92,246,0.2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(139,92,246,0.12)")}
                  >
                    Contactar por WhatsApp
                  </a>
                </div>
              </div>

              {/* Trial minimalista */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-xs" style={{ color: "#334155" }}>
                  Probá 7 días gratis · sin tarjeta
                </p>
                <button onClick={handleTrial} disabled={loadingTrial}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                  style={{ color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(34,197,94,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(34,197,94,0.08)")}
                >
                  {loadingTrial ? "Activando..." : "Activar prueba"}
                </button>
              </div>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-[11px]" style={{ color: "#1a2030" }}>
            Pagos procesados por MercadoPago · Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  );
}

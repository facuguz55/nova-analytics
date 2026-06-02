"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Clock,
  XCircle,
  Zap,
  AlertTriangle,
  Gift,
  MessageCircle,
} from "lucide-react";
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
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const WA_NUMBER = "5493424633285";
const WA_URL = `https://wa.me/${WA_NUMBER}?text=Hola!%20Quiero%20suscribirme%20a%20Nova%20Analytics%20desde%20el%20exterior.`;

const FEATURES = ["Órdenes ilimitadas", "Meta Ads", "IA sin límites", "Soporte prioritario"];

export default function BillingClient({ workspaceId, userEmail, subscription }: Props) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingTrial, setLoadingTrial] = useState(false);

  const isActive = subscription?.status === "active";
  const isTrial = subscription?.status === "trial";
  const isCancelled = subscription?.status === "cancelled";
  const isExpired = subscription?.status === "expired";
  const hasAnyPlan = isActive || isTrial;

  async function handleCheckout() {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/billing/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al generar checkout");
      window.location.href = json.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al conectar con el servidor");
      setLoadingCheckout(false);
    }
  }

  async function handleTrial() {
    setLoadingTrial(true);
    try {
      const res = await fetch("/api/billing/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al activar prueba");
      toast.success("¡Prueba gratuita activada! Tenés 7 días de acceso completo.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al activar la prueba");
    } finally {
      setLoadingTrial(false);
    }
  }

  async function handleCancel() {
    if (!confirm("¿Cancelar tu suscripción? Seguirás teniendo acceso hasta el próximo vencimiento.")) return;
    setLoadingCancel(true);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo cancelar");
      toast.success("Suscripción cancelada. Seguís teniendo acceso hasta el próximo vencimiento.");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setLoadingCancel(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0a0f1e" }}>
      <div className="w-full max-w-2xl space-y-5 sm:space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.03em" }}>
            Facturación
          </h1>
          <p className="text-sm text-[#64748B]">{userEmail}</p>
        </div>

        {/* Plan activo */}
        {hasAnyPlan && (
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background: isTrial ? "rgba(6,182,212,0.07)" : "rgba(139,92,246,0.07)",
              border: `1.5px solid ${isTrial ? "rgba(6,182,212,0.3)" : "rgba(139,92,246,0.3)"}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: isTrial ? "rgba(6,182,212,0.15)" : "rgba(139,92,246,0.15)" }}
              >
                {isTrial
                  ? <Gift size={20} color="#06B6D4" strokeWidth={2} />
                  : <CheckCircle2 size={20} color="#8B5CF6" strokeWidth={2} />
                }
              </div>
              <div>
                <p className="text-base font-bold text-[#F1F5F9]">
                  {isTrial ? "Prueba gratuita activa" : "Plan Pro activo"}
                </p>
                <p className="text-xs text-[#64748B]">Acceso completo a todas las funciones</p>
              </div>
              <span
                className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: isTrial ? "rgba(6,182,212,0.12)" : "rgba(34,197,94,0.12)",
                  color: isTrial ? "#06B6D4" : "#22c55e",
                  border: `1px solid ${isTrial ? "rgba(6,182,212,0.25)" : "rgba(34,197,94,0.25)"}`,
                }}
              >
                {isTrial ? "PRUEBA" : "ACTIVO"}
              </span>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} color="#64748B" />
                <p className="text-xs text-[#64748B]">
                  {isTrial ? "Prueba válida hasta" : "Próximo cobro"}
                </p>
              </div>
              <p className="text-sm font-semibold text-[#F1F5F9]">
                {formatDate(subscription?.next_billing_at ?? null)}
              </p>
            </div>

            {isCancelled && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <AlertTriangle size={14} color="#f59e0b" />
                <p className="text-xs text-[#f59e0b]">
                  Cancelada el {formatDate(subscription?.cancelled_at ?? null)}. Acceso activo hasta el próximo vencimiento.
                </p>
              </div>
            )}

            {!isCancelled && (
              <button
                onClick={handleCancel}
                disabled={loadingCancel}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                }}
              >
                {loadingCancel ? "Cancelando..." : "Cancelar suscripción"}
              </button>
            )}
          </div>
        )}

        {/* Cancelada o expirada */}
        {(isCancelled || isExpired) && !hasAnyPlan && (
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{ background: "rgba(239,68,68,0.07)", border: "1.5px solid rgba(239,68,68,0.25)" }}
          >
            <XCircle size={18} color="#ef4444" />
            <div>
              <p className="text-sm font-bold text-[#F1F5F9]">
                {isExpired ? "Suscripción expirada" : "Suscripción cancelada"}
              </p>
              <p className="text-xs text-[#94A3B8]">Elegí un plan para volver a tener acceso completo.</p>
            </div>
          </div>
        )}

        {/* Sin plan: opciones de pago */}
        {!hasAnyPlan && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* MercadoPago */}
              <div
                className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "rgba(0,158,227,0.06)", border: "1.5px solid rgba(0,158,227,0.25)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(0,158,227,0.15)" }}
                  >
                    <CreditCard size={17} color="#009EE3" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F1F5F9]">Pagar con MercadoPago</p>
                    <p className="text-xs text-[#64748B]">Tarjeta · Débito · Efectivo</p>
                  </div>
                </div>

                <div>
                  <p className="text-2xl font-black text-[#F1F5F9]">
                    ARS <span style={{ color: "#009EE3" }}>29.900</span>
                    <span className="text-sm font-medium text-[#64748B]">/mes</span>
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">Pago mensual · Cancela cuando quieras</p>
                </div>

                <ul className="space-y-1.5">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <Zap size={11} color="#009EE3" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                  className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #009EE3, #00b4d8)", color: "#ffffff" }}
                >
                  {loadingCheckout ? "Redirigiendo..." : "Suscribirse"}
                </button>
              </div>

              {/* Del exterior */}
              <div
                className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "rgba(249,115,22,0.06)", border: "1.5px solid rgba(249,115,22,0.22)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(249,115,22,0.15)" }}
                  >
                    <MessageCircle size={17} color="#F97316" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F1F5F9]">¿Sos del exterior?</p>
                    <p className="text-xs text-[#64748B]">Pagá en USD · Sin MercadoPago</p>
                  </div>
                </div>

                <div>
                  <p className="text-2xl font-black text-[#F1F5F9]">
                    USD <span style={{ color: "#F97316" }}>29</span>
                    <span className="text-sm font-medium text-[#64748B]">/mes</span>
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">Coordinamos el pago por WhatsApp</p>
                </div>

                <ul className="space-y-1.5">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <Zap size={11} color="#F97316" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#ffffff" }}
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </div>

            {/* Prueba gratuita */}
            <div
              className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{ background: "rgba(34,197,94,0.05)", border: "1.5px solid rgba(34,197,94,0.2)" }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.12)" }}
                >
                  <Gift size={20} color="#22c55e" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F1F5F9]">Probá gratis por 7 días</p>
                  <p className="text-xs text-[#64748B]">Acceso completo · Sin tarjeta · Sin compromiso</p>
                </div>
              </div>
              <button
                onClick={handleTrial}
                disabled={loadingTrial}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 hover:opacity-90 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#ffffff" }}
              >
                {loadingTrial ? "Activando..." : "Activar prueba gratuita"}
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#334155]">
          Pagos procesados por MercadoPago · Cancela en cualquier momento
        </p>
      </div>
    </div>
  );
}

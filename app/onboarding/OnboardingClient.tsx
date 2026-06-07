"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Store, Mail, Target, CheckCircle2, ArrowRight, ChevronRight, Zap, Clock } from "lucide-react";
import { completeOnboarding } from "@/app/app/actions";

interface Props {
  tiendanubeConnected: boolean;
  gmailConnected: boolean;
}

const STEPS = [
  {
    id: "tiendanube",
    icon: Store,
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.12)",
    borderColor: "rgba(59,130,246,0.25)",
    name: "TiendaNube",
    tagline: "Sincronizá tus órdenes, clientes y productos",
    description:
      "Una vez conectada, Nova importa todos tus datos en tiempo real. Vas a poder ver tus ventas, stock y clientes sin salir de acá.",
    connectedTitle: "¡Tu tienda ya está conectada!",
    connectedDesc: "Ya tenemos acceso a tus órdenes, clientes y productos. Todo listo.",
    connectHref: "/api/auth/tiendanube?from=onboarding",
    comingSoon: false,
  },
  {
    id: "gmail",
    icon: Mail,
    color: "#EA4335",
    bgColor: "rgba(234,67,53,0.12)",
    borderColor: "rgba(234,67,53,0.25)",
    name: "Gmail",
    tagline: "Respondé emails de clientes sin cambiar de app",
    description:
      "Con Gmail conectado podés leer y responder los correos de tus clientes directo desde el dashboard. Todo en un solo lugar.",
    connectedTitle: "¡Tu Gmail ya está conectado!",
    connectedDesc: "Ya podés leer y responder emails de clientes desde el dashboard.",
    connectHref: "/api/auth/gmail?from=onboarding",
    comingSoon: false,
  },
  {
    id: "meta",
    icon: Target,
    color: "#1877F2",
    bgColor: "rgba(24,119,242,0.12)",
    borderColor: "rgba(24,119,242,0.25)",
    name: "Meta Ads",
    tagline: "Visualizá ROAS, CPA y todas tus campañas",
    description:
      "La integración con Meta Business API está en desarrollo. Cuando esté lista, podrás conectarla desde Configuración → Integraciones.",
    connectedTitle: "",
    connectedDesc: "",
    connectHref: "",
    comingSoon: true,
  },
];

function StepContent({
  step,
  stepIndex,
  isConnected,
  onSkip,
  onFinish,
}: {
  step: typeof STEPS[0];
  stepIndex: number;
  isConnected: boolean;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const Icon = step.icon;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Icono + nombre */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: step.bgColor, border: `1px solid ${step.borderColor}` }}
        >
          <Icon size={30} color={step.color} strokeWidth={1.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              {step.name}
            </h2>
            {step.comingSoon && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(100,116,139,0.15)", color: "#64748B", border: "1px solid rgba(100,116,139,0.2)" }}
              >
                PRÓXIMAMENTE
              </span>
            )}
            {isConnected && !step.comingSoon && (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <CheckCircle2 size={10} strokeWidth={2.5} />
                YA CONECTADO
              </span>
            )}
          </div>
          <p className="text-sm text-[#64748B] mt-0.5">{step.tagline}</p>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-sm text-[#94A3B8] leading-relaxed">{step.description}</p>

      {/* Acciones */}
      <div className="flex flex-col gap-3">
        {step.comingSoon ? (
          <>
            <div
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm text-[#475569] font-semibold"
              style={{ background: "rgba(100,116,139,0.06)", border: "1px solid rgba(100,116,139,0.15)" }}
            >
              <Clock size={14} strokeWidth={2} />
              Disponible pronto
            </div>
            <button
              onClick={onFinish}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
            >
              Ir al dashboard
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </>
        ) : isConnected ? (
          <div className="flex flex-col gap-3">
            <div
              className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <CheckCircle2 size={20} color="#22c55e" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold" style={{ color: "#22c55e" }}>{step.connectedTitle}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{step.connectedDesc}</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
            >
              {isLast ? "Ir al dashboard" : "Continuar"}
              <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <>
            <a
              href={step.connectHref}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
            >
              <Zap size={14} strokeWidth={2.5} />
              Conectar {step.name}
            </a>
            <button
              onClick={onSkip}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-[#64748B] transition-all hover:text-[#94A3B8]"
              style={{ background: "rgba(100,116,139,0.06)", border: "1px solid rgba(100,116,139,0.12)" }}
            >
              {isLast ? "Terminar sin conectar" : "Omitir por ahora →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function OnboardingInner({ tiendanubeConnected, gmailConnected }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);

  const connected = [tiendanubeConnected, gmailConnected, false];

  // Si vuelve del OAuth con ?success=provider, avanzar automáticamente
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "tiendanube" && step === 0) setStep(1);
    if (success === "gmail" && step <= 1) setStep(2);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFinish() {
    setFinishing(true);
    setFinishError(false);
    try {
      await completeOnboarding();
      router.push("/app/dashboard");
    } catch {
      setFinishing(false);
      setFinishError(true);
    }
  }

  function handleSkip() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }

  const currentStep = STEPS[step];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0a0a0f" }}
    >
      {/* Halo de fondo */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-lg relative z-10 flex flex-col gap-8">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2.5">
            <img
              src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
              alt="Nova Analytics"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-lg tracking-tight text-[#F1F5F9]">Nova Analytics</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.03em" }}>
            Configurá tu dashboard
          </h1>
          <p className="text-sm text-[#64748B]">
            Conectá tus herramientas para ver todo en un solo lugar
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 justify-center">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: isCurrent
                      ? "rgba(124,58,237,0.15)"
                      : isDone
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(100,116,139,0.08)",
                    border: isCurrent
                      ? "1px solid rgba(124,58,237,0.3)"
                      : isDone
                      ? "1px solid rgba(34,197,94,0.2)"
                      : "1px solid rgba(100,116,139,0.15)",
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={12} color="#22c55e" strokeWidth={2.5} />
                  ) : (
                    <StepIcon
                      size={12}
                      color={isCurrent ? "#8B5CF6" : "#475569"}
                      strokeWidth={2}
                    />
                  )}
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isCurrent ? "#8B5CF6" : isDone ? "#22c55e" : "#475569" }}
                  >
                    {s.name}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="w-6 h-px"
                    style={{ background: i < step ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.2)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card del paso actual */}
        <div
          className="rounded-2xl p-7"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          {finishError ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <p className="text-sm font-bold text-red-400">Ocurrió un error. Intentá de nuevo.</p>
              <button
                onClick={handleFinish}
                className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
              >
                Reintentar
              </button>
            </div>
          ) : finishing ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.15)" }}
              >
                <Zap size={24} color="#8B5CF6" strokeWidth={1.5} />
              </div>
              <p className="text-base font-bold text-[#F1F5F9]">Preparando tu dashboard...</p>
              <p className="text-sm text-[#64748B]">Un momento.</p>
            </div>
          ) : (
            <StepContent
              step={currentStep}
              stepIndex={step}
              isConnected={connected[step]}
              onSkip={handleSkip}
              onFinish={handleFinish}
            />
          )}
        </div>

        {/* Nota de seguridad */}
        <p className="text-center text-xs text-[#334155]">
          Podés conectar o desconectar cualquier integración en cualquier momento desde Configuración.
        </p>
      </div>
    </div>
  );
}

export default function OnboardingClient(props: Props) {
  return (
    <Suspense>
      <OnboardingInner {...props} />
    </Suspense>
  );
}

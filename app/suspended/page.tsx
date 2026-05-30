import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Acceso bloqueado | Nova Analytics" };

export default function SuspendedPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "#050508",
        backgroundImage:
          "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(180,0,0,0.18) 0%, transparent 70%)",
      }}
    >
      <div className="w-full max-w-lg text-center space-y-8">

        {/* Icono */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(140,0,0,0.25)",
              border: "1px solid rgba(200,0,0,0.4)",
              boxShadow: "0 0 40px rgba(180,0,0,0.3), inset 0 0 20px rgba(180,0,0,0.1)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                stroke="#cc0000"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="#cc0000"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            className="text-xs font-mono tracking-[0.3em] uppercase"
            style={{ color: "#7a0000" }}
          >
            ACCESO DENEGADO
          </div>
        </div>

        {/* Título */}
        <div className="space-y-3">
          <h1
            className="text-4xl font-black tracking-tight"
            style={{
              color: "#fff",
              letterSpacing: "-0.03em",
              textShadow: "0 0 30px rgba(200,0,0,0.4)",
            }}
          >
            Tu cuenta fue<br />
            <span style={{ color: "#cc0000" }}>suspendida.</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#5a3a3a" }}>
            El acceso a Nova Analytics ha sido bloqueado.<br />
            No podés continuar hasta regularizar tu situación.
          </p>
        </div>

        {/* Separador */}
        <div
          className="w-full h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(150,0,0,0.4), transparent)" }}
        />

        {/* Bloque de info */}
        <div
          className="rounded-2xl p-5 text-left space-y-3"
          style={{
            background: "#0a0204",
            border: "1px solid rgba(120,0,0,0.4)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a2020" }}>
            Para recuperar el acceso
          </p>
          <ul className="space-y-2.5">
            {[
              "Contactá al equipo de Nova Analytics de inmediato",
              "Regularizá cualquier pago pendiente",
              "Si es un error, indicalo al comunicarte",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#6b3a3a" }}>
                <span className="mt-0.5 shrink-0" style={{ color: "#8b0000" }}>—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <a
          href="https://wa.me/5493424633285"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: "rgba(140,0,0,0.3)",
            border: "1px solid rgba(180,0,0,0.5)",
            color: "#ff4444",
            boxShadow: "0 0 20px rgba(140,0,0,0.2)",
          }}
        >
          Contactar soporte
        </a>

        <Link
          href="/login"
          className="block text-xs transition-colors"
          style={{ color: "#3a1a1a" }}
        >
          Usar otra cuenta
        </Link>
      </div>
    </div>
  );
}

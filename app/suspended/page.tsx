import Link from "next/link";
import { ShieldOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cuenta suspendida | Nova Analytics" };

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0a0f1e" }}>
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <ShieldOff size={28} color="#ef4444" strokeWidth={2} />
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Cuenta suspendida
          </h1>
          <p className="text-sm text-[#94A3B8] mt-2">
            Tu cuenta fue suspendida temporalmente. Contactá al equipo de Nova Analytics para resolverlo.
          </p>
        </div>

        <div className="rounded-2xl p-5 space-y-3 text-left"
          style={{ background: "#111118", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-xs font-semibold text-[#94A3B8]">¿Qué podés hacer?</p>
          <ul className="space-y-2">
            {[
              "Escribinos por WhatsApp para regularizar tu situación",
              "Verificá que tu pago esté al día",
              "Si creés que es un error, contactanos",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-[#64748B]">
                <span className="mt-0.5 text-[#ef4444]">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <a
          href="https://wa.me/5491100000000"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "#22c55e" }}
        >
          Contactar por WhatsApp
        </a>

        <Link href="/login" className="block text-xs text-[#475569] hover:text-[#64748B] transition-colors">
          Cerrar sesión e iniciar con otra cuenta
        </Link>
      </div>
    </div>
  );
}

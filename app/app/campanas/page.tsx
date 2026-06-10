import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Campañas" };

export default function CampanasPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Campañas</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Gestión y seguimiento de campañas</p>
      </div>
      <div
        className="rounded-2xl p-10 flex flex-col items-center gap-5 text-center"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.12)" }}
        >
          <Megaphone size={28} color="#8b5cf6" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9]">Campañas — Próximamente</h2>
          <p className="text-sm text-[#94A3B8] mt-2 max-w-md">
            Acá vas a poder crear y gestionar campañas de email marketing, descuentos y cupones
            directamente integrado con TiendaNube y tus clientes de Nova Analytics.
          </p>
        </div>
        <Link
          href="/app/mails"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-80"
          style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}
        >
          Ir a Mails →
        </Link>
      </div>
    </div>
  );
}

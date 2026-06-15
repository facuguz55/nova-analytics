import type { Metadata } from "next";
import { Megaphone, Target, Mail, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Campañas" };

export default function CampanasPage() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Campañas</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Gestión y seguimiento de campañas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Meta Ads */}
        <div className="rounded-2xl flex flex-col overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.25)" }}>
          <div className="p-6 flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(24,119,242,0.12)" }}>
                <Target size={26} color="#1877F2" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold text-[#F1F5F9] text-base">Meta Ads</p>
                <p className="text-sm text-[#64748B] mt-0.5">Facebook e Instagram</p>
              </div>
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Visualizá el rendimiento de tus campañas — spend, ROAS, CPA, impresiones y métricas de video en tiempo real.
            </p>
            <div className="mt-auto pt-2">
              <Link href="/app/meta-ads"
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(24,119,242,0.15)", color: "#1877F2", border: "1px solid rgba(24,119,242,0.3)" }}>
                Ver campañas <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>

        {/* Email Marketing */}
        <div className="rounded-2xl flex flex-col overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(234,67,53,0.25)" }}>
          <div className="p-6 flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(234,67,53,0.1)" }}>
                <Mail size={26} color="#EA4335" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#F1F5F9] text-base">Email Marketing</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                    Próximamente
                  </span>
                </div>
                <p className="text-sm text-[#64748B] mt-0.5">Powered by Nova Recover</p>
              </div>
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Recuperá carritos abandonados, enviá campañas segmentadas y automatizá emails con tus clientes de TiendaNube — integrado directamente con Nova Recover.
            </p>
            <div className="mt-auto pt-2">
              <a href="https://app.novaagency.info" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(234,67,53,0.08)", color: "#EA4335", border: "1px solid rgba(234,67,53,0.2)" }}>
                <ExternalLink size={14} strokeWidth={2.5} /> Conocer Nova Recover
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

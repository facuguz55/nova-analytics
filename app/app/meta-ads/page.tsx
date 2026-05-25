import type { Metadata } from "next";
import { Target, ExternalLink, BarChart2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Meta Ads" };

export default function MetaAdsPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Meta Ads</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Métricas de campañas Facebook e Instagram</p>
      </div>

      {/* Coming soon */}
      <div
        className="rounded-2xl p-10 flex flex-col items-center gap-5 text-center"
        style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.25)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(24,119,242,0.12)" }}
        >
          <Target size={28} color="#1877F2" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9]">Meta Ads — Próximamente</h2>
          <p className="text-sm text-[#94A3B8] mt-2 max-w-md">
            La integración con Meta Business API está en desarrollo. Podrás ver ROAS, CPA,
            inversión vs. ventas y el rendimiento de cada campaña directamente aquí.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/app/configuracion/integraciones"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(24,119,242,0.15)", color: "#1877F2", border: "1px solid rgba(24,119,242,0.3)" }}
          >
            <BarChart2 size={14} strokeWidth={2.5} />
            Ver integraciones
          </Link>
          <a
            href="https://business.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(100,116,139,0.1)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.2)" }}
          >
            <ExternalLink size={14} strokeWidth={2.5} />
            Abrir Meta Business
          </a>
        </div>
      </div>
    </div>
  );
}

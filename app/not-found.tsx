import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0a0a0f", fontFamily: "Inter, sans-serif" }}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative text-center space-y-6 max-w-sm">
        {/* Ícono */}
        <div
          className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}
        >
          <SearchX size={36} color="#8B5CF6" strokeWidth={1.5} />
        </div>

        {/* 404 */}
        <div>
          <p
            className="text-8xl font-black"
            style={{
              letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, #7C3AED, #2563EB)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </p>
          <p className="text-xl font-bold text-[#F1F5F9] mt-2">Página no encontrada</p>
          <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
            La ruta que buscás no existe o fue movida.
          </p>
        </div>

        {/* Botón */}
        <Link
          href="/app/dashboard"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-85"
          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          Ir al Dashboard
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

/**
 * Landing pública de Nova Analytics
 * analytics.novaagency.info/
 *
 * Por ahora es un placeholder. La UI completa de la landing
 * se construirá en una fase posterior.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      {/* Logo / título */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 mb-6">
          <div
            className="w-10 h-10 rounded-lg nova-gradient flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-syne)" }}>
              N
            </span>
          </div>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}
          >
            Nova Analytics
          </span>
        </div>

        <h1
          className="text-5xl font-extrabold mb-4 nova-gradient-text"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Tu negocio, un solo panel.
        </h1>

        <p
          className="text-lg max-w-md mx-auto"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-barlow)" }}
        >
          TiendaNube, Meta Ads y Gmail centralizados con IA integrada.
          <br />
          Para clientes de Nova Agency.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <Link
          href="/app/dashboard"
          className="px-6 py-3 rounded-lg text-white font-semibold transition-all nova-glow-orange"
          style={{
            background: "var(--nova-orange)",
            fontFamily: "var(--font-barlow)",
            fontSize: "15px",
            letterSpacing: "0.02em",
          }}
        >
          Ir al Dashboard →
        </Link>

        <Link
          href="/auth/login"
          className="px-6 py-3 rounded-lg font-semibold transition-all"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontFamily: "var(--font-barlow)",
            fontSize: "15px",
          }}
        >
          Iniciar sesión
        </Link>
      </div>

      {/* Status badge */}
      <div
        className="animate-fade-in"
        style={{ animationDelay: "0.2s", color: "var(--text-muted)", fontSize: "13px" }}
      >
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse-glow"
            style={{ background: "var(--success)" }}
          />
          v0.1.0 — Inicialización del proyecto
        </span>
      </div>
    </main>
  );
}

import Link from "next/link";
import {
  Zap, Store, Mail, BarChart2, Target,
  TrendingUp, Bot, Bell, ArrowRight,
  CheckCircle2, ShieldCheck,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   NOVA ANALYTICS — Landing pública
   Diseño: copia fiel de app.novaagency.info (Nova Recover)
   Fondo #0a0f1e · Naranja #e1691e · Violeta #a855f7
   Syne 800 (títulos) · Barlow Condensed (body)
═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  return (
    <div style={{ background: "#080c1a", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ─────────────────────────────────────────────
          NAVBAR
      ───────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 50,
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(8,12,26,0.9)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #e1691e 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={15} color="white" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "16px",
                fontWeight: 700,
                color: "#f1f5f9",
                letterSpacing: "-0.01em",
              }}
            >
              Nova Analytics
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/auth/login"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#94a3b8",
                textDecoration: "none",
              }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/app/dashboard"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "14px",
                fontWeight: 700,
                color: "#fff",
                textDecoration: "none",
                padding: "9px 20px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%)",
                letterSpacing: "0.01em",
              }}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          position: "relative",
        }}
      >
        {/* Glow fondo */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "600px",
            background: "radial-gradient(ellipse at center top, rgba(109,40,217,0.18) 0%, rgba(168,85,247,0.08) 40%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "500px",
            height: "200px",
            background: "radial-gradient(ellipse, rgba(225,105,30,0.07) 0%, transparent 70%)",
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", maxWidth: "860px", width: "100%" }}>

          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "999px",
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.25)",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#a855f7",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "13px",
                fontWeight: 600,
                color: "#a855f7",
                letterSpacing: "0.04em",
              }}
            >
              BETA · Para clientes Nova Agency
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 800,
              fontSize: "clamp(52px, 8vw, 88px)",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              color: "#f1f5f9",
              margin: "0 0 24px",
            }}
          >
            Tu negocio,
            <br />
            <span style={{ color: "#e1691e" }}>un solo panel.</span>
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "18px",
              fontWeight: 400,
              lineHeight: 1.65,
              color: "#64748b",
              maxWidth: "520px",
              margin: "0 auto 40px",
            }}
          >
            TiendaNube, Meta Ads y Gmail centralizados con IA
            integrada. Tomá decisiones con datos reales, no con
            suposiciones.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "56px",
            }}
          >
            <Link
              href="/app/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%)",
                fontFamily: "var(--font-barlow)",
                fontSize: "16px",
                fontWeight: 700,
                color: "#fff",
                textDecoration: "none",
                letterSpacing: "0.01em",
                boxShadow: "0 0 40px rgba(109,40,217,0.35), 0 0 80px rgba(109,40,217,0.15)",
              }}
            >
              Empezar ahora
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/auth/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "14px 28px",
                borderRadius: "10px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "var(--font-barlow)",
                fontSize: "15px",
                fontWeight: 500,
                color: "#94a3b8",
                textDecoration: "none",
              }}
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: "+23%", label: "más ventas recuperadas" },
              { value: "< 5 min", label: "para conectar la tienda" },
              { value: "24/7", label: "métricas en tiempo real" },
            ].map((s, i) => (
              <div
                key={s.value}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "0 32px",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "#e1691e",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "13px",
                    color: "#475569",
                    marginTop: "6px",
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          EN 3 PASOS
      ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1000px" }}>

          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Simple y rápido
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 800,
                fontSize: "clamp(32px, 5vw, 52px)",
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              En 3 pasos y listo
            </h2>
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "17px",
                color: "#64748b",
                maxWidth: "440px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              No necesitás saber de tecnología. Conectás y nosotros
              nos encargamos del resto.
            </p>
          </div>

          {/* Step cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                num: "01",
                icon: Store,
                title: "Conectá tu tienda",
                desc: "Ingresás tu Store ID y API Token de TiendaNube. Son dos campos, menos de un minuto.",
                iconColor: "#e1691e",
              },
              {
                num: "02",
                icon: Mail,
                title: "Conectá tu Gmail",
                desc: "Autorizás tu cuenta de Gmail con un clic. Los mails quedan desde tu propio dominio, con más confianza.",
                iconColor: "#a855f7",
              },
              {
                num: "03",
                icon: Zap,
                title: "Activá el servicio",
                desc: "Una vez el pago se procesa, el sistema arranca automáticamente. A partir de ahí, es tu trabajo.",
                iconColor: "#a855f7",
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  padding: "28px",
                  borderRadius: "14px",
                  background: "#0d1424",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* Icon + Step number */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      background: `${step.iconColor}1a`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: `1px solid ${step.iconColor}28`,
                    }}
                  >
                    <step.icon size={22} color={step.iconColor} strokeWidth={1.8} />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      color: step.iconColor,
                      textTransform: "uppercase",
                    }}
                  >
                    Paso {step.num}
                  </span>
                </div>

                {/* Text */}
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#f1f5f9",
                      margin: "0 0 10px",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-barlow)",
                      fontSize: "14px",
                      color: "#64748b",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FEATURES 2×3
      ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px",
          background: "rgba(13,20,36,0.6)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1000px" }}>

          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 800,
                fontSize: "clamp(30px, 5vw, 50px)",
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              Todo incluido en{" "}
              <span style={{ color: "#e1691e" }}>un solo sistema</span>
            </h2>
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "16px",
                color: "#64748b",
                maxWidth: "420px",
                margin: "0 auto",
              }}
            >
              Cada herramienta pensada para que vendas más con menos
              esfuerzo.
            </p>
          </div>

          {/* 2×3 grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                icon: BarChart2,
                title: "Detección automática",
                desc: "Identifica cada venta directamente en tu tienda en tiempo real, sin ninguna configuración.",
                iconColor: "#e1691e",
              },
              {
                icon: Mail,
                title: "Secuencia de mails",
                desc: "Enviá mails desde tu propia dirección. Más personal, más efectivo, en el momento justo para maximizar la recuperación.",
                iconColor: "#a855f7",
              },
              {
                icon: Target,
                title: "Seguimiento de clics",
                desc: "Sabés exactamente cuántos clientes abrieron el mail y volvieron a la tienda a comprar.",
                iconColor: "#a855f7",
              },
              {
                icon: TrendingUp,
                title: "Dashboard de métricas",
                desc: "Ves de forma clara cuánto se facturó, cómo va el crecimiento y qué palancas mover.",
                iconColor: "#e1691e",
              },
              {
                icon: Bot,
                title: "Mails desde tu Gmail",
                desc: "Usamos tu propia dirección. Más personal, más confianza, mejor apertura y conversión.",
                iconColor: "#a855f7",
              },
              {
                icon: Bell,
                title: "100% automático",
                desc: "Una vez activo no necesitás hacer nada. El sistema trabaja solo, 24hs al día, todo el año.",
                iconColor: "#22c55e",
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  padding: "24px",
                  borderRadius: "14px",
                  background: "rgba(17,24,39,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: `${f.iconColor}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${f.iconColor}25`,
                    flexShrink: 0,
                  }}
                >
                  <f.icon size={18} color={f.iconColor} strokeWidth={1.8} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#f1f5f9",
                      margin: "0 0 8px",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-barlow)",
                      fontSize: "14px",
                      color: "#64748b",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          INTEGRACIONES
      ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1000px" }}>

          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 800,
                fontSize: "clamp(30px, 5vw, 50px)",
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              Conectado con las herramientas
              <br />
              que ya usás
            </h2>
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "16px",
                color: "#64748b",
              }}
            >
              Integraciones nativas, sin configuraciones complicadas.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              maxWidth: "860px",
              margin: "0 auto",
            }}
          >
            {[
              {
                abbr: "TN",
                name: "TiendaNube",
                desc: "Sincronización automática de órdenes, productos y clientes en tiempo real.",
                accentColor: "#3b82f6",
              },
              {
                abbr: "M",
                name: "Meta Ads",
                desc: "Campañas, conjuntos y anuncios. Spend, ROAS, CPA y True ROAS cruzados con tus ventas.",
                accentColor: "#1877f2",
              },
              {
                abbr: "G",
                name: "Gmail",
                desc: "Bandeja integrada con hilos, respuestas y composición directamente desde el dashboard.",
                accentColor: "#ea4335",
              },
            ].map((item) => (
              <div
                key={item.name}
                style={{
                  padding: "28px",
                  borderRadius: "14px",
                  background: "#0d1424",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                {/* Logo + badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: `${item.accentColor}18`,
                      border: `1px solid ${item.accentColor}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-syne)",
                      fontSize: "14px",
                      fontWeight: 800,
                      color: item.accentColor,
                    }}
                  >
                    {item.abbr}
                  </div>
                  {/* Disponible badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-barlow)",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#22c55e",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Disponible
                    </span>
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#f1f5f9",
                      margin: "0 0 8px",
                    }}
                  >
                    {item.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-barlow)",
                      fontSize: "14px",
                      color: "#64748b",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          UN SOLO PLAN (pricing-style CTA)
          Replica exacta del pricing card de Nova Recover
      ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "rgba(13,20,36,0.4)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1000px" }}>

          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 800,
                fontSize: "clamp(32px, 5vw, 52px)",
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: "0 0 12px",
              }}
            >
              Un solo plan, todo incluido
            </h2>
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "16px",
                color: "#64748b",
              }}
            >
              Sin costos ocultos. Sin límites de envíos.
            </p>
          </div>

          {/* Pricing card */}
          <div
            style={{
              maxWidth: "520px",
              margin: "48px auto 0",
              borderRadius: "18px",
              background: "#0d1424",
              border: "1px solid rgba(109,40,217,0.3)",
              overflow: "hidden",
              boxShadow: "0 0 80px rgba(109,40,217,0.12), 0 0 160px rgba(109,40,217,0.06)",
              position: "relative",
            }}
          >
            {/* Top gradient border line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, transparent, #a855f7, #6d28d9, transparent)",
              }}
            />

            <div style={{ padding: "36px" }}>

              {/* MÁS POPULAR badge */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#a855f7",
                    textTransform: "uppercase",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    background: "rgba(168,85,247,0.12)",
                    border: "1px solid rgba(168,85,247,0.25)",
                  }}
                >
                  MÁS POPULAR
                </span>
              </div>

              {/* Price */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "18px",
                    fontWeight: 500,
                    color: "#94a3b8",
                  }}
                >
                  USD
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "80px",
                    fontWeight: 800,
                    color: "#f1f5f9",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  59
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "16px",
                    color: "#64748b",
                    alignSelf: "flex-end",
                    paddingBottom: "8px",
                  }}
                >
                  /mes
                </span>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "14px",
                  color: "#64748b",
                  textAlign: "center",
                  marginBottom: "28px",
                }}
              >
                Cancelás cuando querés. Sin permanencia.
              </p>

              {/* Feature list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "28px",
                }}
              >
                {[
                  "TiendaNube conectado ilimitado",
                  "Integración Meta Ads completa",
                  "Gmail integrado en el dashboard",
                  "IA con contexto de tu negocio",
                  "Dashboard de métricas en tiempo real",
                  "Soporte por WhatsApp",
                ].map((feat) => (
                  <div
                    key={feat}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <CheckCircle2
                      size={16}
                      color="#a855f7"
                      strokeWidth={2}
                      style={{ flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-barlow)",
                        fontSize: "15px",
                        color: "#cbd5e1",
                      }}
                    >
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <Link
                href="/app/dashboard"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%)",
                  fontFamily: "var(--font-barlow)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#fff",
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                  boxShadow: "0 0 40px rgba(109,40,217,0.4)",
                }}
              >
                Empezar ahora
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────── */}
      <footer
        style={{
          padding: "28px 24px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #e1691e, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={11} color="white" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#475569",
            }}
          >
            Nova Analytics — By Nova Agency
          </span>
        </div>

        {/* Link */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={12} color="#334155" strokeWidth={2} />
          <span
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "12px",
              color: "#334155",
            }}
          >
            analytics.novaagency.info
          </span>
        </div>
      </footer>

    </div>
  );
}

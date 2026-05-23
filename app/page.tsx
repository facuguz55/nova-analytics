import Link from "next/link";
import {
  BarChart2, Target, Mail, Zap, Bell, TrendingUp,
  ShieldCheck, ArrowRight, CheckCircle2, Store,
} from "lucide-react";

// ─────────────────────────────────────────────
// Sub-components inline (server, no estado)
// ─────────────────────────────────────────────

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
      style={{
        background: "rgba(168,85,247,0.08)",
        border: "1px solid rgba(168,85,247,0.25)",
        fontFamily: "var(--font-barlow)",
        fontSize: "13px",
        fontWeight: 600,
        color: "#a855f7",
        letterSpacing: "0.02em",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "#a855f7", display: "inline-block" }}
      />
      {children}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  iconColor = "#a855f7",
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  desc: string;
  iconColor?: string;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 group transition-all duration-200"
      style={{
        background: "rgba(17,24,39,0.8)",
        border: "1px solid #1e293b",
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0 w-10 h-10"
        style={{ background: `${iconColor}18` }}
      >
        <Icon size={18} color={iconColor} strokeWidth={2} />
      </div>
      <div>
        <h3
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "15px",
            fontWeight: 700,
            color: "#f1f5f9",
          }}
        >
          {title}
        </h3>
        <p
          className="mt-1"
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "14px",
            lineHeight: 1.55,
            color: "#64748b",
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  icon: Icon,
  title,
  desc,
  iconColor = "#a855f7",
}: {
  number: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  desc: string;
  iconColor?: string;
}) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-4"
      style={{
        background: "rgba(13,20,36,0.9)",
        border: "1px solid #1e293b",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: "48px", height: "48px", background: `${iconColor}18` }}
        >
          <Icon size={22} color={iconColor} strokeWidth={1.8} />
        </div>
        <span
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: iconColor,
            textTransform: "uppercase",
          }}
        >
          Paso {number}
        </span>
      </div>
      <div>
        <h3
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "17px",
            fontWeight: 700,
            color: "#f1f5f9",
          }}
        >
          {title}
        </h3>
        <p
          className="mt-2"
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#64748b",
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Landing page
// ─────────────────────────────────────────────
export default function HomePage() {
  return (
    <div
      style={{
        background: "#0a0f1e",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* ═══════════════════════════════════
          NAVBAR
      ═══════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
        style={{
          height: "60px",
          background: "rgba(10,15,30,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(30,41,59,0.8)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: "30px",
              height: "30px",
              background: "linear-gradient(135deg, #e1691e, #a855f7)",
            }}
          >
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "16px",
              fontWeight: 700,
              color: "#f1f5f9",
            }}
          >
            Nova Analytics
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-1.5 rounded-lg px-4 py-2"
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "14px",
              fontWeight: 700,
              color: "white",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════
          HERO
      ═══════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "80px" }}
      >
        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(30,60,105,0.35) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "10%",
            left: "50%",
            transform: "translate(-50%, 0)",
            width: "600px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(168,85,247,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
          <Badge>BETA · Para clientes Nova Agency</Badge>

          {/* Headline */}
          <h1
            className="mb-6"
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 800,
              fontSize: "clamp(44px, 7vw, 80px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#f1f5f9",
            }}
          >
            Tu e-commerce,{" "}
            <br />
            un solo{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #e1691e 30%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              panel.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mb-10 max-w-lg"
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "18px",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "#64748b",
            }}
          >
            TiendaNube, Meta Ads y Gmail centralizados con IA integrada. Tomá
            decisiones con datos reales, no con suposiciones.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
            <Link
              href="/app/dashboard"
              className="flex items-center gap-2 rounded-xl px-7 py-3.5 transition-all duration-200"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "16px",
                fontWeight: 700,
                color: "white",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                textDecoration: "none",
                letterSpacing: "0.01em",
                boxShadow: "0 0 40px rgba(168,85,247,0.3)",
              }}
            >
              Ver el dashboard
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-xl px-7 py-3.5 transition-all duration-200"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#94a3b8",
                background: "transparent",
                border: "1px solid #1e293b",
                textDecoration: "none",
              }}
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
            {[
              { value: "+23%", label: "más ventas recuperadas" },
              { value: "< 5 min", label: "para conectar la tienda" },
              { value: "24/7", label: "métricas en tiempo real" },
            ].map((stat) => (
              <div key={stat.value} className="flex flex-col items-center">
                <span
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#e1691e",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "13px",
                    color: "#64748b",
                    marginTop: "2px",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          EN 3 PASOS
      ═══════════════════════════════════ */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.15em",
                color: "#a855f7",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Simple y rápido
            </p>
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
              }}
            >
              En 3 pasos y listo
            </h2>
            <p
              className="mt-3 max-w-md mx-auto"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "16px",
                color: "#64748b",
              }}
            >
              No necesitás saber de tecnología. Conectás y nosotros nos encargamos del resto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StepCard
              number="01"
              icon={Store}
              title="Conectá tu tienda"
              desc="Ingresás tu Store ID y API Token de TiendaNube. Son dos campos, menos de un minuto."
              iconColor="#e1691e"
            />
            <StepCard
              number="02"
              icon={Mail}
              title="Conectá tu Gmail"
              desc="Autorizás tu cuenta de Gmail con un clic. Los mails quedan desde tu propio dominio."
              iconColor="#a855f7"
            />
            <StepCard
              number="03"
              icon={Zap}
              title="Activá el servicio"
              desc="Una vez el pago se procesa, el sistema arranca automáticamente. A partir de ahí, es tu trabajo."
              iconColor="#22c55e"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          TODO INCLUIDO
      ═══════════════════════════════════ */}
      <section
        className="px-6 md:px-12 py-24"
        style={{
          background: "rgba(13,20,36,0.5)",
          borderTop: "1px solid #1e293b",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#f1f5f9",
              }}
            >
              Todo incluido en{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #e1691e, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                un solo sistema
              </span>
            </h2>
            <p
              className="mt-3 max-w-md mx-auto"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "16px",
                color: "#64748b",
              }}
            >
              Cada herramienta pensada para que vendas más con menos trabajo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={BarChart2}
              title="Dashboard de métricas"
              desc="Ventas, órdenes, ticket promedio y tendencias en tiempo real desde TiendaNube."
              iconColor="#e1691e"
            />
            <FeatureCard
              icon={Target}
              title="Meta Ads integrado"
              desc="Spend, ROAS, CPA y True ROAS de tus campañas cruzados con tus ventas reales."
              iconColor="#a855f7"
            />
            <FeatureCard
              icon={Mail}
              title="Gmail conectado"
              desc="Leé y respondé emails de clientes directamente desde el dashboard. Sin cambiar de tab."
              iconColor="#22c55e"
            />
            <FeatureCard
              icon={Zap}
              title="IA con contexto"
              desc="Asistente con contexto completo de tu negocio: ventas, Meta y emails en un solo chat."
              iconColor="#a855f7"
            />
            <FeatureCard
              icon={Bell}
              title="Alertas inteligentes"
              desc="Notificaciones de venta nueva, carrito abandonado, stock bajo y anomalías en métricas."
              iconColor="#f59e0b"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Rentabilidad real"
              desc="Net Revenue, Profit y Profit Margin calculados con tus costos y comisiones reales."
              iconColor="#e1691e"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          INTEGRACIONES
      ═══════════════════════════════════ */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              color: "#64748b",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Integraciones nativas
          </p>
          <h2
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(24px, 3.5vw, 38px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#f1f5f9",
              marginBottom: "16px",
            }}
          >
            Conectado con las herramientas
            <br />
            que ya usás
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
            {[
              {
                name: "TiendaNube",
                desc: "Sincronización automática de órdenes, productos y clientes.",
                color: "#3b82f6",
                letter: "TN",
              },
              {
                name: "Meta Ads",
                desc: "Campañas, conjuntos, anuncios y métricas de conversión real.",
                color: "#1877f2",
                letter: "M",
              },
              {
                name: "Gmail",
                desc: "Bandeja integrada con hilos, respuestas y composición.",
                color: "#ea4335",
                letter: "G",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-xl p-6 flex flex-col gap-4 text-left"
                style={{
                  background: "rgba(13,20,36,0.9)",
                  border: "1px solid #1e293b",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl font-bold text-white"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: `${item.color}22`,
                    border: `1px solid ${item.color}44`,
                    fontFamily: "var(--font-syne)",
                    fontSize: "14px",
                    color: item.color,
                  }}
                >
                  {item.letter}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#f1f5f9",
                    }}
                  >
                    {item.name}
                  </h3>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "var(--font-barlow)",
                      fontSize: "13px",
                      lineHeight: 1.55,
                      color: "#64748b",
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 self-start"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    fontFamily: "var(--font-barlow)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#22c55e",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#22c55e", display: "inline-block" }}
                  />
                  Disponible
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════ */}
      <section
        className="px-6 md:px-12 py-24"
        style={{
          borderTop: "1px solid #1e293b",
        }}
      >
        <div
          className="max-w-2xl mx-auto text-center rounded-2xl p-12"
          style={{
            background: "rgba(13,20,36,0.9)",
            border: "1px solid rgba(168,85,247,0.2)",
            boxShadow: "0 0 80px rgba(168,85,247,0.08)",
          }}
        >
          {/* Top gradient line */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: "0",
              width: "160px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #a855f7, transparent)",
            }}
          />

          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#a855f7",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Listo para escalar
          </p>

          <h2
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(26px, 4vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#f1f5f9",
              marginBottom: "16px",
            }}
          >
            ¿Listo para potenciar
            <br />
            tu e-commerce?
          </h2>

          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "16px",
              color: "#64748b",
              marginBottom: "32px",
              lineHeight: 1.6,
            }}
          >
            Acceso exclusivo para clientes de Nova Agency.
            <br />
            Un solo plan. Sin costos ocultos.
          </p>

          {/* Checklist */}
          <div className="flex flex-col gap-2 text-left mb-8 max-w-xs mx-auto">
            {[
              "TiendaNube conectado",
              "Meta Ads integrado",
              "Gmail incluido",
              "IA con contexto de tu negocio",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 size={15} color="#a855f7" strokeWidth={2} />
                <span
                  style={{
                    fontFamily: "var(--font-barlow)",
                    fontSize: "14px",
                    color: "#94a3b8",
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 w-full justify-center"
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "16px",
              fontWeight: 700,
              color: "white",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              textDecoration: "none",
              letterSpacing: "0.01em",
              boxShadow: "0 0 40px rgba(168,85,247,0.35)",
            }}
          >
            Empezar ahora
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FOOTER
      ═══════════════════════════════════ */}
      <footer
        className="px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid #1e293b" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-md"
            style={{
              width: "22px",
              height: "22px",
              background: "linear-gradient(135deg, #e1691e, #a855f7)",
            }}
          >
            <Zap size={11} color="white" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Nova Analytics — By Nova Agency
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} color="#64748b" strokeWidth={2} />
          <span
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            analytics.novaagency.info
          </span>
        </div>
      </footer>
    </div>
  );
}

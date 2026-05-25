import Link from "next/link";
import {
  ArrowRight, BarChart3, Bell, Brain,
  Mail, Megaphone, ShoppingCart, TrendingUp, Zap,
  CheckCircle, Store,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#F1F5F9]">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(124,58,237,0.15)] bg-[rgba(10,10,15,0.85)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
              alt="Nova Analytics"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-lg tracking-tight">
              Nova Analytics
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[#94A3B8] hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.3)] rounded-full px-4 py-2 text-sm font-medium text-[#8B5CF6] mb-8">
            <Zap className="w-3.5 h-3.5" />
            Dashboard unificado para e-commerce
          </div>

          <h1
            className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6"
          >
            Tu negocio,{" "}
            <span className="gradient-text">un solo panel</span>
          </h1>

          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            TiendaNube, Meta Ads y Gmail centralizados con IA integrada.
            Tomá decisiones más rápido, sin saltar de plataforma en plataforma.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:opacity-90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-[rgba(124,58,237,0.3)]"
            >
              Empezar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <span className="text-[#94A3B8] text-sm">Sin tarjeta de crédito para probar</span>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "+23%", label: "más ventas rastreadas" },
              { value: "< 5 min", label: "para conectar" },
              { value: "24/7", label: "en piloto automático" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-black text-white"
                >
                  {stat.value}
                </div>
                <div className="text-xs text-[#94A3B8] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.3)] rounded-full px-4 py-2 text-sm font-medium text-[#8B5CF6] mb-6">
              Como funciona
            </div>
            <h2
              className="text-4xl md:text-5xl font-black mb-4"
            >
              En 3 pasos y listo
            </h2>
            <p className="text-[#94A3B8] text-lg">
              No necesitas saber de tecnología. Conectas y el sistema trabaja solo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <Store className="w-7 h-7" />,
                title: "Conectas tu TiendaNube",
                desc: "Autorizas la app desde tu panel de TiendaNube. OAuth oficial, menos de un minuto.",
              },
              {
                step: "02",
                icon: <Megaphone className="w-7 h-7" />,
                title: "Conectas Meta Ads y Gmail",
                desc: "Un clic para vincular tu cuenta publicitaria y tu Gmail. Los datos fluyen en tiempo real.",
              },
              {
                step: "03",
                icon: <Zap className="w-7 h-7" />,
                title: "El dashboard trabaja solo",
                desc: "Metricas, insights de IA y alertas inteligentes. Todo centralizado, actualizado en tiempo real.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-[#111118] border border-[rgba(124,58,237,0.2)] rounded-2xl p-7 hover:border-[rgba(124,58,237,0.4)] transition-all group"
              >
                <div className="absolute top-6 right-6 text-5xl font-black text-[rgba(124,58,237,0.08)] group-hover:text-[rgba(124,58,237,0.12)] transition-colors select-none"
                >
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-white mb-5">
                  {item.icon}
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                >
                  {item.title}
                </h3>
                <p className="text-[#94A3B8] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-black mb-4"
            >
              Todo incluido en{" "}
              <span className="gradient-text">un solo sistema</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: "Metricas de ventas en tiempo real",
                desc: "Ventas del dia, semana y mes. Productos mas vendidos, ticket promedio y conversion.",
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                title: "Analisis comparativo",
                desc: "Compara periodos, detecta tendencias y entende que dias y productos generan mas facturacion.",
              },
              {
                icon: <Megaphone className="w-5 h-5" />,
                title: "Meta Ads integrado",
                desc: "Gasto publicitario, ROAS, CPM y CPC de todas tus campanas en el mismo panel.",
              },
              {
                icon: <Brain className="w-5 h-5" />,
                title: "IA Assistant",
                desc: "Responde preguntas sobre tu negocio, detecta oportunidades y genera insights accionables.",
              },
              {
                icon: <Mail className="w-5 h-5" />,
                title: "Gmail integrado",
                desc: "Gestion de comunicacion con clientes desde el dashboard. Sin cambiar de app.",
              },
              {
                icon: <Bell className="w-5 h-5" />,
                title: "Alertas inteligentes",
                desc: "Notificaciones cuando una metrica sale del rango esperado. Siempre al tanto sin monitorear.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="flex gap-4 bg-[#111118] border border-[rgba(124,58,237,0.15)] rounded-xl p-5 hover:border-[rgba(124,58,237,0.35)] transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(124,58,237,0.15)] flex items-center justify-center text-[#8B5CF6] shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feat.title}</h4>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integraciones ── */}
      <section className="py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.3)] rounded-full px-4 py-2 text-sm font-medium text-[#8B5CF6] mb-6">
              Integraciones
            </div>
            <h2
              className="text-4xl font-black mb-4"
            >
              Conecta tus plataformas
            </h2>
            <p className="text-[#94A3B8]">Todas disponibles desde el primer dia.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <ShoppingCart className="w-6 h-6" />,
                name: "TiendaNube",
                desc: "Ventas, ordenes, productos, clientes y stock en tiempo real.",
              },
              {
                icon: <Megaphone className="w-6 h-6" />,
                name: "Meta Ads",
                desc: "Campanas, grupos de anuncios, ROAS, CPM y gasto publicitario.",
              },
              {
                icon: <Mail className="w-6 h-6" />,
                name: "Gmail",
                desc: "Comunicacion con clientes integrada directamente en el dashboard.",
              },
            ].map((integration) => (
              <div
                key={integration.name}
                className="bg-[#111118] border border-[rgba(124,58,237,0.2)] rounded-2xl p-6 hover:border-[rgba(124,58,237,0.4)] transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-white">
                    {integration.icon}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Disponible
                  </span>
                </div>
                <h3
                  className="font-bold text-lg mb-2"
                >
                  {integration.name}
                </h3>
                <p className="text-sm text-[#94A3B8]">{integration.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.3)] rounded-full px-4 py-2 text-sm font-medium text-[#8B5CF6] mb-8">
            Precio
          </div>
          <h2
            className="text-4xl font-black mb-4"
          >
            Un solo plan, todo incluido
          </h2>
          <p className="text-[#94A3B8] mb-12">Sin costos ocultos. Sin limites de datos.</p>

          <div className="bg-[#111118] border border-[rgba(124,58,237,0.4)] rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#06B6D4]" />

            <div className="inline-flex items-center gap-2 bg-[rgba(124,58,237,0.15)] text-[#8B5CF6] rounded-full px-3 py-1 text-xs font-semibold mb-6">
              MAS POPULAR
            </div>

            <div className="flex items-end justify-center gap-2 mb-2">
              <span className="text-2xl text-[#94A3B8] font-medium">$</span>
              <span
                className="text-7xl font-black"
              >
                77.000
              </span>
              <span className="text-[#94A3B8] mb-3">/mes</span>
            </div>
            <p className="text-[#94A3B8] text-sm mb-8">Cancelas cuando queres. Sin permanencia.</p>

            <ul className="space-y-3 mb-8 text-left">
              {[
                "Dashboard completo TiendaNube + Meta + Gmail",
                "Metricas en tiempo real",
                "IA Assistant integrado",
                "Alertas inteligentes",
                "Analisis comparativo de periodos",
                "Soporte por WhatsApp",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#7C3AED] shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:opacity-90 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-[rgba(124,58,237,0.3)]"
            >
              Empezar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-4xl md:text-5xl font-black mb-6"
          >
            Todo tu negocio,{" "}
            <span className="gradient-text">en un lugar</span>
          </h2>
          <p className="text-xl text-[#94A3B8] mb-10">
            Deja de perder tiempo saltando entre plataformas.
            Nova Analytics centraliza todo y deja que la IA trabaje por vos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:opacity-90 text-white px-10 py-5 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-[rgba(124,58,237,0.3)]"
          >
            Empezar ahora — $77.000/mes
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[rgba(124,58,237,0.15)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <img
              src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
              alt="Nova Analytics"
              className="w-6 h-6 object-contain"
            />
            <span className="font-semibold text-white">
              Nova Analytics
            </span>
            <span>— by Nova Agency</span>
          </div>
          <div>© 2025 Nova Agency. Todos los derechos reservados.</div>
        </div>
      </footer>

    </div>
  );
}



import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Nova Analytics",
  description: "Términos y condiciones de uso de Nova Analytics.",
};

const LAST_UPDATED = "30 de mayo de 2025";
const CONTACT_EMAIL = "novaagencytec@gmail.com";
const PRICE_ARS = "$77.000";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#F1F5F9]">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(124,58,237,0.15)] bg-[rgba(10,10,15,0.92)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
              alt="Nova Analytics"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-base tracking-tight">Nova Analytics</span>
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:opacity-90 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-3xl mx-auto px-5 sm:px-6 pt-28 pb-20">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.3)] rounded-full px-4 py-1.5 text-xs font-medium text-[#8B5CF6] mb-5">
            Legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Términos y Condiciones
          </h1>
          <p className="text-sm text-[#64748B]">Última actualización: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-[#CBD5E1] leading-relaxed text-sm">

          <div className="p-4 rounded-xl bg-[rgba(124,58,237,0.06)] border border-[rgba(124,58,237,0.2)]">
            <p>Al crear una cuenta o utilizar Nova Analytics aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no uses el servicio.</p>
          </div>

          <Section title="1. Descripción del servicio">
            <p>
              Nova Analytics es una plataforma SaaS (Software as a Service) operada por <strong className="text-white">Nova Agency</strong> que ofrece un dashboard unificado de analítica para comercios electrónicos, integrando TiendaNube, Meta Ads y Gmail con asistencia de inteligencia artificial.
            </p>
            <p className="mt-3">El servicio se provee &ldquo;tal como está&rdquo; (&ldquo;as is&rdquo;) y puede ser modificado, actualizado o discontinuado con previo aviso razonable a los usuarios.</p>
          </Section>

          <Section title="2. Elegibilidad">
            <p>Podés usar Nova Analytics si:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>Sos mayor de 18 años.</li>
              <li>Tenés capacidad legal para celebrar contratos según la ley argentina.</li>
              <li>Operás un comercio electrónico en Argentina o con clientes argentinos.</li>
              <li>Representás a una empresa, en cuyo caso garantizás tener autorización para aceptar estos términos en su nombre.</li>
            </ul>
          </Section>

          <Section title="3. Cuenta y seguridad">
            <p>
              Sos responsable de mantener la confidencialidad de tus credenciales de acceso. Debés notificarnos de inmediato ante cualquier uso no autorizado de tu cuenta a través de <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8B5CF6] hover:underline">{CONTACT_EMAIL}</a>.
            </p>
            <p className="mt-3">Cada workspace corresponde a un único comercio electrónico. No podés compartir tu cuenta ni reasignar credenciales a terceros sin autorización expresa de Nova Agency.</p>
          </Section>

          <Section title="4. Período de prueba gratuita (free trial)">
            <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] mb-4">
              <p className="font-semibold text-[#f59e0b]">Trial gratuito de 7 días</p>
              <p className="text-[#CBD5E1] mt-1">
                Al registrarte tenés acceso completo a todas las funcionalidades del plan Pro por un período de <strong className="text-white">7 días calendario</strong> desde la activación de tu cuenta.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1.5">
              <li>El trial comienza en el momento en que Nova Agency activa tu cuenta.</li>
              <li>Al vencer los 7 días, el acceso se bloquea automáticamente hasta que contratés un plan.</li>
              <li>No se requiere tarjeta de crédito para iniciar el trial.</li>
              <li>El trial no es extensible y no se otorga más de uno por empresa o persona.</li>
              <li>Los datos y configuraciones cargadas durante el trial se conservan al contratar el plan.</li>
            </ul>
          </Section>

          <Section title="5. Planes y facturación">
            <Subtitle>5.1 Precio del plan Pro</Subtitle>
            <p>El plan activo tiene un costo de <strong className="text-white">{PRICE_ARS} por mes (IVA no incluido)</strong>, pagadero mensualmente por adelantado. Los precios están expresados en pesos argentinos (ARS).</p>

            <Subtitle>5.2 Forma de pago</Subtitle>
            <p>Los pagos se coordinan directamente con Nova Agency. Aceptamos transferencia bancaria y otros medios que Nova Agency informe oportunamente.</p>

            <Subtitle>5.3 Vencimiento y acceso</Subtitle>
            <p>Si el pago no se acredita dentro de los 5 días posteriores al vencimiento del período, el acceso puede ser suspendido. Los datos se conservan durante 30 días adicionales antes de cualquier eliminación.</p>

            <Subtitle>5.4 Cambios de precio</Subtitle>
            <p>Nova Agency puede modificar el precio del servicio con un aviso mínimo de 30 días por correo electrónico. Podés cancelar sin costo adicional antes de que el nuevo precio entre en vigencia.</p>
          </Section>

          <Section title="6. Cancelación">
            <p>Podés cancelar tu suscripción en cualquier momento comunicándote con Nova Agency por email o WhatsApp. La cancelación toma efecto al final del período pagado en curso.</p>
            <p className="mt-3">No se otorgan reembolsos por períodos parciales, salvo en casos donde la plataforma haya tenido una interrupción superior a 72 horas consecutivas por causas imputables a Nova Agency.</p>
          </Section>

          <Section title="7. Uso aceptable">
            <p>Al usar Nova Analytics te comprometés a no:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>Usar el servicio para actividades ilegales o fraudulentas.</li>
              <li>Intentar acceder a cuentas, datos o sistemas de otros usuarios.</li>
              <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la plataforma.</li>
              <li>Usar la IA para generar contenido dañino, engañoso o que viole derechos de terceros.</li>
              <li>Sobrecargar intencionalmente la infraestructura del servicio (ataques de denegación de servicio).</li>
              <li>Revender o sublicenciar el acceso a la plataforma sin autorización escrita de Nova Agency.</li>
            </ul>
          </Section>

          <Section title="8. Integraciones de terceros">
            <p>Al conectar TiendaNube, Meta Ads o Gmail autorizás a Nova Analytics a acceder a los datos de esas plataformas en tu nombre. Al hacerlo también aceptás los términos y políticas de cada plataforma:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>TiendaNube: términos disponibles en tiendanube.com</li>
              <li>Meta (Facebook/Instagram): términos disponibles en facebook.com/terms</li>
              <li>Google (Gmail): términos disponibles en google.com/terms</li>
            </ul>
            <p className="mt-3">Nova Agency no se responsabiliza por cambios en las APIs o políticas de estas plataformas que afecten la funcionalidad del servicio.</p>
          </Section>

          <Section title="9. Propiedad intelectual">
            <p>Todo el código, diseño, marca, logotipos y materiales de Nova Analytics son propiedad exclusiva de Nova Agency y están protegidos por las leyes de propiedad intelectual de Argentina y tratados internacionales.</p>
            <p className="mt-3">Se te otorga una licencia limitada, no exclusiva, intransferible y revocable para usar el servicio únicamente con fines comerciales propios y durante la vigencia de tu suscripción activa.</p>
          </Section>

          <Section title="10. Disponibilidad del servicio">
            <p>Nova Agency se compromete a mantener una disponibilidad del servicio igual o superior al <strong className="text-white">99% mensual</strong>, excluyendo mantenimientos programados (que se anunciarán con al menos 24 horas de anticipación).</p>
            <p className="mt-3">En caso de interrupciones no programadas que superen las 72 horas consecutivas, se otorgará un crédito proporcional al período afectado en la facturación del mes siguiente.</p>
          </Section>

          <Section title="11. Limitación de responsabilidad">
            <p>En la máxima medida permitida por la ley, Nova Agency no será responsable por:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>Pérdidas de ganancias, ingresos o datos resultantes del uso o la imposibilidad de uso del servicio.</li>
              <li>Decisiones comerciales tomadas con base en los datos o análisis de la plataforma.</li>
              <li>Inexactitudes en los datos provenientes de APIs de terceros (TiendaNube, Meta, Gmail).</li>
              <li>Interrupciones del servicio causadas por fuerza mayor, fallas de infraestructura de terceros o eventos fuera del control de Nova Agency.</li>
            </ul>
            <p className="mt-3">La responsabilidad total de Nova Agency por cualquier reclamo relacionado con el servicio no superará el importe total pagado por el usuario en los 3 meses previos al reclamo.</p>
          </Section>

          <Section title="12. Privacidad">
            <p>
              El tratamiento de tus datos personales está regido por nuestra{" "}
              <Link href="/privacidad" className="text-[#8B5CF6] hover:underline">Política de Privacidad</Link>,
              que forma parte integrante de estos Términos y Condiciones.
            </p>
          </Section>

          <Section title="13. Modificaciones a los términos">
            <p>
              Nova Agency se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios materiales serán comunicados por correo electrónico con al menos <strong className="text-white">15 días de anticipación</strong>. El uso continuado del servicio tras ese plazo implica la aceptación de los nuevos términos.
            </p>
          </Section>

          <Section title="14. Terminación">
            <p>Nova Agency puede suspender o cancelar tu acceso sin previo aviso si:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>Incumplís estos Términos y Condiciones.</li>
              <li>Usás el servicio de forma que cause daño a Nova Agency, otros usuarios o terceros.</li>
              <li>No abonás el servicio dentro del período de gracia establecido.</li>
            </ul>
            <p className="mt-3">Ante una cancelación por incumplimiento no hay derecho a reembolso.</p>
          </Section>

          <Section title="15. Ley aplicable y jurisdicción">
            <p>
              Estos Términos se rigen por las leyes de la <strong className="text-white">República Argentina</strong>.
              Cualquier controversia que no pueda resolverse amigablemente será sometida a la jurisdicción de los
              Tribunales Ordinarios de la <strong className="text-white">ciudad de Santa Fe, Provincia de Santa Fe</strong>,
              renunciando ambas partes a cualquier otro fuero que pudiera corresponderles.
            </p>
          </Section>

          <Section title="16. Contacto">
            <p>Para consultas, reclamos o ejercicio de derechos:</p>
            <div className="mt-4 p-4 rounded-xl bg-[#111118] border border-[rgba(124,58,237,0.2)]">
              <p className="font-semibold text-white">Nova Agency</p>
              <p className="text-sm text-[#94A3B8] mt-1">
                Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8B5CF6] hover:underline">{CONTACT_EMAIL}</a>
              </p>
              <p className="text-sm text-[#94A3B8]">Santa Fe, Argentina</p>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(124,58,237,0.15)] py-6 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <Link href="/" className="flex items-center gap-2 hover:text-[#94A3B8] transition-colors">
            <img
              src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
              alt="Nova Analytics"
              className="w-5 h-5 object-contain"
            />
            <span className="font-semibold text-white">Nova Analytics</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="hover:text-[#94A3B8] transition-colors">Privacidad</Link>
            <Link href="/terminos" className="text-[#8B5CF6]">Términos</Link>
            <span>© 2025 Nova Agency</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-3 pb-2 border-b border-[rgba(124,58,237,0.15)]">
        {title}
      </h2>
      <div className="text-[#CBD5E1] text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-white mt-4 mb-1.5 text-sm">{children}</h3>;
}

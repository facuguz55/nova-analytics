import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — Nova Analytics",
  description: "Política de privacidad de Nova Analytics. Cómo recopilamos, usamos y protegemos tu información.",
};

const LAST_UPDATED = "30 de mayo de 2025";
const CONTACT_EMAIL = "novaagencytec@gmail.com";

export default function PrivacidadPage() {
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
            Política de Privacidad
          </h1>
          <p className="text-sm text-[#64748B]">Última actualización: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-[#CBD5E1] leading-relaxed">

          <Section title="1. Quiénes somos">
            <p>
              Nova Analytics es un servicio operado por <strong className="text-white">Nova Agency</strong> (en adelante, &ldquo;Nova&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;la plataforma&rdquo;), con sede en Argentina. Proveemos un dashboard de analítica unificada para comercios electrónicos que integra TiendaNube, Meta Ads y Gmail.
            </p>
            <p className="mt-3">
              Al utilizar Nova Analytics aceptás esta Política de Privacidad. Si tenés dudas podés contactarnos en <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8B5CF6] hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <Subtitle>2.1 Datos de cuenta</Subtitle>
            <p>Al registrarte recopilamos tu nombre, dirección de correo electrónico y contraseña (almacenada en forma hasheada mediante Supabase Auth).</p>

            <Subtitle>2.2 Tokens de integración OAuth</Subtitle>
            <p>Cuando conectás TiendaNube, Meta Ads o Gmail, almacenamos los tokens OAuth necesarios para consultar esas plataformas en tu nombre. Estos tokens están cifrados en reposo con <strong className="text-white">AES-256-GCM</strong> y nunca se almacenan en texto plano ni en el navegador.</p>

            <Subtitle>2.3 Datos de uso de la IA</Subtitle>
            <p>Los mensajes que enviás al Asistente IA se procesan por Anthropic (Claude) y se registra la cantidad de tokens utilizados por workspace con fines de billing interno. No almacenamos el contenido de los chats en nuestra base de datos.</p>

            <Subtitle>2.4 Datos de terceros (sin almacenamiento propio)</Subtitle>
            <p>Los datos de órdenes, productos, clientes (TiendaNube) y correos (Gmail) se consultan directamente desde las APIs de cada plataforma y se muestran en tiempo real. <strong className="text-white">Nova Analytics no guarda copias de estos datos en sus propias bases de datos.</strong></p>

            <Subtitle>2.5 Datos técnicos y de auditoría</Subtitle>
            <p>Registramos acciones sensibles (cambio de contraseña, eliminación de cuenta, desconexión de integraciones) en un log de auditoría a los efectos de seguridad y trazabilidad.</p>
          </Section>

          <Section title="3. Cómo usamos tus datos">
            <ul className="list-disc list-inside space-y-2 text-[#CBD5E1]">
              <li>Proveerte el servicio de analítica y las integraciones que activaste.</li>
              <li>Verificar tu identidad y mantener la sesión activa.</li>
              <li>Enviarte comunicaciones relacionadas con el servicio (alertas, cambios en los términos, soporte).</li>
              <li>Detectar y prevenir fraude, abusos y accesos no autorizados.</li>
              <li>Calcular el uso de la IA a los efectos de facturación interna.</li>
            </ul>
            <p className="mt-3">No vendemos, cedemos ni compartimos tu información personal con terceros con fines publicitarios o comerciales.</p>
          </Section>

          <Section title="4. Servicios de terceros">
            <p>Nova Analytics utiliza los siguientes proveedores para operar:</p>
            <div className="mt-4 space-y-3">
              {[
                { name: "Supabase", desc: "Base de datos PostgreSQL, autenticación y almacenamiento. Datos alojados en la región us-east-1." },
                { name: "Vercel", desc: "Infraestructura de hosting y edge functions. Procesamiento en servidores de EE.UU. y Europa." },
                { name: "Anthropic (Claude)", desc: "Procesamiento del Asistente IA. Los mensajes se envían a Anthropic para su procesamiento y no se almacenan en nuestros servidores." },
                { name: "TiendaNube, Meta, Google", desc: "Plataformas de terceros que autorizás voluntariamente al conectar tus integraciones." },
              ].map((s) => (
                <div key={s.name} className="flex gap-3 p-3 rounded-xl bg-[#111118] border border-[rgba(124,58,237,0.1)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2 flex-shrink-0" />
                  <div>
                    <span className="text-white font-semibold text-sm">{s.name}: </span>
                    <span className="text-sm text-[#94A3B8]">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="5. Seguridad de los datos">
            <p>Implementamos las siguientes medidas de seguridad:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Cifrado AES-256-GCM de todos los tokens OAuth.</li>
              <li>Row Level Security (RLS) en 100% de las tablas de la base de datos.</li>
              <li>HTTPS obligatorio en todas las comunicaciones.</li>
              <li>Acceso por workspace_id explícito en todas las consultas a la base de datos.</li>
              <li>Log de auditoría para acciones sensibles.</li>
            </ul>
            <p className="mt-3">Ningún sistema es 100% seguro. En caso de una brecha de seguridad que afecte tus datos te notificaremos dentro de las 72 horas de tomarla conocimiento.</p>
          </Section>

          <Section title="6. Retención de datos">
            <p>Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta borramos permanentemente:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Tu perfil de usuario y credenciales de acceso.</li>
              <li>Los tokens OAuth de todas tus integraciones.</li>
              <li>La configuración financiera y alertas de tu workspace.</li>
            </ul>
            <p className="mt-3">Los registros de auditoría pueden conservarse por hasta 90 días adicionales por razones de seguridad.</p>
          </Section>

          <Section title="7. Tus derechos">
            <p>De acuerdo con la <strong className="text-white">Ley 25.326 de Protección de Datos Personales</strong> (Argentina) tenés derecho a:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong className="text-white">Acceso:</strong> solicitar una copia de los datos que almacenamos sobre vos.</li>
              <li><strong className="text-white">Rectificación:</strong> corregir datos inexactos desde la sección Mi Cuenta.</li>
              <li><strong className="text-white">Supresión:</strong> eliminar tu cuenta y todos los datos asociados desde la sección Mi Cuenta o enviándonos un correo.</li>
              <li><strong className="text-white">Portabilidad:</strong> solicitar la exportación de tus datos en formato legible.</li>
              <li><strong className="text-white">Oposición:</strong> oponerte al procesamiento de tus datos con fines distintos a los declarados.</li>
            </ul>
            <p className="mt-3">Para ejercer cualquiera de estos derechos escribinos a <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8B5CF6] hover:underline">{CONTACT_EMAIL}</a>.</p>
          </Section>

          <Section title="8. Cookies">
            <p>Nova Analytics utiliza únicamente las cookies estrictamente necesarias para mantener la sesión autenticada (gestionadas por Supabase Auth). No utilizamos cookies de rastreo publicitario ni analítica de terceros.</p>
          </Section>

          <Section title="9. Cambios a esta política">
            <p>Podemos actualizar esta política periódicamente. Te notificaremos por correo electrónico ante cambios materiales. El uso continuado del servicio luego de la notificación implica tu aceptación de la versión actualizada.</p>
          </Section>

          <Section title="10. Contacto">
            <p>
              Si tenés preguntas sobre esta Política de Privacidad o el tratamiento de tus datos personales podés contactarnos en:
            </p>
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
            <Link href="/privacidad" className="text-[#8B5CF6]">Privacidad</Link>
            <Link href="/terminos" className="hover:text-[#94A3B8] transition-colors">Términos</Link>
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

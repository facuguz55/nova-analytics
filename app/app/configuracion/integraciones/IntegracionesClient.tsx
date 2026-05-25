"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Store, Mail, Target, CheckCircle2, AlertCircle,
  Link2Off, RefreshCw, ExternalLink, Shield, Lock, Eye, Server, Zap,
} from "lucide-react";
import { disconnectIntegration } from "@/app/app/actions";
import { toast } from "sonner";

interface IntegrationRow {
  provider: string;
  status: string;
  metadata: Record<string, string> | null;
  updated_at: string;
  store_id: string | null;
}

interface Props {
  tiendanube: IntegrationRow | null;
  gmail: IntegrationRow | null;
  meta: IntegrationRow | null;
}

function IntegrationCard({
  icon: Icon,
  name,
  description,
  color,
  bgColor,
  integration,
  connectHref,
  onDisconnect,
  comingSoon,
}: {
  icon: React.ElementType;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  integration: IntegrationRow | null;
  connectHref: string;
  onDisconnect: () => Promise<void>;
  comingSoon?: boolean;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = integration?.status === "active";

  async function handleDisconnect() {
    if (!confirm(`¿Desconectar ${name}? Se revocarán los tokens de acceso.`)) return;
    setDisconnecting(true);
    try {
      await onDisconnect();
      toast.success(`${name} desconectado correctamente`);
    } catch {
      toast.error("Error al desconectar. Intentá de nuevo.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{ background: "#111118", border: `1px solid ${isConnected ? "rgba(34,197,94,0.2)" : "rgba(124,58,237,0.2)"}` }}
    >
      {/* Barra superior de estado */}
      <div
        className="h-1 rounded-t-2xl"
        style={{
          background: comingSoon
            ? "rgba(100,116,139,0.3)"
            : isConnected
            ? "linear-gradient(90deg, #22c55e, #16a34a)"
            : "linear-gradient(90deg, #7C3AED, #2563EB)",
        }}
      />

      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* Header: icono + nombre + badge */}
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: bgColor, border: `1px solid ${color}30` }}
          >
            <Icon size={26} color={color} strokeWidth={1.5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-[#F1F5F9] text-base leading-tight">{name}</p>
              {comingSoon ? (
                <span
                  className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ background: "rgba(100,116,139,0.12)", color: "#64748B", border: "1px solid rgba(100,116,139,0.2)" }}
                >
                  Próximamente
                </span>
              ) : isConnected ? (
                <span
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  <CheckCircle2 size={11} strokeWidth={2.5} />
                  Conectado
                </span>
              ) : (
                <span
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  <AlertCircle size={11} strokeWidth={2.5} />
                  Sin conectar
                </span>
              )}
            </div>
            <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Metadata si está conectado */}
        {isConnected && integration && (
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            {integration.store_id && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">ID de tienda</span>
                <span className="text-[#F1F5F9] font-mono bg-[rgba(124,58,237,0.1)] px-2 py-0.5 rounded">{integration.store_id}</span>
              </div>
            )}
            {integration.metadata?.store_name && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Tienda</span>
                <span className="text-[#F1F5F9] font-semibold">{integration.metadata.store_name}</span>
              </div>
            )}
            {integration.metadata?.email && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Email</span>
                <span className="text-[#F1F5F9]">{integration.metadata.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8]">Última sync</span>
              <span className="text-[#22c55e]">
                {new Date(integration.updated_at).toLocaleDateString("es-AR", {
                  day: "2-digit", month: "2-digit", year: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!comingSoon && (
          <div className="flex gap-2 mt-auto pt-1">
            {isConnected ? (
              <>
                <a
                  href={connectHref}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(124,58,237,0.1)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.25)" }}
                >
                  <RefreshCw size={13} strokeWidth={2.5} />
                  Reconectar
                </a>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <Link2Off size={13} strokeWidth={2.5} />
                  {disconnecting ? "..." : "Desconectar"}
                </button>
              </>
            ) : (
              <a
                href={connectHref}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", color: "white" }}
              >
                <ExternalLink size={14} strokeWidth={2.5} />
                Conectar {name}
              </a>
            )}
          </div>
        )}

        {comingSoon && (
          <div className="mt-auto pt-1">
            <div
              className="w-full text-center rounded-xl py-3 text-sm text-[#475569] font-semibold"
              style={{ background: "rgba(100,116,139,0.06)", border: "1px solid rgba(100,116,139,0.15)" }}
            >
              Disponible pronto
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SECURITY_ITEMS = [
  {
    icon: Lock,
    color: "#7C3AED",
    title: "AES-256-GCM",
    desc: "Todos los tokens OAuth se encriptan con AES-256-GCM antes de persistirse en la base de datos.",
  },
  {
    icon: Eye,
    color: "#2563EB",
    title: "Nunca expuestos al cliente",
    desc: "Los tokens viven solo en el servidor. Ningún token toca el navegador ni aparece en logs.",
  },
  {
    icon: Server,
    color: "#22c55e",
    title: "Aislamiento por workspace",
    desc: "Row Level Security (RLS) garantiza que cada cliente solo accede a sus propios tokens.",
  },
  {
    icon: Shield,
    color: "#e1691e",
    title: "Revocación inmediata",
    desc: "Desconectar una integración elimina los tokens de forma permanente e irreversible.",
  },
];

function URLParamHandler() {
  const params = useSearchParams();

  useEffect(() => {
    const error = params.get("error");
    const success = params.get("success");

    if (success === "tiendanube") toast.success("TiendaNube conectado correctamente");
    else if (success === "gmail") toast.success("Gmail conectado correctamente");
    else if (error === "token_failed") toast.error("Error al obtener el token. Intentá conectar de nuevo.");
    else if (error === "no_code") toast.error("No se recibió el código de autorización. Intentá de nuevo.");
    else if (error === "no_workspace") toast.error("No se encontró tu workspace. Contactá soporte.");
  }, [params]);

  return null;
}

export default function IntegracionesClient({ tiendanube, gmail, meta }: Props) {
  const cards = [
    {
      icon: Store,
      name: "TiendaNube",
      description: "Sincronizá órdenes, productos, clientes y stock en tiempo real desde tu tienda.",
      color: "#3B82F6",
      bgColor: "rgba(59,130,246,0.12)",
      integration: tiendanube,
      connectHref: "/api/auth/tiendanube",
      onDisconnect: () => disconnectIntegration("tiendanube"),
      comingSoon: false,
    },
    {
      icon: Mail,
      name: "Gmail",
      description: "Gestioná emails de clientes directamente desde el dashboard sin cambiar de app.",
      color: "#EA4335",
      bgColor: "rgba(234,67,53,0.12)",
      integration: gmail,
      connectHref: "/api/auth/gmail",
      onDisconnect: () => disconnectIntegration("gmail"),
      comingSoon: false,
    },
    {
      icon: Target,
      name: "Meta Ads",
      description: "Visualizá spend, ROAS, CPA y resultados de todas tus campañas en Facebook e Instagram.",
      color: "#1877F2",
      bgColor: "rgba(24,119,242,0.12)",
      integration: meta,
      connectHref: "/api/auth/meta",
      onDisconnect: () => disconnectIntegration("meta"),
      comingSoon: true,
    },
  ];

  const connectedCount = [tiendanube, gmail, meta].filter((i) => i?.status === "active").length;

  return (
    <Suspense>
      <URLParamHandler />
      <div className="p-6 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              Integraciones
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              Conectá tus herramientas para centralizar todos tus datos en Nova Analytics.
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: connectedCount > 0 ? "rgba(34,197,94,0.1)" : "rgba(124,58,237,0.1)",
              border: connectedCount > 0 ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(124,58,237,0.25)",
              color: connectedCount > 0 ? "#22c55e" : "#8B5CF6",
            }}
          >
            <Zap size={14} strokeWidth={2.5} />
            {connectedCount} de {cards.filter(c => !c.comingSoon).length} conectadas
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cards.map((card) => (
            <IntegrationCard key={card.name} {...card} />
          ))}
        </div>

        {/* Seguridad de tokens */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.04)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)" }}
            >
              <Shield size={16} color="#7C3AED" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-[#F1F5F9] text-sm">Seguridad de tokens — cifrado de extremo a extremo</p>
              <p className="text-xs text-[#64748B]">Tus credenciales nunca viajan ni se almacenan en texto plano</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(124,58,237,0.1)]">
            {SECURITY_ITEMS.map((item) => (
              <div key={item.title} className="p-5 flex flex-col gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}15` }}
                >
                  <item.icon size={17} color={item.color} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F1F5F9] mb-1">{item.title}</p>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Suspense>
  );
}

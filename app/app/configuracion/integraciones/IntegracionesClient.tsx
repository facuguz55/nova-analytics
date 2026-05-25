"use client";

import { useState } from "react";
import { Store, Mail, Target, CheckCircle2, AlertCircle, Link2Off, RefreshCw, ExternalLink } from "lucide-react";
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
    if (!confirm(`¿Desconectar ${name}? Se perderán los tokens de acceso.`)) return;
    setDisconnecting(true);
    try {
      await onDisconnect();
      toast.success(`${name} desconectado`);
    } catch {
      toast.error("Error al desconectar");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: bgColor, border: `1px solid ${color}25` }}
          >
            <Icon size={22} color={color} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-bold text-[#F1F5F9]" style={{ fontSize: "15px" }}>{name}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{description}</p>
          </div>
        </div>

        {/* Status badge */}
        {comingSoon ? (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(100,116,139,0.12)", color: "#64748B", border: "1px solid rgba(100,116,139,0.2)" }}
          >
            Próximamente
          </span>
        ) : isConnected ? (
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <CheckCircle2 size={11} strokeWidth={2.5} />
            Conectado
          </span>
        ) : (
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <AlertCircle size={11} strokeWidth={2.5} />
            No conectado
          </span>
        )}
      </div>

      {/* Metadata */}
      {isConnected && integration && (
        <div
          className="rounded-xl p-3 text-xs space-y-1"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          {integration.store_id && (
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Store ID:</span>
              <span className="text-[#F1F5F9] font-mono">{integration.store_id}</span>
            </div>
          )}
          {integration.metadata && typeof integration.metadata === "object" && (integration.metadata as Record<string, string>).store_name && (
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Tienda:</span>
              <span className="text-[#F1F5F9]">{(integration.metadata as Record<string, string>).store_name}</span>
            </div>
          )}
          {integration.metadata && typeof integration.metadata === "object" && (integration.metadata as Record<string, string>).email && (
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Email:</span>
              <span className="text-[#F1F5F9]">{(integration.metadata as Record<string, string>).email}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Última sync:</span>
            <span className="text-[#F1F5F9]">
              {new Date(integration.updated_at).toLocaleDateString("es-AR", {
                day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Acciones */}
      {!comingSoon && (
        <div className="flex gap-2 mt-auto">
          {isConnected ? (
            <>
              <a
                href={connectHref}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: "rgba(124,58,237,0.1)",
                  color: "#8B5CF6",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              >
                <RefreshCw size={13} strokeWidth={2.5} />
                Reconectar
              </a>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <Link2Off size={13} strokeWidth={2.5} />
                {disconnecting ? "..." : "Desconectar"}
              </button>
            </>
          ) : (
            <a
              href={connectHref}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                color: "white",
              }}
            >
              <ExternalLink size={13} strokeWidth={2.5} />
              Conectar {name}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function IntegracionesClient({ tiendanube, gmail, meta }: Props) {
  const cards = [
    {
      icon: Store,
      name: "TiendaNube",
      description: "Sincronizá órdenes, productos y clientes",
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
      description: "Accedé a tu bandeja y enviá emails a clientes",
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
      description: "Métricas de campañas Facebook e Instagram",
      color: "#1877F2",
      bgColor: "rgba(24,119,242,0.12)",
      integration: meta,
      connectHref: "/api/auth/meta",
      onDisconnect: () => disconnectIntegration("meta"),
      comingSoon: true,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Integraciones
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Conectá tus herramientas para centralizar todos tus datos en Nova Analytics.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <IntegrationCard key={card.name} {...card} />
        ))}
      </div>

      {/* Info */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
      >
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
          Seguridad de tokens
        </p>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Todos los tokens OAuth se encriptan con AES-256-GCM antes de almacenarse en la base de datos.
          Nunca se exponen al cliente ni aparecen en logs. Podés desconectar una integración en cualquier momento
          para revocar el acceso.
        </p>
      </div>
    </div>
  );
}

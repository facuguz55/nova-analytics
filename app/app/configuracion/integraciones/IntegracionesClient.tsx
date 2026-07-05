"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Store, ShoppingBag, Mail, Target, CheckCircle2, AlertCircle,
  Link2Off, RefreshCw, ExternalLink, Shield, Lock, Eye, Server, Zap,
  X, Loader2, Key,
} from "lucide-react";
import { disconnectIntegration, saveMetaToken } from "@/app/app/actions";
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
  shopify: IntegrationRow | null;
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
  onManualConnect,
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
  onManualConnect?: () => void;
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
      style={{ background: "#111118", border: `1px solid ${isConnected ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.2)"}` }}
    >
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
                <span className="text-[#F1F5F9] font-mono bg-[rgba(139,92,246,0.1)] px-2 py-0.5 rounded">{integration.store_id}</span>
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
            {integration.metadata?.account_name && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Cuenta</span>
                <span className="text-[#F1F5F9] font-semibold">{integration.metadata.account_name}</span>
              </div>
            )}
            {integration.metadata?.currency && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Moneda</span>
                <span className="text-[#F1F5F9]">{integration.metadata.currency}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8]">Conectado desde</span>
              <span className="text-[#22c55e]">
                {new Date(integration.updated_at).toLocaleDateString("es-AR", {
                  day: "2-digit", month: "2-digit", year: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8]">Modo</span>
              <span className="text-[#22c55e] font-semibold">⚡ Tiempo real</span>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!comingSoon && (
          <div className="flex gap-2 mt-auto pt-1">
            {isConnected ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2">
                  {onManualConnect ? (
                    <button
                      onClick={onManualConnect}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: "rgba(24,119,242,0.1)", color: "#1877F2", border: "1px solid rgba(24,119,242,0.25)" }}
                    >
                      <RefreshCw size={13} strokeWidth={2.5} />
                      Reconectar
                    </button>
                  ) : (
                  <a
                    href={connectHref}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}
                  >
                    <RefreshCw size={13} strokeWidth={2.5} />
                    Reconectar
                  </a>
                  )}
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    <Link2Off size={13} strokeWidth={2.5} />
                    {disconnecting ? "..." : "Desconectar"}
                  </button>
                </div>
              </div>
            ) : onManualConnect ? (
              <button
                onClick={onManualConnect}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #1877F2, #0a5ab5)", color: "white" }}
              >
                <Key size={14} strokeWidth={2.5} />
                Conectar {name}
              </button>
            ) : (
              <a
                href={connectHref}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)", color: "white" }}
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

function MetaConnectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [token, setToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState<{ name: string; currency: string } | null>(null);
  const [error, setError] = useState("");

  async function handleVerify() {
    if (!token.trim() || !adAccountId.trim()) {
      setError("Completá los dos campos antes de verificar.");
      return;
    }
    setVerifying(true);
    setError("");
    setVerified(null);
    try {
      const res = await fetch("/api/meta/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), adAccountId: adAccountId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Token o Ad Account ID inválido.");
      } else {
        setVerified({ name: data.name, currency: data.currency });
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSave() {
    if (!verified) return;
    setSaving(true);
    try {
      await saveMetaToken({ token: token.trim(), adAccountId: adAccountId.trim(), accountName: verified.name });
      toast.success("Meta Ads conectado correctamente");
      onSuccess();
      onClose();
    } catch {
      toast.error("Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
        style={{ background: "#111118", border: "1px solid rgba(24,119,242,0.3)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(24,119,242,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(24,119,242,0.12)" }}>
              <Target size={18} color="#1877F2" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-bold text-[#F1F5F9] text-sm">Conectar Meta Ads</p>
              <p className="text-xs text-[#64748B]">System User Token — no expira</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Instrucciones */}
          <div className="rounded-xl p-4 space-y-2 text-xs"
            style={{ background: "rgba(24,119,242,0.06)", border: "1px solid rgba(24,119,242,0.2)" }}>
            <p className="font-semibold text-[#1877F2]">¿Cómo obtener el token?</p>
            <ol className="text-[#94A3B8] space-y-1 list-decimal list-inside leading-relaxed">
              <li>Entrá a <strong className="text-[#F1F5F9]">business.facebook.com</strong> → Configuración → Usuarios del sistema</li>
              <li>Seleccioná tu System User → <strong className="text-[#F1F5F9]">Generar token</strong></li>
              <li>Permisos: <code className="bg-[rgba(139,92,246,0.15)] px-1 rounded">ads_read</code> + <code className="bg-[rgba(139,92,246,0.15)] px-1 rounded">read_insights</code></li>
              <li>Copiá el token generado y pegalo abajo</li>
            </ol>
          </div>

          {/* Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1.5">
              <Key size={12} strokeWidth={2.5} /> System User Token
            </label>
            <textarea
              value={token}
              onChange={(e) => { setToken(e.target.value); setVerified(null); setError(""); }}
              placeholder="EAAn..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-xs font-mono text-[#F1F5F9] placeholder-[#475569] resize-none outline-none transition-all"
              style={{ background: "#0a0a0f", border: "1px solid rgba(24,119,242,0.2)" }}
            />
          </div>

          {/* Ad Account ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#94A3B8]">Ad Account ID</label>
            <input
              value={adAccountId}
              onChange={(e) => { setAdAccountId(e.target.value); setVerified(null); setError(""); }}
              placeholder="820587217236514 o act_820587217236514"
              className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] outline-none transition-all"
              style={{ background: "#0a0a0f", border: "1px solid rgba(24,119,242,0.2)" }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-xs text-[#ef4444] flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={13} strokeWidth={2} />
              {error}
            </div>
          )}

          {/* Verificado */}
          {verified && (
            <div className="rounded-xl px-4 py-3 space-y-1"
              style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#22c55e]">
                <CheckCircle2 size={13} strokeWidth={2.5} /> Cuenta verificada
              </div>
              <p className="text-sm font-bold text-[#F1F5F9]">{verified.name}</p>
              <p className="text-xs text-[#64748B]">Moneda: {verified.currency}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 gap-3"
          style={{ borderTop: "1px solid rgba(24,119,242,0.15)" }}>
          <button onClick={onClose} className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">
            Cancelar
          </button>
          <div className="flex gap-2">
            {!verified ? (
              <button
                onClick={handleVerify}
                disabled={verifying || !token.trim() || !adAccountId.trim()}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: "rgba(24,119,242,0.85)", border: "1px solid rgba(24,119,242,0.4)" }}
              >
                {verifying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                {verifying ? "Verificando..." : "Verificar conexión"}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #1877F2, #0a5ab5)" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                {saving ? "Guardando..." : "Guardar integración"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SHOP_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

function ShopifyConnectModal({ onClose }: { onClose: () => void }) {
  const [shop, setShop] = useState("");
  const [error, setError] = useState("");

  function handleConnect() {
    const value = shop.trim().toLowerCase();
    if (!SHOP_REGEX.test(value)) {
      setError("Ingresá el dominio completo, ej: mitienda.myshopify.com");
      return;
    }
    window.location.href = `/api/auth/shopify?shop=${encodeURIComponent(value)}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
        style={{ background: "#111118", border: "1px solid rgba(149,191,71,0.3)" }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(149,191,71,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(149,191,71,0.12)" }}>
              <ShoppingBag size={18} color="#95BF47" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-bold text-[#F1F5F9] text-sm">Conectar Shopify</p>
              <p className="text-xs text-[#64748B]">Te vamos a redirigir a Shopify para autorizar el acceso</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#94A3B8]">Dominio de tu tienda</label>
            <input
              value={shop}
              onChange={(e) => { setShop(e.target.value); setError(""); }}
              placeholder="mitienda.myshopify.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] outline-none transition-all"
              style={{ background: "#0a0a0f", border: "1px solid rgba(149,191,71,0.2)" }}
            />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-xs text-[#ef4444] flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={13} strokeWidth={2} />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 gap-3"
          style={{ borderTop: "1px solid rgba(149,191,71,0.15)" }}>
          <button onClick={onClose} className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleConnect}
            disabled={!shop.trim()}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #95BF47, #5E8E3E)" }}
          >
            <ExternalLink size={14} strokeWidth={2.5} />
            Continuar a Shopify
          </button>
        </div>
      </div>
    </div>
  );
}

const SECURITY_ITEMS = [
  {
    icon: Lock,
    color: "#8b5cf6",
    title: "AES-256-GCM",
    desc: "Todos los tokens OAuth se encriptan con AES-256-GCM antes de persistirse en la base de datos.",
  },
  {
    icon: Eye,
    color: "#c026d3",
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
    color: "#c084fc",
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
    else if (success === "shopify") toast.success("Shopify conectado correctamente");
    else if (success === "gmail") toast.success("Gmail conectado correctamente");
    else if (success === "meta") toast.success("Meta Ads conectado correctamente");
    else if (error === "token_failed") toast.error("Error al obtener el token. Intentá conectar de nuevo.");
    else if (error === "no_code") toast.error("No se recibió el código de autorización. Intentá de nuevo.");
    else if (error === "no_workspace") toast.error("No se encontró tu workspace. Contactá soporte.");
    else if (error === "meta_denied") toast.error("Cancelaste la conexión con Meta.");
    else if (error === "no_ad_accounts") toast.error("No se encontraron cuentas publicitarias activas en tu Meta.");
    else if (error === "shopify_invalid_shop") toast.error("Dominio de Shopify inválido. Usá el formato mitienda.myshopify.com.");
    else if (error === "shopify_hmac_invalid") toast.error("No se pudo verificar la conexión con Shopify. Intentá de nuevo.");
    else if (error === "oauth_invalid") toast.error("La conexión expiró o es inválida. Intentá de nuevo.");
  }, [params]);

  return null;
}

export default function IntegracionesClient({ tiendanube, shopify, gmail, meta }: Props) {
  const [showShopifyModal, setShowShopifyModal] = useState(false);

  const cards = [
    {
      icon: Store,
      name: "TiendaNube",
      description: "Datos en tiempo real — órdenes, productos y clientes se cargan directo desde tu tienda al entrar.",
      color: "#3B82F6",
      bgColor: "rgba(59,130,246,0.12)",
      integration: tiendanube,
      connectHref: "/api/auth/tiendanube",
      onDisconnect: () => disconnectIntegration("tiendanube"),
      comingSoon: false,
      onManualConnect: undefined as (() => void) | undefined,
    },
    {
      icon: ShoppingBag,
      name: "Shopify",
      description: "Conectá tu tienda Shopify para sincronizar órdenes, productos y clientes.",
      color: "#95BF47",
      bgColor: "rgba(149,191,71,0.12)",
      integration: shopify,
      connectHref: "",
      onDisconnect: () => disconnectIntegration("shopify"),
      comingSoon: false,
      onManualConnect: () => setShowShopifyModal(true),
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
      onManualConnect: undefined as (() => void) | undefined,
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
      comingSoon: false,
      onManualConnect: undefined,
    },
  ];

  const connectedCount = [tiendanube, shopify, gmail, meta].filter((i) => i?.status === "active").length;

  return (
    <Suspense>
      {showShopifyModal && <ShopifyConnectModal onClose={() => setShowShopifyModal(false)} />}
      <URLParamHandler />
      <div className="p-4 sm:p-6 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
              Integraciones
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              Conectá tus herramientas para centralizar todos tus datos en Nova Analytics.
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: connectedCount > 0 ? "rgba(34,197,94,0.1)" : "rgba(139,92,246,0.1)",
              border: connectedCount > 0 ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(139,92,246,0.25)",
              color: connectedCount > 0 ? "#22c55e" : "#a78bfa",
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
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom: "1px solid rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.04)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
              <Shield size={16} color="#8b5cf6" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-[#F1F5F9] text-sm">Seguridad de tokens — cifrado de extremo a extremo</p>
              <p className="text-xs text-[#64748B]">Tus credenciales nunca viajan ni se almacenan en texto plano</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(139,92,246,0.1)]">
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

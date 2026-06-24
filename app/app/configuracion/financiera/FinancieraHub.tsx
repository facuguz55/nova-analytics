"use client";

import { useRouter, usePathname } from "next/navigation";
import { DollarSign, TrendingUp, Percent, PlusCircle, Truck } from "lucide-react";
import FinancieraClient from "./FinancieraClient";
import CotizacionesClient from "../cotizaciones/CotizacionesClient";
import ComisionesClient from "../comisiones/ComisionesClient";
import CostosAdicionalesClient, { type AdditionalCost } from "../costos-adicionales/CostosAdicionalesClient";
import EnviosContent, { type ShippingCost } from "./EnviosContent";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface GeneralConfig {
  usd_rate: number;
  tax_rate: number;
  platform_fee: number;
}

interface CotizacionesConfig {
  usdRate: number;
  usdType: string;
  usdAdjustment: number;
  ratesData: unknown;
}

interface ComisionesConfig {
  tax_rate: number;
  platform_fee: number;
  custom_commission: number;
  custom_tax: number;
}

interface Props {
  activeTab: string;
  workspaceId: string;
  avgCostPct: number;
  productStats: { total: number; withCost: number };
  generalConfig: GeneralConfig;
  cotizacionesConfig: CotizacionesConfig;
  comisionesConfig: ComisionesConfig;
  additionalCosts: AdditionalCost[];
  storeName: string | null;
  isConnected: boolean;
  shippingCosts: ShippingCost[];
}

const TABS = [
  { key: "general",    label: "General",           icon: DollarSign },
  { key: "cotizaciones", label: "Cotizaciones",    icon: TrendingUp },
  { key: "comisiones", label: "Comisiones",        icon: Percent },
  { key: "costos",     label: "Costos Adicionales", icon: PlusCircle },
  { key: "envios",     label: "Envíos",            icon: Truck },
];

export default function FinancieraHub({
  activeTab,
  workspaceId,
  avgCostPct,
  productStats,
  generalConfig,
  cotizacionesConfig,
  comisionesConfig,
  additionalCosts,
  storeName,
  isConnected,
  shippingCosts,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  function goTab(tab: string) {
    router.push(`${pathname}?tab=${tab}`);
  }

  return (
    <div className="flex flex-col h-full">

      {/* Tab bar */}
      <div
        className="flex items-center flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.15)", background: "#0a0a0f", height: "52px" }}
      >
        <span className="text-xs font-black text-[#F1F5F9] whitespace-nowrap flex-shrink-0 pl-6 pr-4" style={{ letterSpacing: "-0.01em" }}>
          Configuración Financiera
        </span>
        <div className="flex items-center gap-0.5 h-full overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => goTab(t.key)}
                className="flex items-center gap-1.5 px-3 h-full text-xs font-semibold transition-all whitespace-nowrap relative"
                style={{ color: active ? "#F1F5F9" : "#64748B" }}
              >
                <Icon
                  size={12}
                  strokeWidth={active ? 2.5 : 2}
                  color={active ? "#a78bfa" : undefined}
                />
                {t.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 rounded-t-full"
                    style={{ height: "2px", background: "#8b5cf6" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "general" && (
          <FinancieraClient config={generalConfig} avgCostPct={avgCostPct} productStats={productStats} />
        )}

        {activeTab === "cotizaciones" && (
          <CotizacionesClient
            ratesData={cotizacionesConfig.ratesData as any}
            initialUsdType={cotizacionesConfig.usdType}
            initialAdjustment={cotizacionesConfig.usdAdjustment}
            workspaceId={workspaceId}
          />
        )}

        {activeTab === "comisiones" && (
          <ComisionesClient
            config={comisionesConfig}
            workspaceId={workspaceId}
          />
        )}

        {activeTab === "costos" && (
          <CostosAdicionalesClient
            costs={additionalCosts}
            workspaceId={workspaceId}
          />
        )}

        {activeTab === "envios" && (
          <EnviosContent
            isConnected={isConnected}
            storeName={storeName}
            workspaceId={workspaceId}
            initialCosts={shippingCosts}
          />
        )}
      </div>
    </div>
  );
}

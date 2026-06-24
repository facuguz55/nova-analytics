"use client";

import EnviosContent from "./EnviosContent";
import CostosAdicionalesClient, { type AdditionalCost } from "../costos-adicionales/CostosAdicionalesClient";
import { type ShippingCost } from "./shipping-defaults";

interface Props {
  workspaceId:     string;
  isConnected:     boolean;
  storeName:       string | null;
  shippingCosts:   ShippingCost[];
  additionalCosts: AdditionalCost[];
}

export default function CostosTab({ workspaceId, isConnected, storeName, shippingCosts, additionalCosts }: Props) {
  return (
    <div>
      <EnviosContent
        isConnected={isConnected}
        storeName={storeName}
        workspaceId={workspaceId}
        initialCosts={shippingCosts}
      />
      <div style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }}>
        <CostosAdicionalesClient
          costs={additionalCosts}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  );
}

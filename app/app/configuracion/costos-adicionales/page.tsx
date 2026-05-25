import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CostosAdicionalesClient from "./CostosAdicionalesClient";

export const metadata: Metadata = { title: "Costos Adicionales" };

export interface AdditionalCost {
  id: string;
  workspace_id: string;
  name: string;
  type: "fixed" | "variable";
  amount: number;       // para fixed: monto en ARS; para variable: % sobre facturación
  currency: string;
  created_at: string;
}

export default async function CostosAdicionalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const workspaceId = (rawRow as unknown as { workspace_id: string | null } | null)?.workspace_id ?? "";

  let costs: AdditionalCost[] = [];
  if (workspaceId) {
    const db = supabase as unknown as { from: (t: string) => any };
    const { data } = await db.from("additional_costs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    costs = (data ?? []) as AdditionalCost[];
  }

  return <CostosAdicionalesClient costs={costs} workspaceId={workspaceId} />;
}

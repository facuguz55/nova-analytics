import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import CostosAdicionalesClient, { type AdditionalCost } from "./CostosAdicionalesClient";
export type { AdditionalCost };

export const metadata: Metadata = { title: "Costos Adicionales" };

export default async function CostosAdicionalesPage() {
  const supabase = await createClient();
  const user = await getUser();
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

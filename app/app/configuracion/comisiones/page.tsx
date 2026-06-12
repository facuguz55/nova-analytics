import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import ComisionesClient from "./ComisionesClient";

export const metadata: Metadata = { title: "Comisiones" };

export default async function ComisionesPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data: rawRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const workspaceId = (rawRow as unknown as { workspace_id: string | null } | null)?.workspace_id ?? "";

  // Obtener configuración de comisiones
  const db = supabase as unknown as { from: (t: string) => any };
  const { data: comData } = await db.from("financial_config")
    .select("tax_rate, platform_fee, custom_commission, custom_tax")
    .eq("workspace_id", workspaceId)
    .single();

  const config = {
    tax_rate:          (comData as any)?.tax_rate ?? 10,
    platform_fee:      (comData as any)?.platform_fee ?? 2,
    custom_commission: (comData as any)?.custom_commission ?? 0,
    custom_tax:        (comData as any)?.custom_tax ?? 0,
  };

  return (
    <ComisionesClient config={config} workspaceId={workspaceId} />
  );
}

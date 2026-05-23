import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import FinancieraClient from "./FinancieraClient";

export const metadata: Metadata = { title: "Configuración financiera" };

export default async function FinancieraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawUserRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const userRow = rawUserRow as unknown as { workspace_id: string | null } | null;

  const { data: rawConfig } = await supabase
    .from("financial_config")
    .select("*")
    .eq("workspace_id", userRow?.workspace_id ?? "")
    .single();
  type FinConfig = { usd_rate: number; tax_rate: number; platform_fee: number; agency_fee: number };
  const config = rawConfig as unknown as FinConfig | null;

  return (
    <FinancieraClient
      config={config ?? { usd_rate: 1200, tax_rate: 21, platform_fee: 2, agency_fee: 0 }}
    />
  );
}

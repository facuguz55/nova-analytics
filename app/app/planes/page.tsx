import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PlanesClient from "./PlanesClient";

export const metadata: Metadata = { title: "Planes" };

export default async function PlanesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawRow } = await supabase
    .from("users")
    .select("workspace_id, workspaces(plan, trial_started_at)")
    .eq("id", user.id)
    .single();

  type Row = { workspace_id: string; workspaces: { plan: string; trial_started_at: string | null } | null };
  const row = rawRow as unknown as Row | null;
  const plan = row?.workspaces?.plan ?? "free";
  const trialStartedAt = row?.workspaces?.trial_started_at ?? null;

  // Calcular días restantes del trial
  let trialDaysLeft: number | null = null;
  if (plan === "trial" && trialStartedAt) {
    const started = new Date(trialStartedAt);
    const expires = new Date(started.getTime() + 14 * 86400000); // 14 días
    trialDaysLeft = Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86400000));
  }

  // Órdenes del último mes (directo desde TiendaNube no almacenadas — usamos 0 como placeholder)
  const ordersLastMonth = 0;

  return (
    <PlanesClient
      plan={plan}
      trialDaysLeft={trialDaysLeft}
      ordersLastMonth={ordersLastMonth}
    />
  );
}

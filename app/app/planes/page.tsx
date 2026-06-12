import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import PlanesClient from "./PlanesClient";

export const metadata: Metadata = { title: "Planes" };

export default async function PlanesPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data: rawRow } = await supabase
    .from("users")
    .select("workspace_id, email, workspaces(plan, trial_started_at)")
    .eq("id", user.id)
    .single();

  type Row = { workspace_id: string; email: string; workspaces: { plan: string; trial_started_at: string | null } | null };
  const row = rawRow as unknown as Row | null;
  const plan = row?.workspaces?.plan ?? "free";
  const trialStartedAt = row?.workspaces?.trial_started_at ?? null;

  let trialDaysLeft: number | null = null;
  if (plan === "trial" && trialStartedAt) {
    const started = new Date(trialStartedAt);
    const expires = new Date(started.getTime() + 7 * 86400000); // 7 días
    trialDaysLeft = Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86400000));
  }

  return (
    <PlanesClient
      plan={plan}
      trialDaysLeft={trialDaysLeft}
      workspaceId={row?.workspace_id ?? ""}
      userEmail={row?.email ?? user.email ?? ""}
    />
  );
}

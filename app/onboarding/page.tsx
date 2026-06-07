import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawUserRow } = await supabase
    .from("users")
    .select("workspace_id, workspaces(onboarding_completed)")
    .eq("id", user.id)
    .single();

  type UserRow = { workspace_id: string | null; workspaces: { onboarding_completed: boolean } | null };
  const userRow = rawUserRow as unknown as UserRow | null;

  // Si ya completó el onboarding, ir al dashboard
  if (userRow?.workspaces?.onboarding_completed) redirect("/app/dashboard");

  // Leer estado de integraciones
  const workspaceId = userRow?.workspace_id;
  let tiendanubeConnected = false;
  let gmailConnected = false;

  if (workspaceId) {
    // Usar service client para evitar falsos negativos por RLS
    const service = createServiceClient();
    const { data: integrations } = await service
      .from("integrations")
      .select("provider, status")
      .eq("workspace_id", workspaceId)
      .eq("status", "active");

    const providers = new Set((integrations ?? []).map((i: { provider: string }) => i.provider));
    tiendanubeConnected = providers.has("tiendanube");
    gmailConnected = providers.has("gmail");
  }

  return (
    <OnboardingClient
      tiendanubeConnected={tiendanubeConnected}
      gmailConnected={gmailConnected}
    />
  );
}

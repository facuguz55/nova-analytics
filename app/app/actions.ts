"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const FinancialSchema = z.object({
  usd_rate: z.coerce.number().min(0).max(99999),
  tax_rate: z.coerce.number().min(0).max(100),
  platform_fee: z.coerce.number().min(0).max(100),
  agency_fee: z.coerce.number().min(0).max(100),
});

export async function updateFinancialConfig(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = FinancialSchema.safeParse({
    usd_rate: formData.get("usd_rate"),
    tax_rate: formData.get("tax_rate"),
    platform_fee: formData.get("platform_fee"),
    agency_fee: formData.get("agency_fee"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");

  const db = supabase as unknown as { from: (t: string) => any };
  await db.from("financial_config")
    .update(parsed.data)
    .eq("workspace_id", (userRow as any).workspace_id);

  revalidatePath("/app/configuracion/financiera");
}

const ProfileSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = ProfileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) throw new Error("Datos inválidos");

  await (supabase as any).from("users")
    .update({ name: parsed.data.name })
    .eq("id", user.id);

  revalidatePath("/app/configuracion/cuenta");
}

export async function triggerSync() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/tiendanube/sync`, {
    method: "POST",
    headers: { Cookie: "" },
  });

  if (!res.ok) throw new Error("Sync failed");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/ordenes");
  revalidatePath("/app/productos");
  revalidatePath("/app/clientes");
}

export async function disconnectIntegration(provider: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");

  await (supabase as any).from("integrations")
    .update({ status: "disconnected", access_token_encrypted: null, refresh_token_encrypted: null })
    .eq("workspace_id", (userRow as any).workspace_id)
    .eq("provider", provider);

  const service = createServiceClient();
  await (service as any).from("audit_logs").insert({
    workspace_id: (userRow as any).workspace_id,
    user_id: user.id,
    action: "integration_disconnected",
    metadata: { provider },
  });

  revalidatePath("/app/configuracion/integraciones");
}

export async function startTrial() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: rawUserRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const workspaceId = (rawUserRow as unknown as { workspace_id: string | null } | null)?.workspace_id;
  if (!workspaceId) throw new Error("Sin workspace");

  await (supabase as any).from("workspaces")
    .update({ plan: "trial", trial_started_at: new Date().toISOString() })
    .eq("id", workspaceId);

  const service = createServiceClient();
  await (service as any).from("audit_logs").insert({
    workspace_id: workspaceId,
    user_id: user.id,
    action: "trial_started",
    metadata: { plan: "trial" },
  });

  revalidatePath("/app");
  redirect("/app/dashboard");
}

export async function markAlertRead(alertId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await (supabase as any).from("alerts")
    .update({ read: true })
    .eq("id", alertId);

  revalidatePath("/app/alertas");
}

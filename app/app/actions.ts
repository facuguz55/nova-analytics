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
  usd_rate:     z.coerce.number().min(0).max(99999),
  tax_rate:     z.coerce.number().min(0).max(100),
  platform_fee: z.coerce.number().min(0).max(100),
});

export async function updateFinancialConfig(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = FinancialSchema.safeParse({
    usd_rate:     formData.get("usd_rate"),
    tax_rate:     formData.get("tax_rate"),
    platform_fee: formData.get("platform_fee"),
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

// ── Cambiar contraseña ─────────────────────────────────────────────────
const PasswordSchema = z.object({
  new_password: z.string().min(8).max(128),
});

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = PasswordSchema.safeParse({ new_password: formData.get("new_password") });
  if (!parsed.success) throw new Error("La contraseña debe tener al menos 8 caracteres");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) throw new Error(error.message);

  revalidatePath("/app/configuracion/cuenta");
}

// ── Eliminar cuenta ────────────────────────────────────────────────────
export async function deleteAccount(_formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  const workspaceId = (userRow as unknown as { workspace_id: string | null } | null)?.workspace_id;

  const db = supabase as unknown as { from: (t: string) => any };

  // Desconectar todas las integraciones primero
  if (workspaceId) {
    await db.from("integrations").delete().eq("workspace_id", workspaceId);
    await db.from("financial_config").delete().eq("workspace_id", workspaceId);
    await db.from("additional_costs").delete().eq("workspace_id", workspaceId);
    await db.from("workspaces").delete().eq("id", workspaceId);
  }

  await db.from("users").delete().eq("id", user.id);

  // Sign out — el service client haría hard delete del auth user
  // Por ahora simplemente cerramos sesión
  await supabase.auth.signOut();
  redirect("/login");
}

export async function triggerSync() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Usar NEXT_PUBLIC_APP_URL, o VERCEL_URL (seteado automáticamente por Vercel), o localhost
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/tiendanube/sync`, {
    method: "POST",
    // Pasar el user id en header interno para que el endpoint pueda autenticar
    headers: {
      "x-internal-user-id": user.id,
      "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
    },
  });

  if (!res.ok) throw new Error("Sync failed");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/ordenes");
  revalidatePath("/app/productos");
  revalidatePath("/app/clientes");
}

const VALID_PROVIDERS = ["tiendanube", "gmail", "meta"] as const;
type ValidProvider = typeof VALID_PROVIDERS[number];

export async function disconnectIntegration(provider: string) {
  // Whitelist estricta — evita pasar strings arbitrarios a la DB
  if (!VALID_PROVIDERS.includes(provider as ValidProvider)) {
    throw new Error("Provider inválido");
  }

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

// ── Cotizaciones ───────────────────────────────────────────────────────
const CotizacionSchema = z.object({
  usd_type:       z.enum(["oficial", "blue", "bolsa", "ccl", "cripto"]),
  usd_adjustment: z.coerce.number().min(-50).max(50),
  usd_rate:       z.coerce.number().min(0).max(999999).optional(),
});

export async function saveCotizacion(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = CotizacionSchema.safeParse({
    usd_type:       formData.get("usd_type"),
    usd_adjustment: formData.get("usd_adjustment"),
    usd_rate:       formData.get("usd_rate"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");

  const db = supabase as unknown as { from: (t: string) => any };
  await db.from("financial_config").update({
    ...(parsed.data.usd_rate ? { usd_rate: parsed.data.usd_rate } : {}),
    usd_type:       parsed.data.usd_type,
    usd_adjustment: parsed.data.usd_adjustment,
  }).eq("workspace_id", (userRow as any).workspace_id);

  revalidatePath("/app/configuracion/cotizaciones");
  revalidatePath("/app/configuracion/financiera");
}

// ── Comisiones ─────────────────────────────────────────────────────────
const ComisionesSchema = z.object({
  tax_rate:          z.coerce.number().min(0).max(100).optional(),
  custom_commission: z.coerce.number().min(0).max(100).optional(),
  custom_tax:        z.coerce.number().min(0).max(100).optional(),
});

export async function saveComisiones(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = ComisionesSchema.safeParse({
    tax_rate:          formData.get("tax_rate"),
    custom_commission: formData.get("custom_commission"),
    custom_tax:        formData.get("custom_tax"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");

  const update: Record<string, number> = {};
  if (parsed.data.tax_rate          !== undefined) update.tax_rate          = parsed.data.tax_rate;
  if (parsed.data.custom_commission !== undefined) update.custom_commission = parsed.data.custom_commission;
  if (parsed.data.custom_tax        !== undefined) update.custom_tax        = parsed.data.custom_tax;

  const db = supabase as unknown as { from: (t: string) => any };
  await db.from("financial_config").update(update).eq("workspace_id", (userRow as any).workspace_id);

  revalidatePath("/app/configuracion/comisiones");
  revalidatePath("/app/configuracion/financiera");
}

// ── Costos adicionales ─────────────────────────────────────────────────
const AdditionalCostSchema = z.object({
  name:     z.string().min(1).max(100),
  type:     z.enum(["fixed", "variable"]),
  amount:   z.coerce.number().min(0).max(99999999),
  currency: z.string().max(10).default("ARS"),
});

export async function addAdditionalCost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = AdditionalCostSchema.safeParse({
    name:     formData.get("name"),
    type:     formData.get("type"),
    amount:   formData.get("amount"),
    currency: formData.get("currency") ?? "ARS",
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db.from("additional_costs").insert({
    workspace_id: (userRow as any).workspace_id,
    ...parsed.data,
  }).select().single();

  if (error) throw new Error(error.message);

  revalidatePath("/app/configuracion/costos-adicionales");
  return data;
}

export async function deleteAdditionalCost(id: string, workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Validar UUID básico
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("ID inválido");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db.from("additional_costs")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId); // doble check de ownership

  if (error) throw new Error(error.message);
  revalidatePath("/app/configuracion/costos-adicionales");
}

export async function markAlertRead(alertId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Obtener workspace_id del usuario para verificar ownership
  const { data: rawRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  const workspaceId = (rawRow as unknown as { workspace_id: string | null } | null)?.workspace_id;
  if (!workspaceId) return;

  // Filtrar por workspace_id — evita que un usuario marque alertas de otro workspace
  await (supabase as any).from("alerts")
    .update({ read: true })
    .eq("id", alertId)
    .eq("workspace_id", workspaceId);

  revalidatePath("/app/alertas");
}

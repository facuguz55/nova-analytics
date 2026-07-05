"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const FinancialSchema = z.object({
  usd_rate:          z.coerce.number().min(0).max(99999),
  tax_rate:          z.coerce.number().min(0).max(100),
  platform_fee:      z.coerce.number().min(0).max(100),
  custom_commission: z.coerce.number().min(0).max(100),
});

export async function updateFinancialConfig(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = FinancialSchema.safeParse({
    usd_rate:          formData.get("usd_rate"),
    tax_rate:          formData.get("tax_rate"),
    platform_fee:      formData.get("platform_fee"),
    custom_commission: formData.get("custom_commission"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");

  const workspaceId = (userRow as any).workspace_id;
  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db.from("financial_config")
    .upsert({ workspace_id: workspaceId, ...parsed.data }, { onConflict: "workspace_id" });

  if (error) throw new Error("Error al guardar en base de datos");

  revalidateTag(`financial-config-${workspaceId}`);
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

  revalidateTag(`user-row-${user.id}`);
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


const VALID_PROVIDERS = ["tiendanube", "shopify", "gmail", "meta"] as const;
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

  revalidateTag(`integrations-${(userRow as any).workspace_id}`);
  revalidatePath("/app/configuracion/integraciones");
}

const MetaTokenSchema = z.object({
  token: z.string().min(10).max(500),
  adAccountId: z.string().min(5).max(50),
  accountName: z.string().max(200).optional(),
});

export async function saveMetaToken(input: { token: string; adAccountId: string; accountName?: string }) {
  const parsed = MetaTokenSchema.safeParse(input);
  if (!parsed.success) throw new Error("Datos inválidos");

  const { token, adAccountId, accountName } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");

  const { encrypt } = await import("@/lib/encryption");
  const encrypted = encrypt(token);
  const cleanAccountId = adAccountId.replace(/^act_/, "");

  await (supabase as any).from("integrations")
    .upsert({
      workspace_id: (userRow as any).workspace_id,
      provider: "meta",
      access_token_encrypted: encrypted,
      store_id: cleanAccountId,
      status: "active",
      metadata: { account_name: accountName ?? "", token_type: "system_user" },
      updated_at: new Date().toISOString(),
    }, { onConflict: "workspace_id,provider" });

  const service = createServiceClient();
  await (service as any).from("audit_logs").insert({
    workspace_id: (userRow as any).workspace_id,
    user_id: user.id,
    action: "integration_connected",
    metadata: { provider: "meta", account_id: cleanAccountId },
  });

  revalidateTag(`integrations-${(userRow as any).workspace_id}`);
  revalidatePath("/app/configuracion/integraciones");
  revalidatePath("/app/meta-ads");
}

export async function startTrial() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: rawUserRow } = await supabase
    .from("users")
    .select("workspace_id, workspaces(plan)")
    .eq("id", user.id)
    .single();

  type UserWithPlan = { workspace_id: string | null; workspaces: { plan: string } | null };
  const row = rawUserRow as unknown as UserWithPlan | null;
  const workspaceId = row?.workspace_id;
  if (!workspaceId) throw new Error("Sin workspace");

  // Prevenir abuso: solo se puede activar trial si el plan actual es "free"
  const currentPlan = row?.workspaces?.plan ?? "free";
  if (currentPlan !== "free") throw new Error("El trial solo puede activarse desde el plan gratuito");

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
  // No usar redirect() — lanza NEXT_REDIRECT que los catch del cliente interceptan
  // y bloquean la navegación. El cliente navega con router.push() al recibir el éxito.
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

  revalidateTag(`financial-config-${(userRow as any).workspace_id}`);
  revalidatePath("/app/configuracion/cotizaciones");
  revalidatePath("/app/configuracion/financiera");
}

// ── Costos adicionales ─────────────────────────────────────────────────
const VALID_CURRENCIES = ["ARS", "USD", "EUR", "BRL", "MXN", "COP", "CLP", "UYU"] as const;

const AdditionalCostSchema = z.object({
  name:     z.string().min(1).max(100),
  type:     z.enum(["fixed", "variable"]),
  amount:   z.coerce.number().min(0).max(99999999),
  currency: z.enum(VALID_CURRENCIES).default("ARS"), // whitelist — no string arbitrario
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

export async function deleteAdditionalCost(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Validar UUID básico
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("ID inválido");

  // ⚠️ workspaceId siempre del servidor — nunca del cliente (previene IDOR)
  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");
  const workspaceId = (userRow as unknown as { workspace_id: string }).workspace_id;

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db.from("additional_costs")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId); // ownership verificado server-side

  if (error) throw new Error(error.message);
  revalidatePath("/app/configuracion/costos-adicionales");
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const service = createServiceClient();

  const { data: userRow } = await service
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  let workspaceId = (userRow as unknown as { workspace_id: string | null } | null)?.workspace_id;

  // Si el usuario no tiene workspace (auth callback falló), crearlo on-the-fly
  if (!workspaceId) {
    const email = user.email ?? "";
    const name = (user.user_metadata?.full_name as string | undefined) || email.split("@")[0] || "Mi Tienda";
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);

    const { data: workspace, error: wsError } = await service
      .from("workspaces")
      .insert({ name, slug, plan: "free", status: "active" })
      .select("id")
      .single();

    if (wsError || !workspace) throw new Error("No se pudo crear el workspace");
    workspaceId = workspace.id;

    await service.from("users").upsert({
      id: user.id,
      workspace_id: workspaceId,
      email,
      role: "client",
      name,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    });

    await service.from("financial_config").upsert({
      workspace_id: workspaceId,
      usd_rate: 1000,
      tax_rate: 21,
      platform_fee: 8,
      custom_commission: 15,
    }, { onConflict: "workspace_id" });
  }

  const { error } = await service.from("workspaces")
    .update({ onboarding_completed: true })
    .eq("id", workspaceId);

  if (error) throw new Error(error.message);

  // El layout de /app lee el workspace vía getCachedUserRow (TTL 5 min);
  // sin invalidar el tag, redirige de nuevo a /onboarding con el dato viejo.
  revalidateTag(`user-row-${user.id}`);
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

  revalidateTag(`alert-count-${workspaceId}`);
  revalidatePath("/app/alertas");
}

// ── Configuración de notificaciones ───────────────────────────────────────────
const NotifConfigSchema = z.object({
  telegram_chat_id:         z.string().max(30).optional(),
  telegram_enabled:         z.coerce.boolean(),
  daily_summary_enabled:    z.coerce.boolean(),
  daily_summary_time:       z.string().regex(/^\d{2}:\d{2}$/).default("20:00"),
  alert_vip_inactive_days:  z.coerce.number().min(1).max(365).default(30),
  alert_big_sale_threshold: z.coerce.number().min(0).max(99999999).default(50000),
});

export async function saveNotificationConfig(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = NotifConfigSchema.safeParse({
    telegram_chat_id:         formData.get("telegram_chat_id") || undefined,
    telegram_enabled:         formData.get("telegram_enabled"),
    daily_summary_enabled:    formData.get("daily_summary_enabled"),
    daily_summary_time:       formData.get("daily_summary_time"),
    alert_vip_inactive_days:  formData.get("alert_vip_inactive_days"),
    alert_big_sale_threshold: formData.get("alert_big_sale_threshold"),
  });
  if (!parsed.success) throw new Error("Datos inválidos");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!userRow) throw new Error("Sin workspace");

  const workspaceId = (userRow as any).workspace_id;

  // Upsert usando workspace_id como PK de la config
  await (supabase as any).from("notification_config")
    .upsert({ workspace_id: workspaceId, ...parsed.data }, { onConflict: "workspace_id" });

  revalidatePath("/app/configuracion/notificaciones");
}

export async function testTelegramNotification(chatId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Validar que el chatId sea numérico
  if (!/^-?\d+$/.test(chatId.trim())) throw new Error("Chat ID inválido");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN no configurado");

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: "✅ *Nova Analytics* — Conexión exitosa\\! Vas a recibir alertas de ventas, stock y clientes VIP acá.",
        parse_mode: "MarkdownV2",
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.description ?? "Error al enviar mensaje");
  }
}

"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

function revalidateAdmin() {
  revalidatePath("/admin/hq");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/workspaces");
  revalidatePath("/admin/analytics");
}

export async function changeWorkspacePlan(workspaceId: string, plan: string) {
  const service = createServiceClient();

  const { error } = await service.from("workspaces").update({ plan }).eq("id", workspaceId);
  if (error) throw new Error(error.message);

  // Sincronizar subscriptions: fuente única de verdad para acceso
  if (plan === "trial") {
    await service.from("subscriptions").upsert({
      workspace_id: workspaceId,
      status: "trial",
      provider: "manual",
      trial_ends_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    }, { onConflict: "workspace_id" });
  } else if (["active", "pro", "agency"].includes(plan)) {
    await service.from("subscriptions").upsert({
      workspace_id: workspaceId,
      status: "active",
      provider: "manual",
      trial_ends_at: null,
    }, { onConflict: "workspace_id" });
  } else {
    // "free" → sin suscripción = sin acceso
    await service.from("subscriptions").delete().eq("workspace_id", workspaceId);
  }

  revalidateAdmin();
}

export async function changeWorkspaceStatus(workspaceId: string, status: string) {
  const service = createServiceClient();
  const { error, data } = await service
    .from("workspaces")
    .update({ status })
    .eq("id", workspaceId)
    .select("id, status");
  console.log("[changeWorkspaceStatus]", { workspaceId, status, data, error });
  if (error) throw new Error(error.message);
  revalidateAdmin();
}

export async function deleteWorkspace(workspaceId: string) {
  const service = createServiceClient();

  // 1. Obtener todos los usuarios del workspace
  const { data: wsUsers } = await service
    .from("users")
    .select("id")
    .eq("workspace_id", workspaceId);

  // 2. Eliminar cada usuario de Supabase Auth
  if (wsUsers && wsUsers.length > 0) {
    await Promise.allSettled(
      wsUsers.map((u) => service.auth.admin.deleteUser(u.id))
    );
  }

  // 3. Eliminar registros de la tabla users
  await service.from("users").delete().eq("workspace_id", workspaceId);

  // 4. Eliminar workspace (subscriptions y otros con CASCADE se eliminan automáticamente)
  const { error } = await service.from("workspaces").delete().eq("id", workspaceId);
  if (error) throw new Error(error.message);

  revalidateAdmin();
}

export async function deleteUser(userId: string) {
  const service = createServiceClient();

  // 1. Eliminar de la tabla users
  await service.from("users").delete().eq("id", userId);

  // 2. Eliminar de Supabase Auth
  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidateAdmin();
}

export async function changeUserRole(userId: string, role: string) {
  const service = createServiceClient();
  const { error } = await service.from("users").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidateAdmin();
}

/** Crear cuenta de cliente completa: auth + workspace + user + config financiera */
export async function createClientAccount(
  email: string,
  name: string,
  password: string,
  workspaceName: string,
  plan: string
) {
  const service = createServiceClient();

  // 1. Crear usuario en Supabase Auth (confirmado directamente)
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (authError) throw new Error(authError.message);

  const userId = authData.user.id;
  const slug = workspaceName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);

  // 2. Crear workspace
  const { data: workspace, error: wsError } = await service
    .from("workspaces")
    .insert({ name: workspaceName, slug, plan, status: "active" })
    .select("id")
    .single();
  if (wsError) {
    await service.auth.admin.deleteUser(userId);
    throw new Error(wsError.message);
  }

  // 3. Crear registro de usuario
  await service.from("users").insert({
    id: userId,
    workspace_id: workspace.id,
    email,
    role: "client",
    name,
  });

  // 4. Config financiera default
  await service.from("financial_config").insert({
    workspace_id: workspace.id,
    usd_rate: 1000,
    tax_rate: 21,
    platform_fee: 8,
    agency_fee: 15,
  });

  // 5. Registro de suscripción si el plan lo requiere
  if (["active", "trial", "pro", "agency"].includes(plan)) {
    await service.from("subscriptions").upsert({
      workspace_id: workspace.id,
      status: plan === "trial" ? "trial" : "active",
      provider: "manual",
      ...(plan === "trial" && {
        trial_ends_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      }),
    }, { onConflict: "workspace_id" });
  }

  revalidateAdmin();
}

/** Resetear la contraseña de un usuario */
export async function resetClientPassword(userId: string, newPassword: string) {
  if (newPassword.length < 8) throw new Error("Mínimo 8 caracteres");
  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) throw new Error(error.message);
}

/** Actualizar nombre o email de un usuario */
export async function updateClientInfo(userId: string, name: string, email: string) {
  const service = createServiceClient();
  const [dbRes, authRes] = await Promise.allSettled([
    service.from("users").update({ name, email }).eq("id", userId),
    service.auth.admin.updateUserById(userId, { email }),
  ]);
  if (dbRes.status === "rejected") throw new Error("Error actualizando nombre");
  if (authRes.status === "rejected") throw new Error("Error actualizando email");
  revalidateAdmin();
}

/** Agregar un credito de pago manual al workspace en la tabla billing */
export async function addManualPayment(workspaceId: string, amount: number, note: string) {
  const service = createServiceClient();
  const { error } = await service.from("billing").insert({
    workspace_id: workspaceId,
    amount,
    currency: "ARS",
    status: "paid",
    provider: "manual",
    metadata: { note: note || "Pago manual registrado desde HQ" },
    paid_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidateAdmin();
}

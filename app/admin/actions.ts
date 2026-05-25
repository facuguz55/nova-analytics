"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

function revalidateAdmin() {
  revalidatePath("/admin/hq");
  revalidatePath("/admin/workspaces");
  revalidatePath("/admin/analytics");
}

export async function changeWorkspacePlan(workspaceId: string, plan: string) {
  const service = createServiceClient();
  const { error } = await service.from("workspaces").update({ plan }).eq("id", workspaceId);
  if (error) throw new Error(error.message);
  revalidateAdmin();
}

export async function changeWorkspaceStatus(workspaceId: string, status: string) {
  const service = createServiceClient();
  const { error } = await service.from("workspaces").update({ status }).eq("id", workspaceId);
  if (error) throw new Error(error.message);
  revalidateAdmin();
}

export async function deleteWorkspace(workspaceId: string) {
  const service = createServiceClient();
  const { error } = await service.from("workspaces").delete().eq("id", workspaceId);
  if (error) throw new Error(error.message);
  revalidateAdmin();
}

export async function deleteUser(userId: string) {
  const service = createServiceClient();
  await service.from("users").delete().eq("id", userId);
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

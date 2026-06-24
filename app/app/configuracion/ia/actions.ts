"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const Schema = z.object({
  store_name:      z.string().max(100).optional(),
  general_info:    z.string().max(2000).optional(),
  shipping_policy: z.string().max(1000).optional(),
  return_policy:   z.string().max(1000).optional(),
  payment_methods: z.string().max(500).optional(),
  tone:            z.string().max(300).optional(),
});

export async function saveAIContext(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: rawUser } = await supabase
    .from("users").select("workspace_id").eq("id", user.id).single();
  const workspaceId = (rawUser as { workspace_id: string | null } | null)?.workspace_id;
  if (!workspaceId) return { error: "Sin workspace" };

  const parsed = Schema.safeParse({
    store_name:      formData.get("store_name"),
    general_info:    formData.get("general_info"),
    shipping_policy: formData.get("shipping_policy"),
    return_policy:   formData.get("return_policy"),
    payment_methods: formData.get("payment_methods"),
    tone:            formData.get("tone"),
  });
  if (!parsed.success) return { error: "Datos inválidos" };

  const service = createServiceClient();
  const { error } = await service
    .from("workspace_ai_context")
    .upsert({ workspace_id: workspaceId, ...parsed.data }, { onConflict: "workspace_id" });

  if (error) return { error: "Error al guardar" };

  revalidatePath("/app/configuracion/ia");
  return { success: true };
}

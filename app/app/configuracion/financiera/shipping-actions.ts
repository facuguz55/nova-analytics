"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CostSchema = z.object({
  method:    z.string().max(50),
  label:     z.string().max(100),
  cost:      z.number().min(0).max(10_000_000),
  is_active: z.boolean(),
});

const Schema = z.array(CostSchema).min(1).max(20);

export async function saveShippingCosts(
  workspaceId: string,
  costs: z.infer<typeof Schema>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const parsed = Schema.safeParse(costs);
  if (!parsed.success) return { error: "Datos inválidos" };

  const service = createServiceClient();
  const rows = parsed.data.map(c => ({ workspace_id: workspaceId, ...c }));

  const { error } = await service
    .from("shipping_costs")
    .upsert(rows, { onConflict: "workspace_id,method" });

  if (error) return { error: "Error al guardar" };

  revalidatePath("/app/configuracion/financiera");
  return { success: true };
}

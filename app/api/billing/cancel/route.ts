import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const bodySchema = z.object({
  workspaceId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "workspaceId inválido" }, { status: 400 });
  }

  const { workspaceId } = parsed.data;

  // Verificar que el usuario pertenece al workspace
  const { data: rawUserRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  const userRow = rawUserRow as unknown as { workspace_id: string } | null;

  if (userRow?.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: sub } = await service
    .from("subscriptions")
    .select("status")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!sub || (sub.status !== "active" && sub.status !== "trial")) {
    return NextResponse.json({ error: "No hay suscripción activa para cancelar" }, { status: 400 });
  }

  await service
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);

  // Mantener sincronizado el plan del workspace (lo lee el layout)
  await service
    .from("workspaces")
    .update({ plan: "free" })
    .eq("id", workspaceId);

  return NextResponse.json({ ok: true });
}

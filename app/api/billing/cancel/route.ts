import { NextResponse } from "next/server";
import { z } from "zod";
import { PreApproval } from "mercadopago";
import { mpClient } from "@/lib/mercadopago/client";
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
    .select("status, provider_subscription_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!sub || (sub.status !== "active" && sub.status !== "trial")) {
    return NextResponse.json({ error: "No hay suscripción activa para cancelar" }, { status: 400 });
  }

  // Frenar el cobro recurrente en MercadoPago (best-effort: si falla, igual
  // marcamos cancelada en la DB y el webhook eventualmente reconcilia).
  const providerSubId = (sub as { provider_subscription_id: string | null }).provider_subscription_id;
  if (providerSubId) {
    try {
      await new PreApproval(mpClient).update({
        id: providerSubId,
        body: { status: "cancelled" },
      });
    } catch (err) {
      console.error("[billing/cancel] no se pudo cancelar el preapproval en MP:", err);
    }
  }

  // Marcar cancelada pero CONSERVAR next_billing_at: el usuario mantiene
  // acceso hasta el fin del período que ya pagó (lo resuelve hasActiveAccess).
  // No se toca workspaces.plan todavía — sigue activo hasta esa fecha.
  await service
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);

  return NextResponse.json({ ok: true });
}

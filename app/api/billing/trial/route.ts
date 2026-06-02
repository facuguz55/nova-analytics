import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

const bodySchema = z.object({
  workspaceId: z.string().uuid(),
});

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.error }, { status: 429 });
  }

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

  // Verificar que no haya tenido trial antes
  const { data: existing } = await service
    .from("subscriptions")
    .select("status")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya usaste el período de prueba o tenés una suscripción activa." },
      { status: 400 }
    );
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  const { error } = await service.from("subscriptions").insert({
    workspace_id: workspaceId,
    status: "trial",
    next_billing_at: trialEndsAt.toISOString(),
    provider_subscription_id: null,
    cancelled_at: null,
  });

  if (error) {
    console.error("[billing/trial] error:", error);
    return NextResponse.json({ error: "No se pudo activar el trial" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, trialEndsAt: trialEndsAt.toISOString() });
}

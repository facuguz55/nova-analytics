import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionUrl } from "@/lib/mercadopago/client";
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
    .select("workspace_id, email")
    .eq("id", user.id)
    .single();

  const userRow = rawUserRow as unknown as { workspace_id: string; email: string | null } | null;

  if (userRow?.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const email = userRow?.email ?? user.email ?? "";

  try {
    const url = await createSubscriptionUrl(workspaceId, email);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    console.error("[checkout/mercadopago] error:", {
      message: err instanceof Error ? err.message : String(err),
      status: (err as Record<string, unknown>)?.status,
      hasPlanId: !!process.env.MERCADOPAGO_PLAN_ID,
      hasToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

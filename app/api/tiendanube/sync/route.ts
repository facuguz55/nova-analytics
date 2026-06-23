import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { syncAll } from "@/lib/tiendanube/sync";
import { checkUserRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1 sync completo por hora por usuario
  const rl = await checkUserRateLimit(user.id, "tn_sync_manual", 1, 3600);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === "full" ? "full" : "incremental";

  const db = createServiceClient() as any;

  const { data: userRow } = await db
    .from("users").select("workspace_id").eq("id", user.id).single();
  if (!userRow) return NextResponse.json({ error: "Sin workspace" }, { status: 404 });

  const { data: integration } = await db
    .from("integrations")
    .select("access_token_encrypted, store_id")
    .eq("workspace_id", userRow.workspace_id)
    .eq("provider", "tiendanube")
    .eq("status", "active")
    .maybeSingle();

  if (!integration?.access_token_encrypted || !integration.store_id)
    return NextResponse.json({ error: "TiendaNube no conectado" }, { status: 404 });

  try {
    const accessToken = decrypt(integration.access_token_encrypted);
    const result = await syncAll(
      userRow.workspace_id,
      { accessToken, storeId: integration.store_id },
      mode
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[sync]", err);
    return NextResponse.json({ error: "Error durante la sincronización" }, { status: 500 });
  }
}

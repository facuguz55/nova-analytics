import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { syncAll } from "@/lib/tiendanube/sync";

export const maxDuration = 300;
export const runtime = "nodejs";

// Endpoint de uso único para sync inicial — protegido por service role key
function isAuthorized(req: Request): boolean {
  const key = req.headers.get("x-service-key");
  return key === process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient() as any;

  const { data: integrations } = await service
    .from("integrations")
    .select("workspace_id, access_token_encrypted, store_id")
    .eq("provider", "tiendanube")
    .eq("status", "active");

  if (!integrations?.length) {
    return NextResponse.json({ message: "Sin integraciones activas", synced: 0 });
  }

  const results = [];

  for (const int of integrations) {
    try {
      if (!int.access_token_encrypted || !int.store_id) continue;
      const accessToken = decrypt(int.access_token_encrypted);
      const result = await syncAll(
        int.workspace_id,
        { accessToken, storeId: int.store_id },
        "full"
      );
      results.push({ workspaceId: int.workspace_id, ...result, ok: true });
    } catch (err) {
      results.push({ workspaceId: int.workspace_id, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({ results, total: results.length });
}

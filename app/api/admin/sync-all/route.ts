import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUser } from "@/lib/supabase/cached-queries";
import { decrypt } from "@/lib/encryption";
import { syncOrders, syncCustomers } from "@/lib/tiendanube/sync";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((userRow as { role: string } | null)?.role !== "super_admin") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const service = createServiceClient();

  type IntRow = {
    workspace_id: string;
    access_token_encrypted: string | null;
    store_id: string | null;
    metadata: Record<string, string> | null;
  };

  const { data: integrations } = await service
    .from("integrations")
    .select("workspace_id, access_token_encrypted, store_id, metadata")
    .eq("provider", "tiendanube")
    .eq("status", "active");

  const results: { workspaceId: string; synced?: number; error?: string }[] = [];

  for (const int of (integrations ?? []) as IntRow[]) {
    try {
      if (!int.access_token_encrypted || !int.store_id) continue;
      const accessToken = decrypt(int.access_token_encrypted);
      const opts = { accessToken, storeId: int.store_id };

      const [ordersRes, customersRes] = await Promise.allSettled([
        syncOrders(int.workspace_id, opts, "full"),
        syncCustomers(int.workspace_id, opts, 3),
      ]);

      const synced =
        (ordersRes.status === "fulfilled" ? ordersRes.value.synced : 0) +
        (customersRes.status === "fulfilled" ? customersRes.value.synced : 0);

      results.push({ workspaceId: int.workspace_id, synced });
    } catch (err) {
      results.push({ workspaceId: int.workspace_id, error: String(err) });
    }
  }

  return NextResponse.json({ ok: true, results });
}

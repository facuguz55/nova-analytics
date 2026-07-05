import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { syncOrders, syncProducts, syncCustomers } from "@/lib/shopify/sync";

export const runtime = "nodejs";
export const maxDuration = 60;

// No es un Vercel Cron (Hobby ya usa sus 2 crons diarios) — este endpoint
// lo llama un scheduler externo (ej. cron-job.org) cada 1-2hs para mantener
// shopify_orders/shopify_products/shopify_customers al día.
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  type IntRow = {
    workspace_id: string;
    access_token_encrypted: string | null;
    store_id: string | null;
  };

  const { data: allIntegrations } = await service
    .from("integrations")
    .select("workspace_id, access_token_encrypted, store_id")
    .eq("provider", "shopify")
    .eq("status", "active");

  const results: {
    workspaceId: string;
    orders?: number; ordersError?: string;
    products?: number; productsError?: string;
    customers?: number; customersError?: string;
  }[] = [];

  for (const int of (allIntegrations ?? []) as IntRow[]) {
    if (!int.access_token_encrypted || !int.store_id) continue;
    try {
      const accessToken = decrypt(int.access_token_encrypted);
      const opts = { accessToken, shop: int.store_id };

      const [ordersResult, productsResult, customersResult] = await Promise.allSettled([
        syncOrders(int.workspace_id, opts, "incremental"),
        syncProducts(int.workspace_id, opts),
        syncCustomers(int.workspace_id, opts, 3),
      ]);

      results.push({
        workspaceId: int.workspace_id,
        orders:        ordersResult.status    === "fulfilled" ? ordersResult.value.synced    : undefined,
        ordersError:   ordersResult.status    === "rejected"  ? String(ordersResult.reason)   : undefined,
        products:      productsResult.status  === "fulfilled" ? productsResult.value.synced  : undefined,
        productsError: productsResult.status  === "rejected"  ? String(productsResult.reason) : undefined,
        customers:      customersResult.status === "fulfilled" ? customersResult.value.synced  : undefined,
        customersError: customersResult.status === "rejected"  ? String(customersResult.reason) : undefined,
      });
    } catch (err) {
      results.push({ workspaceId: int.workspace_id, ordersError: String(err) });
    }
  }

  return NextResponse.json({ results });
}

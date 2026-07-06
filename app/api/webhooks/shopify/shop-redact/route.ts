import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyShopifyWebhookHmac } from "@/lib/shopify/webhooks";

// Webhook de compliance obligatorio: Shopify lo manda 48hs después de que el
// comerciante desinstala la app. Hay que borrar todos los datos de esa tienda
// (no solo desconectar) — dejamos el workspace intacto, solo se borra lo
// ligado a Shopify.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhookHmac(rawBody, hmac, process.env.SHOPIFY_CLIENT_SECRET!)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as { shop_domain: string };

  const service = createServiceClient();

  const { data: integration } = await service
    .from("integrations")
    .select("workspace_id")
    .eq("provider", "shopify")
    .eq("store_id", payload.shop_domain)
    .maybeSingle();

  const workspaceId = (integration as { workspace_id: string } | null)?.workspace_id;

  if (workspaceId) {
    await Promise.allSettled([
      (service as any).from("shopify_orders").delete().eq("workspace_id", workspaceId),
      (service as any).from("shopify_products").delete().eq("workspace_id", workspaceId),
      (service as any).from("shopify_customers").delete().eq("workspace_id", workspaceId),
      service.from("integrations").delete().eq("workspace_id", workspaceId).eq("provider", "shopify"),
    ]);
  }

  await service.from("audit_logs").insert({
    workspace_id: workspaceId ?? null,
    user_id: null,
    action: "shopify_shop_redact",
    metadata: { shop_domain: payload.shop_domain },
  });

  return new NextResponse(null, { status: 200 });
}

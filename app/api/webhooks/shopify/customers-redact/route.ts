import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyShopifyWebhookHmac } from "@/lib/shopify/webhooks";

// Webhook de compliance obligatorio: un cliente final pidió borrar sus datos.
// Borramos su fila en shopify_customers y anonimizamos las órdenes que tenga
// asociadas (no borramos la orden entera — el registro de venta en sí no es
// dato personal, pero nombre/email del cliente sí).
export async function POST(req: Request) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhookHmac(rawBody, hmac, process.env.SHOPIFY_CLIENT_SECRET!)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    shop_domain: string;
    customer: { id: number; email: string };
  };

  const service = createServiceClient();

  const { data: integration } = await service
    .from("integrations")
    .select("workspace_id")
    .eq("provider", "shopify")
    .eq("store_id", payload.shop_domain)
    .maybeSingle();

  const workspaceId = (integration as { workspace_id: string } | null)?.workspace_id;

  if (workspaceId) {
    await (service as any)
      .from("shopify_customers")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("external_id", String(payload.customer.id));

    if (payload.customer.email) {
      await (service as any)
        .from("shopify_orders")
        .update({ customer_name: null, customer_email: null })
        .eq("workspace_id", workspaceId)
        .eq("customer_email", payload.customer.email);
    }
  }

  await service.from("audit_logs").insert({
    workspace_id: workspaceId ?? null,
    user_id: null,
    action: "shopify_customer_redact",
    metadata: { shop_domain: payload.shop_domain, customer_id: payload.customer?.id },
  });

  return new NextResponse(null, { status: 200 });
}

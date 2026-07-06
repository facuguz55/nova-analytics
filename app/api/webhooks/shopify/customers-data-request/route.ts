import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyShopifyWebhookHmac } from "@/lib/shopify/webhooks";

// Webhook de compliance obligatorio para distribución pública de Shopify.
// Un comerciante le pide a Shopify los datos de un cliente final; Shopify nos
// avisa acá. No hay UI de exportación automática todavía — se deja registrado
// en audit_logs para que el equipo responda manualmente al pedido dentro del
// plazo que exige Shopify.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhookHmac(rawBody, hmac, process.env.SHOPIFY_CLIENT_SECRET!)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    shop_domain: string;
    customer: { id: number; email: string; phone?: string };
    orders_requested?: number[];
  };

  const service = createServiceClient();

  const { data: integration } = await service
    .from("integrations")
    .select("workspace_id")
    .eq("provider", "shopify")
    .eq("store_id", payload.shop_domain)
    .maybeSingle();

  await service.from("audit_logs").insert({
    workspace_id: (integration as { workspace_id: string } | null)?.workspace_id ?? null,
    user_id: null,
    action: "shopify_customer_data_request",
    metadata: {
      shop_domain: payload.shop_domain,
      customer_id: payload.customer?.id,
      customer_email: payload.customer?.email,
      orders_requested: payload.orders_requested ?? [],
    },
  });

  return new NextResponse(null, { status: 200 });
}

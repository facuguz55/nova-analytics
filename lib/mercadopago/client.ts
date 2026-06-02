import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function createMercadoPagoCheckoutUrl(
  workspaceId: string,
  email: string
): Promise<string> {
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: "nova-analytics-pro",
          title: "Nova Analytics — Plan Pro",
          quantity: 1,
          unit_price: 29900,
          currency_id: "ARS",
        },
      ],
      payer: { email },
      external_reference: workspaceId,
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/app/dashboard?billing=success`,
        failure: `${process.env.NEXTAUTH_URL}/billing?billing=failed`,
        pending: `${process.env.NEXTAUTH_URL}/billing?billing=pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
    },
  });

  if (!result.init_point) throw new Error("MercadoPago no devolvió URL de pago");
  return result.init_point;
}

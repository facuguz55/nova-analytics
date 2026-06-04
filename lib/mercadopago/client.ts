import { MercadoPagoConfig, PreApproval } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function createSubscriptionUrl(
  workspaceId: string,
  email: string
): Promise<string> {
  const preApproval = new PreApproval(client);

  const result = await preApproval.create({
    body: {
      reason: "Nova Analytics — Plan Pro",
      external_reference: workspaceId,
      back_url: "https://analytics.novaagency.info/app/dashboard",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 77000,
        currency_id: "ARS",
      },
      status: "pending",
    },
  });

  if (!result.init_point) throw new Error("MercadoPago no devolvió URL de pago");
  return result.init_point;
}

export { client as mpClient };

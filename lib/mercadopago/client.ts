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
      preapproval_plan_id: process.env.MERCADOPAGO_PLAN_ID!,
      payer_email: email,
      external_reference: workspaceId,
      back_url: "https://analytics.novaagency.info/app/dashboard",
    },
  });

  if (!result.init_point) throw new Error("MercadoPago no devolvió URL de pago");
  return result.init_point;
}

export { client as mpClient };

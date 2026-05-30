import {
  lemonSqueezySetup,
  createCheckout,
  updateSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";

function setup() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });
}

export async function createCheckoutUrl(
  workspaceId: string,
  email: string
): Promise<string> {
  setup();

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID!;

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutOptions: { embed: false },
    checkoutData: {
      email,
      custom: { workspace_id: workspaceId },
    },
    productOptions: {
      redirectUrl: "https://nova-analytics-psi.vercel.app/app/dashboard",
      receiptButtonText: "Ir al dashboard",
    },
  });

  if (error || !data?.data?.attributes?.url) {
    throw new Error(error?.message ?? "No se pudo generar el checkout");
  }

  return data.data.attributes.url;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  setup();
  const { error } = await updateSubscription(subscriptionId, { cancelled: true });
  if (error) throw new Error(error.message ?? "No se pudo cancelar la suscripción");
}

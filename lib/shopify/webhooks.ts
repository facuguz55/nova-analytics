import { createHmac, timingSafeEqual } from "crypto";

// Shopify firma el body crudo (sin re-serializar) con HMAC-SHA256 + base64,
// usando el Client Secret de la app. Hay que verificar ANTES de hacer JSON.parse.
export function verifyShopifyWebhookHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;

  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

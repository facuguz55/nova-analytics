import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { PreApproval } from "mercadopago";
import { mpClient } from "@/lib/mercadopago/client";
import { createServiceClient } from "@/lib/supabase/service";

type MpNotification = {
  action: string;
  api_version: string;
  data: { id: string };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
};

// Verifica la firma x-signature de MercadoPago.
// Formato: ts=<timestamp>,v1=<hmac_sha256>
// HMAC sobre: "id:<dataId>;request-id:<xRequestId>;ts:<ts>"
function verifySignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null
): boolean {
  if (!xSignature || !xRequestId || !dataId) return false;

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  let ts: string | undefined;
  let hash: string | undefined;

  for (const part of xSignature.split(",")) {
    const [key, val] = part.trim().split("=");
    if (key === "ts") ts = val;
    if (key === "v1") hash = val;
  }

  if (!ts || !hash) return false;

  const message = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
  const expected = createHmac("sha256", secret).update(message).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  } catch {
    return false;
  }
}

async function upsertSubscription(
  workspaceId: string,
  fields: {
    status: string;
    provider_subscription_id?: string;
    cancelled_at?: string | null;
    next_billing_at?: string | null;
  }
) {
  const service = createServiceClient();
  await service.from("subscriptions").upsert(
    {
      workspace_id: workspaceId,
      provider: "mercadopago",
      status: fields.status,
      ...(fields.provider_subscription_id !== undefined && {
        provider_subscription_id: fields.provider_subscription_id,
      }),
      ...(fields.cancelled_at !== undefined && {
        cancelled_at: fields.cancelled_at,
      }),
      ...(fields.next_billing_at !== undefined && {
        next_billing_at: fields.next_billing_at,
      }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" }
  );
}

async function updateWorkspacePlan(workspaceId: string, plan: string) {
  const service = createServiceClient();
  await service.from("workspaces").update({ plan }).eq("id", workspaceId);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const url = new URL(request.url);

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  // MP envía el id del recurso como query param "data.id"
  const dataId = url.searchParams.get("data.id");

  if (!verifySignature(xSignature, xRequestId, dataId)) {
    console.warn("[webhook/mercadopago] firma inválida", { xSignature, xRequestId, dataId });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: MpNotification;
  try {
    payload = JSON.parse(rawBody) as MpNotification;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  // Solo procesamos eventos de preapproval (suscripciones)
  if (payload.type !== "subscription_preapproval") {
    return NextResponse.json({ received: true });
  }

  const preapprovalId = payload.data?.id;
  if (!preapprovalId) {
    return NextResponse.json({ received: true });
  }

  try {
    const preApproval = new PreApproval(mpClient);
    const sub = await preApproval.get({ id: preapprovalId });

    const workspaceId = sub.external_reference;
    const status = sub.status;

    if (!workspaceId) {
      console.warn("[webhook/mercadopago] sin external_reference en preapproval", preapprovalId);
      return NextResponse.json({ received: true });
    }

    // Fecha del próximo cobro que reporta MP — alimenta la red de seguridad del middleware.
    // Si MP no la manda, caemos a 'autorización + 1 mes' como cota superior.
    const mpNext = (sub as { next_payment_date?: string }).next_payment_date;
    const nextBillingAt = mpNext
      ? new Date(mpNext).toISOString()
      : new Date(Date.now() + 31 * 86_400_000).toISOString();

    switch (status) {
      case "authorized": {
        await upsertSubscription(workspaceId, {
          status: "active",
          provider_subscription_id: preapprovalId,
          cancelled_at: null,
          next_billing_at: nextBillingAt,
        });
        await updateWorkspacePlan(workspaceId, "active");
        break;
      }

      case "cancelled":
      case "paused": {
        // No tocamos next_billing_at ni el plan: el usuario conserva acceso
        // hasta el fin del período que ya pagó. Cuando MP mande 'expired'
        // (o venza next_billing_at) se corta. hasActiveAccess lo resuelve.
        await upsertSubscription(workspaceId, {
          status: "cancelled",
          provider_subscription_id: preapprovalId,
          cancelled_at: new Date().toISOString(),
        });
        break;
      }

      case "expired": {
        await upsertSubscription(workspaceId, {
          status: "expired",
          provider_subscription_id: preapprovalId,
        });
        await updateWorkspacePlan(workspaceId, "free");
        break;
      }

      default:
        // pending u otros — no modificamos el plan
        break;
    }
  } catch (err) {
    console.error("[webhook/mercadopago] error al procesar:", err);
    // Devolver 200 para que MP no reintente indefinidamente con el mismo error
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

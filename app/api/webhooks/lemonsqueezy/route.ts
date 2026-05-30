import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

type SubscriptionAttributes = {
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  customer_id: number;
};

type LsPayload = {
  meta: {
    event_name: string;
    custom_data?: { workspace_id?: string };
  };
  data: {
    id: string;
    type: string;
    attributes: SubscriptionAttributes & Record<string, unknown>;
  };
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hash = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function upsertSubscription(
  workspaceId: string,
  fields: {
    status: string;
    provider_subscription_id?: string;
    provider_customer_id?: string;
    next_billing_at?: string | null;
    cancelled_at?: string | null;
  }
) {
  const service = createServiceClient();

  const now = new Date().toISOString();

  await service
    .from("subscriptions")
    .upsert(
      {
        workspace_id: workspaceId,
        provider: "lemonsqueezy",
        status: fields.status,
        ...(fields.provider_subscription_id !== undefined && {
          provider_subscription_id: fields.provider_subscription_id,
        }),
        ...(fields.provider_customer_id !== undefined && {
          provider_customer_id: fields.provider_customer_id,
        }),
        ...(fields.next_billing_at !== undefined && {
          next_billing_at: fields.next_billing_at,
        }),
        ...(fields.cancelled_at !== undefined && {
          cancelled_at: fields.cancelled_at,
        }),
        updated_at: now,
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
  const signature = request.headers.get("x-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: LsPayload;
  try {
    payload = JSON.parse(rawBody) as LsPayload;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const workspaceId = payload.meta?.custom_data?.workspace_id;

  if (!workspaceId) {
    // Sin workspace_id no podemos asociar la suscripción
    return NextResponse.json({ received: true });
  }

  const subscriptionId = payload.data?.id;
  const attrs = payload.data?.attributes as SubscriptionAttributes;
  const customerId = attrs?.customer_id?.toString();

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "order_created": {
      const nextBilling =
        eventName !== "order_created" ? (attrs?.renews_at ?? null) : null;

      await upsertSubscription(workspaceId, {
        status: "active",
        ...(eventName !== "order_created" && {
          provider_subscription_id: subscriptionId,
        }),
        ...(customerId && { provider_customer_id: customerId }),
        next_billing_at: nextBilling,
        cancelled_at: null,
      });
      await updateWorkspacePlan(workspaceId, "active");
      break;
    }

    case "subscription_cancelled": {
      await upsertSubscription(workspaceId, {
        status: "cancelled",
        provider_subscription_id: subscriptionId,
        cancelled_at: new Date().toISOString(),
      });
      break;
    }

    case "subscription_expired": {
      await upsertSubscription(workspaceId, {
        status: "expired",
        provider_subscription_id: subscriptionId,
      });
      await updateWorkspacePlan(workspaceId, "free");
      break;
    }

    default:
      // Evento no manejado — responder OK igual para evitar reintentos
      break;
  }

  return NextResponse.json({ received: true });
}

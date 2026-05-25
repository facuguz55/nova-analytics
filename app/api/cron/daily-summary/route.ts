import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { getOrdersForRange, getCustomers } from "@/lib/tiendanube/client";
import { sendTelegramMessage, TelegramMessages } from "@/lib/telegram";

export const runtime = "nodejs";

// Vercel cron — solo se llama desde Vercel con el header correcto
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // Obtener todos los workspaces con notificaciones activas
  type NotifRow = {
    workspace_id: string;
    telegram_chat_id: string | null;
    telegram_enabled: boolean;
    daily_summary_enabled: boolean;
    daily_summary_time: string;
  };
  type IntRow = {
    workspace_id: string;
    access_token_encrypted: string | null;
    store_id: string | null;
    metadata: Record<string, string> | null;
  };

  const { data: configs } = await service
    .from("notification_config")
    .select("workspace_id, telegram_chat_id, telegram_enabled, daily_summary_enabled, daily_summary_time")
    .eq("daily_summary_enabled", true);

  if (!configs || configs.length === 0) {
    return NextResponse.json({ message: "Sin workspaces con resumen diario activo" });
  }

  const results: { workspaceId: string; status: string }[] = [];

  for (const cfg of configs as NotifRow[]) {
    try {
      // Obtener integración TiendaNube del workspace
      const { data: integration } = await service
        .from("integrations")
        .select("access_token_encrypted, store_id, metadata")
        .eq("workspace_id", cfg.workspace_id)
        .eq("provider", "tiendanube")
        .eq("status", "active")
        .maybeSingle();

      const int = integration as IntRow | null;
      if (!int?.access_token_encrypted || !int.store_id) continue;

      const accessToken = decrypt(int.access_token_encrypted);
      const opts        = { accessToken, storeId: int.store_id };
      const storeName   = int.metadata?.store_name ?? "Tu tienda";

      // Obtener datos del día
      const today    = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const [ordersRes, customersRes] = await Promise.allSettled([
        getOrdersForRange(opts, { since: todayStr, until: todayStr }),
        getCustomers(opts, 1, 100),
      ]);

      const orders    = ordersRes.status === "fulfilled" ? ordersRes.value : [];
      const customers = customersRes.status === "fulfilled" ? customersRes.value : [];

      const paidOrders = orders.filter((o) => o.payment_status === "paid" || o.status === "closed");
      const revenue    = paidOrders.reduce((a, o) => a + parseFloat(o.total), 0);
      const newCustomers = customers.filter((c) => {
        return new Date(c.created_at).toISOString().split("T")[0] === todayStr;
      }).length;

      const dateLabel = today.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" });

      const text = TelegramMessages.dailySummary({
        storeName,
        revenue,
        orders: paidOrders.length,
        newCustomers,
        date: dateLabel,
      });

      // Enviar Telegram si está configurado
      if (cfg.telegram_enabled && cfg.telegram_chat_id) {
        await sendTelegramMessage(cfg.telegram_chat_id, text, "HTML");
      }

      results.push({ workspaceId: cfg.workspace_id, status: "sent" });
    } catch (err) {
      results.push({ workspaceId: cfg.workspace_id, status: `error: ${String(err)}` });
    }
  }

  return NextResponse.json({ results });
}

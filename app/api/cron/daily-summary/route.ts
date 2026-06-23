import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { getOrdersForRange, getCustomers } from "@/lib/tiendanube/client";
import { sendTelegramMessage, TelegramMessages } from "@/lib/telegram";

export const runtime = "nodejs";

// Vercel Hobby: máximo 2 cron jobs
// Este cron corre a las 20:00 y hace: resumen diario + check VIP inactivos

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

  type NotifRow = {
    workspace_id: string;
    telegram_chat_id: string | null;
    telegram_enabled: boolean;
    daily_summary_enabled: boolean;
    daily_summary_time: string;
    alert_vip_inactive_days: number;
  };
  type IntRow = {
    workspace_id: string;
    access_token_encrypted: string | null;
    store_id: string | null;
    metadata: Record<string, string> | null;
  };

  const { data: configs } = await service
    .from("notification_config")
    .select("workspace_id, telegram_chat_id, telegram_enabled, daily_summary_enabled, daily_summary_time, alert_vip_inactive_days");

  if (!configs || configs.length === 0) {
    return NextResponse.json({ message: "Sin configuraciones de notificación" });
  }

  const results: { workspaceId: string; summary?: string; vip?: string }[] = [];

  for (const cfg of configs as NotifRow[]) {
    try {
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

      // ── 0. SYNC INCREMENTAL ────────────────────────────────────────
      try {
        const { syncOrders, syncCustomers } = await import("@/lib/tiendanube/sync");
        await Promise.allSettled([
          syncOrders(cfg.workspace_id, opts, "incremental"),
          syncCustomers(cfg.workspace_id, opts, 3),
        ]);
      } catch (syncErr) {
        console.error("[cron] sync error:", syncErr);
      }

      const today    = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const result: { workspaceId: string; summary?: string; vip?: string } = {
        workspaceId: cfg.workspace_id,
      };

      // ── 1. RESUMEN DIARIO ──────────────────────────────────────────
      if (cfg.daily_summary_enabled) {
        try {
          const [ordersRes, customersRes] = await Promise.allSettled([
            getOrdersForRange(opts, { since: todayStr, until: todayStr }),
            getCustomers(opts, 1, 100),
          ]);

          const orders      = ordersRes.status === "fulfilled" ? ordersRes.value : [];
          const customers   = customersRes.status === "fulfilled" ? customersRes.value : [];
          const paidOrders  = orders.filter((o) => o.payment_status === "paid" || o.status === "closed");
          const revenue     = paidOrders.reduce((a, o) => a + parseFloat(o.total), 0);
          const newCustomers = customers.filter((c) => {
            return new Date(c.created_at).toISOString().split("T")[0] === todayStr;
          }).length;

          const dateLabel = today.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" });

          if (cfg.telegram_enabled && cfg.telegram_chat_id) {
            const text = TelegramMessages.dailySummary({
              storeName,
              revenue,
              orders: paidOrders.length,
              newCustomers,
              date: dateLabel,
            });
            await sendTelegramMessage(cfg.telegram_chat_id, text, "HTML");
          }
          result.summary = "sent";
        } catch {
          result.summary = "error";
        }
      }

      // ── 2. CLIENTES VIP INACTIVOS ─────────────────────────────────
      try {
        const inactiveDays = cfg.alert_vip_inactive_days ?? 30;
        const [p1, p2] = await Promise.allSettled([
          getCustomers(opts, 1, 100),
          getCustomers(opts, 2, 100),
        ]);
        const allCustomers = [
          ...(p1.status === "fulfilled" ? p1.value : []),
          ...(p2.status === "fulfilled" ? p2.value : []),
        ];

        const vipCustomers = allCustomers.filter((c) => c.orders_count > 1);
        const now          = Date.now();

        let vipCount = 0;
        for (const vip of vipCustomers) {
          const lastActivity = new Date(vip.created_at).getTime();
          const daysSince    = Math.floor((now - lastActivity) / 86400000);

          if (daysSince < inactiveDays) continue;

          // Deduplicar — solo alertar una vez por semana por cliente
          const { data: existing } = await service
            .from("alerts")
            .select("id")
            .eq("workspace_id", cfg.workspace_id)
            .like("title", `%${vip.email}%`)
            .gte("created_at", new Date(now - 7 * 86400000).toISOString())
            .maybeSingle();

          if (existing) continue;

          await service.from("alerts").insert({
            workspace_id: cfg.workspace_id,
            type:         "warning",
            title:        `Cliente VIP inactivo: ${vip.name}`,
            body:         `${vip.email} tiene ${vip.orders_count} órdenes pero no compra hace ${daysSince} días. Total gastado: $${parseFloat(vip.total_spent).toLocaleString("es-AR")}`,
            read:         false,
          });

          if (cfg.telegram_enabled && cfg.telegram_chat_id) {
            const text = TelegramMessages.vipInactiveAlert({
              customerName: vip.name,
              email:        vip.email,
              daysSince,
              totalSpent:   parseFloat(vip.total_spent),
            });
            await sendTelegramMessage(cfg.telegram_chat_id, text, "HTML");
          }
          vipCount++;
        }
        result.vip = `${vipCount} alertas`;
      } catch {
        result.vip = "error";
      }

      results.push(result);
    } catch (err) {
      results.push({ workspaceId: cfg.workspace_id, summary: `error: ${String(err)}` });
    }
  }

  return NextResponse.json({ results });
}

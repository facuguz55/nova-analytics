import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { getCustomers } from "@/lib/tiendanube/client";
import { sendTelegramMessage, TelegramMessages } from "@/lib/telegram";
import { syncOrders, syncCustomers } from "@/lib/tiendanube/sync";

export const runtime = "nodejs";

// Vercel Hobby: máximo 2 cron jobs
// Este cron corre a las 20:00 y hace:
//   1. Sync incremental de TODOS los workspaces con TN conectado
//   2. Resumen diario + check VIP (solo workspaces con notification_config)

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
  const db = service as any;

  type IntRow = {
    workspace_id: string;
    access_token_encrypted: string | null;
    store_id: string | null;
    metadata: Record<string, string> | null;
  };
  type NotifRow = {
    workspace_id: string;
    telegram_chat_id: string | null;
    telegram_enabled: boolean;
    daily_summary_enabled: boolean;
    daily_summary_time: string;
    alert_vip_inactive_days: number;
  };

  // ── PASO 1: Sync incremental de TODOS los workspaces activos ──────────
  const { data: allIntegrations } = await service
    .from("integrations")
    .select("workspace_id, access_token_encrypted, store_id, metadata")
    .eq("provider", "tiendanube")
    .eq("status", "active");

  const syncResults: { workspaceId: string; synced?: number; error?: string }[] = [];

  for (const int of (allIntegrations ?? []) as IntRow[]) {
    try {
      if (!int.access_token_encrypted || !int.store_id) continue;
      const accessToken = decrypt(int.access_token_encrypted);
      const opts = { accessToken, storeId: int.store_id };

      const [ordersResult, customersResult] = await Promise.allSettled([
        syncOrders(int.workspace_id, opts, "incremental"),
        syncCustomers(int.workspace_id, opts, 3),
      ]);

      const synced = (ordersResult.status === "fulfilled" ? ordersResult.value.synced : 0)
                   + (customersResult.status === "fulfilled" ? customersResult.value.synced : 0);
      syncResults.push({ workspaceId: int.workspace_id, synced });
    } catch (err) {
      syncResults.push({ workspaceId: int.workspace_id, error: String(err) });
    }
  }

  // ── PASO 2: Notificaciones (solo workspaces con notification_config) ──
  const { data: configs } = await service
    .from("notification_config")
    .select("workspace_id, telegram_chat_id, telegram_enabled, daily_summary_enabled, daily_summary_time, alert_vip_inactive_days");

  if (!configs || configs.length === 0) {
    return NextResponse.json({ syncResults, message: "Sin configuraciones de notificación" });
  }

  const notifResults: { workspaceId: string; summary?: string; vip?: string }[] = [];

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

      const today    = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const result: { workspaceId: string; summary?: string; vip?: string } = {
        workspaceId: cfg.workspace_id,
      };

      // ── Resumen diario (lee de Supabase — ya sincronizado en paso 1) ──
      if (cfg.daily_summary_enabled) {
        try {
          const [ordersRes, newCustRes] = await Promise.allSettled([
            db.from("tn_orders")
              .select("total, payment_status, status")
              .eq("workspace_id", cfg.workspace_id)
              .gte("created_at", `${todayStr}T00:00:00.000Z`)
              .lte("created_at", `${todayStr}T23:59:59.999Z`),
            db.from("tn_customers")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", cfg.workspace_id)
              .gte("created_at_tn", `${todayStr}T00:00:00.000Z`),
          ]);

          const orders = ordersRes.status === "fulfilled" ? (ordersRes.value.data ?? []) : [];
          const paidOrders = orders.filter((o: any) => o.payment_status === "paid" || o.status === "closed");
          const revenue = paidOrders.reduce((a: number, o: any) => a + parseFloat(o.total), 0);
          const newCustomers = newCustRes.status === "fulfilled" ? (newCustRes.value.count ?? 0) : 0;
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

      // ── Clientes VIP inactivos (lee de Supabase) ─────────────────────
      try {
        const inactiveDays = cfg.alert_vip_inactive_days ?? 30;
        const { data: vipRaw } = await db
          .from("tn_customers")
          .select("external_id, name, email, orders_count, total_spent, created_at_tn")
          .eq("workspace_id", cfg.workspace_id)
          .gt("orders_count", 1)
          .order("total_spent", { ascending: false })
          .limit(200);

        const now = Date.now();
        let vipCount = 0;

        for (const vip of (vipRaw ?? []) as any[]) {
          const lastActivity = new Date(vip.created_at_tn ?? 0).getTime();
          const daysSince    = Math.floor((now - lastActivity) / 86400000);
          if (daysSince < inactiveDays) continue;

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

      notifResults.push(result);
    } catch (err) {
      notifResults.push({ workspaceId: cfg.workspace_id, summary: `error: ${String(err)}` });
    }
  }

  return NextResponse.json({ syncResults, notifResults });
}

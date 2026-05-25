import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { getCustomers } from "@/lib/tiendanube/client";
import { sendTelegramMessage, TelegramMessages } from "@/lib/telegram";

export const runtime = "nodejs";

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

  type IntRow = { workspace_id: string; access_token_encrypted: string | null; store_id: string | null };
  type NotifRow = {
    workspace_id: string;
    telegram_chat_id: string | null;
    telegram_enabled: boolean;
    alert_vip_inactive_days: number;
  };

  const { data: integrations } = await service
    .from("integrations")
    .select("workspace_id, access_token_encrypted, store_id")
    .eq("provider", "tiendanube")
    .eq("status", "active");

  if (!integrations?.length) return NextResponse.json({ message: "Sin integraciones" });

  for (const int of integrations as IntRow[]) {
    try {
      if (!int.access_token_encrypted || !int.store_id) continue;
      const accessToken = decrypt(int.access_token_encrypted);
      const opts        = { accessToken, storeId: int.store_id };

      // Obtener config de notificaciones
      const { data: notifCfg } = await service
        .from("notification_config")
        .select("telegram_chat_id, telegram_enabled, alert_vip_inactive_days")
        .eq("workspace_id", int.workspace_id)
        .maybeSingle();

      const cfg          = notifCfg as NotifRow | null;
      const inactiveDays = cfg?.alert_vip_inactive_days ?? 30;

      // Obtener clientes VIP (más de 1 orden)
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
      const threshold    = inactiveDays * 86400000;

      for (const vip of vipCustomers) {
        // TiendaNube no da last_order_date directamente; usamos created_at del cliente como aproximación
        // En producción, esto se mejora cargando sus órdenes individuales
        const lastActivity = new Date(vip.created_at).getTime();
        const daysSince    = Math.floor((now - lastActivity) / 86400000);

        if (daysSince >= inactiveDays) {
          // Crear alerta en DB (deduplicar — verificar si ya existe una reciente)
          const { data: existing } = await service
            .from("alerts")
            .select("id")
            .eq("workspace_id", int.workspace_id)
            .like("title", `%${vip.email}%`)
            .gte("created_at", new Date(now - 7 * 86400000).toISOString())
            .maybeSingle();

          if (existing) continue; // ya se notificó esta semana

          await service.from("alerts").insert({
            workspace_id: int.workspace_id,
            type:         "warning",
            title:        `Cliente VIP inactivo: ${vip.name}`,
            body:         `${vip.email} tiene ${vip.orders_count} órdenes pero no compra hace ${daysSince} días. Total gastado: $${parseFloat(vip.total_spent).toLocaleString("es-AR")}`,
            read:         false,
          });

          if (cfg?.telegram_enabled && cfg.telegram_chat_id) {
            const text = TelegramMessages.vipInactiveAlert({
              customerName: vip.name,
              email:        vip.email,
              daysSince,
              totalSpent:   parseFloat(vip.total_spent),
            });
            await sendTelegramMessage(cfg.telegram_chat_id, text, "HTML");
          }
        }
      }
    } catch {
      // Continuar
    }
  }

  return NextResponse.json({ ok: true });
}

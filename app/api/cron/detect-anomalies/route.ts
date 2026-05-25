import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { getOrdersForRange } from "@/lib/tiendanube/client";
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
  type NotifRow = { workspace_id: string; telegram_chat_id: string | null; telegram_enabled: boolean };

  const { data: integrations } = await service
    .from("integrations")
    .select("workspace_id, access_token_encrypted, store_id")
    .eq("provider", "tiendanube")
    .eq("status", "active");

  if (!integrations?.length) return NextResponse.json({ message: "Sin integraciones activas" });

  const now       = new Date();
  const todayStr  = now.toISOString().split("T")[0];
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const ystrdyStr = yesterday.toISOString().split("T")[0];

  const ANOMALY_THRESHOLD = 0.4; // 40% de caída o subida dispara alerta

  for (const int of integrations as IntRow[]) {
    try {
      if (!int.access_token_encrypted || !int.store_id) continue;
      const accessToken = decrypt(int.access_token_encrypted);
      const opts        = { accessToken, storeId: int.store_id };

      const [todayRes, ystrdyRes] = await Promise.allSettled([
        getOrdersForRange(opts, { since: todayStr, until: todayStr }),
        getOrdersForRange(opts, { since: ystrdyStr, until: ystrdyStr }),
      ]);

      if (todayRes.status !== "fulfilled" || ystrdyRes.status !== "fulfilled") continue;

      const todayPaid  = todayRes.value.filter((o) => o.payment_status === "paid" || o.status === "closed");
      const ystrdyPaid = ystrdyRes.value.filter((o) => o.payment_status === "paid" || o.status === "closed");
      const todayRev   = todayPaid.reduce((a, o)  => a + parseFloat(o.total), 0);
      const ystrdyRev  = ystrdyPaid.reduce((a, o) => a + parseFloat(o.total), 0);

      if (ystrdyRev === 0) continue; // sin base de comparación

      const pctChange = (todayRev - ystrdyRev) / ystrdyRev;
      const isAnomaly = Math.abs(pctChange) >= ANOMALY_THRESHOLD;
      if (!isAnomaly) continue;

      // Guardar alerta en DB
      await service.from("alerts").insert({
        workspace_id: int.workspace_id,
        type:         pctChange < 0 ? "warning" : "info",
        title:        pctChange < 0
          ? `⚠️ Caída de ventas detectada (${Math.abs(pctChange * 100).toFixed(0)}%)`
          : `📈 Pico de ventas detectado (+${(pctChange * 100).toFixed(0)}%)`,
        body: pctChange < 0
          ? `Las ventas de hoy ($${todayRev.toLocaleString("es-AR")}) cayeron ${Math.abs(pctChange * 100).toFixed(0)}% respecto a ayer ($${ystrdyRev.toLocaleString("es-AR")}). Revisá si hay problemas con medios de pago o campañas.`
          : `Las ventas de hoy ($${todayRev.toLocaleString("es-AR")}) subieron ${(pctChange * 100).toFixed(0)}% respecto a ayer. ¡Buen momento para capitalizar el tráfico!`,
        read: false,
      });

      // Notificación Telegram si está configurado
      const { data: notifCfg } = await service
        .from("notification_config")
        .select("telegram_chat_id, telegram_enabled")
        .eq("workspace_id", int.workspace_id)
        .maybeSingle();

      const cfg = notifCfg as NotifRow | null;
      if (cfg?.telegram_enabled && cfg.telegram_chat_id) {
        const text = TelegramMessages.anomalyAlert({
          type:      pctChange < 0 ? "drop" : "spike",
          metric:    "Ventas del día",
          pctChange: pctChange * 100,
        });
        await sendTelegramMessage(cfg.telegram_chat_id, text, "HTML");
      }
    } catch {
      // Continuar con el siguiente workspace si uno falla
    }
  }

  return NextResponse.json({ ok: true, checked: integrations.length });
}

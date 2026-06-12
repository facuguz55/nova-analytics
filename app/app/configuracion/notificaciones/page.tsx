import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import NotificacionesClient from "./NotificacionesClient";

export const metadata: Metadata = { title: "Notificaciones" };

export default async function NotificacionesPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data: rawRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  const workspaceId = (rawRow as any)?.workspace_id as string | null;

  // Cargar configuración de notificaciones existente
  let notifConfig: {
    telegram_chat_id: string | null;
    telegram_enabled: boolean;
    whatsapp_phone: string | null;
    whatsapp_enabled: boolean;
    daily_summary_enabled: boolean;
    daily_summary_time: string;
    alert_vip_inactive_days: number;
    alert_big_sale_threshold: number;
  } | null = null;

  if (workspaceId) {
    const { data } = await (supabase as any)
      .from("notification_config")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    notifConfig = data;
  }

  return (
    <NotificacionesClient
      userEmail={user.email ?? ""}
      workspaceId={workspaceId}
      config={notifConfig}
    />
  );
}

import type { Metadata } from "next";
import AnalisisClient from "./AnalisisClient";
import { createClient } from "@/lib/supabase/server";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getOrders } from "@/lib/tiendanube/client";
import type { TNOrder } from "@/lib/tiendanube/client";

export const metadata: Metadata = { title: "Análisis" };

// Mapea presets a rango de fechas
function presetToDates(preset: string): { since: string; until: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (preset === "hoy") {
    return { since: today, until: today };
  }
  if (preset === "ayer") {
    const d = new Date(now); d.setDate(d.getDate() - 1);
    const s = d.toISOString().split("T")[0];
    return { since: s, until: s };
  }
  const daysMap: Record<string, number> = {
    "7d": 7, "15d": 15, "30d": 30, "60d": 60, "90d": 90,
  };
  const days = daysMap[preset];
  if (days) {
    const d = new Date(now); d.setDate(d.getDate() - days);
    return { since: d.toISOString().split("T")[0], until: today };
  }
  // default 30d
  const d = new Date(now); d.setDate(d.getDate() - 30);
  return { since: d.toISOString().split("T")[0], until: today };
}

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; since?: string; until?: string }>;
}) {
  const params = await searchParams;

  // Determinar rango
  let since: string;
  let until: string;
  let activePreset: string;

  const VALID_PRESETS = ["hoy", "ayer", "7d", "15d", "30d", "60d", "90d"];

  if (params.since && params.until) {
    // Rango custom
    since = params.since;
    until = params.until;
    activePreset = "custom";
  } else if (params.preset && VALID_PRESETS.includes(params.preset)) {
    activePreset = params.preset;
    const range = presetToDates(params.preset);
    since = range.since;
    until = range.until;
  } else {
    // Default: 30d
    activePreset = "30d";
    const range = presetToDates("30d");
    since = range.since;
    until = range.until;
  }

  // Obtener usd_rate del workspace
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let usdRate = 1100;
  if (user) {
    const { data: rawUserRow } = await supabase
      .from("users").select("workspace_id").eq("id", user.id).single();
    const workspaceId = (rawUserRow as unknown as { workspace_id: string | null } | null)?.workspace_id;
    if (workspaceId) {
      const { data: rawCfg } = await supabase
        .from("financial_config").select("usd_rate").eq("workspace_id", workspaceId).single();
      usdRate = (rawCfg as unknown as { usd_rate: number } | null)?.usd_rate ?? 1100;
    }
  }

  const connection = await getTiendaNubeConnection();

  if (!connection) {
    return (
      <AnalisisClient
        initialOrders={[]}
        since={since}
        until={until}
        activePreset={activePreset}
        usdRate={usdRate}
        isConnected={false}
      />
    );
  }

  let initialOrders: TNOrder[] = [];
  try {
    initialOrders = await getOrders(connection.opts, 1, 100, { since });
  } catch {
    // El cliente mostrará error
  }

  return (
    <AnalisisClient
      initialOrders={initialOrders}
      since={since}
      until={until}
      activePreset={activePreset}
      usdRate={usdRate}
      isConnected={true}
    />
  );
}

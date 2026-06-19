import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import HQClient from "./HQClient";

export const metadata: Metadata = { title: "HQ Admin — Vista Global" };

export default async function HQPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((userRow as { role: string } | null)?.role !== "super_admin") redirect("/app/dashboard");

  type WsRow = { id: string; name: string; plan: string; status: string; created_at: string };
  type IntRow = { workspace_id: string; provider: string; status: string; metadata: Record<string, string> | null };

  const [wsRes, intRes] = await Promise.allSettled([
    supabase.from("workspaces").select("id, name, plan, status, created_at").order("created_at", { ascending: false }),
    supabase.from("integrations").select("workspace_id, provider, status, metadata").eq("status", "active"),
  ]);

  const workspaces = (wsRes.status === "fulfilled" ? wsRes.value.data ?? [] : []) as WsRow[];
  const integrations = (intRes.status === "fulfilled" ? intRes.value.data ?? [] : []) as IntRow[];

  // Mapa workspace_id → providers activos
  const intMap = new Map<string, { providers: string[]; tnStoreName: string | null }>();
  integrations.forEach((i) => {
    const prev = intMap.get(i.workspace_id) ?? { providers: [], tnStoreName: null };
    intMap.set(i.workspace_id, {
      providers: [...prev.providers, i.provider],
      tnStoreName: i.provider === "tiendanube" ? (i.metadata?.store_name ?? null) : prev.tnStoreName,
    });
  });

  const enriched = workspaces.map((ws) => {
    const info = intMap.get(ws.id) ?? { providers: [], tnStoreName: null };
    return {
      ...ws,
      providers: info.providers,
      hasTiendanube: info.providers.includes("tiendanube"),
      storeName: info.tnStoreName,
    };
  });

  return <HQClient workspaces={enriched} />;
}

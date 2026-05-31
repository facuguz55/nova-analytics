import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getProducts } from "@/lib/tiendanube/client";
import FinancieraHub from "./FinancieraHub";

export const metadata: Metadata = { title: "Configuración Financiera" };

export default async function FinancieraPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "general" } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const workspaceId = (rawRow as unknown as { workspace_id: string | null } | null)?.workspace_id ?? "";

  // Fetch all financial data in parallel
  const db = supabase as unknown as { from: (t: string) => any };

  const [cfgRes, costsRes, ratesRes] = await Promise.allSettled([
    db.from("financial_config")
      .select("usd_rate, tax_rate, platform_fee, usd_type, usd_adjustment, custom_commission, custom_tax")
      .eq("workspace_id", workspaceId)
      .single(),
    workspaceId
      ? db.from("additional_costs")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/cotizaciones`,
      { next: { revalidate: 3600 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const cfg = cfgRes.status === "fulfilled" ? (cfgRes.value as any)?.data : null;
  const costs = costsRes.status === "fulfilled" ? ((costsRes.value as any)?.data ?? []) : [];
  const ratesData = ratesRes.status === "fulfilled" ? ratesRes.value : null;

  const connection = await getTiendaNubeConnection();

  let avgCostPct = 0;
  if (connection) {
    const prods = await getProducts(connection.opts, 1, 100).catch(() => []);
    const ratios = prods.flatMap((p) =>
      p.variants
        .filter((v) => parseFloat(v.cost_price ?? "0") > 0 && parseFloat(v.price) > 0)
        .map((v) => parseFloat(v.cost_price!) / parseFloat(v.price))
    );
    if (ratios.length > 0)
      avgCostPct = (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100;
  }

  return (
    <FinancieraHub
      activeTab={tab}
      workspaceId={workspaceId}
      avgCostPct={avgCostPct}
      generalConfig={{
        usd_rate:     cfg?.usd_rate     ?? 1200,
        tax_rate:     cfg?.tax_rate     ?? 21,
        platform_fee: cfg?.platform_fee ?? 2,
      }}
      cotizacionesConfig={{
        usdRate:       cfg?.usd_rate       ?? 1100,
        usdType:       cfg?.usd_type       ?? "oficial",
        usdAdjustment: cfg?.usd_adjustment ?? 0,
        ratesData,
      }}
      comisionesConfig={{
        tax_rate:          cfg?.tax_rate          ?? 10,
        platform_fee:      cfg?.platform_fee      ?? 2,
        custom_commission: cfg?.custom_commission ?? 0,
        custom_tax:        cfg?.custom_tax        ?? 0,
      }}
      additionalCosts={costs}
      storeName={connection?.storeName ?? null}
      isConnected={!!connection}
    />
  );
}

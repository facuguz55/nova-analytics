import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
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
  const user = await getUser();
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
  const productStats = { total: 0, withCost: 0 };

  if (connection) {
    // Fetch sin caché, loop hasta traer todos los productos
    const allProds: import("@/lib/tiendanube/client").TNProduct[] = [];
    for (let page = 1; page <= 15; page++) {
      const batch = await fetch(
        `https://api.tiendanube.com/v1/${connection.opts.storeId}/products?per_page=100&page=${page}`,
        {
          headers: {
            Authentication: `bearer ${connection.opts.accessToken}`,
            "User-Agent": "Nova Analytics (novaagency.info)",
          },
          cache: "no-store",
        }
      )
        .then((r) => (r.ok ? (r.json() as Promise<import("@/lib/tiendanube/client").TNProduct[]>) : []))
        .catch(() => []);

      allProds.push(...batch);
      if (batch.length < 100) break; // última página
    }

    const uniqueProds = allProds;

    productStats.total = uniqueProds.length;

    const ratios: number[] = [];
    for (const p of uniqueProds) {
      for (const v of p.variants) {
        const cost  = parseFloat(v.cost ?? "0");
        const price = parseFloat(v.price);
        if (!isNaN(cost) && cost > 0 && !isNaN(price) && price > 0) {
          ratios.push(cost / price);
          productStats.withCost++;
        }
      }
    }

    if (ratios.length > 0) {
      avgCostPct = (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100;
    }

    // Fallback: si la API no devuelve costos, leer desde tn_products en Supabase
    if (avgCostPct === 0) {
      const { data: local } = await db
        .from("tn_products")
        .select("cost, price")
        .gt("price", 0)
        .gt("cost", 0);

      if (local && local.length > 0) {
        const localRatios = (local as { cost: number; price: number }[])
          .filter((p) => p.cost > 0 && p.price > 0)
          .map((p) => p.cost / p.price);

        if (localRatios.length > 0) {
          avgCostPct = (localRatios.reduce((a, b) => a + b, 0) / localRatios.length) * 100;
          productStats.withCost = localRatios.length;
          productStats.total = Math.max(productStats.total, local.length);
        }
      }
    }
  }

  return (
    <FinancieraHub
      activeTab={tab}
      workspaceId={workspaceId}
      avgCostPct={avgCostPct}
      productStats={productStats}
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

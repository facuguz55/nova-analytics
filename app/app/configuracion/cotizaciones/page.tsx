import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import CotizacionesClient from "./CotizacionesClient";

export const metadata: Metadata = { title: "Cotizaciones" };

async function getCotizacionPreference(workspaceId: string) {
  const supabase = await createClient();
  const db = supabase as unknown as { from: (t: string) => any };
  const { data } = await db.from("financial_config")
    .select("usd_rate, usd_type, usd_adjustment")
    .eq("workspace_id", workspaceId)
    .single();
  return {
    usdRate:       (data as any)?.usd_rate ?? 1100,
    usdType:       (data as any)?.usd_type ?? "oficial",
    usdAdjustment: (data as any)?.usd_adjustment ?? 0,
  };
}

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data: rawRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const workspaceId = (rawRow as unknown as { workspace_id: string | null } | null)?.workspace_id ?? "";

  let ratesData = null;
  let pref = { usdRate: 1100, usdType: "oficial", usdAdjustment: 0 };

  try {
    const [ratesRes, prefRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/cotizaciones`, {
        next: { revalidate: 3600 },
      }),
      workspaceId ? getCotizacionPreference(workspaceId) : Promise.resolve(pref),
    ]);

    if (ratesRes.status === "fulfilled" && ratesRes.value.ok) {
      ratesData = await ratesRes.value.json();
    }
    if (prefRes.status === "fulfilled") {
      pref = prefRes.value;
    }
  } catch {
    // silent
  }

  return (
    <Suspense>
      <CotizacionesClient
        ratesData={ratesData}
        initialUsdType={pref.usdType}
        initialAdjustment={pref.usdAdjustment}
        workspaceId={workspaceId}
      />
    </Suspense>
  );
}

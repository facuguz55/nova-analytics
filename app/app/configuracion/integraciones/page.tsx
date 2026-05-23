import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import IntegracionesClient from "./IntegracionesClient";

export const metadata: Metadata = { title: "Integraciones" };

export default async function IntegracionesPage() {
  const supabase = await createClient();

  type IntRow = { provider: string; status: string; metadata: Record<string, string> | null; updated_at: string; store_id: string | null };
  const { data: rawIntegrations } = await supabase
    .from("integrations")
    .select("provider, status, metadata, updated_at, store_id");
  const integrations = (rawIntegrations ?? []) as unknown as IntRow[];

  const byProvider = Object.fromEntries(integrations.map((i) => [i.provider, i]));

  return (
    <IntegracionesClient
      tiendanube={byProvider["tiendanube"] ?? null}
      gmail={byProvider["gmail"] ?? null}
      meta={byProvider["meta"] ?? null}
    />
  );
}

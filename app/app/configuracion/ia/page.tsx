import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import IAContextClient from "./IAContextClient";

export const metadata: Metadata = { title: "Contexto de IA" };

export default async function IAContextPage() {
  const supabase = await createClient();

  const { data: rawUser } = await supabase
    .from("users").select("workspace_id").single();
  const workspaceId = (rawUser as { workspace_id: string | null } | null)?.workspace_id;

  type CtxRow = {
    store_name: string | null;
    general_info: string | null;
    shipping_policy: string | null;
    return_policy: string | null;
    payment_methods: string | null;
    tone: string | null;
  };

  const { data: raw } = workspaceId
    ? await supabase
        .from("workspace_ai_context")
        .select("store_name, general_info, shipping_policy, return_policy, payment_methods, tone")
        .eq("workspace_id", workspaceId)
        .maybeSingle()
    : { data: null };

  const ctx = raw as CtxRow | null;

  return (
    <IAContextClient
      initial={{
        store_name:      ctx?.store_name      ?? "",
        general_info:    ctx?.general_info    ?? "",
        shipping_policy: ctx?.shipping_policy ?? "",
        return_policy:   ctx?.return_policy   ?? "",
        payment_methods: ctx?.payment_methods ?? "",
        tone:            ctx?.tone            ?? "",
      }}
    />
  );
}

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BillingClient from "./BillingClient";

export const metadata: Metadata = { title: "Facturación | Nova Analytics" };

type SubscriptionRow = {
  status: string;
  next_billing_at: string | null;
  provider_subscription_id: string | null;
  cancelled_at: string | null;
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/billing");

  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id, workspaces(name)")
    .eq("id", user.id)
    .single();

  type UserRow = { workspace_id: string; workspaces: { name: string } | null };
  const row = userRow as unknown as UserRow | null;
  const workspaceId = row?.workspace_id ?? "";

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, next_billing_at, provider_subscription_id, cancelled_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const subscription = sub as SubscriptionRow | null;

  return (
    <BillingClient
      workspaceId={workspaceId}
      userEmail={user.email ?? ""}
      subscription={subscription}
    />
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTNConnectionForWorkspace } from "@/lib/tiendanube/hq-connection";
import { getOrdersForRange, getCustomers, type TNOrder, type TNCustomer } from "@/lib/tiendanube/client";
import WorkspaceDetailClient from "./WorkspaceDetailClient";

export const metadata: Metadata = { title: "HQ — Detalle de tienda" };

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((userRow as { role: string } | null)?.role !== "super_admin") redirect("/app/dashboard");

  const { data: wsRaw } = await supabase
    .from("workspaces")
    .select("id, name, plan, status, created_at")
    .eq("id", workspaceId)
    .single();

  if (!wsRaw) redirect("/app/hq");

  const ws = wsRaw as { id: string; name: string; plan: string; status: string; created_at: string };

  const tnConn = await getTNConnectionForWorkspace(workspaceId);

  let orders: TNOrder[] = [];
  let customers: TNCustomer[] = [];

  if (tnConn) {
    const [ordersResult, customersResult] = await Promise.allSettled([
      getOrdersForRange(tnConn.opts, { days: 30 }, 5),
      getCustomers(tnConn.opts, 1, 50),
    ]);
    orders   = ordersResult.status   === "fulfilled" ? ordersResult.value   : [];
    customers = customersResult.status === "fulfilled" ? customersResult.value : [];
  }

  return (
    <WorkspaceDetailClient
      workspace={ws}
      orders={orders}
      customers={customers}
      hasTN={!!tnConn}
      storeName={tnConn?.storeName ?? null}
    />
  );
}

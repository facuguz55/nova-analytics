import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/encryption";
import { getOrders, getProducts, getCustomers, getProductName } from "@/lib/tiendanube/client";

export async function POST(request: Request) {
  // Puede ser llamado autenticado o con header interno
  const headerWorkspaceId = request.headers.get("x-workspace-id");

  let workspaceId: string;

  if (headerWorkspaceId) {
    workspaceId = headerWorkspaceId;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = createServiceClient();
    const { data: userRow } = await service
      .from("users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!userRow?.workspace_id) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }
    workspaceId = userRow.workspace_id;
  }

  const service = createServiceClient();

  // Obtener la integración de TiendaNube
  const { data: integration } = await service
    .from("integrations")
    .select("access_token_encrypted, store_id, status")
    .eq("workspace_id", workspaceId)
    .eq("provider", "tiendanube")
    .single();

  if (!integration?.access_token_encrypted || integration.status !== "active") {
    return NextResponse.json({ error: "TiendaNube not connected" }, { status: 400 });
  }

  const accessToken = decrypt(integration.access_token_encrypted);
  const storeId = integration.store_id!;
  const opts = { accessToken, storeId };

  try {
    // Sync órdenes (últimas 200)
    const [orders, products, customers] = await Promise.all([
      getOrders(opts, 1, 100).then(async (page1) => {
        const page2 = await getOrders(opts, 2, 100);
        return [...page1, ...page2];
      }).catch(() => []),
      getProducts(opts, 1, 100).catch(() => []),
      getCustomers(opts, 1, 100).catch(() => []),
    ]);

    // Upsert órdenes
    if (orders.length > 0) {
      const orderRows = orders.map((o) => ({
        workspace_id: workspaceId,
        external_id: String(o.id),
        customer_name: o.customer?.name ?? null,
        customer_email: o.customer?.email ?? null,
        total: parseFloat(o.total),
        status: o.payment_status ?? o.status,
        created_at: o.created_at,
      }));
      await service.from("tn_orders").upsert(orderRows, { onConflict: "workspace_id,external_id" });
    }

    // Upsert productos
    if (products.length > 0) {
      const productRows = products.map((p) => {
        const mainVariant = p.variants?.[0];
        const totalStock = p.variants?.reduce((acc, v) => acc + (v.stock ?? 0), 0) ?? 0;
        return {
          workspace_id: workspaceId,
          external_id: String(p.id),
          name: getProductName(p),
          stock: totalStock,
          price: parseFloat(mainVariant?.price ?? "0"),
          cost: parseFloat(mainVariant?.cost_price ?? "0"),
          variants: p.variants as unknown as import("@/lib/types/database").Json,
        };
      });
      await service.from("tn_products").upsert(productRows, { onConflict: "workspace_id,external_id" });
    }

    // Upsert clientes
    if (customers.length > 0) {
      const customerRows = customers.map((c) => ({
        workspace_id: workspaceId,
        external_id: String(c.id),
        name: c.name,
        email: c.email,
        orders_count: c.orders_count,
        total_spent: parseFloat(c.total_spent),
      }));
      await service.from("tn_customers").upsert(customerRows, { onConflict: "workspace_id,external_id" });
    }

    // Audit log
    await service.from("audit_logs").insert({
      workspace_id: workspaceId,
      action: "tiendanube_sync",
      metadata: {
        orders: orders.length,
        products: products.length,
        customers: customers.length,
      },
    });

    return NextResponse.json({
      success: true,
      synced: { orders: orders.length, products: products.length, customers: customers.length },
    });
  } catch (err) {
    console.error("Sync error:", err);
    // Marcar integración como error
    await service.from("integrations").update({ status: "error" })
      .eq("workspace_id", workspaceId)
      .eq("provider", "tiendanube");

    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

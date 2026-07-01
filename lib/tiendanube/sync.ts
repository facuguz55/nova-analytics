import { createServiceClient } from "@/lib/supabase/service";
import {
  getOrdersForRangePaged,
  getAllProducts,
  getCustomers,
  type TiendaNubeOptions,
  type TNOrder,
} from "./client";

export type SyncMode = "full" | "incremental";

export async function syncOrders(
  workspaceId: string,
  opts: TiendaNubeOptions,
  mode: SyncMode = "incremental"
): Promise<{ synced: number; partial: boolean }> {
  const db = createServiceClient() as any;

  const range =
    mode === "full"
      ? { days: 120 as const }
      : { since: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString().split("T")[0] };

  const maxPages = mode === "full" ? 20 : 5;
  const { orders, partial } = await getOrdersForRangePaged(opts, range, maxPages);

  if (orders.length === 0) return { synced: 0, partial };

  const rows = orders.map((o: TNOrder) => ({
    workspace_id:   workspaceId,
    external_id:    String(o.id),
    number:         o.number,
    customer_name:  o.customer?.name ?? null,
    customer_email: o.customer?.email ?? null,
    total:          parseFloat(o.total || "0"),
    subtotal:       parseFloat(o.subtotal || "0"),
    discount:       parseFloat(o.discount || "0"),
    shipping:       parseFloat(o.shipping || "0"),
    status:         o.status,
    payment_status: o.payment_status,
    currency:       o.currency ?? "ARS",
    products:       o.products ?? [],
    created_at:     o.created_at,
    synced_at:      new Date().toISOString(),
  }));

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("tn_orders").upsert(rows.slice(i, i + 500), {
      onConflict: "workspace_id,external_id",
    });
    if (error) throw new Error(`syncOrders: ${error.message}`);
  }

  return { synced: orders.length, partial };
}

export async function syncProducts(
  workspaceId: string,
  opts: TiendaNubeOptions
): Promise<{ synced: number }> {
  const db = createServiceClient() as any;
  const products = await getAllProducts(opts, 20);
  if (products.length === 0) return { synced: 0 };

  const rows = products.map((p) => {
    const name = typeof p.name === "string" ? p.name : (p.name?.es ?? "Sin nombre");
    const main = p.variants?.[0];
    return {
      workspace_id:  workspaceId,
      external_id:   String(p.id),
      name,
      stock:         p.variants.reduce((a, v) => a + (v.stock ?? 0), 0),
      price:         parseFloat(main?.price ?? "0"),
      cost:          parseFloat(main?.cost ?? "0"),
      variants:      p.variants,
      images:        p.images ?? [],
      created_at_tn: p.created_at,
      synced_at:     new Date().toISOString(),
    };
  });

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from("tn_products").upsert(rows.slice(i, i + 200), {
      onConflict: "workspace_id,external_id",
    });
    if (error) throw new Error(`syncProducts: ${error.message}`);
  }

  return { synced: products.length };
}

export async function syncCustomers(
  workspaceId: string,
  opts: TiendaNubeOptions,
  pages = 5
): Promise<{ synced: number }> {
  const db = createServiceClient() as any;
  const all = [];
  for (let page = 1; page <= pages; page++) {
    const batch = await getCustomers(opts, page, 100).catch(() => []);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  if (all.length === 0) return { synced: 0 };

  const rows = all.map((c) => ({
    workspace_id:  workspaceId,
    external_id:   String(c.id),
    name:          c.name,
    email:         c.email,
    phone:         c.phone ?? null,
    orders_count:  c.orders_count ?? 0,
    total_spent:   parseFloat(c.total_spent || "0"),
    created_at_tn: c.created_at,
    synced_at:     new Date().toISOString(),
  }));

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("tn_customers").upsert(rows.slice(i, i + 500), {
      onConflict: "workspace_id,external_id",
    });
    if (error) throw new Error(`syncCustomers: ${error.message}`);
  }

  return { synced: all.length };
}

export async function syncAll(
  workspaceId: string,
  opts: TiendaNubeOptions,
  mode: SyncMode = "incremental"
): Promise<{ orders: number; products: number; customers: number }> {
  const [o, p, c] = await Promise.allSettled([
    syncOrders(workspaceId, opts, mode),
    syncProducts(workspaceId, opts),
    syncCustomers(workspaceId, opts, mode === "full" ? 10 : 2),
  ]);
  return {
    orders:    o.status === "fulfilled" ? o.value.synced : 0,
    products:  p.status === "fulfilled" ? p.value.synced : 0,
    customers: c.status === "fulfilled" ? c.value.synced : 0,
  };
}

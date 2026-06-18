"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getAllProducts } from "@/lib/tiendanube/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

// ── helpers ───────────────────────────────────────────────────────────────────

async function getWorkspaceId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  if (!data) throw new Error("Sin workspace");
  return (data as { workspace_id: string }).workspace_id;
}

async function db(): Promise<AnySupabase> {
  return createClient();
}

// ── PRODUCTOS ─────────────────────────────────────────────────────────────────

const ProductSchema = z.object({
  name:      z.string().min(1).max(200),
  sku:       z.string().max(100).optional(),
  cost:      z.coerce.number().min(0),
  price:     z.coerce.number().min(0),
  stock:     z.coerce.number().int().min(0),
  min_stock: z.coerce.number().int().min(0),
  category:  z.string().max(100).optional(),
});

export async function createLocalProduct(formData: FormData) {
  const parsed = ProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Datos inválidos");

  const workspace_id = await getWorkspaceId();
  const supabase: AnySupabase = await db();

  const { error } = await supabase.from("local_products").insert({ ...parsed.data, workspace_id });
  if (error) throw new Error(error.message);
  revalidatePath("/app/local");
  revalidatePath("/app/local/productos");
}

export async function updateLocalProduct(id: string, formData: FormData) {
  const parsed = ProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Datos inválidos");

  const workspace_id = await getWorkspaceId();
  const supabase: AnySupabase = await db();

  const { error } = await supabase
    .from("local_products")
    .update(parsed.data)
    .eq("id", id)
    .eq("workspace_id", workspace_id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/local");
  revalidatePath("/app/local/productos");
}

export async function updateLocalProductStock(id: string, stock: number) {
  const StockSchema = z.number().int().min(0);
  const parsed = StockSchema.safeParse(stock);
  if (!parsed.success) throw new Error("Stock inválido");

  const workspace_id = await getWorkspaceId();
  const supabase: AnySupabase = await db();

  const { error } = await supabase
    .from("local_products")
    .update({ stock: parsed.data })
    .eq("id", id)
    .eq("workspace_id", workspace_id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/local/productos");
  revalidatePath("/app/alertas");
}

export async function deleteLocalProduct(id: string) {
  const workspace_id = await getWorkspaceId();
  const supabase: AnySupabase = await db();

  const { error } = await supabase
    .from("local_products")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace_id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/local/productos");
}

// ── VENTAS ────────────────────────────────────────────────────────────────────

export type SaleItem = {
  product_id: string | null;
  product_name: string;
  unit_price: number;
  unit_cost: number;
  quantity: number;
};

const SaleSchema = z.object({
  payment_method: z.enum(["efectivo", "transferencia", "debito", "credito", "cuotas"]),
  installments:   z.coerce.number().int().min(1).max(72).optional(),
  notes:          z.string().max(500).optional(),
  items:          z.array(z.object({
    product_id:   z.string().uuid().nullable(),
    product_name: z.string().min(1).max(200),
    unit_price:   z.number().min(0),
    unit_cost:    z.number().min(0),
    quantity:     z.number().int().min(1),
  })).min(1),
});

export async function registerLocalSale(data: {
  payment_method: string;
  installments?: number;
  notes?: string;
  items: SaleItem[];
}) {
  const parsed = SaleSchema.safeParse(data);
  if (!parsed.success) throw new Error("Datos de venta inválidos");

  const workspace_id = await getWorkspaceId();
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  const supabase: AnySupabase = client;

  const total = parsed.data.items.reduce(
    (acc, it) => acc + it.unit_price * it.quantity,
    0
  );

  const { data: sale, error: saleErr } = await supabase
    .from("local_sales")
    .insert({
      workspace_id,
      total,
      payment_method: parsed.data.payment_method,
      installments:   parsed.data.installments ?? null,
      notes:          parsed.data.notes ?? null,
      created_by:     user!.id,
    })
    .select("id")
    .single();

  if (saleErr || !sale) throw new Error(saleErr?.message ?? "Error al guardar venta");

  const items = parsed.data.items.map((it) => ({
    sale_id:      (sale as { id: string }).id,
    product_id:   it.product_id,
    product_name: it.product_name,
    unit_price:   it.unit_price,
    unit_cost:    it.unit_cost,
    quantity:     it.quantity,
  }));

  const { error: itemsErr } = await supabase.from("local_sale_items").insert(items);
  if (itemsErr) throw new Error(itemsErr.message);

  // Descontar stock de los productos del catálogo
  for (const it of parsed.data.items) {
    if (!it.product_id) continue;
    await (client as AnySupabase).rpc("decrement_local_stock", {
      p_product_id:   it.product_id,
      p_workspace_id: workspace_id,
      p_qty:          it.quantity,
    });
  }

  revalidatePath("/app/local");
  revalidatePath("/app/local/ventas");
  revalidatePath("/app/alertas");
  return { id: (sale as { id: string }).id };
}

// ── SYNC TIENDANUBE → LOCAL ───────────────────────────────────────────────────

export async function syncFromTiendaNube(): Promise<{ created: number; skipped: number }> {
  const workspace_id = await getWorkspaceId();

  const connection = await getTiendaNubeConnection();
  if (!connection) throw new Error("No hay conexión con TiendaNube activa. Configurá la integración primero.");

  const tnProducts = await getAllProducts(connection.opts);

  const supabase: AnySupabase = await db();

  // Traer SKUs y nombres ya existentes en el catálogo local
  const { data: existing } = await supabase
    .from("local_products")
    .select("sku, name")
    .eq("workspace_id", workspace_id);

  type ExistingRow = { sku: string | null; name: string };
  const rows = (existing ?? []) as ExistingRow[];
  const existingSKUs  = new Set(rows.map((r) => r.sku).filter((s): s is string => !!s));
  const existingNames = new Set(rows.map((r) => r.name));

  type LocalProductInsert = {
    workspace_id: string;
    name: string;
    sku: string | null;
    cost: number;
    price: number;
    stock: number;
    min_stock: number;
    category: null;
  };

  const toInsert: LocalProductInsert[] = [];
  let total = 0;

  for (const product of tnProducts) {
    const baseName =
      typeof product.name === "string" ? product.name : product.name.es ?? "Producto";

    for (const variant of product.variants) {
      total++;
      const sku = variant.sku ?? null;

      const name =
        product.variants.length === 1
          ? baseName
          : sku
          ? `${baseName} (${sku})`
          : `${baseName} #${variant.id}`;

      // Deduplicar: si ya existe por SKU o por nombre, saltar
      if (sku && existingSKUs.has(sku)) continue;
      if (!sku && existingNames.has(name)) continue;

      toInsert.push({
        workspace_id,
        name,
        sku,
        cost:      parseFloat(variant.cost  ?? "0") || 0,
        price:     parseFloat(variant.price) || 0,
        stock:     variant.stock ?? 0,
        min_stock: 3,
        category:  null,
      });

      if (sku) existingSKUs.add(sku);
      else     existingNames.add(name);
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("local_products").insert(toInsert);
    if (error) throw new Error(`Error al importar productos: ${error.message}`);
  }

  revalidatePath("/app/local/productos");
  revalidatePath("/app/local");

  return { created: toInsert.length, skipped: total - toInsert.length };
}

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

// ── CLIENTES ──────────────────────────────────────────────────────────────────

const CustomerSchema = z.object({
  name:  z.string().min(1).max(200),
  dni:   z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export type LocalCustomer = {
  id: string; name: string; dni: string | null;
  phone: string | null; email: string | null; created_at: string;
  sales_count: number;
};

export async function lookupCustomerByDNI(dni: string): Promise<{
  id: string; name: string; phone: string | null; email: string | null; sales_count: number;
} | null> {
  const clean = dni.replace(/\D/g, "");
  if (clean.length < 7) return null;

  const workspace_id = await getWorkspaceId();
  const supabase: AnySupabase = await db();

  const { data } = await supabase
    .from("local_customers")
    .select("id, name, phone, email")
    .eq("workspace_id", workspace_id)
    .eq("dni", clean)
    .maybeSingle();

  if (!data) return null;

  const { count } = await supabase
    .from("local_sales")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace_id)
    .eq("customer_id", (data as { id: string }).id);

  const c = data as { id: string; name: string; phone: string | null; email: string | null };
  return { ...c, sales_count: count ?? 0 };
}

async function findOrCreateLocalCustomer(
  workspace_id: string,
  supabase: AnySupabase,
  input: { id?: string; dni?: string; name?: string; phone?: string; email?: string }
): Promise<string | null> {
  if (!input.name?.trim() && !input.id) return null;

  // Verificar ownership antes de confiar en el ID — evita IDOR cross-tenant
  if (input.id) {
    const { data: owned } = await supabase
      .from("local_customers")
      .select("id")
      .eq("id", input.id)
      .eq("workspace_id", workspace_id)
      .maybeSingle();
    return owned ? (owned as { id: string }).id : null;
  }

  const clean = input.dni?.replace(/\D/g, "") ?? "";

  // Buscar por DNI si fue provisto
  if (clean.length >= 7) {
    const { data: existing } = await supabase
      .from("local_customers")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("dni", clean)
      .maybeSingle();

    if (existing) {
      // Actualizar datos si hay nuevos
      if (input.name || input.phone) {
        await supabase
          .from("local_customers")
          .update({
            ...(input.name  ? { name:  input.name.trim()  } : {}),
            ...(input.phone ? { phone: input.phone.trim() } : {}),
          })
          .eq("id", (existing as { id: string }).id);
      }
      return (existing as { id: string }).id;
    }
  }

  // Crear nuevo cliente
  const parsed = CustomerSchema.safeParse({
    name:  input.name,
    dni:   clean || undefined,
    phone: input.phone,
    email: input.email,
  });
  if (!parsed.success) return null;

  const { data: created, error } = await supabase
    .from("local_customers")
    .insert({
      workspace_id,
      name:  parsed.data.name,
      dni:   parsed.data.dni ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email || null,
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return (created as { id: string }).id;
}

// ── VENTAS ────────────────────────────────────────────────────────────────────

export type SaleItem = {
  product_id: string | null;
  product_name: string;
  unit_price: number;
  unit_cost: number;
  quantity: number;
};

const SaleCustomerSchema = z.object({
  id:    z.string().uuid().optional(),
  dni:   z.string().max(20).optional(),
  name:  z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
}).optional().nullable();

const SaleSchema = z.object({
  payment_method: z.enum(["efectivo", "transferencia", "debito", "credito", "cuotas"]),
  installments:   z.coerce.number().int().min(1).max(72).optional(),
  notes:          z.string().max(500).optional(),
  customer:       SaleCustomerSchema,
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
  customer?: {
    id?: string;
    dni?: string;
    name?: string;
    phone?: string;
    email?: string;
  } | null;
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

  // Resolver cliente usando los datos ya validados por Zod (no data.customer crudo)
  const customer_id = parsed.data.customer
    ? await findOrCreateLocalCustomer(workspace_id, supabase, parsed.data.customer)
    : null;

  const { data: sale, error: saleErr } = await supabase
    .from("local_sales")
    .insert({
      workspace_id,
      total,
      payment_method: parsed.data.payment_method,
      installments:   parsed.data.installments ?? null,
      notes:          parsed.data.notes ?? null,
      created_by:     user!.id,
      customer_id,
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

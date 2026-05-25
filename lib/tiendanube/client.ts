// TiendaNube API v1 wrapper — DATOS SIEMPRE DIRECTO DESDE API, NUNCA EN SUPABASE
const BASE_URL = "https://api.tiendanube.com/v1";

export interface TiendaNubeOptions {
  accessToken: string;
  storeId: string;
}

export interface TNOrder {
  id: number;
  number: number;
  status: string;
  payment_status: string;
  total: string;
  subtotal: string;
  discount: string;
  shipping: string;
  currency: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  } | null;
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    price: string;
    product_id: number;
  }>;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
  cancelled_at?: string | null;
}

export interface TNProduct {
  id: number;
  name: { es: string } | string;
  description?: { es?: string } | string;
  variants: Array<{
    id: number;
    stock: number | null;
    price: string;
    cost_price: string | null;
    sku?: string;
  }>;
  images?: Array<{ src: string }>;
  created_at: string;
}

export interface TNCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  total_spent: string;
  orders_count: number;
  created_at: string;
  last_order_id?: number;
  default_address?: {
    city?: string;
    province?: string;
    country?: string;
  };
}

export interface DateRangeOpts {
  days?: 30 | 60 | 90;
  since?: string;
  until?: string;
}

function buildDateParams(range?: DateRangeOpts): Record<string, string> {
  if (!range) return {};
  const params: Record<string, string> = {};
  if (range.since) params["created_at_min"] = range.since;
  if (range.until) params["created_at_max"] = range.until;
  if (range.days && !range.since) {
    const since = new Date();
    since.setDate(since.getDate() - range.days);
    params["created_at_min"] = since.toISOString().split("T")[0];
  }
  return params;
}

async function tnFetch<T>(
  path: string,
  opts: TiendaNubeOptions,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}/${opts.storeId}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authentication: `bearer ${opts.accessToken}`,
      "User-Agent": "Nova Analytics (novaagency.info)",
    },
    // Cache 2 minutos — los datos de TiendaNube no cambian cada segundo.
    // Elimina el re-fetch en cada click de sidebar para la misma ventana de tiempo.
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TiendaNube API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function getOrders(
  opts: TiendaNubeOptions,
  page = 1,
  perPage = 100,
  range?: DateRangeOpts
): Promise<TNOrder[]> {
  return tnFetch<TNOrder[]>("/orders", opts, {
    page: String(page),
    per_page: String(perPage),
    sort_by: "created_at",
    sort_direction: "desc",
    ...buildDateParams(range),
  });
}

export async function getOrdersForRange(
  opts: TiendaNubeOptions,
  range: DateRangeOpts,
  maxPages = 3
): Promise<TNOrder[]> {
  const pages = await Promise.allSettled(
    Array.from({ length: maxPages }, (_, i) => getOrders(opts, i + 1, 100, range))
  );
  return pages.flatMap((p) => (p.status === "fulfilled" ? p.value : []));
}

export async function getProducts(
  opts: TiendaNubeOptions,
  page = 1,
  perPage = 100
): Promise<TNProduct[]> {
  return tnFetch<TNProduct[]>("/products", opts, {
    page: String(page),
    per_page: String(perPage),
  });
}

export async function getCustomers(
  opts: TiendaNubeOptions,
  page = 1,
  perPage = 100
): Promise<TNCustomer[]> {
  return tnFetch<TNCustomer[]>("/customers", opts, {
    page: String(page),
    per_page: String(perPage),
    sort_by: "total_spent",
    sort_direction: "desc",
  });
}

export function getProductName(product: TNProduct): string {
  if (typeof product.name === "string") return product.name;
  return product.name?.es ?? "Sin nombre";
}

export function calcOrderRevenue(orders: TNOrder[]): number {
  return orders
    .filter((o) => o.payment_status === "paid" || o.status === "closed")
    .reduce((acc, o) => acc + parseFloat(o.total || "0"), 0);
}

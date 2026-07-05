// Shopify Admin REST API wrapper — mismo espíritu que lib/tiendanube/client.ts.
// Diferencia clave: Shopify pagina por cursor (page_info en el header Link),
// no por número de página — una vez que hay page_info, el resto de los
// params (excepto limit) se ignoran, así que las páginas siguientes van "pelodas".
const API_VERSION = "2024-10";

export interface ShopifyOptions {
  accessToken: string;
  shop: string; // xxx.myshopify.com
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  financial_status: string | null;
  total_price: string;
  subtotal_price: string | null;
  total_discounts: string | null;
  currency: string;
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: string;
    product_id: number | null;
  }>;
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null;
  closed_at?: string | null;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html?: string | null;
  // El costo por variante no viene en este endpoint — Shopify lo expone vía
  // InventoryItem (requiere scope read_inventory y una llamada extra por
  // variante). Se deja en null hasta que se necesite ese dato.
  variants: Array<{
    id: number;
    inventory_quantity: number | null;
    price: string;
    sku?: string;
  }>;
  images?: Array<{ src: string }>;
  created_at: string;
}

export interface ShopifyCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
  orders_count: number;
  total_spent: string;
  created_at: string;
  default_address?: {
    city?: string;
    province?: string;
    country?: string;
  };
}

export interface DateRangeOpts {
  days?: 30 | 60 | 90 | 120;
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

function parseNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const nextLink = linkHeader
    .split(",")
    .map((s) => s.trim())
    .find((s) => s.endsWith('rel="next"'));
  if (!nextLink) return null;
  const match = nextLink.match(/<([^>]+)>/);
  if (!match) return null;
  return new URL(match[1]).searchParams.get("page_info");
}

async function shopifyFetch<T>(
  path: string,
  opts: ShopifyOptions,
  params?: Record<string, string>
): Promise<{ data: T; nextPageInfo: string | null }> {
  const url = new URL(`https://${opts.shop}/admin/api/${API_VERSION}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": opts.accessToken,
      "Content-Type": "application/json",
    },
    // Cache 2 minutos, igual que TiendaNube — evita re-fetch en cada click de sidebar.
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Shopify API error ${res.status}: ${body}`);
  }
  const data = (await res.json()) as T;
  return { data, nextPageInfo: parseNextPageInfo(res.headers.get("link")) };
}

export async function getOrdersForRangePaged(
  opts: ShopifyOptions,
  range: DateRangeOpts,
  maxPages = 10
): Promise<{ orders: ShopifyOrder[]; partial: boolean }> {
  const all: ShopifyOrder[] = [];
  let pageInfo: string | null = null;

  for (let page = 1; page <= maxPages; page++) {
    const params: Record<string, string> = pageInfo
      ? { page_info: pageInfo, limit: "100" }
      // status=any — por default Shopify sólo devuelve órdenes abiertas.
      : { limit: "100", status: "any", ...buildDateParams(range) };

    let result;
    try {
      result = await shopifyFetch<{ orders: ShopifyOrder[] }>("/orders.json", opts, params);
    } catch {
      return { orders: all, partial: true };
    }
    all.push(...result.data.orders);
    if (!result.nextPageInfo) return { orders: all, partial: false };
    pageInfo = result.nextPageInfo;
  }
  return { orders: all, partial: true };
}

export async function getOrdersForRange(
  opts: ShopifyOptions,
  range: DateRangeOpts,
  maxPages = 10
): Promise<ShopifyOrder[]> {
  const { orders } = await getOrdersForRangePaged(opts, range, maxPages);
  return orders;
}

export async function getAllProducts(
  opts: ShopifyOptions,
  maxPages = 15
): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let pageInfo: string | null = null;

  for (let page = 1; page <= maxPages; page++) {
    const params: Record<string, string> = pageInfo ? { page_info: pageInfo, limit: "250" } : { limit: "250" };
    let result;
    try {
      result = await shopifyFetch<{ products: ShopifyProduct[] }>("/products.json", opts, params);
    } catch {
      break;
    }
    all.push(...result.data.products);
    if (!result.nextPageInfo) break;
    pageInfo = result.nextPageInfo;
  }
  return all;
}

export async function getCustomers(
  opts: ShopifyOptions,
  pages = 5
): Promise<ShopifyCustomer[]> {
  const all: ShopifyCustomer[] = [];
  let pageInfo: string | null = null;

  for (let page = 1; page <= pages; page++) {
    const params: Record<string, string> = pageInfo ? { page_info: pageInfo, limit: "250" } : { limit: "250" };
    let result;
    try {
      result = await shopifyFetch<{ customers: ShopifyCustomer[] }>("/customers.json", opts, params);
    } catch {
      break;
    }
    all.push(...result.data.customers);
    if (!result.nextPageInfo) break;
    pageInfo = result.nextPageInfo;
  }
  return all;
}

export function getCustomerName(c: { first_name: string | null; last_name: string | null }): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Sin nombre";
}

export function calcOrderRevenue(orders: ShopifyOrder[]): number {
  return orders
    .filter((o) => o.financial_status === "paid" && !o.cancelled_at)
    .reduce((acc, o) => acc + parseFloat(o.total_price || "0"), 0);
}

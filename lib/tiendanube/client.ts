// TiendaNube API v1 wrapper
const BASE_URL = "https://api.tiendanube.com/v1";

interface TiendaNubeOptions {
  accessToken: string;
  storeId: string;
}

export interface TNOrder {
  id: number;
  status: string;
  payment_status: string;
  total: string;
  customer: {
    name: string;
    email: string;
  } | null;
  created_at: string;
}

export interface TNProduct {
  id: number;
  name: { es: string } | string;
  variants: Array<{
    id: number;
    stock: number | null;
    price: string;
    cost_price: string | null;
  }>;
}

export interface TNCustomer {
  id: number;
  name: string;
  email: string;
  total_spent: string;
  orders_count: number;
}

export interface TNStats {
  revenue: number;
  orders_count: number;
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
  });
  if (!res.ok) {
    throw new Error(`TiendaNube API error: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function getOrders(
  opts: TiendaNubeOptions,
  page = 1,
  perPage = 100
): Promise<TNOrder[]> {
  return tnFetch<TNOrder[]>("/orders", opts, {
    page: String(page),
    per_page: String(perPage),
    sort_by: "created_at",
    sort_direction: "desc",
  });
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
  });
}

export function getProductName(product: TNProduct): string {
  if (typeof product.name === "string") return product.name;
  return product.name?.es ?? "Sin nombre";
}

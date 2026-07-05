-- Tablas Shopify, espejo de tn_orders/tn_products/tn_customers.
-- Mismo patrón: RLS por workspace_id vía get_my_workspace_id(), unique (workspace_id, external_id) para upsert.

create table if not exists shopify_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  external_id text not null,
  number integer,
  customer_name text,
  customer_email text,
  total numeric not null default 0,
  subtotal numeric default 0,
  discount numeric default 0,
  shipping numeric default 0,
  status text,
  payment_status text,
  currency text default 'ARS',
  products jsonb default '[]'::jsonb,
  created_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (workspace_id, external_id)
);

create table if not exists shopify_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  external_id text not null,
  name text not null,
  description text,
  stock integer not null default 0,
  price numeric not null default 0,
  cost numeric not null default 0,
  variants jsonb not null default '[]'::jsonb,
  images jsonb default '[]'::jsonb,
  created_at_shopify timestamptz,
  synced_at timestamptz not null default now(),
  unique (workspace_id, external_id)
);

create table if not exists shopify_customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  external_id text not null,
  name text,
  email text,
  phone text,
  orders_count integer not null default 0,
  total_spent numeric not null default 0,
  created_at_shopify timestamptz,
  synced_at timestamptz not null default now(),
  unique (workspace_id, external_id)
);

alter table shopify_orders enable row level security;
alter table shopify_products enable row level security;
alter table shopify_customers enable row level security;

create policy orders_all on shopify_orders for all using (workspace_id = get_my_workspace_id());
create policy products_all on shopify_products for all using (workspace_id = get_my_workspace_id());
create policy customers_all on shopify_customers for all using (workspace_id = get_my_workspace_id());

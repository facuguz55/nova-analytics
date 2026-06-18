-- Local Físico: productos, ventas e ítems de venta
-- Estos datos SÍ van en Supabase (generados en la app, no de APIs externas)

-- =============================================
-- TABLA: local_products
-- =============================================
CREATE TABLE IF NOT EXISTS local_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  sku           text,
  cost          numeric(12,2) NOT NULL DEFAULT 0,
  price         numeric(12,2) NOT NULL DEFAULT 0,
  stock         integer NOT NULL DEFAULT 0,
  min_stock     integer NOT NULL DEFAULT 3,
  category      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE local_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "local_products_workspace_isolation"
  ON local_products
  USING (
    workspace_id = (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS local_products_workspace_idx ON local_products(workspace_id);

-- =============================================
-- TABLA: local_sales
-- =============================================
CREATE TABLE IF NOT EXISTS local_sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  total           numeric(12,2) NOT NULL DEFAULT 0,
  payment_method  text NOT NULL CHECK (payment_method IN ('efectivo','transferencia','debito','credito','cuotas')),
  installments    integer,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE local_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "local_sales_workspace_isolation"
  ON local_sales
  USING (
    workspace_id = (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS local_sales_workspace_idx     ON local_sales(workspace_id);
CREATE INDEX IF NOT EXISTS local_sales_created_at_idx    ON local_sales(created_at DESC);

-- =============================================
-- TABLA: local_sale_items
-- =============================================
CREATE TABLE IF NOT EXISTS local_sale_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       uuid NOT NULL REFERENCES local_sales(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES local_products(id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  unit_price    numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost     numeric(12,2) NOT NULL DEFAULT 0,
  quantity      integer NOT NULL DEFAULT 1
);

ALTER TABLE local_sale_items ENABLE ROW LEVEL SECURITY;

-- Aislamiento por workspace a través del sale
CREATE POLICY "local_sale_items_workspace_isolation"
  ON local_sale_items
  USING (
    sale_id IN (
      SELECT id FROM local_sales
      WHERE workspace_id = (
        SELECT workspace_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS local_sale_items_sale_idx    ON local_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS local_sale_items_product_idx ON local_sale_items(product_id);

-- =============================================
-- Trigger: actualizar updated_at en local_products
-- =============================================
CREATE OR REPLACE FUNCTION update_local_products_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER local_products_updated_at
  BEFORE UPDATE ON local_products
  FOR EACH ROW EXECUTE FUNCTION update_local_products_updated_at();

-- =============================================
-- RPC: decrementar stock de forma segura
-- =============================================
CREATE OR REPLACE FUNCTION decrement_local_stock(
  p_product_id   uuid,
  p_workspace_id uuid,
  p_qty          integer
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE local_products
  SET stock = GREATEST(0, stock - p_qty)
  WHERE id = p_product_id
    AND workspace_id = p_workspace_id;
END;
$$;

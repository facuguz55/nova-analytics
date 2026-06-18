-- Local Físico: tabla de clientes + FK en ventas
-- Estos datos SÍ van en Supabase (generados en la app, no de APIs externas)

-- =============================================
-- TABLA: local_customers
-- =============================================
CREATE TABLE IF NOT EXISTS local_customers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         text NOT NULL,
  phone        text,
  email        text,
  dni          text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE local_customers ENABLE ROW LEVEL SECURITY;

-- Cada workspace solo ve sus propios clientes
CREATE POLICY "local_customers_workspace_isolation"
  ON local_customers
  USING (
    workspace_id = (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

-- Super admin ve todos (HQ)
CREATE POLICY "local_customers_super_admin_select"
  ON local_customers
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- DNI único por workspace (solo si no es null/vacío)
CREATE UNIQUE INDEX IF NOT EXISTS local_customers_dni_workspace_idx
  ON local_customers(workspace_id, dni)
  WHERE dni IS NOT NULL AND dni <> '';

CREATE INDEX IF NOT EXISTS local_customers_workspace_idx ON local_customers(workspace_id);
CREATE INDEX IF NOT EXISTS local_customers_name_idx     ON local_customers(workspace_id, name);

-- =============================================
-- FK: local_sales.customer_id → local_customers
-- =============================================
ALTER TABLE local_sales
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES local_customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS local_sales_customer_idx ON local_sales(customer_id);

-- =============================================
-- Super admin ve ventas de todos los workspaces (para HQ)
-- =============================================
CREATE POLICY "local_sales_super_admin_select"
  ON local_sales
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "local_sale_items_super_admin_select"
  ON local_sale_items
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- =============================================
-- Trigger updated_at en local_customers
-- =============================================
CREATE OR REPLACE FUNCTION update_local_customers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER local_customers_updated_at
  BEFORE UPDATE ON local_customers
  FOR EACH ROW EXECUTE FUNCTION update_local_customers_updated_at();

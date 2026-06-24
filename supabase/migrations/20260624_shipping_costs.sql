CREATE TABLE IF NOT EXISTS shipping_costs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  method       TEXT NOT NULL,
  label        TEXT NOT NULL,
  cost         NUMERIC NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, method)
);

ALTER TABLE shipping_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their shipping_costs"
  ON shipping_costs FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS update_shipping_costs_updated_at ON shipping_costs;
CREATE TRIGGER update_shipping_costs_updated_at
  BEFORE UPDATE ON shipping_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

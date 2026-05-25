-- ============================================================
-- Migration: add financial columns + additional_costs table
-- Date: 2026-05-25
-- ============================================================

-- 1. Agregar columnas nuevas a financial_config
ALTER TABLE financial_config
  ADD COLUMN IF NOT EXISTS usd_type       TEXT    NOT NULL DEFAULT 'oficial',
  ADD COLUMN IF NOT EXISTS usd_adjustment NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_commission NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_tax        NUMERIC NOT NULL DEFAULT 0;

-- Validar el tipo de dólar
ALTER TABLE financial_config
  ADD CONSTRAINT IF NOT EXISTS financial_config_usd_type_check
    CHECK (usd_type IN ('oficial', 'blue', 'bolsa', 'ccl', 'cripto'));

-- 2. Tabla de costos adicionales
CREATE TABLE IF NOT EXISTS additional_costs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  type         TEXT        NOT NULL CHECK (type IN ('fixed', 'variable')),
  amount       NUMERIC     NOT NULL CHECK (amount >= 0),
  currency     TEXT        NOT NULL DEFAULT 'ARS',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para additional_costs
ALTER TABLE additional_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_members_select_costs"
  ON additional_costs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "workspace_members_insert_costs"
  ON additional_costs FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "workspace_members_delete_costs"
  ON additional_costs FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

-- Índice de workspace_id
CREATE INDEX IF NOT EXISTS additional_costs_workspace_id_idx ON additional_costs (workspace_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_additional_costs ON additional_costs;
CREATE TRIGGER set_updated_at_additional_costs
  BEFORE UPDATE ON additional_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

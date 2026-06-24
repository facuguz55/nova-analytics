CREATE TABLE IF NOT EXISTS workspace_ai_context (
  workspace_id    UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  store_name      TEXT,
  general_info    TEXT,
  shipping_policy TEXT,
  return_policy   TEXT,
  payment_methods TEXT,
  tone            TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workspace_ai_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace ai context"
  ON workspace_ai_context FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

DROP TRIGGER IF EXISTS update_workspace_ai_context_updated_at ON workspace_ai_context;
CREATE TRIGGER update_workspace_ai_context_updated_at
  BEFORE UPDATE ON workspace_ai_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

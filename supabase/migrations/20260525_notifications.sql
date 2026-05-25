-- Tabla de configuración de notificaciones por workspace
CREATE TABLE IF NOT EXISTS notification_config (
  workspace_id            UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  telegram_chat_id        TEXT,
  telegram_enabled        BOOLEAN NOT NULL DEFAULT false,
  whatsapp_phone          TEXT,
  whatsapp_enabled        BOOLEAN NOT NULL DEFAULT false,
  daily_summary_enabled   BOOLEAN NOT NULL DEFAULT false,
  daily_summary_time      TEXT NOT NULL DEFAULT '20:00',
  alert_vip_inactive_days INTEGER NOT NULL DEFAULT 30,
  alert_big_sale_threshold NUMERIC NOT NULL DEFAULT 50000,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: el usuario solo ve su propio workspace
ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification_config"
  ON notification_config
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notification_config_updated_at ON notification_config;
CREATE TRIGGER update_notification_config_updated_at
  BEFORE UPDATE ON notification_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index para lookups de audit_logs por workspace
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_created
  ON audit_logs(workspace_id, created_at DESC);

-- Index para alerts por workspace
CREATE INDEX IF NOT EXISTS idx_alerts_workspace_created
  ON alerts(workspace_id, created_at DESC);

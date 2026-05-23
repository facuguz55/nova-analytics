/**
 * Tipos globales de Nova Analytics
 */

// ─────────────────────────────────────────────
// Roles del sistema
// ─────────────────────────────────────────────
export type UserRole = "super_admin" | "client";

// ─────────────────────────────────────────────
// Plan de workspace
// ─────────────────────────────────────────────
export type WorkspacePlan = "trial" | "starter" | "pro" | "agency";

// ─────────────────────────────────────────────
// Estado de workspace
// ─────────────────────────────────────────────
export type WorkspaceStatus = "active" | "suspended" | "cancelled";

// ─────────────────────────────────────────────
// Usuario
// ─────────────────────────────────────────────
export interface User {
  id: string;
  workspace_id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar_url?: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Workspace
// ─────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  status: WorkspaceStatus;
  created_at: string;
}

// ─────────────────────────────────────────────
// Integración
// ─────────────────────────────────────────────
export type IntegrationProvider = "tiendanube" | "meta" | "gmail";
export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface Integration {
  id: string;
  workspace_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  expires_at?: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Órdenes TiendaNube
// ─────────────────────────────────────────────
export type OrderStatus = "paid" | "pending" | "cancelled" | "refunded";

export interface Order {
  id: string;
  workspace_id: string;
  external_id: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: OrderStatus;
  created_at: string;
}

// ─────────────────────────────────────────────
// Alertas
// ─────────────────────────────────────────────
export type AlertType =
  | "new_order"
  | "abandoned_cart"
  | "low_stock"
  | "metric_anomaly";

export interface Alert {
  id: string;
  workspace_id: string;
  type: AlertType;
  title: string;
  body: string;
  read: boolean;
  sent_email: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────
// Config financiera
// ─────────────────────────────────────────────
export interface FinancialConfig {
  id: string;
  workspace_id: string;
  usd_rate: number;
  tax_rate: number;
  platform_fee: number;
  agency_fee: number;
}

// ─────────────────────────────────────────────
// Métricas comunes (dashboard)
// ─────────────────────────────────────────────
export interface MetricCard {
  label: string;
  value: string | number;
  change?: number;   // % vs período anterior
  trend?: "up" | "down" | "neutral";
}

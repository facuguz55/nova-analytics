export interface ChangelogEntry {
  version: string;
  date: string;
  tag: "launch" | "feature" | "fix" | "improvement";
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-05-25",
    tag: "launch",
    title: "Lanzamiento de Nova Analytics",
    items: [
      "Dashboard con métricas en tiempo real desde TiendaNube",
      "Gestión de órdenes, productos y clientes",
      "Análisis de rentabilidad con costos configurables",
      "Integración con Meta Ads para seguimiento de campañas",
      "Sistema de alertas automáticas de stock bajo",
      "Chat con IA integrado para análisis de datos",
      "Gestión de emails con análisis de sentimiento",
      "Cotizaciones del dólar en tiempo real",
      "Paywall y sistema de planes (free, trial, pro, agency)",
      "Panel super admin (Nova HQ)",
      "Seguridad: rate limiting, cifrado AES-256-GCM, middleware de auth",
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;

export const TAG_META: Record<ChangelogEntry["tag"], { label: string; color: string; bg: string }> = {
  launch:      { label: "Lanzamiento", color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  feature:     { label: "Nueva función", color: "#7C3AED", bg: "rgba(124,58,237,0.12)" },
  fix:         { label: "Corrección",  color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
  improvement: { label: "Mejora",      color: "#c026d3", bg: "rgba(37,99,235,0.12)"  },
};

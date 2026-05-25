import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma segura, resolviendo conflictos.
 * Uso: cn("text-sm", condition && "font-bold", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda completa con separadores de miles.
 * Ej: 1740000 → "$1.740.000"
 */
export function formatCurrency(
  amount: number,
  currency: "ARS" | "USD" = "ARS"
): string {
  if (!Number.isFinite(amount)) return currency === "ARS" ? "$0" : "U$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Versión compacta: 1.740.000 → "$1.7M". Útil para gráficos/ejes.
 */
export function formatCurrencyCompact(amount: number, currency: "ARS" | "USD" = "ARS"): string {
  const sym = currency === "USD" ? "U$" : "$";
  if (!Number.isFinite(amount)) return `${sym}0`;
  if (Math.abs(amount) >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000)     return `${sym}${(amount / 1_000).toFixed(0)}k`;
  return `${sym}${amount.toFixed(0)}`;
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-AR").format(n);
}

/**
 * Formatea una fecha en español
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

/**
 * Calcula el porcentaje de cambio entre dos valores
 */
export function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Trunca un texto a N caracteres con elipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

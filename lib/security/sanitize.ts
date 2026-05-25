/**
 * Utilidades de sanitización para inputs externos.
 * Úsalas antes de procesar contenido que viene de emails,
 * APIs de terceros o del cliente.
 */

/** Elimina caracteres de control peligrosos (deja \n y \t) */
export function sanitizePlainText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/** Elimina tags HTML, útil para extraer texto de emails HTML */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Sanitiza contenido de email para enviarlo a Claude.
 * Elimina patrones de prompt injection y limita el largo.
 */
export function sanitizeEmailForAI(content: string, maxLength = 3000): string {
  return content
    .slice(0, maxLength)
    // Neutralizar patrones comunes de prompt injection
    .replace(/\[INSTRUC[CK]IÓN[^\]]*\]/gi, "[contenido omitido]")
    .replace(/\[SYSTEM[^\]]*\]/gi, "[contenido omitido]")
    .replace(/ignore (all )?previous instructions?/gi, "[contenido omitido]")
    .replace(/system prompt/gi, "[referencia omitida]")
    .replace(/\bDAN\b/g, "[contenido omitido]")
    .replace(/jailbreak/gi, "[contenido omitido]")
    .trim();
}

/**
 * Sanitiza strings para logs — previene log injection.
 * Reemplaza saltos de línea y tabs por espacios.
 */
export function sanitizeForLog(text: string): string {
  return String(text)
    .replace(/[\r\n\t]/g, " ")
    .slice(0, 200);
}

/**
 * Verifica que un string no contenga CRLF (para prevenir header injection).
 * Retorna true si es seguro.
 */
export function isHeaderSafe(value: string): boolean {
  return !value.includes("\r") && !value.includes("\n");
}

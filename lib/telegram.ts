/**
 * Módulo de Telegram para Nova Analytics.
 * Envía mensajes a través del bot configurado con TELEGRAM_BOT_TOKEN.
 */

const BASE = "https://api.telegram.org";

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN no configurado en variables de entorno");
  return token;
}

/**
 * Envía un mensaje de texto a un chat de Telegram.
 * Usa MarkdownV2 para formateo (negrita, cursiva, código).
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "MarkdownV2" | "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  const token = getToken();
  try {
    const res = await fetch(`${BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    chatId,
        text,
        parse_mode: parseMode,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Plantillas de mensajes para alertas comunes.
 */
export const TelegramMessages = {
  dailySummary: (data: {
    storeName: string;
    revenue: number;
    orders: number;
    newCustomers: number;
    date: string;
  }) => `📊 <b>Resumen diario — ${data.storeName}</b>
📅 ${data.date}

💰 <b>Ventas:</b> $${data.revenue.toLocaleString("es-AR")}
🛒 <b>Órdenes:</b> ${data.orders}
👤 <b>Clientes nuevos:</b> ${data.newCustomers}

<i>Visto desde Nova Analytics</i>`,

  bigSaleAlert: (data: {
    orderNumber: string | number;
    amount: number;
    customerName: string;
  }) => `🎉 <b>¡Venta grande!</b>
Orden <code>#${data.orderNumber}</code>
👤 ${data.customerName}
💰 <b>$${data.amount.toLocaleString("es-AR")}</b>`,

  vipInactiveAlert: (data: {
    customerName: string;
    email: string;
    daysSince: number;
    totalSpent: number;
  }) => `⚠️ <b>Cliente VIP inactivo</b>
👤 ${data.customerName}
📧 ${data.email}
📅 Sin comprar hace <b>${data.daysSince} días</b>
💰 Gastó en total: $${data.totalSpent.toLocaleString("es-AR")}

Considerá reactivarlo con un descuento o email personalizado.`,

  stockAlert: (data: {
    productName: string;
    stock: number;
  }) => `📦 <b>Stock bajo</b>
<code>${data.productName}</code>
Quedan <b>${data.stock} unidades</b>`,

  anomalyAlert: (data: {
    type: "drop" | "spike";
    metric: string;
    pctChange: number;
  }) => `${data.type === "drop" ? "📉" : "📈"} <b>Anomalía detectada</b>
Métrica: <b>${data.metric}</b>
Cambio: <b>${data.pctChange > 0 ? "+" : ""}${data.pctChange.toFixed(1)}%</b> vs día anterior`,
};

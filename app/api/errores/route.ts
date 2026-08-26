import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.NOVA_AGENCY_OS_ERRORS_URL;
  const webhookSecret = process.env.ERROR_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const body = JSON.stringify(normalizarPayload(payload));

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${webhookSecret}`,
      },
      body,
    });
  } catch {
    // Best-effort: nunca romper la app del cliente por un error de reporte.
  }

  return NextResponse.json({ ok: true });
}

function normalizarPayload(payload: unknown) {
  const data = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;

  // Ya viene en el formato que espera nova-agency-os: {app, asunto, error: {...}}
  if (data.error && typeof data.error === "object") {
    const error = data.error as Record<string, unknown>;
    return {
      app: data.app || "nova-analytics",
      asunto: (data.asunto as string) || String(error.mensaje || "Error desconocido").slice(0, 120),
      error: {
        id: error.id || crypto.randomUUID(),
        ...error,
      },
    };
  }

  // Formato plano: {app, donde, mensaje, stack, detalle, ...}
  const mensaje = (data.mensaje as string) || "Error desconocido";
  return {
    app: data.app || "nova-analytics",
    asunto: mensaje.toString().slice(0, 120),
    error: {
      id: crypto.randomUUID(),
      donde: data.donde,
      mensaje: data.mensaje,
      stack: data.stack,
      url: data.url,
      navegador: data.navegador,
      detalle: data.detalle || {},
    },
  };
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.NOVA_AGENCY_OS_ERRORS_URL;
  const webhookSecret = process.env.ERROR_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  const body = await req.text();

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

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  token: z.string().min(10),
  adAccountId: z.string().min(5),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { token, adAccountId } = parsed.data;
  const accountId = adAccountId.replace(/^act_/, "");

  try {
    const url = `https://graph.facebook.com/v21.0/act_${accountId}?fields=name,currency,account_status&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({
      name: data.name,
      currency: data.currency,
      status: data.account_status,
    });
  } catch {
    return NextResponse.json({ error: "Error de conexión con Meta" }, { status: 500 });
  }
}

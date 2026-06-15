import { NextRequest, NextResponse } from "next/server";
import { getMetaConnection } from "@/lib/meta/connection";

export async function GET(req: NextRequest) {
  const conn = await getMetaConnection();
  if (!conn) return NextResponse.json({ error: "Meta no conectado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const datePreset = searchParams.get("date_preset") ?? "last_30d";
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  const accountId = conn.adAccountId.replace(/^act_/, "");

  const fields = [
    "campaign_name",
    "adset_name",
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "unique_clicks",
    "ctr",
    "unique_ctr",
    "cpc",
    "cpm",
    "cpp",
    "actions",
    "action_values",
    "cost_per_action_type",
    "video_play_actions",
    "video_avg_time_watched_actions",
    "video_p100_watched_actions",
    "video_p95_watched_actions",
    "video_p75_watched_actions",
    "video_p50_watched_actions",
    "website_ctr",
    "unique_link_clicks_ctr",
    "outbound_clicks",
    "cost_per_outbound_click",
  ].join(",");

  let timeRange = "";
  if (since && until) {
    timeRange = `&time_range={"since":"${since}","until":"${until}"}`;
  } else {
    timeRange = `&date_preset=${datePreset}`;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=${fields}&level=campaign&limit=50${timeRange}&access_token=${conn.accessToken}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // También traer datos de cuenta (spend total del período)
    const accountUrl = `https://graph.facebook.com/v21.0/act_${accountId}?fields=name,currency,spend_cap,amount_spent&access_token=${conn.accessToken}`;
    const accountRes = await fetch(accountUrl, { next: { revalidate: 300 } });
    const accountData = await accountRes.json();

    return NextResponse.json({
      campaigns: data.data ?? [],
      paging: data.paging ?? null,
      account: accountData.error ? null : {
        name: accountData.name,
        currency: accountData.currency,
      },
    });
  } catch {
    return NextResponse.json({ error: "Error de conexión con Meta" }, { status: 500 });
  }
}

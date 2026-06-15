import type { Metadata } from "next";
import { getMetaConnection } from "@/lib/meta/connection";
import MetaAdsClient from "./MetaAdsClient";

export const metadata: Metadata = { title: "Meta Ads" };

export default async function MetaAdsPage() {
  const conn = await getMetaConnection();
  return <MetaAdsClient connected={!!conn} />;
}

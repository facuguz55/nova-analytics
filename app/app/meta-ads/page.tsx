import type { Metadata } from "next";
import MetaAdsClient from "./MetaAdsClient";

export const metadata: Metadata = { title: "Meta Ads" };

export default function MetaAdsPage() {
  return <MetaAdsClient />;
}

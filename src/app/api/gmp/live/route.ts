import { NextResponse } from "next/server";
import { getIpoFeed } from "@/lib/server-data";
export const dynamic = "force-dynamic";
export async function GET() {
  const feed = await getIpoFeed();
  const live = feed.records.filter((ipo) => (ipo.status === "OPEN" || ipo.status === "UPCOMING") && ipo.gmp != null).map((ipo) => ({
    ...ipo,
    percent: ipo.gmpPercentage ?? (ipo.priceBandHigh && ipo.priceBandHigh > 0 ? Math.round((ipo.gmp! / ipo.priceBandHigh) * 10_000) / 100 : undefined),
  }));
  return NextResponse.json({ ...feed, records: live }, { headers: { "Cache-Control": "private, max-age=0, s-maxage=30, stale-while-revalidate=60", "X-Data-Status": feed.freshness } });
}

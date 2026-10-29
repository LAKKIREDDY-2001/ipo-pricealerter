import { NextResponse } from "next/server";
import { getIpoFeed } from "@/lib/server-data";
export const dynamic = "force-dynamic";
export async function GET() {
  const feed = await getIpoFeed();
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata" }).format(new Date());
  const live = feed.records.filter((ipo) => {
    const notClosedByDate = !ipo.closeDate || ipo.closeDate >= today;
    return (ipo.status === "OPEN" || ipo.status === "UPCOMING") && notClosedByDate && ipo.gmp != null;
  }).map((ipo) => ({
    ...ipo,
    status: ipo.status === "UPCOMING" && ipo.openDate && ipo.openDate <= today ? "OPEN" as const : ipo.status,
    percent: ipo.gmpPercentage ?? (ipo.priceBandHigh && ipo.priceBandHigh > 0 ? Math.round((ipo.gmp! / ipo.priceBandHigh) * 10_000) / 100 : undefined),
  }));
  return NextResponse.json({ ...feed, records: live }, { headers: { "Cache-Control": "private, max-age=0, s-maxage=30, stale-while-revalidate=60", "X-Data-Status": feed.freshness } });
}

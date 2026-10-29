import { NextRequest, NextResponse } from "next/server";
import { getIpoFeed } from "@/lib/server-data";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const feed = await getIpoFeed();
  const records = feed.records;
  const status = params.get("status")?.toUpperCase(), board = params.get("board")?.toUpperCase(), exchange = params.get("exchange")?.toUpperCase();
  const search = params.get("search")?.toLowerCase() ?? "";
  const result = records.filter((ipo) => (!status || ipo.status === status) && (!board || ipo.board === board) && (!exchange || ipo.exchange === exchange || ipo.exchange === "BOTH") && (!search || `${ipo.companyName} ${ipo.slug}`.toLowerCase().includes(search)));
  const sort = params.get("sort");
  if (sort === "closeDate") result.sort((a, b) => a.closeDate.localeCompare(b.closeDate));
  if (sort === "listingDate") result.sort((a, b) => (b.listingDate ?? "").localeCompare(a.listingDate ?? ""));
  return NextResponse.json({ ...feed, records: result }, { headers: { "Cache-Control": "private, max-age=0, s-maxage=30, stale-while-revalidate=60", "X-Data-Status": feed.freshness } });
}

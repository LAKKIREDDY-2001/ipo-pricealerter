import { NextRequest, NextResponse } from "next/server";
import { getIpoFeed } from "@/lib/server-data";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const feed = await getIpoFeed();
  const records = feed.records;
  const status = params.get("status")?.toUpperCase();
  const board = params.get("board")?.toUpperCase();
  const exchange = params.get("exchange")?.toUpperCase();
  const search = params.get("search")?.toLowerCase() ?? "";
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata" }).format(new Date());

  // Status follows the current India date for issues with supplied issue dates.
  const effectiveStatus = (ipo: typeof records[number]) => {
    if (ipo.status === "LISTED") return "LISTED";
    if (ipo.openDate && ipo.listingDate && ipo.listingDate <= today) return "LISTED";
    if (ipo.closeDate && ipo.closeDate < today) return "CLOSED";
    if (ipo.openDate && ipo.closeDate && ipo.openDate <= today && ipo.closeDate >= today) return "OPEN";
    if (ipo.openDate && ipo.openDate > today) return "UPCOMING";
    return ipo.status;
  };

  const result = records
    .filter((ipo) =>
      (!status || effectiveStatus(ipo) === status) &&
      (!board || ipo.board === board) &&
      (!exchange || ipo.exchange === exchange || ipo.exchange === "BOTH") &&
      (!search || `${ipo.companyName} ${ipo.slug}`.toLowerCase().includes(search))
    )
    .map((ipo) => ({ ...ipo, status: effectiveStatus(ipo) }));

  const sort = params.get("sort");
  if (sort === "closeDate") result.sort((a, b) => a.closeDate.localeCompare(b.closeDate));
  if (sort === "listingDate") result.sort((a, b) => (b.listingDate ?? "").localeCompare(a.listingDate ?? ""));
  return NextResponse.json({ ...feed, records: result }, { headers: { "Cache-Control": "private, max-age=0, s-maxage=30, stale-while-revalidate=60", "X-Data-Status": feed.freshness } });
}

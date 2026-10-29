import { NextRequest, NextResponse } from "next/server";
import { getIpos } from "@/lib/server-data";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "Pass month as YYYY-MM" }, { status: 400 });
  const records = await getIpos(); const dates = records.flatMap((ipo) => [ipo.openDate, ipo.closeDate, ipo.listingDate].filter((date): date is string => Boolean(date?.startsWith(month))).map((date) => ({ date, slug: ipo.slug, companyName: ipo.companyName, shortName: ipo.shortName, status: ipo.status, event: date === ipo.openDate ? "opens" : date === ipo.closeDate ? "closes" : "lists" })));
  return NextResponse.json(dates);
}

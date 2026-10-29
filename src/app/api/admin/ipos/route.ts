import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateCache } from "@/lib/cache";
import { fromDb, getIpos } from "@/lib/server-data";
export const dynamic = "force-dynamic";
const validStatuses = ["UPCOMING", "OPEN", "CLOSED", "LISTED"];
const validTypes = ["FRESH", "OFS", "FRESH_AND_OFS", "UNKNOWN"];
const validBoards = ["MAINBOARD", "SME", "UNKNOWN"];
const validExchanges = ["NSE", "BSE", "BOTH", "UNKNOWN"];
const numberOrNull = (value: unknown) => value == null || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
const dateOrNull = (value: unknown) => value == null || value === "" ? null : new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json(await getIpos());
  try {
    const rows = await db.ipo.findMany({ include: { subscription: { orderBy: { day: "asc" } }, gmpHistory: { orderBy: { timestamp: "asc" } }, financials: true, promoters: true }, orderBy: [{ status: "asc" }, { closeDate: "asc" }] });
    return NextResponse.json(rows.map((row) => fromDb(row)));
  } catch (error) { console.error("Admin IPO read failed.", error); return NextResponse.json({ error: "Could not load saved IPOs." }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Configure DATABASE_URL before saving IPOs." }, { status: 503 });
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.companyName !== "string" || body.companyName.trim().length < 3 || typeof body.shortName !== "string" || !/^[a-z0-9-]+$/.test(String(body.slug ?? ""))) return NextResponse.json({ error: "Company name, short name, and a valid URL slug are required." }, { status: 400 });
    if (!validStatuses.includes(String(body.status ?? "UPCOMING")) || !validTypes.includes(String(body.issueType ?? "FRESH")) || !validBoards.includes(String(body.board ?? "MAINBOARD")) || !validExchanges.includes(String(body.exchange ?? "NSE"))) return NextResponse.json({ error: "Choose a valid status, issue type, board, and exchange." }, { status: 400 });
    const dateValues = [body.openDate, body.closeDate, body.allotDate, body.listingDate].map(dateOrNull);
    if (dateValues.some((date) => date instanceof Date && Number.isNaN(date.getTime()))) return NextResponse.json({ error: "Enter valid IPO dates." }, { status: 400 });
    const numericValues = [body.priceBandLow, body.priceBandHigh, body.lotSize, body.issueSizeCr, body.freshIssueCr, body.ofsCr, body.gmp, body.listingGain, body.currentPrice];
    if (numericValues.some((value) => value != null && value !== "" && !Number.isFinite(Number(value)))) return NextResponse.json({ error: "Enter valid numeric IPO details." }, { status: 400 });
    const high = numberOrNull(body.priceBandHigh), lot = numberOrNull(body.lotSize);
    const low = numberOrNull(body.priceBandLow);
    if (lot != null && (!Number.isInteger(lot) || lot < 1)) return NextResponse.json({ error: "Lot size must be a positive whole number." }, { status: 400 });
    if (low != null && high != null && low > 0 && high > 0 && low > high) return NextResponse.json({ error: "Price band low must not exceed its high value." }, { status: 400 });
    const created = await db.ipo.create({ data: {
      slug: String(body.slug), companyName: String(body.companyName), shortName: String(body.shortName),
      status: String(body.status ?? "UPCOMING") as "UPCOMING" | "OPEN" | "CLOSED" | "LISTED",
      issueType: String(body.issueType ?? "FRESH") as "FRESH" | "OFS" | "FRESH_AND_OFS" | "UNKNOWN",
      board: String(body.board ?? "MAINBOARD") as "MAINBOARD" | "SME" | "UNKNOWN",
      exchange: String(body.exchange ?? "NSE") as "NSE" | "BSE" | "BOTH" | "UNKNOWN",
      logoUrl: body.logoUrl ? String(body.logoUrl) : null,
      priceBandLow: numberOrNull(body.priceBandLow), priceBandHigh: numberOrNull(body.priceBandHigh),
      lotSize: lot,
      minimumInvestment: high != null && high > 0 && lot != null ? high * lot : null,
      issueSizeCr: numberOrNull(body.issueSizeCr), freshIssueCr: numberOrNull(body.freshIssueCr), ofsCr: numberOrNull(body.ofsCr),
      openDate: dateValues[0], closeDate: dateValues[1], allotDate: dateValues[2], listingDate: dateValues[3],
      gmp: numberOrNull(body.gmp), listingGain: numberOrNull(body.listingGain), currentPrice: numberOrNull(body.currentPrice),
      review: body.review ? String(body.review) : null, peers: Array.isArray(body.peers) ? body.peers.map(String) : [],
      dataSource: "MANUAL", sourceUpdatedAt: new Date(),
    } });
    invalidateCache("ipos:"); return NextResponse.json(created, { status: 201 });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Could not create IPO. Check required fields and slug uniqueness." }, { status: 400 }); }
}

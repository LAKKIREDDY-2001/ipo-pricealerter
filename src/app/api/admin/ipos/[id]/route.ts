import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateCache } from "@/lib/cache";
import { Prisma } from "@prisma/client";
export const dynamic = "force-dynamic";
const enumValues = {
  status: ["UPCOMING", "OPEN", "CLOSED", "LISTED"],
  issueType: ["FRESH", "OFS", "FRESH_AND_OFS", "UNKNOWN"],
  board: ["MAINBOARD", "SME", "UNKNOWN"],
  exchange: ["NSE", "BSE", "BOTH", "UNKNOWN"]
};
function optionalNumber(value: unknown) {
  if (value == null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("Enter valid numeric IPO details.");
  return number;
}
function optionalDate(value: unknown) {
  if (value == null || value === "") return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Enter valid IPO dates.");
  return date;
}
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(); if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Configure DATABASE_URL before saving IPOs." }, { status: 503 });
  try {
    const body = await request.json() as Record<string, unknown>; const data: Prisma.IpoUncheckedUpdateInput = {};
    for (const field of ["slug", "companyName", "shortName"] as const) if (field in body) {
      if (typeof body[field] !== "string" || !String(body[field]).trim()) return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
      if (field === "slug" && !/^[a-z0-9-]+$/.test(String(body[field]))) return NextResponse.json({ error: "Slug may contain lowercase letters, numbers, and hyphens." }, { status: 400 });
      data[field] = String(body[field]).trim();
    }
    for (const field of Object.keys(enumValues) as (keyof typeof enumValues)[]) if (field in body) {
      const value = String(body[field]);
      if (!enumValues[field].includes(value)) return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
      if (field === "status") data.status = value as "UPCOMING" | "OPEN" | "CLOSED" | "LISTED";
      if (field === "issueType") data.issueType = value as "FRESH" | "OFS" | "FRESH_AND_OFS" | "UNKNOWN";
      if (field === "board") data.board = value as "MAINBOARD" | "SME" | "UNKNOWN";
      if (field === "exchange") data.exchange = value as "NSE" | "BSE" | "BOTH" | "UNKNOWN";
    }
    for (const field of ["priceBandLow", "priceBandHigh", "issueSizeCr", "freshIssueCr", "ofsCr", "gmp", "listingGain", "currentPrice"] as const) if (field in body) data[field] = optionalNumber(body[field]);
    if ("lotSize" in body) { const value = optionalNumber(body.lotSize); if (value != null && (!Number.isInteger(value) || value < 1)) return NextResponse.json({ error: "Lot size must be a positive whole number." }, { status: 400 }); data.lotSize = value; }
    for (const field of ["openDate", "closeDate", "allotDate", "listingDate"] as const) if (field in body) data[field] = optionalDate(body[field]);
    if ("review" in body) data.review = body.review == null ? null : String(body.review);
    if ("logoUrl" in body) data.logoUrl = body.logoUrl == null || body.logoUrl === "" ? null : String(body.logoUrl);
    if ("peers" in body) data.peers = Array.isArray(body.peers) ? body.peers.map(String) : [];
    if ("priceBandHigh" in body || "lotSize" in body) {
      const current = await db.ipo.findUnique({ where: { id: params.id }, select: { priceBandHigh: true, lotSize: true } });
      if (!current) return NextResponse.json({ error: "IPO not found." }, { status: 404 });
      const high = "priceBandHigh" in body ? optionalNumber(body.priceBandHigh) : Number(current.priceBandHigh);
      const lot = "lotSize" in body ? optionalNumber(body.lotSize) : current.lotSize;
      if (high != null && high > 0 && lot != null && Number.isInteger(lot) && lot > 0) data.minimumInvestment = high * lot;
      else data.minimumInvestment = null;
    }
    data.dataSource = "MANUAL";
    data.sourceUpdatedAt = new Date();
    const updated = await db.ipo.update({ where: { id: params.id }, data });
    invalidateCache("ipos:"); return NextResponse.json(updated);
  } catch (error) { console.error(error); return NextResponse.json({ error: (error as Error).message || "Could not update IPO." }, { status: 400 }); }
}
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(); if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Configure DATABASE_URL before deleting IPOs." }, { status: 503 });
  try { await db.ipo.delete({ where: { id: params.id } }); invalidateCache("ipos:"); return NextResponse.json({ ok: true }); }
  catch (error) { console.error(error); return NextResponse.json({ error: "Could not delete IPO." }, { status: 400 }); }
}

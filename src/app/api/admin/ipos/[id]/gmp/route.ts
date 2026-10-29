import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateCache } from "@/lib/cache";
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(); if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Configure DATABASE_URL before saving GMP." }, { status: 503 });
  try {
    const body = await request.json(); const gmp = body.gmp == null || body.gmp === "" ? Number.NaN : Number(body.gmp);
    if (!Number.isFinite(gmp)) return NextResponse.json({ error: "Enter a valid GMP amount." }, { status: 400 });
    const observedAt = new Date();
    const record = await db.$transaction([
      db.gmpRecord.create({ data: { ipoId: params.id, gmp, timestamp: observedAt } }),
      db.ipo.update({ where: { id: params.id }, data: { gmp, gmpUpdatedAt: observedAt, gmpSource: "MANUAL", dataSource: "MANUAL", sourceUpdatedAt: observedAt } }),
    ]);
    invalidateCache("ipos:"); return NextResponse.json(record[0], { status: 201 });
  }
  catch (error) { console.error(error); return NextResponse.json({ error: "Could not add GMP record." }, { status: 400 }); }
}

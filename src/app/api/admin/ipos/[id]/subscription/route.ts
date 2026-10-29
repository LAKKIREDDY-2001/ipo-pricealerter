import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateCache } from "@/lib/cache";
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(); if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Configure DATABASE_URL before saving subscription data." }, { status: 503 });
  try {
    const body = await request.json();
    const day = Number(body.day);
    const values = [body.retail, body.nii, body.qib, body.total].map((value) => value == null || value === "" ? null : Number(value));
    if (!Number.isInteger(day) || day < 1 || values.some((value) => value != null && (!Number.isFinite(value) || value < 0))) return NextResponse.json({ error: "Enter a positive day number and non-negative subscription values." }, { status: 400 });
    const [retail, nii, qib, total] = values;
    const observedAt = new Date();
    const record = await db.$transaction([
      db.subscription.upsert({ where: { ipoId_day: { ipoId: params.id, day } }, update: { retail, nii, qib, total, timestamp: observedAt }, create: { ipoId: params.id, day, retail, nii, qib, total, timestamp: observedAt } }),
      db.ipo.update({ where: { id: params.id }, data: { subscriptionUpdatedAt: observedAt, subscriptionSource: "MANUAL", dataSource: "MANUAL", sourceUpdatedAt: observedAt } }),
    ]);
    invalidateCache("ipos:"); return NextResponse.json(record[0], { status: 201 });
  }
  catch (error) { console.error(error); return NextResponse.json({ error: "Could not save subscription figures." }, { status: 400 }); }
}

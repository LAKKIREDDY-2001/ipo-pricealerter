import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  return NextResponse.json({ databaseConfigured: Boolean(process.env.DATABASE_URL) });
}

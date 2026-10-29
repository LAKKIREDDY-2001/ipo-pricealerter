import { NextResponse } from "next/server";
import { getIpo } from "@/lib/server-data";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const item = await getIpo(params.slug);
  return item ? NextResponse.json(item.subscription ?? []) : NextResponse.json({ error: "IPO not found" }, { status: 404 });
}

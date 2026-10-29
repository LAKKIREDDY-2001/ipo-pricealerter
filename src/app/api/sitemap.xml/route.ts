import { NextResponse } from "next/server";
import { getIpos } from "@/lib/server-data";
export const dynamic = "force-dynamic";
export async function GET() {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const records = await getIpos();
  const urls = ["", "/calendar", "/gmp", ...records.map((ipo) => `/ipo/${ipo.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${base}${path}</loc></url>`).join("")}</urlset>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

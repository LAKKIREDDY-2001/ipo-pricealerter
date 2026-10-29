import { NextResponse } from "next/server";
export async function GET() {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return new NextResponse(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain" } });
}

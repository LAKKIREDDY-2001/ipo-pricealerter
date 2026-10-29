import type { MetadataRoute } from "next";
import { getIpos } from "@/lib/server-data";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const records = await getIpos();
  return [{ url: base, changeFrequency: "hourly", priority: 1 }, { url: `${base}/calendar`, changeFrequency: "daily", priority: .8 }, { url: `${base}/gmp`, changeFrequency: "hourly", priority: .8 }, ...records.map((ipo) => ({ url: `${base}/ipo/${ipo.slug}`, changeFrequency: "daily" as const, priority: .7 }))];
}

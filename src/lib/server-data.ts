import "server-only";
import { db } from "@/lib/db";
import type { DataFreshness, Ipo, IpoFeed } from "@/lib/data";
import { enrichIpoFromIpoGuru, getIpoGuruFeed } from "@/lib/live-ipo";
import { manualIpos } from "@/lib/manual-ipo-data";

const num = (value: unknown) => value == null ? undefined : Number(value);
const nameKey = (value: string) => value.toLowerCase().replace(/limited|ltd\.?/g, "").replace(/[^a-z0-9]/g, "");
const dateOnly = (value?: Date | null) => value ? value.toISOString().slice(0, 10) : "";

export function fromDb(row: any, freshness: DataFreshness = "stale"): Ipo {
  const initials = row.shortName.split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
  const officialLinks = Array.isArray(row.officialLinks) ? row.officialLinks.filter((item: any) => item && typeof item.label === "string" && typeof item.url === "string") : undefined;
  const updatedAt = row.sourceUpdatedAt?.toISOString() ?? row.updatedAt?.toISOString();
  return {
    id: row.id, slug: row.slug, companyName: row.companyName, shortName: row.shortName, initials: initials || "IPO", color: "#EEF3FA",
    logoUrl: row.logoUrl ?? undefined, status: row.status, issueType: row.issueType ?? "UNKNOWN", board: row.board,
    exchange: row.exchange ?? "UNKNOWN", priceBandLow: num(row.priceBandLow), priceBandHigh: num(row.priceBandHigh),
    issuePrice: num(row.issuePrice), listingPrice: num(row.listingPrice), minimumInvestment: num(row.minimumInvestment),
    lotSize: row.lotSize ?? undefined, issueSizeCr: num(row.issueSizeCr), freshIssueCr: num(row.freshIssueCr), ofsCr: num(row.ofsCr),
    openDate: dateOnly(row.openDate), closeDate: dateOnly(row.closeDate), allotDate: dateOnly(row.allotDate) || undefined,
    listingDate: dateOnly(row.listingDate) || undefined, gmp: num(row.gmp), gmpUpdatedAt: row.gmpUpdatedAt?.toISOString(),
    gmpHistory: row.gmpHistory?.map((item: any) => ({ gmp: Number(item.gmp), date: item.timestamp.toISOString().slice(0, 10), timestamp: item.timestamp.toISOString() })),
    subscription: row.subscription?.map((item: any) => ({ day: item.day, retail: num(item.retail), nii: num(item.nii), qib: num(item.qib), total: num(item.total), timestamp: item.timestamp?.toISOString() })),
    subscriptionUpdatedAt: row.subscriptionUpdatedAt?.toISOString(),
    subscriptionSource: row.subscriptionSource ?? undefined,
    sector: row.financials?.sector, business: row.financials?.business, review: row.review ?? undefined,
    listingGain: num(row.listingGain), currentPrice: num(row.currentPrice),
    source: row.dataSource === "MANUAL" ? "Manually updated" : row.providerSlug ? "IPO Guru API" : "Saved database entry; original source unknown",
    gmpSource: row.gmpSource ?? (row.providerSlug ? "IPO Guru API" : row.gmp == null ? undefined : "Saved database entry; original source unknown"),
    sourceUrl: row.providerUrl ?? undefined, providerUrl: row.providerUrl ?? undefined,
    officialLinks, registrarName: row.registrarName ?? undefined, registrarUrl: row.registrarUrl ?? undefined,
    prospectusUrl: row.prospectusUrl ?? undefined, peers: row.peers ?? [], lastUpdated: updatedAt,
    sourceFreshness: row.dataSource === "MANUAL" ? "manual" : freshness,
    financials: row.financials ? [{ year: "Reported", revenue: num(row.financials.revenue), profit: num(row.financials.profit), ebitda: num(row.financials.ebitda), netWorth: num(row.financials.netWorth), eps: num(row.financials.eps), peRatio: num(row.financials.peRatio) }] : undefined,
    promoters: row.promoters?.map((promoter: any) => ({ name: promoter.name, holding: num(promoter.holding), notes: promoter.notes ?? undefined })),
  };
}

function mergeSavedAndProvider(saved: Ipo, provider: Ipo): Ipo {
  const history = new Map<string, NonNullable<Ipo["gmpHistory"]>[number]>();
  for (const point of [...(saved.gmpHistory ?? []), ...(provider.gmpHistory ?? [])]) {
    const key = point.timestamp ?? point.date;
    history.set(key, point);
  }
  const subscriptionHistory = provider.subscription?.length ? provider.subscription : saved.subscription;
  return {
    ...saved, ...provider, id: saved.id, slug: provider.slug,
    gmp: provider.gmp ?? saved.gmp, gmpUpdatedAt: provider.gmpUpdatedAt ?? saved.gmpUpdatedAt,
    gmpHistory: history.size ? [...history.values()].sort((a, b) => (a.timestamp ?? a.date).localeCompare(b.timestamp ?? b.date)) : undefined,
    subscription: subscriptionHistory,
    subscriptionSummary: provider.subscriptionSummary,
    subscriptionSource: provider.subscriptionSummary ? "IPO Guru API" : saved.subscriptionSource,
    subscriptionTotal: provider.subscriptionSummary?.total ?? provider.subscriptionTotal ?? saved.subscriptionSummary?.total ?? saved.subscriptionTotal,
    financials: saved.financials, promoters: saved.promoters, peers: provider.peers?.length ? provider.peers : saved.peers,
    source: provider.source, sourceUrl: provider.sourceUrl, providerUrl: provider.providerUrl,
    lastUpdated: provider.lastUpdated, sourceFreshness: provider.sourceFreshness,
  };
}

async function databaseRows(): Promise<Ipo[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const rows = await db.ipo.findMany({ include: { subscription: { orderBy: { day: "asc" } }, gmpHistory: { orderBy: { timestamp: "asc" } }, financials: true, promoters: true }, orderBy: [{ status: "asc" }, { closeDate: "asc" }] });
    return rows.map((row) => fromDb(row));
  } catch (error) {
    console.warn("Saved IPO records could not be loaded.", error instanceof Error ? error.name : "database_error");
    return [];
  }
}

export async function getIpoFeed(): Promise<IpoFeed> {
  const [provider, saved] = await Promise.all([getIpoGuruFeed(), databaseRows()]);
  if (!provider.records.length) {
    const records = saved.map((ipo) => ({ ...ipo, sourceFreshness: ipo.sourceFreshness === "manual" ? "manual" as const : "stale" as const }));
    return {
      records: mergeManualRecords(records), freshness: provider.freshness,
      lastSuccessfulUpdate: provider.lastSuccessfulUpdate,
      refreshSeconds: provider.refreshSeconds,
      errorCode: provider.errorCode,
    };
  }

  const savedByName = new Map(saved.map((ipo) => [nameKey(ipo.companyName), ipo]));
  const providerNames = new Set(provider.records.map((ipo) => nameKey(ipo.companyName)));
  const oldOnly = saved.filter((ipo) => !providerNames.has(nameKey(ipo.companyName)));
  const records = provider.records.map((ipo) => {
    const old = savedByName.get(nameKey(ipo.companyName));
    return old ? mergeSavedAndProvider(old, ipo) : ipo;
  });
  // Retain older locally stored issues and their real history, but label them stale.
  for (const old of oldOnly) records.push({ ...old, sourceFreshness: old.sourceFreshness === "manual" ? "manual" : "stale" });
  return { ...provider, records: mergeManualRecords(records) };
}

/** Merge the editable starter dataset without duplicates; provider values remain preferred. */
function mergeManualRecords(records: Ipo[]): Ipo[] {
  const byName = new Map(records.map((ipo) => [nameKey(ipo.companyName), ipo]));
  const providerNames = new Set(records.map((ipo) => nameKey(ipo.companyName)));
  const merged = [...records];
  for (const manual of manualIpos) {
    const existing = byName.get(nameKey(manual.companyName));
    if (existing) {
      // Manual details fill gaps only. Live provider details override same-name manual values.
      const combined = {
        ...manual, ...existing,
        aiGainPercent: existing.aiGainPercent ?? manual.aiGainPercent,
        aiGainRupees: existing.aiGainRupees ?? manual.aiGainRupees,
        review: existing.review ?? manual.review,
        id: existing.id,
        slug: existing.slug,
      };
      const index = merged.findIndex((item) => item.id === existing.id);
      if (index >= 0) merged[index] = combined;
    } else if (!providerNames.has(nameKey(manual.companyName))) {
      merged.push(manual);
    }
  }
  return merged;
}

export async function getIpos(): Promise<Ipo[]> {
  return (await getIpoFeed()).records;
}

export async function getIpo(slug: string): Promise<Ipo | undefined> {
  const records = await getIpoFeed();
  const ipo = records.records.find((item) => item.slug === slug);
  if (!ipo || ipo.source !== "IPO Guru API") return ipo;
  return enrichIpoFromIpoGuru(ipo);
}

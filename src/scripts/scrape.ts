import { Prisma, PrismaClient } from "@prisma/client";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseIpoGuruList, requestIpoGuruJson } from "@/lib/providers/ipoguru";

const CACHE_KEY = "ipoguru:ipos";
const QUOTA_KEY = "ipoguru:quota";
const positiveInt = (value?: number) => value != null && Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
const nonNegativeInt = (value?: number) => value != null && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;
const rateAwareRefreshMs = (dailyLimit?: number) => {
  const configured = Number(process.env.IPOGURU_REFRESH_SECONDS ?? 300);
  const requested = Number.isFinite(configured) ? Math.max(60, Math.min(86_400, configured)) * 1_000 : 300_000;
  const budget = dailyLimit && dailyLimit > 0 ? 86_400_000 / (dailyLimit * 0.75) : 0;
  return Math.max(requested, budget);
};

export async function syncIpoGuruSnapshot() {
  const prisma = new PrismaClient();
  try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the scheduled IPO cache.");
  if (!process.env.IPOGURU_API_KEY) throw new Error("IPOGURU_API_KEY is required; configure the GitHub Actions secret.");

  const [previous, quota] = await Promise.all([
    prisma.providerCache.findUnique({ where: { key: CACHE_KEY } }),
    prisma.providerCache.findUnique({ where: { key: QUOTA_KEY } }),
  ]);
  const knownLimit = quota?.dailyLimit ?? undefined;
  const ttl = rateAwareRefreshMs(knownLimit);
  if (previous?.payload && previous.fetchedAt && Date.now() - previous.fetchedAt.getTime() < ttl) {
    console.log("IPO Guru snapshot is within its configured refresh window; no request sent.");
    return;
  }
  if (previous?.retryAt && previous.retryAt.getTime() > Date.now()) {
    console.log("IPO Guru retry window is active; the saved snapshot is unchanged.");
    return;
  }

  const response = await requestIpoGuruJson("/ipos?months=0");
  const records = parseIpoGuruList(response.payload);
  const now = new Date();
  const plan = response.meta.plan ?? (typeof response.payload === "object" && response.payload && "plan" in response.payload ? String(response.payload.plan) : undefined);
  const dailyLimit = positiveInt(response.meta.dailyLimit);
  const interval = rateAwareRefreshMs(dailyLimit);
  const nextRefreshAt = new Date(now.getTime() + interval);
  await prisma.$transaction([
    prisma.providerCache.upsert({
      where: { key: CACHE_KEY },
      update: { payload: response.payload as Prisma.InputJsonValue, fetchedAt: now, nextRefreshAt, retryAt: null, plan: plan ?? null, dailyLimit: dailyLimit ?? null, requestsPerMinute: positiveInt(response.meta.requestsPerMinute) ?? null, remaining: nonNegativeInt(response.meta.remaining) ?? null, errorCode: null },
      create: { key: CACHE_KEY, payload: response.payload as Prisma.InputJsonValue, fetchedAt: now, nextRefreshAt, plan: plan ?? null, dailyLimit: dailyLimit ?? null, requestsPerMinute: positiveInt(response.meta.requestsPerMinute) ?? null, remaining: nonNegativeInt(response.meta.remaining) ?? null },
    }),
    prisma.providerCache.upsert({
      where: { key: QUOTA_KEY },
      update: { plan: plan ?? null, dailyLimit: dailyLimit ?? null, requestsPerMinute: positiveInt(response.meta.requestsPerMinute) ?? null, remaining: nonNegativeInt(response.meta.remaining) ?? null, retryAt: response.meta.remaining === 0 ? new Date(now.getTime() + 86_400_000) : null },
      create: { key: QUOTA_KEY, plan: plan ?? null, dailyLimit: dailyLimit ?? null, requestsPerMinute: positiveInt(response.meta.requestsPerMinute) ?? null, remaining: nonNegativeInt(response.meta.remaining) ?? null },
    }),
  ]);
  console.log(`Cached ${records.length} validated IPO Guru records; plan=${plan ?? "not reported"}, remaining=${response.meta.remaining ?? "not reported"}.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void syncIpoGuruSnapshot().catch((error) => {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "sync_failed";
    const kind = error instanceof Error ? error.name : "UnknownError";
    console.error(`IPO Guru sync failed [${code}; ${kind}].`);
    process.exitCode = 1;
  });
}

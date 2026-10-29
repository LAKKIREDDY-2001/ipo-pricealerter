import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { DataFreshness } from "@/lib/data";
import { IpoGuruError, requestIpoGuruJson, type IpoGuruResponseMeta } from "@/lib/providers/ipoguru";

type CacheRow = {
  payload?: unknown;
  fetchedAt?: Date | string | null;
  nextRefreshAt?: Date | string | null;
  retryAt?: Date | string | null;
  plan?: string | null;
  dailyLimit?: number | null;
  requestsPerMinute?: number | null;
  remaining?: number | null;
  errorCode?: string | null;
};
type CacheResult<T> = { data: T; fetchedAt: string; freshness: DataFreshness; errorCode?: string };
type MemoryRow = CacheRow & { expiresAt?: number };
const memory = new Map<string, MemoryRow>();
const QUOTA_KEY = "ipoguru:quota";
const flights = new Map<string, Promise<unknown>>();

const asTime = (value: Date | string | null | undefined) => value ? new Date(value).getTime() : 0;
const refreshSeconds = () => {
  const value = Number(process.env.IPOGURU_REFRESH_SECONDS ?? process.env.NEXT_PUBLIC_IPOGURU_REFRESH_SECONDS ?? 300);
  return Number.isFinite(value) ? Math.max(60, Math.min(86_400, Math.floor(value))) : 300;
};
const dailyRateInterval = (meta: Pick<CacheRow, "dailyLimit" | "requestsPerMinute">) => {
  const daily = meta.dailyLimit && meta.dailyLimit > 0 ? 86_400_000 / (meta.dailyLimit * 0.75) : 0;
  const perMinute = meta.requestsPerMinute && meta.requestsPerMinute > 0 ? 60_000 / meta.requestsPerMinute : 0;
  return Math.max(daily, perMinute, 1_000);
};
const nextIstMidnight = () => {
  const now = new Date();
  const india = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(`${india}T00:00:00+05:30`).getTime() + 86_400_000;
};
const isDbConfigured = () => Boolean(process.env.DATABASE_URL);

async function readCache(key: string): Promise<CacheRow | undefined> {
  const local = memory.get(key);
  if (local) return local;
  if (!isDbConfigured()) return undefined;
  try {
    const row = await db.providerCache.findUnique({ where: { key } });
    if (!row) return undefined;
    const result: CacheRow = row;
    memory.set(key, result);
    return result;
  } catch { return undefined; }
}

async function writeCache(key: string, data: CacheRow, preservePayload = false) {
  const current = await readCache(key);
  const next = { ...current, ...data, ...(preservePayload ? { payload: current?.payload } : {}) };
  memory.set(key, next);
  if (!isDbConfigured()) return;
  try {
    const update: Prisma.ProviderCacheUpdateInput = {
      ...(data.payload !== undefined ? { payload: data.payload as Prisma.InputJsonValue } : {}),
      ...(data.fetchedAt !== undefined ? { fetchedAt: data.fetchedAt ? new Date(data.fetchedAt) : null } : {}),
      ...(data.nextRefreshAt !== undefined ? { nextRefreshAt: data.nextRefreshAt ? new Date(data.nextRefreshAt) : null } : {}),
      ...(data.retryAt !== undefined ? { retryAt: data.retryAt ? new Date(data.retryAt) : null } : {}),
      ...(data.plan !== undefined ? { plan: data.plan } : {}),
      ...(data.dailyLimit !== undefined ? { dailyLimit: data.dailyLimit } : {}),
      ...(data.requestsPerMinute !== undefined ? { requestsPerMinute: data.requestsPerMinute } : {}),
      ...(data.remaining !== undefined ? { remaining: data.remaining } : {}),
      ...(data.errorCode !== undefined ? { errorCode: data.errorCode } : {}),
    };
    const create: Prisma.ProviderCacheCreateInput = {
      key,
      payload: data.payload === undefined ? Prisma.JsonNull : data.payload as Prisma.InputJsonValue,
      fetchedAt: data.fetchedAt ? new Date(data.fetchedAt) : null,
      nextRefreshAt: data.nextRefreshAt ? new Date(data.nextRefreshAt) : null,
      retryAt: data.retryAt ? new Date(data.retryAt) : null,
      plan: data.plan ?? null,
      dailyLimit: data.dailyLimit ?? null,
      requestsPerMinute: data.requestsPerMinute ?? null,
      remaining: data.remaining ?? null,
      errorCode: data.errorCode ?? null,
    };
    await db.providerCache.upsert({ where: { key }, update, create });
  } catch { /* The process cache remains available if the database is offline. */ }
}

async function syncQuota(meta: IpoGuruResponseMeta, retryAfterSeconds?: number) {
  const now = Date.now();
  const retryAt = retryAfterSeconds != null ? now + Math.max(1, retryAfterSeconds) * 1_000 : meta.remaining === 0 ? nextIstMidnight() : undefined;
  const quotaRow: CacheRow = {
    ...(retryAt ? { retryAt: new Date(retryAt) } : {}),
    ...(meta.plan ? { plan: meta.plan } : {}),
    ...(meta.dailyLimit != null ? { dailyLimit: meta.dailyLimit } : {}),
    ...(meta.requestsPerMinute != null ? { requestsPerMinute: meta.requestsPerMinute } : {}),
    ...(meta.remaining != null ? { remaining: meta.remaining } : {}),
  };
  await writeCache(QUOTA_KEY, quotaRow, true);
}

function freshnessFor(fetchedAt: number, interval: number): DataFreshness {
  return Date.now() - fetchedAt > interval ? "stale" : "cached";
}

export async function getCachedIpoGuruData<T>(
  key: string,
  path: string,
  validate: (payload: unknown) => T,
  minRefreshSeconds = refreshSeconds(),
): Promise<CacheResult<T>> {
  const quotaRow = await readCache(QUOTA_KEY);
  const ttl = Math.max(minRefreshSeconds * 1_000, dailyRateInterval(quotaRow ?? {}));
  const previous = await readCache(key);
  const fetchedAt = asTime(previous?.fetchedAt);
  const retryAt = asTime(previous?.retryAt);
  if (previous?.payload !== undefined && previous.payload !== null && fetchedAt && Date.now() - fetchedAt < ttl) {
    try { return { data: validate(previous.payload), fetchedAt: new Date(fetchedAt).toISOString(), freshness: "cached" }; }
    catch { /* Discard malformed cached data and attempt a provider refresh. */ }
  }
  if (!process.env.IPOGURU_API_KEY) {
    if (previous?.payload != null && fetchedAt) return { data: validate(previous.payload), fetchedAt: new Date(fetchedAt).toISOString(), freshness: freshnessFor(fetchedAt, ttl), errorCode: "missing_key" };
    throw new IpoGuruError("IPO Guru key is not configured.", 401, "missing_key");
  }
  if (retryAt > Date.now()) {
    if (previous?.payload != null && fetchedAt) return { data: validate(previous.payload), fetchedAt: new Date(fetchedAt).toISOString(), freshness: "stale", errorCode: previous.errorCode ?? "rate_limited" };
    throw new IpoGuruError("IPO Guru retry window is active.", 429, previous?.errorCode ?? "rate_limited");
  }

  const quota = await readCache(QUOTA_KEY);
  if (asTime(quota?.retryAt) > Date.now()) {
    if (previous?.payload != null && fetchedAt) return { data: validate(previous.payload), fetchedAt: new Date(fetchedAt).toISOString(), freshness: freshnessFor(fetchedAt, ttl), errorCode: "rate_limited" };
    throw new IpoGuruError("IPO Guru request rate limit is active.", 429, "rate_limited");
  }
  const existingFlight = flights.get(key);
  if (existingFlight) {
    try { await existingFlight; } catch { /* The caller below uses the last saved snapshot. */ }
    const newest = await readCache(key);
    if (newest?.payload != null && asTime(newest.fetchedAt)) return { data: validate(newest.payload), fetchedAt: new Date(asTime(newest.fetchedAt)).toISOString(), freshness: "cached" };
  }
  const flight = (async () => {
    const response = await requestIpoGuruJson(path);
    const data = validate(response.payload);
    const now = new Date();
    const interval = Math.max(minRefreshSeconds * 1_000, dailyRateInterval({ dailyLimit: response.meta.dailyLimit }));
    const row: CacheRow = {
      payload: response.payload, fetchedAt: now, nextRefreshAt: new Date(now.getTime() + interval), retryAt: null,
      plan: response.meta.plan ?? null, dailyLimit: response.meta.dailyLimit ?? null,
      requestsPerMinute: response.meta.requestsPerMinute ?? null, remaining: response.meta.remaining ?? null, errorCode: null,
    };
    await writeCache(key, row);
    await syncQuota(response.meta);
    return { data, fetchedAt: now.toISOString(), freshness: "fresh" as const };
  })();
  flights.set(key, flight);
  try { return await flight; }
  catch (error) {
    const apiError = error instanceof IpoGuruError ? error : new IpoGuruError("IPO Guru refresh failed.", undefined, "provider_error");
    const delay = apiError.code === "daily_quota_reached" ? Math.max(60, (nextIstMidnight() - Date.now()) / 1_000) : apiError.retryAfterSeconds ?? (apiError.status === 429 ? 300 : apiError.status === 402 ? 900 : apiError.status === 401 || apiError.status === 403 ? 3_600 : 60);
    const retry = new Date(Date.now() + delay * 1_000);
    await writeCache(key, { retryAt: retry, errorCode: apiError.code ?? "provider_error" }, true);
    if (apiError.status === 429) await syncQuota({}, apiError.retryAfterSeconds ?? (apiError.code === "daily_quota_reached" ? delay : 300));
    if (previous?.payload != null && fetchedAt) {
      try { return { data: validate(previous.payload), fetchedAt: new Date(fetchedAt).toISOString(), freshness: "stale", errorCode: apiError.code ?? "provider_error" }; }
      catch { /* Corrupt cache; surface the provider error. */ }
    }
    throw apiError;
  } finally {
    if (flights.get(key) === flight) flights.delete(key);
  }
}

export async function ipoGuruRefreshSeconds() {
  const quota = await readCache(QUOTA_KEY);
  return Math.ceil(Math.max(refreshSeconds() * 1_000, dailyRateInterval(quota ?? {})) / 1_000);
}
export async function ipoGuruPlan() { return (await readCache(QUOTA_KEY))?.plan ?? undefined; }

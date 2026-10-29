import "server-only";
import type { Ipo, IpoFeed, SubscriptionSnapshot } from "@/lib/data";
import {
  parseIpoGuruGmpHistory,
  parseIpoGuruList,
  parseIpoGuruSubscription,
  mergeIpoGuruDetail,
  type IpoGuruError,
} from "@/lib/providers/ipoguru";
import { getCachedIpoGuruData, ipoGuruPlan, ipoGuruRefreshSeconds } from "@/lib/providers/ipoguru-cache";

function errorCode(error: unknown) {
  return (error as IpoGuruError | undefined)?.code ?? "provider_unavailable";
}

export async function getIpoGuruFeed(): Promise<IpoFeed> {
  try {
    const result = await getCachedIpoGuruData("ipoguru:ipos", "/ipos?months=0", parseIpoGuruList);
    const records = result.data.map((ipo) => ({
      ...ipo,
      lastUpdated: result.fetchedAt,
      sourceFreshness: result.freshness,
    }));
    return { records, freshness: result.freshness, lastSuccessfulUpdate: result.fetchedAt, refreshSeconds: await ipoGuruRefreshSeconds(), ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
  } catch (error) {
    return { records: [], freshness: "unavailable", refreshSeconds: await ipoGuruRefreshSeconds(), errorCode: errorCode(error) };
  }
}

export async function getLiveIpos(): Promise<Ipo[]> {
  return (await getIpoGuruFeed()).records;
}

function historyCacheValidator(payload: unknown) {
  return parseIpoGuruGmpHistory(payload);
}

function subscriptionHistory(payload: unknown): SubscriptionSnapshot[] {
  return parseIpoGuruSubscription(payload).history ?? [];
}

export async function enrichIpoFromIpoGuru(ipo: Ipo): Promise<Ipo> {
  let result = ipo;
  try {
    const detail = await getCachedIpoGuruData(`ipoguru:detail:${ipo.slug}`, `/ipos/${encodeURIComponent(ipo.slug)}`, (payload) => mergeIpoGuruDetail(ipo, payload), 21_600);
    result = { ...detail.data, lastUpdated: ipo.lastUpdated ?? detail.fetchedAt, sourceFreshness: detail.freshness === "stale" ? "stale" : ipo.sourceFreshness ?? "fresh" };
  } catch { /* The listing response still has useful data when detail scope is unavailable. */ }

  const plan = await ipoGuruPlan();
  const standardOrPro = plan === "standard" || plan === "pro" || plan === "enterprise";
  if (!standardOrPro) return result;

  const tasks: Promise<void>[] = [];
  tasks.push((async () => {
    try {
      const subscription = await getCachedIpoGuruData(`ipoguru:subscription:${ipo.slug}`, `/ipos/${encodeURIComponent(ipo.slug)}/subscription`, parseIpoGuruSubscription, 300);
      if (subscription.data.summary) {
        result = {
          ...result,
          subscriptionSummary: subscription.data.summary,
          subscriptionTotal: subscription.data.summary.total ?? result.subscriptionTotal,
          ...(subscription.data.summary.updatedAt ? { subscriptionUpdatedAt: subscription.data.summary.updatedAt } : {}),
          subscriptionSource: "IPO Guru API",
          ...(subscription.freshness === "stale" ? { sourceFreshness: "stale" as const } : {}),
        };
      }
    } catch { /* Category subscription requires an enabled provider scope. */ }
  })());
  tasks.push((async () => {
    try {
      const history = await getCachedIpoGuruData(`ipoguru:gmp-history:${ipo.slug}`, `/ipos/${encodeURIComponent(ipo.slug)}/gmp/history`, historyCacheValidator, 21_600);
      if (history.data.length) result = { ...result, gmpHistory: history.data, ...(history.freshness === "stale" ? { sourceFreshness: "stale" as const } : {}) };
    } catch { /* Historical GMP is plan-gated; keep only real saved observations. */ }
  })());
  if (plan === "pro" || plan === "enterprise") {
    tasks.push((async () => {
      try {
        const history = await getCachedIpoGuruData(`ipoguru:subscription-history:${ipo.slug}`, `/ipos/${encodeURIComponent(ipo.slug)}/subscription/history`, subscriptionHistory, 21_600);
        if (history.data.length) result = { ...result, subscription: history.data, ...(history.freshness === "stale" ? { sourceFreshness: "stale" as const } : {}) };
      } catch { /* Day-wise subscription history is plan-gated. */ }
    })());
  }
  await Promise.all(tasks);
  return result;
}

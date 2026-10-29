import type { Ipo, IpoIssueType, IpoExchange, IpoStatus, GmpObservation, SubscriptionSnapshot } from "@/lib/data";

export const IPOGURU_API_BASE = "https://www.ipoguru.in/api/v2";

export class IpoGuruError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "IpoGuruError";
  }
}

export type IpoGuruResponseMeta = {
  plan?: string;
  remaining?: number;
  dailyLimit?: number;
  requestsPerMinute?: number;
  retryAfterSeconds?: number;
};

export type IpoGuruResponse = { payload: unknown; meta: IpoGuruResponseMeta };
type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type JsonObject = Record<string, unknown>;

const object = (value: unknown): JsonObject | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : undefined;
const nonEmpty = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
const numberValue = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number(value.replace(/[₹,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};
const dateValue = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/);
  if (!match) return undefined;
  const parsed = new Date(`${match[1]}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== match[1]) return undefined;
  return match[1];
};
const isoTimestamp = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined;
};
const safeHttpsUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch { return undefined; }
};
const initials = (name: string) => name.split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 2).map((part) => [...part][0]).join("").toUpperCase();
const palette = ["#EAF1FF", "#FFF2DC", "#E7F5EF", "#F3EEFF", "#FCEEE8"];
const colorFor = (slug: string) => palette[[...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length];

function statusValue(row: JsonObject, openDate: string, closeDate: string, listingDate?: string): IpoStatus {
  if (row.is_listed === true) return "LISTED";
  const raw = String(row.status ?? "").trim().toLowerCase();
  if (raw === "open") return "OPEN";
  if (raw === "closed") return listingDate && Date.now() >= Date.parse(`${listingDate}T00:00:00+05:30`) ? "LISTED" : "CLOSED";
  if (raw === "listed") return "LISTED";
  if (raw === "upcoming") return "UPCOMING";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  if (openDate && closeDate && today >= openDate && today <= closeDate) return "OPEN";
  if (closeDate && today > closeDate) return listingDate && today >= listingDate ? "LISTED" : "CLOSED";
  return "UPCOMING";
}

function issueTypeValue(value: unknown): IpoIssueType {
  const text = String(value ?? "").toLowerCase();
  if (/\bfresh\b/.test(text) && /\bofs\b|offer for sale/.test(text)) return "FRESH_AND_OFS";
  if (/\bofs\b|offer for sale/.test(text)) return "OFS";
  if (/\bfresh\b/.test(text)) return "FRESH";
  return "UNKNOWN";
}

function exchangeValue(value: unknown): IpoExchange {
  const text = String(value ?? "").toUpperCase();
  const nse = /\bNSE\b/.test(text), bse = /\bBSE\b/.test(text);
  return nse && bse ? "BOTH" : nse ? "NSE" : bse ? "BSE" : "UNKNOWN";
}

function officialLinks(exchange: IpoExchange): Ipo["officialLinks"] {
  const links: NonNullable<Ipo["officialLinks"]> = [];
  if (exchange === "NSE" || exchange === "BOTH" || exchange === "UNKNOWN") links.push({ label: "NSE public issues", url: "https://www.nseindia.com/market-data/all-upcoming-issues-ipo" });
  if (exchange === "BSE" || exchange === "BOTH" || exchange === "UNKNOWN") links.push({ label: "BSE public issues", url: "https://www.bseindia.com/markets/PublicIssues/Issuesummary.aspx" });
  return links;
}

function mapGmp(value: unknown, priceBandHigh?: number): Pick<Ipo, "gmp" | "gmpPercentage" | "gmpPercentBasis" | "gmpUpdatedAt" | "gmpSource"> {
  const gmp = object(value);
  if (!gmp) return {};
  const price = numberValue(gmp.price_value ?? gmp.price);
  const explicit = numberValue(gmp.percentage);
  // IPO Guru defines percentage as premium over the cap price. Keep it unavailable
  // when we do not have a valid upper price band to identify that basis.
  const computed = price != null && priceBandHigh != null && priceBandHigh > 0 ? Math.round((price / priceBandHigh) * 10_000) / 100 : undefined;
  return {
    ...(price != null ? { gmp: price } : {}),
    ...(price != null ? { gmpSource: "IPO Guru API" } : {}),
    ...(computed != null ? { gmpPercentage: explicit != null && Math.abs(explicit - computed) <= 0.1 ? explicit : computed, gmpPercentBasis: "priceBandHigh" as const } : {}),
    ...(isoTimestamp(gmp.updated_at) ? { gmpUpdatedAt: isoTimestamp(gmp.updated_at) } : {}),
  };
}

export function mapIpoGuruRecord(value: unknown, fetchedAt = new Date().toISOString()): Ipo | undefined {
  const row = object(value);
  const slug = nonEmpty(row?.slug), companyName = nonEmpty(row?.name) ?? nonEmpty(row?.display_name);
  if (!row || !slug || !companyName) return undefined;
  const shortName = nonEmpty(row.display_name) ?? companyName;
  const openDate = dateValue(row.open_date) ?? "";
  const closeDate = dateValue(row.close_date) ?? "";
  const allotDate = dateValue(row.allotment_date);
  const listingDate = dateValue(row.listing_date);
  const issue = object(row.issue), timeline = object(row.timeline), listing = object(row.listing), gmp = row.gmp;
  const low = numberValue(row.price_min) ?? numberValue(issue?.price_min);
  const high = numberValue(row.price_max) ?? numberValue(issue?.price_max);
  const invalidBand = low != null && low > 0 && high != null && high > 0 && low > high;
  const bandLow = low != null && low > 0 && !invalidBand ? low : undefined;
  const bandHigh = high != null && high > 0 && !invalidBand ? high : undefined;
  const rawLotSize = numberValue(row.lot_size) ?? numberValue(issue?.lot_size);
  const lotSize = rawLotSize != null && Number.isInteger(rawLotSize) && rawLotSize > 0 ? rawLotSize : undefined;
  const minimumInvestment = bandHigh != null && lotSize != null ? Math.round(bandHigh * lotSize * 100) / 100 : undefined;
  const boardText = String(row.type ?? "").toLowerCase();
  const board = /sme/.test(boardText) ? "SME" : /mainboard/.test(boardText) ? "MAINBOARD" : "UNKNOWN";
  const exchange = exchangeValue(object(row.issue)?.listing_on ?? row.exchange);
  const issueType = issueTypeValue(issue?.sale_type ?? row.sale_type);
  const business = nonEmpty(object(row.company)?.about) ?? nonEmpty(object(row.company)?.description);
  const providerUrl = safeHttpsUrl(row.web_url);
  const priceBandLow = bandLow;
  const priceBandHigh = bandHigh;
  return {
    id: `ipoguru-${slug}`, slug, companyName, shortName, initials: initials(shortName) || "IPO", color: colorFor(slug),
    status: statusValue(row, openDate, closeDate, listingDate),
    board, exchange, issueType,
    ...(safeHttpsUrl(object(row.images)?.logo ?? row.logo) ? { logoUrl: safeHttpsUrl(object(row.images)?.logo ?? row.logo) } : {}),
    ...(priceBandLow != null ? { priceBandLow } : {}), ...(priceBandHigh != null ? { priceBandHigh } : {}),
    ...(numberValue(issue?.issue_price ?? row.issue_price) != null && numberValue(issue?.issue_price ?? row.issue_price)! > 0 ? { issuePrice: numberValue(issue?.issue_price ?? row.issue_price) } : {}),
    ...(numberValue(issue?.issue_size ?? row.issue_size) != null && numberValue(issue?.issue_size ?? row.issue_size)! > 0 ? { issueSizeCr: numberValue(issue?.issue_size ?? row.issue_size) } : {}),
    ...(lotSize != null ? { lotSize } : {}), ...(minimumInvestment != null ? { minimumInvestment } : {}),
    openDate: dateValue(timeline?.open_date) ?? openDate,
    closeDate: dateValue(timeline?.close_date) ?? closeDate,
    ...(allotDate ?? dateValue(timeline?.allotment_date) ? { allotDate: allotDate ?? dateValue(timeline?.allotment_date) } : {}),
    ...(listingDate ?? dateValue(timeline?.listing_date) ? { listingDate: listingDate ?? dateValue(timeline?.listing_date) } : {}),
    ...mapGmp(gmp, priceBandHigh),
    ...(numberValue(row.subscription_total) != null && numberValue(row.subscription_total)! >= 0 ? { subscriptionTotal: numberValue(row.subscription_total), subscriptionSource: "IPO Guru API" } : {}),
    ...(typeof business === "string" ? { business } : {}),
    ...(typeof object(row.company)?.sector === "string" ? { sector: String(object(row.company)?.sector) } : {}),
    ...(numberValue(listing?.listing_price ?? row.listing_price) != null && numberValue(listing?.listing_price ?? row.listing_price)! > 0 ? { listingPrice: numberValue(listing?.listing_price ?? row.listing_price) } : {}),
    ...(numberValue(listing?.listing_gain_percent ?? row.listing_gain_percent) != null ? { listingGain: numberValue(listing?.listing_gain_percent ?? row.listing_gain_percent) } : {}),
    ...(numberValue(listing?.cmp ?? row.cmp) != null ? { currentPrice: numberValue(listing?.cmp ?? row.cmp) } : {}),
    source: "IPO Guru API", sourceUrl: providerUrl, providerUrl, officialLinks: officialLinks(exchange),
    lastUpdated: fetchedAt, sourceFreshness: "fresh",
  };
}

export function parseIpoGuruList(payload: unknown, fetchedAt = new Date().toISOString()): Ipo[] {
  const envelope = object(payload);
  if (envelope?.success !== true || !Array.isArray(envelope.data)) throw new IpoGuruError("IPO Guru returned an invalid IPO list response.", undefined, "invalid_response");
  const mapped = envelope.data.map((row) => mapIpoGuruRecord(row, fetchedAt)).filter((row): row is Ipo => Boolean(row));
  if (envelope.data.length > 0 && mapped.length === 0) throw new IpoGuruError("IPO Guru returned no valid IPO records.", undefined, "invalid_response");
  return mapped;
}

function mapFinancials(value: unknown): Ipo["financials"] {
  const document = object(value);
  if (!document || !Array.isArray(document.headers) || !Array.isArray(document.rows)) return undefined;
  const rows = document.rows.map(object).filter((row): row is JsonObject => Boolean(row));
  const metric = (pattern: RegExp, index: number) => {
    const row = rows.find((item) => pattern.test(String(item.metric ?? "")));
    return Array.isArray(row?.data) ? numberValue(row.data[index]) : undefined;
  };
  const result = document.headers.flatMap((header, index) => {
    if (typeof header !== "string") return [];
    const financial = {
      year: header,
      revenue: metric(/revenue from operations|total revenue|^revenue$/i, index),
      profit: metric(/profit after tax|net profit|profit for the (year|period)/i, index),
      ebitda: metric(/^ebitda$/i, index),
      netWorth: metric(/^net worth$/i, index),
      eps: metric(/earnings per share|^eps$/i, index),
      peRatio: metric(/price.?earnings|^p\/?e(?: ratio)?$/i, index),
    };
    return Object.entries(financial).some(([key, field]) => key !== "year" && field !== undefined) ? [financial] : [];
  });
  return result.length ? result : undefined;
}

export function mergeIpoGuruDetail(base: Ipo, payload: unknown, fetchedAt = new Date().toISOString()): Ipo {
  const envelope = object(payload), row = object(envelope?.data);
  if (envelope?.success !== true || !row) throw new IpoGuruError("IPO Guru returned an invalid IPO detail response.", undefined, "invalid_response");
  const mapped = mapIpoGuruRecord({ ...row, slug: row.slug ?? base.slug, name: row.name ?? base.companyName, display_name: row.display_name ?? base.shortName }, fetchedAt);
  if (!mapped) throw new IpoGuruError("IPO Guru detail did not include an IPO identity.", undefined, "invalid_response");
  const contacts = object(row.contacts), registrar = object(contacts?.registrar), documents = object(row.documents);
  const company = object(row.company);
  const summary = object(row.subscription_summary);
  const summaryValue = (key: string) => {
    const parsed = numberValue(summary?.[key]);
    return parsed != null && parsed >= 0 ? parsed : undefined;
  };
  const prospectusUrl = safeHttpsUrl(documents?.rhp) ?? safeHttpsUrl(documents?.drhp);
  return {
    ...base, ...mapped,
    id: base.id, slug: base.slug,
    issueType: mapped.issueType === "UNKNOWN" ? base.issueType : mapped.issueType,
    exchange: mapped.exchange === "UNKNOWN" ? base.exchange : mapped.exchange,
    board: mapped.board === "UNKNOWN" ? base.board : mapped.board,
    gmpHistory: base.gmpHistory,
    ...(nonEmpty(registrar?.name) ? { registrarName: nonEmpty(registrar?.name) } : {}),
    ...(safeHttpsUrl(registrar?.status_page) ? { registrarUrl: safeHttpsUrl(registrar?.status_page) } : {}),
    ...(prospectusUrl ? { prospectusUrl } : {}),
    ...(summary ? { subscriptionSummary: {
      ...(summaryValue("retail") != null ? { retail: summaryValue("retail") } : {}),
      ...(summaryValue("nii") != null ? { nii: summaryValue("nii") } : {}),
      ...(summaryValue("qib") != null ? { qib: summaryValue("qib") } : {}),
      ...(summaryValue("total") != null ? { total: summaryValue("total") } : {}),
      ...(isoTimestamp(summary.updated_at) ? { updatedAt: isoTimestamp(summary.updated_at) } : {}),
    }, subscriptionSource: "IPO Guru API", ...(summaryValue("total") != null ? { subscriptionTotal: summaryValue("total") } : {}), ...(isoTimestamp(summary.updated_at) ? { subscriptionUpdatedAt: isoTimestamp(summary.updated_at) } : {}) } : {}),
    ...(nonEmpty(company?.about) ?? nonEmpty(company?.description) ? { business: nonEmpty(company?.about) ?? nonEmpty(company?.description) } : {}),
    ...(typeof company?.financials === "object" ? { financials: mapFinancials(company.financials) } : {}),
    officialLinks: officialLinks(mapped.exchange === "UNKNOWN" ? base.exchange ?? "UNKNOWN" : mapped.exchange ?? base.exchange ?? "UNKNOWN"),
  };
}

function observationDate(value: unknown): string | undefined {
  return dateValue(value) ?? isoTimestamp(value)?.slice(0, 10);
}

function istObservationTimestamp(date: unknown, time: unknown): string | undefined {
  const day = dateValue(date), clock = nonEmpty(time);
  if (!day || !clock || !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(clock)) return undefined;
  return `${day}T${clock}+05:30`;
}

export function parseIpoGuruGmpHistory(payload: unknown): GmpObservation[] {
  const envelope = object(payload), data = object(envelope?.data);
  if (envelope?.success !== true || !data) throw new IpoGuruError("IPO Guru returned an invalid GMP history response.", undefined, "invalid_response");
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  const intraday = timeline.flatMap((value): GmpObservation[] => {
    const row = object(value), gmp = numberValue(row?.price_value ?? row?.price);
    if (!row || gmp == null) return [];
    const rawTime = nonEmpty(row.recorded_at);
    let timestamp: string | undefined;
    if (rawTime) {
      const normalized = rawTime.replace(" ", "T");
      const candidate = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(rawTime) ? normalized : `${normalized}+05:30`;
      timestamp = isoTimestamp(candidate);
    }
    const date = observationDate(row.date ?? timestamp);
    return date ? [{ gmp, date, ...(timestamp ? { timestamp } : {}) }] : [];
  });
  const daily = (Array.isArray(data.trend) ? data.trend : []).flatMap((value): GmpObservation[] => {
    const row = object(value), gmp = numberValue(row?.price_value ?? row?.price);
    const date = observationDate(row?.date);
    return row && date && gmp != null ? [{ gmp, date }] : [];
  });
  return [...daily, ...intraday].sort((a, b) => (a.timestamp ?? a.date).localeCompare(b.timestamp ?? b.date));
}

export function parseIpoGuruSubscription(payload: unknown): { summary?: Ipo["subscriptionSummary"]; history?: SubscriptionSnapshot[] } {
  const envelope = object(payload), data = object(envelope?.data);
  if (envelope?.success !== true || !data) throw new IpoGuruError("IPO Guru returned an invalid subscription response.", undefined, "invalid_response");
  const nonNegative = (value: unknown) => {
    const parsed = numberValue(value);
    return parsed != null && parsed >= 0 ? parsed : undefined;
  };
  const summaryRaw = object(data.summary), summary = summaryRaw ? {
    ...(nonNegative(summaryRaw.retail) != null ? { retail: nonNegative(summaryRaw.retail) } : {}),
    ...(nonNegative(summaryRaw.nii) != null ? { nii: nonNegative(summaryRaw.nii) } : {}),
    ...(nonNegative(summaryRaw.qib) != null ? { qib: nonNegative(summaryRaw.qib) } : {}),
    ...(nonNegative(summaryRaw.total) != null ? { total: nonNegative(summaryRaw.total) } : {}),
    ...(isoTimestamp(summaryRaw.updated_at) ? { updatedAt: isoTimestamp(summaryRaw.updated_at) } : {}),
  } : undefined;
  const history = (Array.isArray(data.day_wise) ? data.day_wise : []).flatMap((value): SubscriptionSnapshot[] => {
    const row = object(value), day = numberValue(row?.day);
    if (!row || day == null || !Number.isInteger(day) || day < 1) return [];
    const timestamp = istObservationTimestamp(row.date, row.time);
    return [{ day, ...(nonNegative(row.retail) != null ? { retail: nonNegative(row.retail) } : {}), ...(nonNegative(row.nii) != null ? { nii: nonNegative(row.nii) } : {}), ...(nonNegative(row.qib) != null ? { qib: nonNegative(row.qib) } : {}), ...(nonNegative(row.total) != null ? { total: nonNegative(row.total) } : {}), ...(timestamp ? { timestamp } : {}) }];
  });
  return { ...(summary ? { summary } : {}), ...(history.length ? { history } : {}) };
}

function apiMessage(payload: unknown, status: number): { code?: string; message: string; retryAfterSeconds?: number } {
  const body = object(payload);
  const code = nonEmpty(body?.error);
  const message = code === "daily_quota_reached" ? "IPO Guru daily request quota is exhausted." : code === "rate_limited" ? "IPO Guru rate limit reached." : code === "plan_upgrade_required" ? "The configured IPO Guru plan does not include this data." : code === "invalid_key" || code === "missing_key" ? "IPO Guru API credentials are missing or invalid." : `IPO Guru request failed (${status}).`;
  const rawRetry = numberValue(body?.retry_after);
  return { ...(code ? { code } : {}), message, ...(rawRetry != null && rawRetry > 0 ? { retryAfterSeconds: rawRetry } : {}) };
}

export async function requestIpoGuruJson(
  path: string,
  options: { apiKey?: string; baseUrl?: string; fetcher?: FetchLike; timeoutMs?: number } = {},
): Promise<IpoGuruResponse> {
  const apiKey = options.apiKey ?? process.env.IPOGURU_API_KEY;
  if (!apiKey) throw new IpoGuruError("Set IPOGURU_API_KEY on the server to enable IPO Guru data.", 401, "missing_key");
  const base = options.baseUrl ?? process.env.IPOGURU_BASE_URL ?? IPOGURU_API_BASE;
  let url: URL;
  try { url = new URL(path.replace(/^\//, ""), base.endsWith("/") ? base : `${base}/`); }
  catch { throw new IpoGuruError("IPOGURU_BASE_URL must be a valid HTTPS URL.", undefined, "invalid_base_url"); }
  if (url.protocol !== "https:") throw new IpoGuruError("IPO Guru API calls require HTTPS.", undefined, "invalid_base_url");
  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000);
  let response: Response;
  try {
    response = await fetcher(url, { method: "GET", headers: { Accept: "application/json", "X-API-KEY": apiKey }, cache: "no-store", signal: controller.signal });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "IPO Guru request timed out." : "IPO Guru could not be reached.";
    throw new IpoGuruError(message, undefined, error instanceof Error && error.name === "AbortError" ? "timeout" : "network_error");
  } finally { clearTimeout(timeout); }
  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new IpoGuruError("IPO Guru returned invalid JSON.", response.status, "invalid_json"); }
  if (!response.ok || object(payload)?.success !== true) {
    const details = apiMessage(payload, response.status);
    const retryHeader = numberValue(response.headers.get("retry-after"));
    throw new IpoGuruError(details.message, response.status, details.code, retryHeader ?? details.retryAfterSeconds);
  }
  const responseBody = object(payload);
  const plan = nonEmpty(response.headers.get("x-plan")) ?? nonEmpty(responseBody?.plan);
  const remaining = numberValue(response.headers.get("x-ratelimit-remaining"));
  const dailyLimit = numberValue(response.headers.get("x-ratelimit-limit"));
  const requestsPerMinute = numberValue(response.headers.get("x-ratelimit-per-minute"));
  return {
    payload,
    meta: {
      ...(plan ? { plan: plan.toLowerCase() } : {}),
      ...(remaining != null ? { remaining } : {}),
      ...(dailyLimit != null ? { dailyLimit } : {}),
      ...(requestsPerMinute != null ? { requestsPerMinute } : {}),
    },
  };
}

export async function fetchIpoGuruList(options?: Parameters<typeof requestIpoGuruJson>[1]) {
  const response = await requestIpoGuruJson("/ipos?months=0", options);
  return { records: parseIpoGuruList(response.payload), meta: response.meta };
}

export async function fetchIpoGuruDetail(slug: string, options?: Parameters<typeof requestIpoGuruJson>[1]) {
  return requestIpoGuruJson(`/ipos/${encodeURIComponent(slug)}`, options);
}

export async function fetchIpoGuruGmpHistory(slug: string, options?: Parameters<typeof requestIpoGuruJson>[1]) {
  const response = await requestIpoGuruJson(`/ipos/${encodeURIComponent(slug)}/gmp/history`, options);
  return { history: parseIpoGuruGmpHistory(response.payload), meta: response.meta };
}

export async function fetchIpoGuruSubscription(slug: string, options?: Parameters<typeof requestIpoGuruJson>[1]) {
  const response = await requestIpoGuruJson(`/ipos/${encodeURIComponent(slug)}/subscription`, options);
  return { subscription: parseIpoGuruSubscription(response.payload), meta: response.meta };
}

export async function fetchIpoGuruSubscriptionHistory(slug: string, options?: Parameters<typeof requestIpoGuruJson>[1]) {
  const response = await requestIpoGuruJson(`/ipos/${encodeURIComponent(slug)}/subscription/history`, options);
  return { subscription: parseIpoGuruSubscription(response.payload), meta: response.meta };
}

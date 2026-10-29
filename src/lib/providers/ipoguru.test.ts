import assert from "node:assert/strict";
import { test } from "node:test";
import {
  IpoGuruError,
  mergeIpoGuruDetail,
  mapIpoGuruRecord,
  parseIpoGuruGmpHistory,
  parseIpoGuruList,
  parseIpoGuruSubscription,
  requestIpoGuruJson,
} from "@/lib/providers/ipoguru";

const sample = {
  slug: "sample-industries-ipo",
  name: "Sample Industries Ltd",
  display_name: "Sample Industries",
  type: "Mainboard",
  status: "Open",
  is_listed: false,
  open_date: "2026-10-28",
  close_date: "2026-10-30",
  allotment_date: "2026-11-02",
  listing_date: "2026-11-05",
  price_min: 100,
  price_max: 108,
  issue_size: "250.50",
  lot_size: 125,
  gmp: { price: "12", percentage: "11.11", updated_at: "2026-10-29T07:00:00.000Z" },
  subscription_total: "2.4",
  web_url: "https://www.ipoguru.in/ipo/sample-industries-ipo",
  issue: { sale_type: "Fresh capital cum OFS", listing_on: "BSE, NSE", issue_price: "108" },
  listing: { listing_price: "119", listing_gain_percent: 10.19 },
};

test("maps documented listing fields and derives the minimum investment from valid band and lot size", () => {
  const record = mapIpoGuruRecord(sample, "2026-10-29T08:00:00.000Z");
  assert.ok(record);
  assert.equal(record.companyName, "Sample Industries Ltd");
  assert.equal(record.status, "OPEN");
  assert.equal(record.issueType, "FRESH_AND_OFS");
  assert.equal(record.exchange, "BOTH");
  assert.equal(record.minimumInvestment, 13_500);
  assert.equal(record.gmp, 12);
  assert.equal(record.gmpPercentage, 11.11);
  assert.equal(record.gmpUpdatedAt, "2026-10-29T07:00:00.000Z");
  assert.equal(record.listingPrice, 119);
});

test("missing provider fields stay unavailable instead of becoming zero or invented history", () => {
  const record = mapIpoGuruRecord({ slug: "unknown-ipo", name: "Unknown IPO", type: "SME", status: "Upcoming", price_max: null, lot_size: null, gmp: { price: null, percentage: null } });
  assert.ok(record);
  assert.equal(record.priceBandHigh, undefined);
  assert.equal(record.minimumInvestment, undefined);
  assert.equal(record.gmp, undefined);
  assert.equal(record.gmpHistory, undefined);
  assert.equal(record.issueType, "UNKNOWN");
  assert.equal(record.exchange, "UNKNOWN");
});

test("keeps provider GMP percentage unavailable without its documented cap-price basis", () => {
  const record = mapIpoGuruRecord({ slug: "no-band-ipo", name: "No Band IPO", gmp: { price: "2", percentage: "10" } });
  assert.equal(record?.gmp, 2);
  assert.equal(record?.gmpPercentage, undefined);
});

test("maps available detail summary and financial rows without filling missing values", () => {
  const base = mapIpoGuruRecord(sample)!;
  const record = mergeIpoGuruDetail(base, { success: true, data: {
    slug: sample.slug,
    subscription_summary: { total: "2.5", retail: "1.8", nii: null, qib: "3.2", updated_at: "2026-10-29T08:00:00.000Z" },
    company: { financials: { headers: ["31 Mar 2026"], rows: [
      { metric: "Revenue from Operations", data: ["1,000"] },
      { metric: "Profit After Tax", data: [null] },
    ] } },
  } });
  assert.equal(record.subscriptionSummary?.retail, 1.8);
  assert.equal(record.subscriptionSummary?.nii, undefined);
  assert.equal(record.financials?.[0].revenue, 1000);
  assert.equal(record.financials?.[0].profit, undefined);
});

test("rejects a malformed collection response but safely skips records missing identity", () => {
  assert.throws(() => parseIpoGuruList({ success: false, data: [] }), IpoGuruError);
  assert.throws(() => parseIpoGuruList({ success: true, data: [{ slug: "", name: "" }] }), IpoGuruError);
  assert.equal(parseIpoGuruList({ success: true, data: [sample, { slug: "", name: "" }] }).length, 1);
});

test("GMP history keeps provider dates and exact timestamps only when present", () => {
  const daily = parseIpoGuruGmpHistory({ success: true, data: { trend: [{ date: "2026-10-28", price_value: 8 }, { date: "2026-10-29", price_value: null }] } });
  assert.deepEqual(daily, [{ date: "2026-10-28", gmp: 8 }]);
  const intraday = parseIpoGuruGmpHistory({ success: true, data: { trend: [], timeline: [{ date: "2026-10-29", price_value: 10, recorded_at: "2026-10-29 11:03:00" }] } });
  assert.equal(intraday[0].timestamp, "2026-10-29T05:33:00.000Z");
});

test("subscription parser preserves category values and timestamps and omits missing categories", () => {
  const result = parseIpoGuruSubscription({ success: true, data: { summary: { qib: "3.2", nii: null, retail: "1.8", total: "2.5", updated_at: "2026-10-29T08:00:00.000Z" } } });
  assert.deepEqual(result.summary, { retail: 1.8, qib: 3.2, total: 2.5, updatedAt: "2026-10-29T08:00:00.000Z" });
  assert.equal(result.history, undefined);
});

test("server request sends the key in a header and normalizes success metadata", async () => {
  let requestUrl = "";
  let sentKey = "";
  const response = await requestIpoGuruJson("/ipos?months=0", {
    apiKey: "test-key",
    fetcher: async (input, init) => {
      requestUrl = String(input);
      sentKey = new Headers(init?.headers).get("X-API-KEY") ?? "";
      return new Response(JSON.stringify({ success: true, plan: "standard", data: [] }), { status: 200, headers: { "X-RateLimit-Limit": "1000", "X-RateLimit-Remaining": "999" } });
    },
  });
  assert.equal(requestUrl, "https://www.ipoguru.in/api/v2/ipos?months=0");
  assert.equal(sentKey, "test-key");
  assert.equal(response.meta.plan, "standard");
  assert.equal(response.meta.remaining, 999);
});

test("missing credentials, rate limits, and provider failures become safe typed errors", async () => {
  await assert.rejects(() => requestIpoGuruJson("/ipos", { apiKey: "" }), (error: unknown) => error instanceof IpoGuruError && error.code === "missing_key");
  await assert.rejects(() => requestIpoGuruJson("/ipos", {
    apiKey: "test-key",
    fetcher: async () => new Response(JSON.stringify({ success: false, error: "rate_limited" }), { status: 429, headers: { "Retry-After": "17" } }),
  }), (error: unknown) => error instanceof IpoGuruError && error.status === 429 && error.retryAfterSeconds === 17);
  await assert.rejects(() => requestIpoGuruJson("/ipos", {
    apiKey: "test-key", fetcher: async () => new Response("{}", { status: 503 }),
  }), (error: unknown) => error instanceof IpoGuruError && error.status === 503 && !error.message.includes("test-key"));
});

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, CircleHelp, FileText, Info, ShieldCheck } from "lucide-react";
import { getIpo } from "@/lib/server-data";
import { currency, crore, formatDate, priceBand } from "@/lib/format";
import { StatusBadge } from "@/components/ipo-card";
import { GmpChart } from "@/components/gmp-chart";
import { SubscriptionChart } from "@/components/subscription-chart";
import { WatchToggle } from "@/components/watch-toggle";
import type { Ipo } from "@/lib/data";

export const dynamic = "force-dynamic";
const amount = (value?: number) => value == null ? "Not available" : currency(value);
const numberLabel = (value?: number) => value == null ? "Not available" : value.toLocaleString("en-IN");
const multiple = (value?: number) => value == null ? "Not available" : `${value}x`;
const issueType = (value: Ipo["issueType"]) => value === "FRESH" ? "Fresh issue" : value === "OFS" ? "Offer for sale" : value === "FRESH_AND_OFS" ? "Fresh issue + OFS" : "Not available";
const exchange = (value: Ipo["exchange"]) => value === "BOTH" ? "NSE & BSE" : value === "NSE" ? "NSE" : value === "BSE" ? "BSE" : "Not available";
const dateLabel = (value?: string) => value ? formatDate(value, { day: "numeric", month: "long", year: "numeric" }) : "Not available";
const freshnessLabel = (value: Ipo["sourceFreshness"]) => value === "stale" ? "Saved data may be stale" : value === "cached" ? "Cached provider data" : value === "manual" ? "Manually updated" : "Provider snapshot";
function timeLabel(value?: string) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) + " IST";
}
function toTableValue(value?: number) { return value == null ? "—" : `${value}x`; }

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const ipo = await getIpo(params.slug);
  const title = ipo ? `${ipo.shortName} IPO: Price, dates and details` : "IPO details";
  return { title, description: ipo?.business ?? "IPO information and source links.", openGraph: { title, description: ipo?.business ?? "IPO information and source links.", type: "article", url: `/ipo/${params.slug}` } };
}

export default async function IpoDetailPage({ params }: { params: { slug: string } }) {
  const ipo = await getIpo(params.slug);
  if (!ipo) notFound();
  const history = ipo.subscription ?? [];
  const last = history.at(-1);
  const summary = ipo.subscriptionSummary;
  const subscriptionTotal = summary?.total ?? last?.total ?? ipo.subscriptionTotal;
  const gmpPercent = ipo.gmpPercentage ?? (ipo.gmp != null && ipo.priceBandHigh != null && ipo.priceBandHigh > 0 ? Math.round((ipo.gmp / ipo.priceBandHigh) * 10_000) / 100 : undefined);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata" }).format(new Date());
  const timeline = [
    { title: "DRHP", date: undefined, done: false },
    { title: "Price band", date: ipo.openDate, done: Boolean(ipo.priceBandHigh) },
    { title: "Issue opens", date: ipo.openDate, done: ipo.status !== "UPCOMING" },
    { title: "Issue closes", date: ipo.closeDate, done: ["CLOSED", "LISTED"].includes(ipo.status) },
    { title: "Allotment", date: ipo.allotDate, done: false },
    { title: "Listing", date: ipo.listingDate, done: ipo.status === "LISTED" },
  ];
  const jsonLd = { "@context": "https://schema.org", "@type": "FinancialProduct", name: `${ipo.companyName} IPO`, description: ipo.business, url: `/ipo/${ipo.slug}`, provider: { "@type": "Organization", name: "Pricealerter" }, offers: ipo.priceBandHigh ? { "@type": "Offer", priceCurrency: "INR", price: ipo.priceBandHigh } : undefined };
  const detailUrl = ipo.providerUrl ?? ipo.sourceUrl;
  const stale = ipo.sourceFreshness === "stale";

  return <div className="page-wrap detail-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to IPO dashboard</Link>
    {stale && <div className="data-note data-stale"><Info size={15} /><span><b>Some data may be stale.</b> Last successful IPO list fetch: {timeLabel(ipo.lastUpdated)}. Refresh failures do not replace saved values.</span></div>}
    <section className="detail-hero"><div className="detail-company"><span className="company-logo detail-logo" style={{ backgroundColor: ipo.color }}>{ipo.logoUrl ? <img src={ipo.logoUrl} alt="" /> : ipo.initials}</span><div><div className="detail-company-title"><h1>{ipo.companyName}</h1><StatusBadge status={ipo.status} closingToday={ipo.closeDate === today} /></div><p>{ipo.board === "MAINBOARD" ? "Mainboard" : ipo.board === "SME" ? "SME" : "Board unavailable"}<i />{exchange(ipo.exchange)}<i />{issueType(ipo.issueType)}</p></div></div><WatchToggle slug={ipo.slug} /></section>

    <div className="detail-top-grid"><div className="detail-main-column">
      <section className="detail-card key-stats"><div className="detail-card-head"><div><h2>At a glance</h2><p>Key details for {ipo.shortName}</p></div><span className="updated-label">{freshnessLabel(ipo.sourceFreshness)}</span></div><div className="key-stat-grid">
        <div><span>PRICE BAND</span><strong>{priceBand(ipo.priceBandLow, ipo.priceBandHigh)}</strong><small>Issue price: {amount(ipo.issuePrice)}</small></div>
        <div><span>LOT SIZE / MINIMUM</span><strong>{ipo.lotSize ? `${ipo.lotSize} shares` : "Not available"}</strong><small>Minimum investment: {amount(ipo.minimumInvestment)}</small></div>
        <div><span>ISSUE SIZE</span><strong>{crore(ipo.issueSizeCr)}</strong></div>
        <div><span>GMP <a title="Grey market premium is unofficial and speculative"><CircleHelp size={12} /></a></span><strong className={ipo.gmp != null && ipo.gmp > 0 ? "positive-text" : ""}>{ipo.gmp == null ? "Not available" : `${ipo.gmp >= 0 ? "+" : "−"}${currency(Math.abs(ipo.gmp))}`}</strong>{gmpPercent != null && <small>{gmpPercent.toFixed(2)}% of upper price band</small>}</div>
      </div></section>

      <section className="detail-card timeline-card"><div className="detail-card-head"><div><h2>Issue timeline</h2><p>Dates from the data source, when announced.</p></div><CalendarDays size={18} className="head-muted" /></div><div className="timeline">{timeline.map((step, i) => <div className={`timeline-step ${step.done ? "timeline-done" : ""}`} key={step.title}><div className="timeline-node">{step.done ? <Check size={12} /> : <span>{i + 1}</span>}</div><div className="timeline-label"><b>{step.title}</b><small>{dateLabel(step.date)}</small></div></div>)}</div></section>

      <section className="detail-card subscription-section"><div className="detail-card-head"><div><h2>Subscription status</h2><p>Provider categories; missing values are left blank.</p></div><span className="live-tag">{ipo.subscriptionUpdatedAt ? `Observed ${timeLabel(ipo.subscriptionUpdatedAt)}` : history.length ? "Historical snapshots" : "Not available"}</span></div>
        {subscriptionTotal != null ? <><div className="subscription-total"><strong>{subscriptionTotal}<small>x</small></strong><span>Overall subscription</span></div><div className="category-grid"><div><i className="cat-retail" /><span>Retail</span><b>{toTableValue(summary?.retail ?? last?.retail)}</b></div><div><i className="cat-nii" /><span>NII</span><b>{toTableValue(summary?.nii ?? last?.nii)}</b></div><div><i className="cat-qib" /><span>QIB</span><b>{toTableValue(summary?.qib ?? last?.qib)}</b></div></div>
          {history.length > 0 ? <><SubscriptionChart data={history.map((row) => ({ day: row.day, retail: row.retail, nii: row.nii, qib: row.qib, total: row.total }))} /><div className="chart-legend"><span><i className="cat-retail" />Retail</span><span><i className="cat-nii" />NII</span><span><i className="cat-qib" />QIB</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>DAY</th><th>RETAIL</th><th>NII</th><th>QIB</th><th>TOTAL</th></tr></thead><tbody>{history.map((row) => <tr key={`${row.day}-${row.timestamp ?? ""}`}><td>Day {row.day}{row.timestamp && <small>{timeLabel(row.timestamp)}</small>}</td><td>{toTableValue(row.retail)}</td><td>{toTableValue(row.nii)}</td><td>{toTableValue(row.qib)}</td><td><b>{toTableValue(row.total)}</b></td></tr>)}</tbody></table></div></> : <div className="no-data"><Info size={16} /> Day-wise history is not supplied for this plan or issue.</div>}
        </> : <div className="no-data"><Info size={16} /> Subscription figures are not available from the current source.</div>}
      </section>

      <section className="detail-card overview-card"><div className="detail-card-head"><div><h2>About the company</h2><p>Business overview</p></div><span className="sector-tag">{ipo.sector ?? "Not available"}</span></div><p className="business-text">{ipo.business ?? "Not available from the current data source."}</p>{ipo.review && <div className="review-box"><span className="review-icon"><FileText size={15} /></span><div><b>What to consider</b><p>{ipo.review}</p></div></div>}{ipo.peers && ipo.peers.length > 0 && <div className="peer-row"><b>Listed peers</b><div>{ipo.peers.map((peer) => <span key={peer}>{peer}</span>)}</div></div>}<div className="detail-disclaimer"><ShieldCheck size={15} /> Informational data only. Review the official offer documents before investing.</div></section>

      <section className="detail-card financial-section"><div className="detail-card-head"><div><h2>Financial snapshot</h2><p>Figures in ₹ crore, except EPS and P/E</p></div><span className="sector-tag">{ipo.financials?.length ? "Reported values" : "Not available"}</span></div>{ipo.financials?.length ? <div className="table-wrap"><table className="data-table financial-table"><thead><tr><th>YEAR</th><th>REVENUE</th><th>EBITDA</th><th>PROFIT</th><th>NET WORTH</th><th>EPS</th><th>P/E</th></tr></thead><tbody>{ipo.financials.map((row) => <tr key={row.year}><td><b>{row.year}</b></td><td>{numberLabel(row.revenue)}</td><td>{numberLabel(row.ebitda)}</td><td>{numberLabel(row.profit)}</td><td>{numberLabel(row.netWorth)}</td><td>{numberLabel(row.eps)}</td><td>{multiple(row.peRatio)}</td></tr>)}</tbody></table></div> : <div className="no-data">Not available from the current provider plan.</div>}</section>

      <section className="detail-card promoter-section"><div className="detail-card-head"><div><h2>Promoter &amp; shareholder details</h2><p>Shareholding after the issue</p></div></div>{ipo.promoters?.length ? <div className="table-wrap"><table className="data-table promoter-table"><thead><tr><th>SHAREHOLDER</th><th>HOLDING</th><th>OWNERSHIP</th></tr></thead><tbody>{ipo.promoters.map((person) => <tr key={person.name}><td><b>{person.name}</b>{person.notes && <small>{person.notes}</small>}</td><td><b>{person.holding == null ? "Not available" : `${person.holding}%`}</b></td><td>{person.holding == null ? "—" : <div className="promoter-track"><span style={{ width: `${Math.max(0, Math.min(person.holding, 100))}%` }} /></div>}</td></tr>)}</tbody></table></div> : <div className="no-data">Not available from the current provider plan.</div>}</section>
    </div>

    <aside className="detail-side-column">{ipo.status !== "LISTED" && <section className="detail-card side-date-card"><div className="side-card-head"><span className="side-icon"><CalendarDays size={17} /></span><div><h3>Important dates</h3><span>Source-reported dates</span></div></div><div className="date-list"><div><span>Issue opens</span><b>{dateLabel(ipo.openDate)}</b></div><div><span>Issue closes</span><b>{dateLabel(ipo.closeDate)}</b></div><div><span>Allotment</span><b>{dateLabel(ipo.allotDate)}</b></div><div><span>Listing date</span><b>{dateLabel(ipo.listingDate)}</b></div></div>{detailUrl && <a className="apply-cta" href={detailUrl} target="_blank" rel="noreferrer">View provider details <ArrowUpRight size={16} /></a>}<p className="apply-hint">Confirm application windows with the official exchange and your broker.</p></section>}

      <section className="detail-card gmp-card"><div className="detail-card-head"><div><h2>Grey market premium</h2><p>Unofficial market indication</p></div><Info size={16} className="head-muted" /></div>{ipo.gmp == null ? <div className="no-data">Not available from the current source.</div> : <><div className="gmp-big"><strong className={ipo.gmp >= 0 ? "positive-text" : "negative-text"}>{ipo.gmp >= 0 ? "+" : "−"}{currency(Math.abs(ipo.gmp))}</strong><span>per share {gmpPercent != null && <b>· {gmpPercent.toFixed(2)}% of upper price band</b>}</span></div>{ipo.gmpHistory && ipo.gmpHistory.length > 0 && <GmpChart data={ipo.gmpHistory} />}<div className="gmp-updated"><i className={ipo.sourceFreshness === "stale" ? "stale-dot" : "live-dot"} /> Observed {timeLabel(ipo.gmpUpdatedAt)}</div><p className="gmp-note">GMP is unofficial and speculative. Source: {ipo.gmpSource ?? "not recorded"}{ipo.gmpSource === "IPO Guru API" && <> · <a href="https://www.ipoguru.in/" target="_blank" rel="noreferrer">IPO Guru</a></>}</p></>}</section>

      {(ipo.status === "LISTED" || ipo.listingPrice != null) && <section className="detail-card side-date-card"><div className="side-card-head"><span className="side-icon"><ArrowUpRight size={17} /></span><div><h3>Listing performance</h3><span>Reported listing values</span></div></div><div className="listed-summary"><strong className={ipo.listingGain != null && ipo.listingGain < 0 ? "negative-text" : "positive-text"}>{ipo.listingGain == null ? "Not available" : `${ipo.listingGain > 0 ? "+" : ""}${ipo.listingGain}%`}</strong><span>Issue price: {amount(ipo.issuePrice)}</span><span>Listing price: {amount(ipo.listingPrice)}</span></div></section>}

      <section className="detail-card source-card"><div className="detail-card-head"><div><h2>Sources</h2><p>Provider and exchange references</p></div></div><p>{ipo.source === "IPO Guru API" ? <>Data by <a href="https://www.ipoguru.in/" target="_blank" rel="noreferrer">IPO Guru</a></> : ipo.source ?? "Source not recorded"} · {freshnessLabel(ipo.sourceFreshness)} · updated {timeLabel(ipo.lastUpdated)}</p>{ipo.providerUrl && <a href={ipo.providerUrl} target="_blank" rel="noreferrer">IPO Guru issue page <ArrowUpRight size={13} /></a>}{ipo.prospectusUrl && <a href={ipo.prospectusUrl} target="_blank" rel="noreferrer">Prospectus <ArrowUpRight size={13} /></a>}{ipo.registrarUrl && <a href={ipo.registrarUrl} target="_blank" rel="noreferrer">Registrar{ipo.registrarName ? `: ${ipo.registrarName}` : ""} <ArrowUpRight size={13} /></a>}{ipo.officialLinks?.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.url}>{item.label} <ArrowUpRight size={13} /></a>)}</section>
      <section className="detail-card note-card"><Info size={16} /><p>Data can lag or be unavailable. Check the linked NSE/BSE issue page and prospectus for official terms. GMP is not an exchange quote.</p></section>
    </aside></div>
  </div>;
}

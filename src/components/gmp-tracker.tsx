"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, Clock3, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { Ipo, IpoFeed } from "@/lib/data";
import { priceBand } from "@/lib/format";

type GmpRow = Ipo & { percent?: number };
type GmpFeed = Omit<IpoFeed, "records"> & { records: GmpRow[] };
function timeLabel(value?: string) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) + " IST";
}

export function GmpTracker() {
  const [sort, setSort] = useState<"percent" | "gmp">("percent");
  const { data: feed, isFetching, refetch } = useQuery({
    queryKey: ["gmp-live"],
    queryFn: async () => {
      const response = await fetch("/api/gmp/live");
      if (!response.ok) throw new Error("Unable to refresh GMP data");
      return response.json() as Promise<GmpFeed>;
    }, refetchInterval: (query) => Math.max(60_000, (query.state.data?.refreshSeconds ?? 300) * 1_000),
  });
  const rows = [...(feed?.records ?? [])].sort((a, b) => sort === "percent" ? (b.percent ?? -Infinity) - (a.percent ?? -Infinity) : (b.gmp ?? -Infinity) - (a.gmp ?? -Infinity));
  const hasStale = feed?.freshness === "stale" || rows.some((ipo) => ipo.sourceFreshness === "stale");
  const allProvider = rows.length > 0 && rows.every((ipo) => ipo.source === "IPO Guru API");
  const updateLabel = feed?.freshness === "unavailable" ? "Source unavailable" : feed?.freshness === "stale" ? "Stale snapshot" : feed?.lastSuccessfulUpdate ? `${feed.freshness === "cached" ? "Cached · source fetched" : "Source updated"} ${timeLabel(feed.lastSuccessfulUpdate)}` : "Not available";

  return <div className="page-wrap subpage gmp-page">
    <div className="gmp-hero"><div><div className="eyebrow"><span className="eyebrow-line" /> MARKET PULSE</div><h1>GMP tracker</h1><p>Latest provider-reported grey market premiums and observation times.</p></div><div className="gmp-pulse"><span className="pulse-icon"><TrendingUp size={17} /></span><div><small>TRACKING</small><b>{rows.length} IPOs</b></div></div></div>
    <div className={`gmp-disclaimer ${hasStale ? "data-stale" : ""}`}><span>ⓘ</span><div><b>{hasStale ? "Showing stale saved readings" : feed?.freshness === "unavailable" ? "Provider data is unavailable" : "A note on GMP"}</b><p>GMP is unofficial and speculative. Percent is calculated as GMP ÷ upper price band × 100. Percent uses the upper price band as the documented basis. Check the observation time; missing values are not treated as zero. {feed?.freshness === "unavailable" ? " Add the server-side IPO Guru key to load provider data." : ""}</p></div></div>
    <section className="gmp-table-card"><div className="table-card-head"><div><h2>Current IPOs</h2><span>{allProvider ? <>Data by <a href="https://www.ipoguru.in/" target="_blank" rel="noreferrer">IPO Guru</a></> : "Mixed provider and saved data sources"}</span></div><div className="refresh-state"><span className={isFetching ? "refreshing" : hasStale || feed?.freshness === "unavailable" ? "stale-dot" : feed?.freshness === "cached" ? "cached-dot" : "live-dot"} />{isFetching ? "Checking source" : hasStale ? "Stale data" : updateLabel}<button onClick={() => void refetch()} aria-label="Refresh GMP data"><RefreshCw size={14} /></button></div></div>
      <div className="gmp-table-wrap"><table className="gmp-table"><thead><tr><th>COMPANY</th><th>PRICE BAND</th><th><button onClick={() => setSort("gmp")}>GMP <ArrowDown size={12} /></button></th><th><button onClick={() => setSort("percent")}>GMP % <ArrowDown size={12} /></button></th><th>TREND</th><th>OBSERVED</th><th /></tr></thead><tbody>{rows.map((ipo) => { const positive = ipo.gmp != null && ipo.gmp >= 0; return <tr key={ipo.id}>
        <td><Link href={`/ipo/${ipo.slug}`} className="gmp-company"><span className="company-logo small-logo" style={{ backgroundColor: ipo.color }}>{ipo.logoUrl ? <img src={ipo.logoUrl} alt="" /> : ipo.initials}</span><span><b>{ipo.shortName}</b><small>{ipo.board === "MAINBOARD" ? "Mainboard" : ipo.board === "SME" ? "SME" : "Board unavailable"} · {ipo.exchange === "UNKNOWN" || !ipo.exchange ? "Exchange unavailable" : ipo.exchange}</small></span></Link></td>
        <td>{priceBand(ipo.priceBandLow, ipo.priceBandHigh)}</td><td><b className={positive ? "positive-text" : "negative-text"}>{ipo.gmp == null ? "Not available" : `${positive ? "+" : "−"}₹${Math.abs(ipo.gmp)}`}</b></td>
        <td><span className={`percent-pill ${positive ? "" : "percent-negative"}`}>{ipo.percent == null ? "Not available" : `${ipo.percent > 0 ? "+" : ""}${ipo.percent.toFixed(2)}%`}</span></td><td><span className={`trend-icon ${positive ? "" : "trend-down"}`}>{ipo.gmp == null ? "—" : positive ? <TrendingUp size={17} /> : <TrendingDown size={17} />}</span></td>
        <td>{timeLabel(ipo.gmpUpdatedAt)}</td><td><Link aria-label={`View ${ipo.shortName}`} className="table-arrow" href={`/ipo/${ipo.slug}`}><ArrowRight size={16} /></Link></td>
      </tr>; })}</tbody></table></div>
      <div className="gmp-mobile-list">{rows.map((ipo) => <Link href={`/ipo/${ipo.slug}`} className="mobile-gmp-row" key={ipo.id}><span className="company-logo small-logo" style={{ backgroundColor: ipo.color }}>{ipo.logoUrl ? <img src={ipo.logoUrl} alt="" /> : ipo.initials}</span><span className="mobile-gmp-name"><b>{ipo.shortName}</b><small>{priceBand(ipo.priceBandLow, ipo.priceBandHigh)}</small></span><span className="mobile-gmp-value"><b className={ipo.gmp == null ? "" : ipo.gmp >= 0 ? "positive-text" : "negative-text"}>{ipo.gmp == null ? "Not available" : `₹${Math.abs(ipo.gmp)}`}</b><small>{ipo.percent == null ? "Not available" : `${ipo.percent.toFixed(2)}%`}</small></span><ArrowRight size={15} /></Link>)}</div>
      {rows.length === 0 && <div className="empty-state">{feed?.freshness === "unavailable" ? "Configure IPOGURU_API_KEY to load provider GMP data." : "No current GMP observations are available. No sample values are shown."}</div>}
      <div className="gmp-table-foot"><span><Clock3 size={13} /> Refresh interval follows the configured provider cache and plan limits</span><span>GMP is not an exchange quote</span></div>
    </section>
  </div>;
}

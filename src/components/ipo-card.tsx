import Link from "next/link";
import { ArrowUpRight, CalendarDays, Layers3 } from "lucide-react";
import type { Ipo } from "@/lib/data";
import { crore, dateRange, formatDate, priceBand } from "@/lib/format";
export function StatusBadge({ status, closingToday = false }: { status: Ipo["status"]; closingToday?: boolean }) {
  const isClosing = status === "OPEN" && closingToday;
  const title = isClosing ? "Closing today" : status === "OPEN" ? "Open" : status === "UPCOMING" ? "Upcoming" : status === "CLOSED" ? "Closed" : "Listed";
  return <span className={`status-badge ${isClosing ? "status-closing" : `status-${status.toLowerCase()}`}`}><i />{title}</span>;
}
export function IpoCard({ ipo }: { ipo: Ipo }) {
  const last = ipo.subscription?.[ipo.subscription.length - 1];
  const subscriptionTotal = ipo.subscriptionSummary?.total ?? last?.total ?? ipo.subscriptionTotal;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata" }).format(new Date());
  const computedStatus = (ipo.status === "OPEN" || ipo.status === "UPCOMING") && ipo.closeDate && ipo.closeDate < today ? "CLOSED" : ipo.status;
  const closingToday = computedStatus === "OPEN" && ipo.closeDate === today;
  return <Link href={`/ipo/${ipo.slug}`} className={`ipo-card ${closingToday ? "closing-today" : ""}`}>
    <div className="ipo-card-head"><span className="company-logo" style={{ backgroundColor: ipo.color }}>{ipo.logoUrl ? <img src={ipo.logoUrl} alt="" /> : ipo.initials}</span><div className="company-title"><h3>{ipo.shortName}</h3><span>{ipo.board === "MAINBOARD" ? "Mainboard" : ipo.board === "SME" ? "SME" : "Board unavailable"} <span className="dot-separator">·</span> {ipo.exchange === "BOTH" ? "NSE, BSE" : ipo.exchange === "UNKNOWN" || !ipo.exchange ? "Exchange unavailable" : ipo.exchange}</span></div><StatusBadge status={computedStatus} closingToday={closingToday} />{ipo.sourceFreshness === "stale" && <span className="data-stale-pill">STALE</span>}</div>
    <div className="card-date-line"><CalendarDays size={13}/><span>{computedStatus === "LISTED" ? `Listed ${formatDate(ipo.listingDate)}` : ipo.openDate && ipo.closeDate ? dateRange(ipo.openDate, ipo.closeDate) : "Issue dates to be announced"}</span></div>
    <div className="card-divider" />
    <div className="ipo-stats"><div><span className="field-label">PRICE BAND</span><strong>{priceBand(ipo.priceBandLow, ipo.priceBandHigh)}</strong></div><div><span className="field-label">LOT SIZE</span><strong>{ipo.lotSize ? ipo.lotSize.toLocaleString("en-IN") : "—"} {ipo.lotSize&&<small>shares</small>}</strong></div><div><span className="field-label">ISSUE SIZE</span><strong>{crore(ipo.issueSizeCr)}</strong></div></div>
    <div className="ipo-card-bottom"><span className="card-subscription">Subscription <b>{subscriptionTotal == null ? "—" : `${subscriptionTotal.toLocaleString("en-IN", {maximumFractionDigits: 2})}x`}</b>{computedStatus === "OPEN" && <small>{closingToday ? "Closing today" : "Live issue"}</small>}{computedStatus === "CLOSED" && <small>Final snapshot</small>}</span>{ipo.gmp != null && computedStatus !== "LISTED" ? <span className={`gmp-pill ${ipo.gmp >= 0 ? "gmp-up" : "gmp-down"}`}><small>GMP</small><b>{ipo.gmp >= 0 ? "+" : "−"}₹{Math.abs(ipo.gmp).toLocaleString("en-IN")}</b><small>{ipo.gmpPercentage != null ? `${ipo.gmpPercentage}%` : ""}</small></span> : ipo.listingGain != null ? <span className="gmp-pill gmp-up">Listed +{ipo.listingGain}%</span> : <span className="card-arrow"><ArrowUpRight size={17} /></span>}</div>
    {ipo.aiGainPercent != null && <div className="ai-gain-row"><span>AI gain estimate <small>Not guaranteed</small></span><strong>{ipo.aiGainPercent >= 0 ? "+" : ""}{ipo.aiGainPercent}%</strong>{ipo.aiGainRupees != null && <small>{ipo.aiGainRupees >= 0 ? "+" : "−"}₹{Math.abs(ipo.aiGainRupees)} per share</small>}</div>}
    {(ipo.sourceFreshness === "manual" || ipo.source === "Manually supplied") && <div className="manual-card-note">MANUALLY SUPPLIED DATA · {ipo.gmpUpdatedAt ? `GMP noted ${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(new Date(ipo.gmpUpdatedAt))} IST` : "Timestamp not supplied"}</div>}
    {subscriptionTotal != null && computedStatus === "OPEN" && <div className="subscription-row"><div className="subscription-label"><span><Layers3 size={13} /> Overall subscription</span><b>{subscriptionTotal}x</b></div><div className="progress-track"><span style={{ width: `${Math.min(subscriptionTotal * 10, 100)}%` }} /></div></div>}
  </Link>;
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, ChevronDown, Menu, Search, TrendingUp, X } from "lucide-react";
import { useState } from "react";
const links = [{ href: "/", label: "IPO dashboard" }, { href: "/calendar", label: "Calendar" }, { href: "/gmp", label: "GMP tracker" }];
export function SiteHeader() {
  const path = usePathname(); const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="nav-wrap"><Link href="/" className="brand-lockup" aria-label="Pricealerter home"><span className="brand-mark"><TrendingUp size={18} strokeWidth={2.5} /></span><span>pricealerter<span className="brand-dot">.</span></span></Link>
    <nav className={`primary-nav ${open ? "nav-open" : ""}`} aria-label="Main navigation">{links.map((item) => <Link key={item.href} onClick={() => setOpen(false)} className={path === item.href || (item.href !== "/" && path.startsWith(item.href)) ? "nav-link active" : "nav-link"} href={item.href}>{item.label}</Link>)}</nav>
    <div className="nav-actions"><Link href="/gmp" className="nav-search"><Search size={16} /><span>Search IPOs</span><kbd>⌘ K</kbd></Link><span className="nav-divider" /><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><button className="profile-button" aria-label="Account menu">A</button></div>
    <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
  </div></header>;
}

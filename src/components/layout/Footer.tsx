import React from 'react';
import { Link } from 'react-router-dom';
import { PriceAlerterLogo } from '../brand/PriceAlerterLogo';
import { useCookieConsent } from '../../context/CookieConsentContext';

export function Footer() {
  const { openPreferencesModal } = useCookieConsent();
  const activeHost =
    typeof window !== 'undefined' && window.location.host ? window.location.host : 'pricealerter.in';

  return (
    <footer className="bg-[#14263F] text-slate-300 border-t border-[#1E3554] pb-20 md:pb-0 pb-safe">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <PriceAlerterLogo size="md" variant="inverted" showTagline />
            <p className="text-xs text-slate-300/90 leading-relaxed max-w-md pt-1">
              PriceAlerter is an independent Indian financial intelligence platform for
              tracking Mainboard &amp; SME IPO filings, unofficial Grey Market Premium (GMP)
              trends, NSE &amp; BSE listed equities, and historical listing performance.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
              {activeHost} · All figures carry source provenance and data freshness
              indicators. Not SEBI-registered investment advice. Automated market tracking runs
              continuous NSE/BSE sync cycles.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              IPO &amp; Markets
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/ipo" className="hover:text-white transition-colors">IPO Explorer</Link></li>
              <li><Link to="/ipo/mainboard" className="hover:text-white transition-colors">Mainboard IPOs</Link></li>
              <li><Link to="/ipo/sme" className="hover:text-white transition-colors">SME IPOs</Link></li>
              <li><Link to="/gmp" className="hover:text-white transition-colors">GMP Tracker</Link></li>
              <li><Link to="/listed" className="hover:text-white transition-colors">Listed IPO Performance</Link></li>
              <li><Link to="/calendar" className="hover:text-white transition-colors">IPO Calendar</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Equities &amp; Tools
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/live-prices" className="hover:text-white transition-colors">Live Stock Dashboard</Link></li>
              <li><Link to="/nse-stocks" className="hover:text-white transition-colors">NSE Stocks</Link></li>
              <li><Link to="/bse-stocks" className="hover:text-white transition-colors">BSE Stocks</Link></li>
              <li><Link to="/stock-screener" className="hover:text-white transition-colors">Stock Screener</Link></li>
              <li><Link to="/calculators" className="hover:text-white transition-colors">Financial Calculators</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">IPO Guides &amp; Education</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Governance &amp; Policies
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-white transition-colors">About PriceAlerter</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/editorial-policy" className="hover:text-white transition-colors">Editorial Standards &amp; Methodology</Link></li>
              <li><Link to="/disclaimer" className="hover:text-white transition-colors">Financial &amp; GMP Disclaimer</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Advertising Disclosure</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            © {new Date().getFullYear()} PriceAlerter ({activeHost}). Informational &amp;
            research use only. Grey Market Premium (GMP) data is unofficial and speculative.
          </p>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link to="/disclaimer" className="hover:text-white">Disclaimer</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/cookies" className="hover:text-white">Cookies</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <button
              type="button"
              onClick={openPreferencesModal}
              className="hover:text-white underline cursor-pointer"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

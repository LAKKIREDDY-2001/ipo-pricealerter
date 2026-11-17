/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Home, Building2, ChartNoAxesCombined, BadgePercent, Grid2X2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import { MainNavbar } from './components/layout/MainNavbar';
import { Footer } from './components/layout/Footer';
import { PriceAlerterLogo } from './components/brand/PriceAlerterLogo';
import { SEOHead } from './components/common/SEOHead';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CookieConsentBanner } from './components/compliance/CookieConsentBanner';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const IPOExplorerPage = lazy(() =>
  import('./pages/IPOExplorerPage').then((m) => ({ default: m.IPOExplorerPage }))
);
const IPODetailsPage = lazy(() =>
  import('./pages/IPODetailsPage').then((m) => ({ default: m.IPODetailsPage }))
);
const GMPTrackerPage = lazy(() =>
  import('./pages/GMPTrackerPage').then((m) => ({ default: m.GMPTrackerPage }))
);
const LiveStocksPage = lazy(() =>
  import('./pages/LiveStocksPage').then((m) => ({ default: m.LiveStocksPage }))
);
const GlobalStocksPage = lazy(() =>
  import('./pages/GlobalStocksPage').then((m) => ({ default: m.GlobalStocksPage }))
);
const StockDetailPage = lazy(() =>
  import('./pages/StockDetailPage').then((m) => ({ default: m.StockDetailPage }))
);
const ListedPerformancePage = lazy(() =>
  import('./pages/ListedPerformancePage').then((m) => ({ default: m.ListedPerformancePage }))
);
const StockScreenerPage = lazy(() =>
  import('./pages/StockScreenerPage').then((m) => ({ default: m.StockScreenerPage }))
);
const IPOCalendarPage = lazy(() =>
  import('./pages/IPOCalendarPage').then((m) => ({ default: m.IPOCalendarPage }))
);
const MarketInsightsPage = lazy(() =>
  import('./pages/MarketInsightsPage').then((m) => ({ default: m.MarketInsightsPage }))
);
const BlogPage = lazy(() =>
  import('./pages/BlogPage').then((m) => ({ default: m.BlogPage }))
);
const CalculatorsPage = lazy(() =>
  import('./pages/CalculatorsPage').then((m) => ({ default: m.CalculatorsPage }))
);
const LoginPage = lazy(() =>
  import('./pages/AuthPages').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage }))
);
const WatchlistPage = lazy(() =>
  import('./pages/WatchlistPage').then((m) => ({ default: m.WatchlistPage }))
);
const AlertsPage = lazy(() =>
  import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const GovernancePage = lazy(() =>
  import('./pages/GovernancePages').then((m) => ({ default: m.GovernancePage }))
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function FloatingBackToTop() {
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 560);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll back to top"
      className="fixed bottom-18 md:bottom-6 right-3 sm:right-6 z-30 h-10 w-10 rounded-full border border-[#CBD5E1] dark:border-slate-700 bg-white/95 dark:bg-[#111C2E]/95 text-[#14263F] dark:text-white shadow-lg flex items-center justify-center hover:border-[#2563EB] transition-colors cursor-pointer"
    >
      <span className="text-sm font-bold leading-none" aria-hidden="true">↑</span>
    </button>
  );
}

function MobileQuickNav() {
  const items = [
    { label: 'Home', to: '/', icon: Home, end: true },
    { label: 'IPOs', to: '/ipo', icon: Building2 },
    { label: 'GMP', to: '/gmp', icon: BadgePercent },
    { label: 'Stocks', to: '/live-prices', icon: ChartNoAxesCombined },
    { label: 'More', to: '/calculators', icon: Grid2X2 },
  ];
  return (
    <nav aria-label="Quick navigation" className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-lg pb-safe shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
      <div className="mx-auto grid max-w-xl grid-cols-5 px-2 pt-2 pb-1">
        {items.map(({ label, to, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} aria-label={label}
            className={({ isActive }) => `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {({ isActive }) => <><Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} /><span>{label}</span></>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 py-16">
      <PriceAlerterLogo size="md" />
      <div className="h-1 w-32 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full w-1/2 bg-[#059669] animate-pulse rounded-full" />
      </div>
      <p className="text-xs text-[#64748B] dark:text-slate-400">
        Loading market workspace...
      </p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
      <SEOHead
        title="Page Not Found"
        description="The requested PriceAlerter route could not be found."
        noIndex
      />
      <div className="inline-flex items-center rounded-md border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-3 py-1 font-data text-xs font-semibold text-[#64748B]">
        404 · Route Unavailable
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
        Requested Market Page Not Found
      </h1>
      <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
        The IPO, stock symbol, or research route you entered does not exist or may have moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Dashboard
        </Link>
        <Link
          to="/ipo"
          className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-4 py-2 text-xs font-semibold text-[#152338] dark:text-slate-200"
        >
          Browse IPOs
        </Link>
        <Link
          to="/live-prices"
          className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-4 py-2 text-xs font-semibold text-[#152338] dark:text-slate-200"
        >
          Live NSE/BSE Prices
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CookieConsentProvider>
          <AuthProvider>
            <BrowserRouter>
              <ScrollToTop />
              <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1120] text-[#152338] dark:text-slate-100 pb-16 lg:pb-0">
                <MainNavbar />
                <div className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/dashboard" element={<HomePage />} />

                    {/* IPO Explorer & Details */}
                    <Route path="/ipo" element={<IPOExplorerPage />} />
                    <Route path="/ipo/mainboard" element={<IPOExplorerPage presetCategory="Mainboard" />} />
                    <Route path="/ipo/sme" element={<IPOExplorerPage presetCategory="SME" />} />
                    <Route path="/ipo/upcoming" element={<IPOExplorerPage presetStatus="Upcoming" />} />
                    <Route path="/ipo/open" element={<IPOExplorerPage presetStatus="Open" />} />
                    <Route path="/ipo/closed" element={<IPOExplorerPage presetStatus="Closed" />} />
                    <Route path="/ipo/listed" element={<IPOExplorerPage presetStatus="Listed" />} />
                    <Route path="/ipo/:companySlug" element={<IPODetailsPage />} />

                    {/* GMP Tracker */}
                    <Route path="/gmp" element={<GMPTrackerPage />} />
                    <Route path="/gmp/:companySlug" element={<GMPTrackerPage />} />

                    {/* Live Stocks, Screener, Performance & Equity Details */}
                    <Route path="/live-prices" element={<LiveStocksPage />} />
                    <Route path="/nse-stocks" element={<LiveStocksPage presetExchange="NSE" />} />
                    <Route path="/bse-stocks" element={<LiveStocksPage presetExchange="BSE" />} />
                    <Route path="/us-stocks" element={<GlobalStocksPage />} />
                    <Route path="/global-stocks" element={<GlobalStocksPage />} />
                    <Route path="/listed" element={<ListedPerformancePage />} />
                    <Route path="/stock-screener" element={<StockScreenerPage />} />
                    <Route path="/screener" element={<StockScreenerPage />} />
                    <Route path="/stock/:symbol" element={<StockDetailPage />} />

                    {/* Calendar, Insights, Learn/Blog, Calculators */}
                    <Route path="/calendar" element={<IPOCalendarPage />} />
                    <Route path="/market-insights" element={<MarketInsightsPage />} />
                    <Route path="/market-insights/:slug" element={<MarketInsightsPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<BlogPage />} />
                    <Route path="/calculators" element={<CalculatorsPage />} />
                    <Route path="/calculators/:tool" element={<CalculatorsPage />} />

                    {/* Account, Watchlist, Alerts, Admin */}
                    <Route path="/watchlist" element={<WatchlistPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signin" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/signup" element={<RegisterPage />} />
                    <Route path="/admin" element={<AdminPage />} />

                    {/* Governance & Disclosures */}
                    <Route path="/privacy" element={<GovernancePage page="privacy" />} />
                    <Route path="/cookies" element={<GovernancePage page="cookies" />} />
                    <Route path="/terms" element={<GovernancePage page="terms" />} />
                    <Route path="/about" element={<GovernancePage page="about" />} />
                    <Route path="/contact" element={<GovernancePage page="contact" />} />
                    <Route path="/disclaimer" element={<GovernancePage page="disclaimer" />} />
                    <Route path="/editorial-policy" element={<GovernancePage page="editorial" />} />

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
                </div>
                <Footer />
                <MobileQuickNav />
                <FloatingBackToTop />
                <CookieConsentBanner />
              </div>
            </BrowserRouter>
          </AuthProvider>
        </CookieConsentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  Calendar,
  ChevronDown,
  LayoutGrid,
  Menu,
  Moon,
  Search,
  Shield,
  SlidersHorizontal,
  Sun,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { PriceAlerterLogo } from '../brand/PriceAlerterLogo';
import { MarketTicker } from './MarketTicker';
import { GlobalSearch } from './GlobalSearch';
import { NotificationPanel } from './NotificationPanel';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export function MainNavbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, unreadCount, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'ipo' | 'stocks' | 'tools' | 'user' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
      isActive
        ? 'text-[#14263F] dark:text-white border-[#059669]'
        : 'text-[#64748B] dark:text-slate-300 border-transparent hover:text-[#152338] dark:hover:text-white'
    }`;

  return (
    <>
      <MarketTicker />
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-15 flex items-center justify-between gap-2 sm:gap-4 lg:gap-5">
          {/* Brand Zone */}
          <Link to="/" className="shrink-0">
            <PriceAlerterLogo size="md" />
          </Link>

          {/* Desktop & Tablet-Landscape Navigation (lg: 1024px+) */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5" aria-label="Primary Navigation">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>

            {/* IPO Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('ipo')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() => navigate('/ipo')}
                aria-expanded={openDropdown === 'ipo'}
                className={`inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                  location.pathname.startsWith('/ipo')
                    ? 'text-[#14263F] dark:text-white border-[#059669]'
                    : 'text-[#64748B] dark:text-slate-300 border-transparent hover:text-[#152338] dark:hover:text-white'
                }`}
              >
                <span>IPO</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === 'ipo' && (
                <div className="absolute left-0 top-full pt-2 w-56 z-50">
                  <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] shadow-lg p-1.5 grid gap-0.5">
                    {[
                      { label: 'All IPOs', to: '/ipo' },
                      { label: 'Mainboard IPO', to: '/ipo/mainboard' },
                      { label: 'SME IPO', to: '/ipo/sme' },
                      { label: 'Open IPOs', to: '/ipo/open' },
                      { label: 'Upcoming IPOs', to: '/ipo/upcoming' },
                      { label: 'Closed IPOs', to: '/ipo/closed' },
                      { label: 'Recently Listed', to: '/ipo/listed' },
                      { label: 'Listed IPO Performance', to: '/listed' },
                      { label: 'IPO Calendar', to: '/calendar' },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/gmp" className={navLinkClass}>
              GMP
            </NavLink>

            {/* Stocks Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('stocks')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() => navigate('/live-prices')}
                aria-expanded={openDropdown === 'stocks'}
                className={`inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                  location.pathname.startsWith('/live-prices') ||
                  location.pathname.startsWith('/nse-stocks') ||
                  location.pathname.startsWith('/bse-stocks') ||
                  location.pathname.startsWith('/stock/')
                    ? 'text-[#14263F] dark:text-white border-[#059669]'
                    : 'text-[#64748B] dark:text-slate-300 border-transparent hover:text-[#152338] dark:hover:text-white'
                }`}
              >
                <span>Live Stocks</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === 'stocks' && (
                <div className="absolute left-0 top-full pt-2 w-56 z-50">
                  <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] shadow-lg p-1.5 grid gap-0.5">
                    {[
                      { label: 'All NSE & BSE Stocks', to: '/live-prices' },
                      { label: 'NSE Stocks', to: '/nse-stocks' },
                      { label: 'BSE Stocks', to: '/bse-stocks' },
                      { label: 'Stock Screener', to: '/stock-screener' },
                      { label: 'Top Gainers', to: '/live-prices?tab=gainers' },
                      { label: 'Top Losers', to: '/live-prices?tab=losers' },
                      { label: 'Sector Performance', to: '/live-prices?tab=sectors' },
                      { label: 'My Watchlist', to: '/watchlist' },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/stock-screener" className={navLinkClass}>
              Screener
            </NavLink>
            <NavLink to="/calendar" className={navLinkClass}>
              Calendar
            </NavLink>

            {/* Full links on xl+, grouped under Tools dropdown on lg */}
            <NavLink to="/listed" className={({ isActive }) => `hidden xl:inline-block ${navLinkClass({ isActive })}`}>
              Listed IPOs
            </NavLink>
            <NavLink to="/calculators" className={({ isActive }) => `hidden xl:inline-block ${navLinkClass({ isActive })}`}>
              Calculators
            </NavLink>
            <NavLink to="/market-insights" className={({ isActive }) => `hidden xl:inline-block ${navLinkClass({ isActive })}`}>
              Insights
            </NavLink>
            <NavLink to="/blog" className={({ isActive }) => `hidden xl:inline-block ${navLinkClass({ isActive })}`}>
              Learn
            </NavLink>

            <div
              className="relative xl:hidden"
              onMouseEnter={() => setOpenDropdown('tools')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'tools' ? null : 'tools')}
                className="inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent text-[#64748B] dark:text-slate-300 hover:text-[#152338] dark:hover:text-white cursor-pointer"
              >
                <span>Tools</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === 'tools' && (
                <div className="absolute left-0 top-full pt-2 w-48 z-50">
                  <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] shadow-lg p-1.5 grid gap-0.5">
                    {[
                      { label: 'Listed IPO Performance', to: '/listed' },
                      { label: 'Calculators', to: '/calculators' },
                      { label: 'Market Insights', to: '/market-insights' },
                      { label: 'Investor Guides', to: '/blog' },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Actions Zone */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="min-h-[38px] inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-800/80 px-2.5 sm:px-3 py-1.5 text-xs text-[#64748B] dark:text-slate-300 hover:border-[#14263F] dark:hover:border-slate-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Open global search"
            >
              <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden md:inline">Search IPOs, NSE/BSE...</span>
              <kbd className="hidden xl:inline-block rounded border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-data text-[#94A3B8]">
                ⌘K
              </kbd>
            </button>

            <Link
              to="/alerts"
              title="Price Alerts"
              aria-label="Price Alerts"
              className="hidden sm:inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-2 text-[#64748B] dark:text-slate-300 hover:text-[#152338] dark:hover:text-white transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notifications"
                className="relative min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-2 text-[#64748B] dark:text-slate-300 hover:text-[#152338] dark:hover:text-white transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-[10px] font-bold text-white flex items-center justify-center font-data">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-2 text-[#64748B] dark:text-slate-300 hover:text-[#152338] dark:hover:text-white transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-[#14263F] dark:bg-[#1E3554] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {openDropdown === 'user' && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] shadow-lg p-1.5 z-50">
                    <div className="px-3 py-2 border-b border-[#E2E8F0] dark:border-slate-800">
                      <div className="text-xs font-semibold text-[#152338] dark:text-slate-100 truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate">{user.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      className="block rounded-lg px-3 py-2 mt-1 text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Dashboard &amp; Profile
                    </Link>
                    <Link
                      to="/watchlist"
                      className="block rounded-lg px-3 py-2 text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      My Watchlist
                    </Link>
                    <Link
                      to="/alerts"
                      className="block rounded-lg px-3 py-2 text-xs font-medium text-[#152338] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Price Alerts
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#059669] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Admin Console
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="w-full text-left rounded-lg px-3 py-2 mt-1 border-t border-[#E2E8F0] dark:border-slate-800 text-xs font-medium text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="min-h-[38px] inline-flex items-center rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-2 text-[#152338] dark:text-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tablet & Mobile Categorized Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] px-4 py-4 max-h-[75vh] overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Primary Market &amp; IPOs
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'IPO Explorer', to: '/ipo' },
                    { label: 'Mainboard IPOs', to: '/ipo/mainboard' },
                    { label: 'SME IPOs', to: '/ipo/sme' },
                    { label: 'GMP Tracker', to: '/gmp' },
                    { label: 'IPO Calendar', to: '/calendar' },
                    { label: 'Listed IPOs', to: '/listed' },
                  ].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="min-h-[40px] flex items-center rounded-lg border border-[#E2E8F0] dark:border-slate-800 px-3 py-2 text-[#152338] dark:text-slate-200 hover:border-[#2563EB]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  NSE &amp; BSE Equities
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Live Stocks', to: '/live-prices' },
                    { label: 'NSE Stocks', to: '/nse-stocks' },
                    { label: 'BSE Stocks', to: '/bse-stocks' },
                    { label: 'Stock Screener', to: '/stock-screener' },
                    { label: 'Top Gainers', to: '/live-prices?tab=gainers' },
                    { label: 'Sector Heatmap', to: '/live-prices?tab=sectors' },
                  ].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="min-h-[40px] flex items-center rounded-lg border border-[#E2E8F0] dark:border-slate-800 px-3 py-2 text-[#152338] dark:text-slate-200 hover:border-[#2563EB]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Tools &amp; Education
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Calculators', to: '/calculators' },
                    { label: 'Market Insights', to: '/market-insights' },
                    { label: 'Learn / Guides', to: '/blog' },
                    { label: 'Dashboard', to: '/' },
                  ].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="min-h-[40px] flex items-center rounded-lg border border-[#E2E8F0] dark:border-slate-800 px-3 py-2 text-[#152338] dark:text-slate-200 hover:border-[#2563EB]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Personal &amp; Governance
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Price Alerts', to: '/alerts' },
                    { label: 'Watchlist', to: '/watchlist' },
                    { label: 'Profile', to: '/profile' },
                    { label: 'Contact & Help', to: '/contact' },
                    ...(user?.role === 'admin' ? [{ label: 'Admin Console', to: '/admin' }] : []),
                  ].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="min-h-[40px] flex items-center rounded-lg border border-[#E2E8F0] dark:border-slate-800 px-3 py-2 text-[#152338] dark:text-slate-200 hover:border-[#2563EB]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 pb-safe bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-5 items-center"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium ${
              isActive ? 'text-[#059669]' : 'text-[#64748B] dark:text-slate-400'
            }`
          }
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/ipo"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium ${
              isActive ? 'text-[#059669]' : 'text-[#64748B] dark:text-slate-400'
            }`
          }
        >
          <Calendar className="w-4 h-4" />
          <span>IPOs</span>
        </NavLink>
        <NavLink
          to="/gmp"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium ${
              isActive ? 'text-[#059669]' : 'text-[#64748B] dark:text-slate-400'
            }`
          }
        >
          <TrendingUp className="w-4 h-4" />
          <span>GMP</span>
        </NavLink>
        <NavLink
          to="/live-prices"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium ${
              isActive ? 'text-[#059669]' : 'text-[#64748B] dark:text-slate-400'
            }`
          }
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Stocks</span>
        </NavLink>
        <NavLink
          to="/watchlist"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium ${
              isActive ? 'text-[#059669]' : 'text-[#64748B] dark:text-slate-400'
            }`
          }
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved</span>
        </NavLink>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

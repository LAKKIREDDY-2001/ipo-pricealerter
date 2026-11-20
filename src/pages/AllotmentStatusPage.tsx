import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  HelpCircle,
  TrendingUp,
  FileText,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { IPOOffering } from '../types/financial';
import { SEOHead } from '../components/common/SEOHead';
import { FreeAlertsLeadMagnet } from '../components/marketing/FreeAlertsLeadMagnet';
import { SocialShareButtons } from '../components/common/SocialShareButtons';

// Official Registrar Direct Portals
const REGISTRARS = [
  {
    name: 'Link Intime India',
    slug: 'linkintime',
    url: 'https://linkintime.co.in/initial_offer/public-issues.html',
    description: 'India\'s largest registrar for major Mainboard IPOs (e.g., Tata Tech, Swiggy, Hyundai).',
    badge: 'High Volume',
  },
  {
    name: 'KFin Technologies',
    slug: 'kfintech',
    url: 'https://kosmic.kfintech.com/ipostatus/',
    description: 'Official registrar for prominent Mainboard & tech issues (e.g., Bajaj Housing, Zomato).',
    badge: 'Instant PAN Search',
  },
  {
    name: 'Bigshare Services',
    slug: 'bigshare',
    url: 'https://www.bigshareonline.com/ipo_Allotment.html',
    description: 'Leading registrar for NSE Emerge and BSE SME offerings as well as mid-cap IPOs.',
    badge: 'SME Leader',
  },
  {
    name: 'Maashitla Securities',
    slug: 'maashitla',
    url: 'https://maashitla.com/allotment-status/public-issues',
    description: 'Official registrar for numerous NSE Emerge & BSE SME public issues.',
    badge: 'SME Registry',
  },
  {
    name: 'Skyline Financial',
    slug: 'skyline',
    url: 'https://www.skylinerta.com/ipo.php',
    description: 'Premier registrar for SME capital market issues and regional IPOs.',
    badge: 'Active Registry',
  },
  {
    name: 'Cameo Corporate Services',
    slug: 'cameo',
    url: 'https://ipo.cameoindia.com/',
    description: 'Registrar for South India-based listings, SME platforms, and institutional rights issues.',
    badge: 'Regional Hub',
  },
  {
    name: 'Purva Sharegistry',
    slug: 'purva',
    url: 'https://www.purvashare.com/queries/',
    description: 'Specialized registrar for SME and industrial issues on BSE SME and NSE.',
    badge: 'SME Registry',
  },
  {
    name: 'BSE Official Allotment Portal',
    slug: 'bse',
    url: 'https://www.bseindia.com/investors/appli_check.aspx',
    description: 'Official BSE portal to check allotment status across ALL listed and pending IPOs.',
    badge: 'Exchange Verified',
  },
];

export function AllotmentStatusPage() {
  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Mainboard' | 'SME'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Declared' | 'Awaiting'>('All');

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await api.getIpos();
        if (mounted && res?.ipos) {
          setIpos(res.ipos);
        }
      } catch (err) {
        console.error('Failed to load IPOs for allotment hub:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredIpos = useMemo(() => {
    return ipos.filter((ipo) => {
      if (categoryFilter !== 'All' && ipo.category !== categoryFilter) return false;

      const isDeclared =
        ipo.status === 'Listed' ||
        (ipo.dates.allotmentDate && ipo.dates.allotmentDate <= todayStr);

      if (statusFilter === 'Declared' && !isDeclared) return false;
      if (statusFilter === 'Awaiting' && isDeclared) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ipo.companyName.toLowerCase().includes(q) ||
        (ipo.shortName && ipo.shortName.toLowerCase().includes(q)) ||
        (ipo.registrar && ipo.registrar.toLowerCase().includes(q))
      );
    });
  }, [ipos, categoryFilter, statusFilter, searchQuery, todayStr]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How can I check my IPO allotment status online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can check your IPO allotment status online on the official website of the designated registrar (such as Link Intime, KFintech, or Bigshare) or directly on the BSE India website. You will need your PAN card number, IPO Application Number, or DP Client ID.',
        },
      },
      {
        '@type': 'Question',
        name: 'What time is IPO allotment usually declared?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Registrars typically finalize and upload the basis of allotment late in the evening on the scheduled allotment date, often between 8:00 PM and 11:30 PM IST, or early morning the next business day.',
        },
      },
      {
        '@type': 'Question',
        name: 'What should I do if I did not receive IPO allotment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If your application was not allotted shares, the UPI ASBA block on your funds will be unblocked/refunded automatically within 1 to 2 working days following the allotment date.',
        },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="IPO Allotment Status Check Online — Direct Registrar Portal Links (Link Intime, KFintech, Bigshare, BSE)"
        description="Check live IPO Allotment Status online using PAN card, Application number, or DP ID. Direct links to Link Intime, KFintech, Bigshare, Maashitla, Skyline, and BSE India official portals."
        canonicalPath="/allotment-status"
      />

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080E18] text-[#152338] dark:text-slate-100 transition-colors pb-16">
        {/* Hero Section */}
        <div className="border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B1522]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-Time Registrar Directory &amp; Allotment Tracker</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14263F] dark:text-white tracking-tight">
                  IPO Allotment Status Check Online
                </h1>
                <p className="mt-3 text-base sm:text-lg text-[#64748B] dark:text-slate-300 leading-relaxed">
                  Verify your share allotment across all official registrars (Link Intime, KFintech, Bigshare, Maashitla) and the BSE/NSE exchange portals with your PAN number.
                </p>
              </div>

              {/* Quick Share Widget */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 min-w-[280px]">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Share Allotment Portal with Friends:
                </span>
                <SocialShareButtons
                  title="Check Live IPO Allotment Status Online"
                  summary="Check live IPO Allotment Status using PAN on Link Intime, KFintech, and BSE on PriceAlerter:"
                  url="https://pricealerter.in/allotment-status"
                  variant="compact"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
          {/* Quick Lead Magnet Banner */}
          <FreeAlertsLeadMagnet
            source="allotment_status_top"
            title="Get Notified the Second Allotment Goes Live"
            description="Registrars frequently declare results late at night. Subscribe to our free WhatsApp or Email alerts to get notified the minute the basis of allotment is published."
          />

          {/* Section: Direct Registrar Access Portals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#14263F] dark:text-white">
                  Official Registrar Portals
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
                  Click any registrar below to jump directly to their secure allotment search page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REGISTRARS.map((reg) => (
                <a
                  key={reg.slug}
                  href={reg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1826] p-4 sm:p-5 hover:border-[#00D09C] hover:shadow-lg hover:shadow-emerald-500/10 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {reg.badge}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00D09C] transition-colors" />
                    </div>
                    <h3 className="text-base font-bold text-[#14263F] dark:text-white group-hover:text-[#00D09C] transition-colors">
                      {reg.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 line-clamp-2">
                      {reg.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-[#00D09C]">
                    <span>Open Portal</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Section: Live IPOs & Allotment Status Tracker */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1826] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#14263F] dark:text-white">
                  Active &amp; Recent IPO Allotment Records
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Real-time status tracking for Mainboard and SME public issues.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search IPO or Registrar..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D09C]"
                  />
                </div>

                {/* Category Filter */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-semibold">
                  {(['All', 'Mainboard', 'SME'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        categoryFilter === cat
                          ? 'bg-white dark:bg-slate-800 text-[#14263F] dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-semibold">
                  {(['All', 'Declared', 'Awaiting'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        statusFilter === st
                          ? 'bg-[#00D09C] text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00D09C]" />
                Loading latest IPO allotment schedules...
              </div>
            ) : filteredIpos.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No matching IPOs found. Try adjusting your search query or filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6">IPO Company</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Allotment Date</th>
                      <th className="py-3 px-4">Official Registrar</th>
                      <th className="py-3 px-4">Allotment Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                    {filteredIpos.map((ipo) => {
                      const isDeclared =
                        ipo.status === 'Listed' ||
                        (ipo.dates.allotmentDate && ipo.dates.allotmentDate <= todayStr);
                      const registrarUrl =
                        ipo.registrarUrl ||
                        REGISTRARS.find((r) =>
                          ipo.registrar?.toLowerCase().includes(r.slug)
                        )?.url ||
                        'https://linkintime.co.in/initial_offer/public-issues.html';

                      const gmpGain =
                        ipo.priceBandHigh && ipo.gmp.latestGmp
                          ? Math.round((ipo.gmp.latestGmp / ipo.priceBandHigh) * 100)
                          : null;

                      return (
                        <tr
                          key={ipo.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <Link
                              to={`/ipo/${ipo.slug}`}
                              className="font-bold text-[#14263F] dark:text-white hover:text-[#00D09C] transition-colors"
                            >
                              {ipo.companyName}
                            </Link>
                            {ipo.gmp.latestGmp != null && (
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <TrendingUp className="w-3 h-3" />
                                <span>
                                  GMP: +₹{ipo.gmp.latestGmp} ({gmpGain}% est. gain)
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                ipo.category === 'Mainboard'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              }`}
                            >
                              {ipo.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {ipo.dates.allotmentDate || 'TBA'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {ipo.registrar || 'Link Intime / KFintech'}
                          </td>
                          <td className="py-3.5 px-4">
                            {isDeclared ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Declared
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Awaiting Date
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={registrarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00D09C] hover:bg-[#00b588] text-white text-xs font-bold transition-all shadow-xs"
                              >
                                <span>Check Allotment</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Step-by-Step Guide for Checking Allotment */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1826] p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#14263F] dark:text-white mb-2">
              How to Check Your IPO Allotment Status Online (Step-by-Step)
            </h2>
            <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
              Follow these simple steps on the official registrar portal (Link Intime, KFintech, or Bigshare):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00D09C] text-white font-bold text-sm mb-3">
                  1
                </div>
                <h3 className="text-sm font-bold text-[#14263F] dark:text-white mb-1">
                  Select the IPO Issue
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  Open the official registrar page above and select the company name from the &quot;Select IPO / Public Issue&quot; dropdown menu once allotment is declared.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00D09C] text-white font-bold text-sm mb-3">
                  2
                </div>
                <h3 className="text-sm font-bold text-[#14263F] dark:text-white mb-1">
                  Choose Identification Method
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  Select <strong>PAN Number</strong> (recommended and easiest), Application Number, or DP Client ID (CDSL / NSDL 16-digit demat account number).
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00D09C] text-white font-bold text-sm mb-3">
                  3
                </div>
                <h3 className="text-sm font-bold text-[#14263F] dark:text-white mb-1">
                  View Shares Allotted
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  Enter the captcha and click Submit. The portal displays applied shares, allotted shares, and refund status instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1826] p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#14263F] dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#00D09C]" />
              <span>Frequently Asked Questions about IPO Allotment</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
              <div className="pt-4 first:pt-0">
                <h3 className="text-sm sm:text-base font-bold text-[#14263F] dark:text-white">
                  Why is my IPO allotment not showing on the registrar website yet?
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                  Registrars finalize the basis of allotment in coordination with stock exchanges late in the evening. If the dropdown does not list the company yet, the registrar is still processing the data. Check back between 9:00 PM and 11:30 PM IST.
                </p>
              </div>

              <div className="pt-4">
                <h3 className="text-sm sm:text-base font-bold text-[#14263F] dark:text-white">
                  When will my blocked money be refunded if I get zero shares?
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                  Under the SEBI T+3 listing norms, banks must release unallotted funds on the next business day following the allotment finalization. If your bank has not unblocked the mandate within 48 hours, contact your bank or UPI app with your Application Number.
                </p>
              </div>

              <div className="pt-4">
                <h3 className="text-sm sm:text-base font-bold text-[#14263F] dark:text-white">
                  Can I check allotment directly on BSE India or NSE?
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                  Yes, BSE India provides a centralized allotment status tool under the &quot;Investor Services &gt; Application Status Check&quot; menu. Select Issue Type &quot;Equity&quot;, pick the issue, and provide your Application Number and PAN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default AllotmentStatusPage;

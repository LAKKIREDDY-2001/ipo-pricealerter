import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, Send, SlidersHorizontal } from 'lucide-react';
import { api } from '../services/api';
import { useCookieConsent } from '../context/CookieConsentContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/StateViews';

interface GovernanceDocProps {
  page: 'about' | 'contact' | 'privacy' | 'cookies' | 'terms' | 'disclaimer' | 'editorial';
}

const CONTENT: Record<
  GovernanceDocProps['page'],
  {
    title: string;
    subtitle: string;
    lastUpdated: string;
    sections: Array<{ heading: string; body: string }>;
  }
> = {
  about: {
    title: 'About PriceAlerter',
    subtitle: 'Independent Indian IPO & NSE/BSE Financial Intelligence Platform',
    lastUpdated: '14 November 2026',
    sections: [
      {
        heading: 'Our Mission',
        body: 'PriceAlerter was built to bring institutional clarity, transparent data provenance, and clean analytics to Indian retail investors tracking Mainboard & SME IPOs, Grey Market Premium (GMP) trends, and all NSE/BSE listed equities.',
      },
      {
        heading: 'Separation of Data Types',
        body: 'We strictly separate verified exchange filings (DRHP, RHP, official NSE/BSE listing prices, UDiFF Bhavcopies) from unofficial grey market sentiment (GMP) and delayed market quotes, ensuring investors always know the exact source, timestamp, and reliability status of every figure.',
      },
      {
        heading: 'Editorial Independence',
        body: 'PriceAlerter does not accept paid stock tips, sponsored IPO recommendations, or undisclosed promotional coverage. Educational research and market briefings undergo review against primary SEBI, NSE, BSE, and registrar sources.',
      },
    ],
  },
  contact: {
    title: 'Contact PriceAlerter & Grievance Desk',
    subtitle: 'Editorial corrections, IPO data verification, privacy requests, and advertising inquiries',
    lastUpdated: '14 November 2026',
    sections: [
      {
        heading: 'Data Verification & Editorial Desk',
        body: 'To report RHP updates, registrar allotment links, or NSE/BSE corporate action discrepancies, contact our verification desk at editorial@pricealerter.in or submit a ticket below. Verified corrections are logged in our platform audit trail.',
      },
      {
        heading: 'Privacy, Compliance & Advertising',
        body: 'For privacy rights requests (India DPDP Act 2023 / GDPR), cookie inquiries, or advertising compliance, write to compliance@pricealerter.in or MADHAVALR4321@gmail.com. Typical response window: 2 business days.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How PriceAlerter protects user data, session security, and Google AdSense disclosures',
    lastUpdated: '14 November 2026',
    sections: [
      {
        heading: '1. Information We Collect & Purpose',
        body: 'When you create an account, we store your display name, email address, salted bcrypt password hash, watchlist symbols, price alert rules, and notification preferences strictly to deliver your requested market monitoring tools. Contact form inquiries are stored only to resolve your support or data-correction request.',
      },
      {
        heading: '2. Google AdSense & Third-Party Advertising Cookies',
        body: 'PriceAlerter may partner with Google AdSense and certified third-party advertising vendors to fund free investor tools. Third-party vendors, including Google, use cookies (such as DoubleClick/DART and IDE cookies) to serve ads based on a user’s prior visits to this website or other websites on the Internet. Google’s use of advertising cookies enables it and its partners to serve ads to users based on their visit to PriceAlerter and/or other sites.',
      },
      {
        heading: '3. Personalized vs. Non-Personalized Ad Opt-Out',
        body: 'You control advertising cookies through our Privacy & Cookie Preference Center. Users may opt out of personalized advertising at any time by choosing "Essential Only" in our Cookie Settings, visiting Google Ads Settings (https://adssettings.google.com), or opting out of third-party vendor cookies via https://www.aboutads.info/choices/.',
      },
      {
        heading: '4. Security, Encryption & No Sale of Personal Data',
        body: 'Passwords are salted and hashed using bcrypt, authenticated sessions rely on HMAC-signed HTTP-only cookies, all inputs are sanitized, and private user tokens or credentials are never exposed in client-side code or sold to data brokers.',
      },
      {
        heading: '5. Your Rights (India DPDP Act 2023 & GDPR)',
        body: 'You may request access to, correction of, export of, or deletion of your account and personal records at any time by contacting compliance@pricealerter.in or submitting a request via our Contact & Grievance form.',
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy & Consent Controls',
    subtitle: 'Transparent breakdown of essential session cookies, workspace preferences, and ad-partner cookies',
    lastUpdated: '14 November 2026',
    sections: [
      {
        heading: 'How PriceAlerter Uses Cookies',
        body: 'Cookies and browser local storage keep your authenticated account secure, remember theme preferences, and honor your privacy choices under Google Consent Mode v2 and Indian/international data protection standards.',
      },
      {
        heading: 'Managing or Withdrawing Consent',
        body: 'You may modify or withdraw non-essential advertising consent at any moment using the button below or via the "Cookie Settings" link in the site footer. Disabling advertising cookies switches ad delivery to contextual/non-personalized mode when ads are active.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service & Advertising Disclosure',
    subtitle: 'Conditions governing use of PriceAlerter financial research, tools, and alerts',
    lastUpdated: '14 November 2026',
    sections: [
      {
        heading: 'Informational & Educational Use Only',
        body: 'All data feeds, IPO summaries, financial ratios, calculators, screeners, and price alerts on PriceAlerter are provided strictly for informational and educational research. Users are solely responsible for verifying official NSE, BSE, SEBI, and registrar records before making any investment or trading decision.',
      },
      {
        heading: 'Service Availability & Market Data Accuracy',
        body: 'While PriceAlerter automates periodic synchronization with NSE/BSE exchange bhavcopies and broker APIs, network delays or upstream exchange downtime can cause temporary delays. Missing fields are intentionally marked "Unavailable" rather than estimated.',
      },
      {
        heading: 'Advertising & Sponsorship Transparency',
        body: 'Any display advertisements served through Google AdSense or clearly marked affiliate links are visually separated from editorial research, IPO tables, and screener metrics and are labelled "Advertisement". Ads never influence IPO ratings, subscription numbers, or price alert triggers.',
      },
    ],
  },
  disclaimer: {
    title: 'Financial & Grey Market Premium (GMP) Disclaimer',
    subtitle: 'Mandatory SEBI non-advisory & speculative market risk disclosures',
    lastUpdated: '14 November 2026',
    sections: [
      {
        heading: 'Not SEBI-Registered Investment Advice',
        body: 'PriceAlerter is not a SEBI-registered investment advisor (RIA), research analyst (RA), or stock broker. Nothing on this platform constitutes a recommendation, tip, or solicitation to apply for an IPO or buy, sell, or hold any equity security.',
      },
      {
        heading: 'Unofficial & Speculative Nature of GMP',
        body: 'Grey Market Premium (GMP) values are unofficial, unregulated estimates observed in informal over-the-counter sentiment channels. GMP is not published or recognized by NSE, BSE, or SEBI, carries zero settlement guarantee, and cannot predict actual listing prices.',
      },
      {
        heading: 'Delayed vs. Live Exchange Quotes',
        body: 'Benchmark indices, EOD UDiFF bhavcopy snapshots, and fallback quotes are labelled Delayed or Provisional alongside their source provenance. Always verify execution prices on your registered broker terminal.',
      },
    ],
  },
  editorial: {
    title: 'Editorial Standards & Data Methodology',
    subtitle: 'How PriceAlerter verifies IPO documents, NSE/BSE bhavcopies, and stock quotes',
    lastUpdated: '14 November 2026',
    sections: [
      {
        heading: 'Source Provenance & Freshness States',
        body: 'Every financial metric carries explicit provenance metadata including upstream source, retrieval timestamp, effective date, and quality status (Verified, Delayed, Stale, Indicative, Unavailable, or Under Review). Unavailable figures are displayed cleanly rather than fabricated.',
      },
      {
        heading: 'Listing Gain & Financial Calculations',
        body: 'Listing Gain % strictly compares the verified listing-day price against the IPO issue price, never mixing issue price, opening price, or subsequent market prices. Financial ratios use restated prospectus statements or exchange-reported TTM filings.',
      },
    ],
  },
};

const COOKIE_INVENTORY = [
  {
    name: 'pa_session',
    provider: 'PriceAlerter (First-Party)',
    category: 'Strictly Necessary',
    purpose: 'HMAC-signed HTTP-only cookie preserving authenticated user sessions across Watchlist and Price Alerts.',
    retention: '7 days (cleared on Sign Out)',
  },
  {
    name: 'pa_cookie_consent_v1',
    provider: 'PriceAlerter (Local Storage)',
    category: 'Strictly Necessary',
    purpose: 'Stores your chosen privacy and cookie preferences for Google Consent Mode v2 compliance.',
    retention: 'Persistent until cleared',
  },
  {
    name: 'pa_theme',
    provider: 'PriceAlerter (Local Storage)',
    category: 'Workspace Preference',
    purpose: 'Remembers your Light or Dark interface preference.',
    retention: 'Persistent until cleared',
  },
  {
    name: 'IDE / _gcl_* / NID',
    provider: 'Google AdSense / DoubleClick (Third-Party)',
    category: 'Advertising (Optional)',
    purpose: 'Used only when AdSense is active and Advertising consent is granted to measure ads, prevent fraud, and personalize relevant placements.',
    retention: 'Per Google Privacy & Terms (typically 3–13 months)',
  },
];

export function GovernancePage({ page }: GovernanceDocProps) {
  const doc = CONTENT[page];
  const { consent, openPreferencesModal } = useCookieConsent();
  const activeDomain =
    typeof window !== 'undefined' ? window.location.origin : 'https://pricealerter.in';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Data Correction');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await api.submitContact({ name, email, topic, message });
      setTicketRef(res.ticketId);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send message right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <SEOHead title={doc.title} description={doc.subtitle} canonicalPath={`/${page === 'editorial' ? 'editorial-policy' : page}`} />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: doc.title }]} />

      <article className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            {doc.title}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">{doc.subtitle}</p>
          <p className="text-[11px] font-data text-[#94A3B8] mt-2">
            Last reviewed: {doc.lastUpdated} · Domain: {activeDomain}
          </p>
        </div>

        <div className="space-y-5">
          {doc.sections.map((sec) => (
            <section key={sec.heading} className="space-y-1.5">
              <h2 className="text-base font-bold text-[#14263F] dark:text-white">{sec.heading}</h2>
              <p className="text-sm text-[#64748B] dark:text-slate-300 leading-relaxed">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        {page === 'cookies' && (
          <div className="space-y-4 pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#F6F8FB] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800 p-4">
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-[#152338] dark:text-white">
                  Current Consent Status:{' '}
                  <span className="font-data text-[#059669] dark:text-emerald-400">
                    {!consent
                      ? 'Pending Selection (Advertising Denied by Default)'
                      : consent.advertising
                        ? 'All Categories Enabled'
                        : 'Essential Only (Non-Personalized Ads)'}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                  Update your Google Consent Mode v2 preferences anytime.
                </div>
              </div>
              <button
                type="button"
                onClick={openPreferencesModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Manage Cookie Preferences
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F6F8FB] dark:bg-slate-900/70 text-[#64748B] border-b border-[#E2E8F0] dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Identifier</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Purpose</th>
                    <th className="py-2.5 px-3 font-semibold">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {COOKIE_INVENTORY.map((c) => (
                    <tr key={c.name}>
                      <td className="py-2.5 px-3 font-data font-semibold text-[#152338] dark:text-slate-200 whitespace-nowrap">
                        {c.name}
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B] dark:text-slate-300 whitespace-nowrap">
                        {c.category}
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B] dark:text-slate-300">{c.purpose}</td>
                      <td className="py-2.5 px-3 text-[#64748B] dark:text-slate-400 whitespace-nowrap">
                        {c.retention}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {page === 'contact' && (
          <section className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#059669]" />
              <h2 className="text-base font-bold text-[#14263F] dark:text-white">
                Send a Data Correction, Privacy, or Support Inquiry
              </h2>
            </div>

            {ticketRef ? (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs space-y-1">
                <div className="font-bold text-[#059669] dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Inquiry Logged Successfully (Reference: <span className="font-data">{ticketRef}</span>)
                </div>
                <p className="text-[#152338] dark:text-slate-300">
                  Thank you. Our editorial and compliance team has recorded your message and will
                  respond to your email within 2 business days.
                </p>
                <button
                  type="button"
                  onClick={() => setTicketRef(null)}
                  className="mt-2 text-[#2563EB] font-semibold underline cursor-pointer"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                {submitError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-[#DC2626]">
                    {submitError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-[#64748B]">Full Name</span>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[#64748B]">Email Address</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[#64748B]">Topic</span>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                    >
                      <option value="Data Correction">Data Correction</option>
                      <option value="IPO Verification">IPO Verification</option>
                      <option value="Privacy & Cookie Request">Privacy &amp; Cookie Request</option>
                      <option value="Advertising">Advertising &amp; Partnerships</option>
                      <option value="General">General Inquiry</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-[#64748B]">Message (Minimum 10 characters)</span>
                  <textarea
                    required
                    minLength={10}
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the stock symbol, IPO filing reference, or privacy request..."
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                  />
                </label>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#94A3B8]">
                    Submissions are protected under our{' '}
                    <Link to="/privacy" className="underline text-[#2563EB]">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Sending...' : 'Submit Inquiry'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-wrap gap-4 text-xs font-medium text-[#2563EB] dark:text-blue-400">
          <Link to="/about" className="hover:underline">About Us</Link>
          <Link to="/editorial-policy" className="hover:underline">Editorial Methodology</Link>
          <Link to="/disclaimer" className="hover:underline">SEBI &amp; GMP Disclaimer</Link>
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link to="/cookies" className="hover:underline">Cookie Policy</Link>
          <Link to="/terms" className="hover:underline">Terms of Service</Link>
          <Link to="/contact" className="hover:underline">Contact Us</Link>
        </div>
      </article>
    </main>
  );
}

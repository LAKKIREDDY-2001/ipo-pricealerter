import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Archive,
  Database,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type {
  AdminAuditLog,
  AuthUser,
  DataSourceStatus,
  IPOOffering,
} from '../types/financial';
import { formatCrores, formatTimestampIN } from '../utils/calculations';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs, EmptyState, LoadingSkeleton } from '../components/common/StateViews';

type AdminTab = 'overview' | 'ipos' | 'gmp' | 'listings' | 'sources' | 'users' | 'audit';

export function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [stats, setStats] = useState<{
    totalIpos: number;
    activeIpos: number;
    totalStocks: number;
    totalUsers: number;
    activeAlerts: number;
    auditLogCount: number;
  } | null>(null);
  const [automation, setAutomation] = useState<{
    running: boolean;
    startedAt: string | null;
    marketSession: string;
    istTimeLabel: string;
    liveClients: number;
    pollIntervalsSec: { indices: number; equitiesAndAlerts: number; iposAndGmp: number };
    cycles: { indices: number; equities: number; ipos: number; alertsEvaluated: number; alertsTriggeredTotal: number };
    lastRunAt: { indices: string | null; equities: string | null; ipos: string | null; alerts: string | null };
    lastError: string | null;
  } | null>(null);
  const [adsenseId, setAdsenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Add IPO form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'Mainboard' | 'SME'>('Mainboard');
  const [newStatus, setNewStatus] = useState<'Upcoming' | 'Open' | 'Closed' | 'Listed'>('Upcoming');
  const [newSector, setNewSector] = useState('Manufacturing');
  const [newPriceHigh, setNewPriceHigh] = useState('250');
  const [newSize, setNewSize] = useState('850');

  // GMP Update form state
  const [gmpSlug, setGmpSlug] = useState('');
  const [gmpInput, setGmpInput] = useState('');

  // Verify Listing form state
  const [listSlug, setListSlug] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [listExchange, setListExchange] = useState<'NSE' | 'BSE'>('NSE');

  // Batch import JSON
  const [importJson, setImportJson] = useState(
    '[{"slug": "crystal-crop-protection-ipo", "latestGmp": 45}]'
  );

  const loadAdmin = async () => {
    setLoading(true);
    try {
      const [ov, ipoRes, logRes, autoRes, cfgRes] = await Promise.all([
        api.adminOverview(),
        api.getIpos({ includeArchived: true }),
        api.adminAuditLogs(),
        api.getAutomationStatus(),
        api.getPublicConfig(),
      ]);
      setStats(ov.stats);
      setDataSources(ov.dataSources);
      setUsers(ov.users);
      setIpos(ipoRes.ipos);
      setAuditLogs(logRes.logs);
      setAutomation(autoRes);
      setAdsenseId(cfgRes.adsenseClientId);
      if (!gmpSlug && ipoRes.ipos[0]) setGmpSlug(ipoRes.ipos[0].slug);
      if (!listSlug && ipoRes.ipos[0]) setListSlug(ipoRes.ipos[0].slug);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdmin();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <LoadingSkeleton rows={6} />
      </main>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-4">
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Admin' }]} />
        <EmptyState
          title="Administrator Access Required (403)"
          description="Public users cannot access financial record governance, GMP overrides, or audit logs. Sign in with an authorized administrator account."
          actionLabel="Go to Sign In"
          onAction={() => navigate('/login')}
        />
      </main>
    );
  }

  const handleCreateIpo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    await api.adminCreateIpo({
      companyName: newName,
      category: newCategory,
      status: newStatus,
      sector: newSector,
      priceBandHigh: Number(newPriceHigh) || null,
      priceBandLow: Number(newPriceHigh) ? Number(newPriceHigh) - 15 : null,
      issueSizeCr: Number(newSize) || null,
      lotSize: newCategory === 'SME' ? 800 : 50,
    });
    setNewName('');
    setFeedback('New IPO record created and logged in audit trail.');
    await loadAdmin();
  };

  const handleUpdateGmp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const val = gmpInput.trim() === '' ? null : Number(gmpInput);
    await api.adminUpdateGmp(gmpSlug, {
      gmpValue: val,
      source: 'Admin Verified Indicative Feed',
    });
    setFeedback(`GMP updated for ${gmpSlug} and logged.`);
    await loadAdmin();
  };

  const handleVerifyListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    await api.adminVerifyListing(listSlug, {
      actualListingPrice: Number(listPrice),
      listingExchange: listExchange,
    });
    setFeedback(`Listing price verified for ${listSlug}.`);
    await loadAdmin();
  };

  const handleExport = async () => {
    const data = await api.adminExportSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricealerter-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBatchImport = async () => {
    setFeedback(null);
    try {
      const parsed = JSON.parse(importJson);
      const res = await api.adminImportRecords({
        importType: 'GMP_BATCH_JSON',
        records: parsed,
      });
      setFeedback(`Batch import processed ${res.updated} record(s).`);
      await loadAdmin();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Invalid JSON payload.');
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <SEOHead
        title="Admin Console – PriceAlerter Governance & Data Operations"
        description="Protected PriceAlerter admin console for managing IPOs, GMP observations, listing price verification, data sources, and audit logs."
        noIndex
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Admin Console' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Admin Sidebar */}
        <aside className="lg:col-span-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-2.5 sm:p-3">
          <div className="hidden lg:block px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Governance Console
          </div>
          <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'ipos', label: 'IPO Records', icon: FileSpreadsheet },
                { id: 'gmp', label: 'GMP Records', icon: Plus },
                { id: 'listings', label: 'Verify Listings', icon: ShieldAlert },
                { id: 'sources', label: 'Data Sources & Import', icon: Database },
                { id: 'users', label: 'Users & Alerts', icon: Activity },
                { id: 'audit', label: 'Audit Logs', icon: Archive },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`lg:w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    tab === item.id
                      ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                      : 'text-[#64748B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Workspace */}
        <section className="lg:col-span-9 space-y-6">
          {feedback && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-xs font-semibold text-[#059669]">
              {feedback}
            </div>
          )}

          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total IPO Records', val: stats.totalIpos },
                  { label: 'Active Open IPOs', val: stats.activeIpos },
                  { label: 'Tracked Stocks', val: stats.totalStocks },
                  { label: 'Registered Users', val: stats.totalUsers },
                  { label: 'Active Price Alerts', val: stats.activeAlerts },
                  { label: 'Audit Log Entries', val: stats.auditLogCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4"
                  >
                    <div className="text-xs text-[#64748B]">{s.label}</div>
                    <div className="font-data text-2xl font-bold mt-1">{s.val}</div>
                  </div>
                ))}
              </div>

              {automation && (
                <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[#14263F] dark:text-white">
                      Autonomous Live Tracking Engine
                    </h2>
                    <span className="font-data text-[#059669] dark:text-emerald-400 font-semibold">
                      {automation.running ? 'RUNNING' : 'IDLE'} · {automation.marketSession} ({automation.istTimeLabel})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-data">
                    <div className="rounded-lg bg-[#F6F8FB] dark:bg-slate-900/60 p-3">
                      <div className="text-[11px] text-[#64748B]">Index Sync Cycles</div>
                      <div className="text-base font-bold mt-0.5">{automation.cycles.indices}</div>
                      <div className="text-[10px] text-[#94A3B8]">Every {automation.pollIntervalsSec.indices}s</div>
                    </div>
                    <div className="rounded-lg bg-[#F6F8FB] dark:bg-slate-900/60 p-3">
                      <div className="text-[11px] text-[#64748B]">Equity &amp; Alert Cycles</div>
                      <div className="text-base font-bold mt-0.5">{automation.cycles.equities}</div>
                      <div className="text-[10px] text-[#94A3B8]">Every {automation.pollIntervalsSec.equitiesAndAlerts}s</div>
                    </div>
                    <div className="rounded-lg bg-[#F6F8FB] dark:bg-slate-900/60 p-3">
                      <div className="text-[11px] text-[#64748B]">IPO &amp; GMP Cycles</div>
                      <div className="text-base font-bold mt-0.5">{automation.cycles.ipos}</div>
                      <div className="text-[10px] text-[#94A3B8]">Every {automation.pollIntervalsSec.iposAndGmp}s</div>
                    </div>
                    <div className="rounded-lg bg-[#F6F8FB] dark:bg-slate-900/60 p-3">
                      <div className="text-[11px] text-[#64748B]">Live SSE Browsers</div>
                      <div className="text-base font-bold mt-0.5">{automation.liveClients}</div>
                      <div className="text-[10px] text-[#94A3B8]">Triggered: {automation.cycles.alertsTriggeredTotal}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-[#14263F] dark:text-white">
                    Google AdSense &amp; Policy Compliance Checklist
                  </h2>
                  <span className="font-data text-[#2563EB] dark:text-blue-400 font-semibold">
                    {adsenseId ? `Publisher Active: ${adsenseId}` : 'Ready (Set VITE_ADSENSE_CLIENT_ID & ADSENSE_PUBLISHER_ID)'}
                  </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#152338] dark:text-slate-300">
                  <li>✓ Cookie Consent Mode v2 Banner &amp; Preference Center active</li>
                  <li>✓ Privacy Policy with AdSense &amp; DART/IDE opt-out disclosures (/privacy)</li>
                  <li>✓ Dedicated Cookie Inventory &amp; Opt-out Page (/cookies)</li>
                  <li>✓ SEBI Non-Advisory &amp; GMP Risk Disclaimers (/disclaimer)</li>
                  <li>✓ Editorial Policy, About Us &amp; Live Contact Form (/contact)</li>
                  <li>✓ /ads.txt, /robots.txt &amp; Dynamic /sitemap.xml endpoints live</li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'ipos' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateIpo}
                className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-xs"
              >
                <h2 className="text-sm font-bold text-[#14263F] dark:text-white">
                  Add New IPO Record
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Company Name Ltd"
                    className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'Mainboard' | 'SME')}
                    className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                  >
                    <option value="Mainboard">Mainboard</option>
                    <option value="SME">SME</option>
                  </select>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as 'Upcoming' | 'Open' | 'Closed' | 'Listed')
                    }
                    className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Listed">Listed</option>
                  </select>
                  <input
                    type="text"
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    placeholder="Sector"
                    className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                  />
                  <input
                    type="number"
                    value={newPriceHigh}
                    onChange={(e) => setNewPriceHigh(e.target.value)}
                    placeholder="Upper Price (₹)"
                    className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data"
                  />
                  <input
                    type="number"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="Issue Size (₹ Cr)"
                    className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 font-semibold text-white cursor-pointer"
                >
                  Create IPO Offering
                </button>
              </form>

              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[540px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[#64748B]">
                      <th className="py-2.5 px-4">Company</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Issue Size</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                    {ipos.map((ipo) => (
                      <tr key={ipo.id} className={ipo.archived ? 'opacity-50' : ''}>
                        <td className="py-2.5 px-4 font-semibold">{ipo.companyName}</td>
                        <td className="py-2.5 px-3">{ipo.category}</td>
                        <td className="py-2.5 px-3">{ipo.status}</td>
                        <td className="py-2.5 px-3 text-right font-data">
                          {formatCrores(ipo.issueSizeCr)}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await api.adminArchiveIpo(ipo.id);
                              await loadAdmin();
                            }}
                            className="text-xs font-medium text-[#2563EB] hover:underline cursor-pointer"
                          >
                            {ipo.archived ? 'Restore' : 'Archive'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'gmp' && (
            <form
              onSubmit={handleUpdateGmp}
              className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-xs"
            >
              <h2 className="text-sm font-bold text-[#14263F] dark:text-white">
                Update Unofficial GMP Observation (Audit Logged)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={gmpSlug}
                  onChange={(e) => setGmpSlug(e.target.value)}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                >
                  {ipos.map((i) => (
                    <option key={i.id} value={i.slug}>
                      {i.companyName} (Current: {i.gmp.latestGmp ?? 'Unavailable'})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={gmpInput}
                  onChange={(e) => setGmpInput(e.target.value)}
                  placeholder="New GMP ₹ (leave blank to mark Unavailable)"
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#059669] px-4 py-2 font-semibold text-white cursor-pointer"
              >
                Save GMP Update
              </button>
            </form>
          )}

          {tab === 'listings' && (
            <form
              onSubmit={handleVerifyListing}
              className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-xs"
            >
              <h2 className="text-sm font-bold text-[#14263F] dark:text-white">
                Verify Official Exchange Listing Price
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={listSlug}
                  onChange={(e) => setListSlug(e.target.value)}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                >
                  {ipos.map((i) => (
                    <option key={i.id} value={i.slug}>
                      {i.companyName} ({i.status})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="Actual Listing Price (₹)"
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 font-data"
                />
                <select
                  value={listExchange}
                  onChange={(e) => setListExchange(e.target.value as 'NSE' | 'BSE')}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2"
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 font-semibold text-white cursor-pointer"
              >
                Verify Listing Data
              </button>
            </form>
          )}

          {tab === 'sources' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#14263F] dark:text-white">
                    Connected Data Sources &amp; API Health
                  </h2>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await api.adminRefreshDataSources();
                      setDataSources(res.dataSources);
                      setFeedback(
                        res.liveFeedReachable
                          ? 'Market feeds refreshed from upstream.'
                          : 'Upstream unreachable in sandbox; reference EOD preserved.'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Feeds
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  {dataSources.map((src) => (
                    <div
                      key={src.id}
                      className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-[#152338] dark:text-white">
                          {src.name}
                        </div>
                        <div className="text-[#64748B] mt-0.5">{src.notes}</div>
                      </div>
                      <div className="text-right font-data shrink-0">
                        <span className="font-semibold text-[#059669]">{src.status}</span>
                        <div className="text-[11px] text-[#94A3B8]">
                          {formatTimestampIN(src.lastCheckedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#14263F] dark:text-white">
                    Import / Export Financial Records
                  </h2>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-3 py-1.5 font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON Snapshot
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 p-3 font-data text-xs"
                />
                <button
                  type="button"
                  onClick={handleBatchImport}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 font-semibold text-white cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Run Batch GMP Import
                </button>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[#64748B]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-4">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 px-4 font-semibold">{u.name}</td>
                      <td className="py-2.5 px-3 font-data">{u.email}</td>
                      <td className="py-2.5 px-3 uppercase font-semibold">{u.role}</td>
                      <td className="py-2.5 px-4">{u.emailVerified ? 'Verified' : 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'audit' && (
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[#64748B]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Actor</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Previous</th>
                    <th className="py-3 px-3">New Value</th>
                    <th className="py-3 px-4">Source / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-4 font-data whitespace-nowrap">
                        {formatTimestampIN(log.timestamp)}
                      </td>
                      <td className="py-2.5 px-3">{log.actorEmail}</td>
                      <td className="py-2.5 px-3 font-semibold">{log.action}</td>
                      <td className="py-2.5 px-3 text-[#64748B]">{log.previousValue}</td>
                      <td className="py-2.5 px-3">{log.newValue}</td>
                      <td className="py-2.5 px-4 text-[#64748B]">
                        {log.source} · {log.verificationStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateIN } from '../utils/calculations';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs, EmptyState, LoadingSkeleton } from '../components/common/StateViews';

export function ProfilePage() {
  const { user, loading, watchlist, alerts, notifications, refreshUserData, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [prefs, setPrefs] = useState(
    user?.preferences || {
      emailAlerts: true,
      browserNotifications: false,
      ipoReminders: true,
      gmpAlerts: true,
    }
  );
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <LoadingSkeleton rows={4} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Profile' }]} />
        <EmptyState
          title="Sign in to access your Personal Dashboard"
          description="Manage your saved IPOs, watchlist, price alerts, and notification settings."
          actionLabel="Sign In"
          onAction={() => navigate('/login')}
        />
      </main>
    );
  }

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(null);
    await api.updatePreferences({
      name: name || user.name,
      preferences: prefs,
    });
    await refreshUserData();
    setSavedMsg('Profile & notification preferences updated.');
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <SEOHead
        title="Personal Investor Dashboard & Preferences"
        description="View your PriceAlerter watchlist summary, active price alerts, and notification preferences."
        noIndex
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Personal Dashboard' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            {user.email} · Role: {user.role.toUpperCase()} · Verified: {user.emailVerified ? 'Yes' : 'Pending'} · Member since {formatDateIN(user.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Shield className="w-3.5 h-3.5" /> Admin Console
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-[#DC2626] cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Personal Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/watchlist"
          className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 hover:border-[#2563EB]"
        >
          <div className="text-xs text-[#64748B]">Saved IPOs</div>
          <div className="font-data text-2xl font-bold mt-1">
            {watchlist.filter((w) => w.itemType === 'ipo').length}
          </div>
        </Link>
        <Link
          to="/watchlist"
          className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 hover:border-[#2563EB]"
        >
          <div className="text-xs text-[#64748B]">Saved Stocks</div>
          <div className="font-data text-2xl font-bold mt-1">
            {watchlist.filter((w) => w.itemType === 'stock').length}
          </div>
        </Link>
        <Link
          to="/alerts"
          className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 hover:border-[#2563EB]"
        >
          <div className="text-xs text-[#64748B]">Price Alerts</div>
          <div className="font-data text-2xl font-bold mt-1">{alerts.length}</div>
        </Link>
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4">
          <div className="text-xs text-[#64748B]">Unread Notifications</div>
          <div className="font-data text-2xl font-bold mt-1">
            {notifications.filter((n) => !n.read).length}
          </div>
        </div>
      </div>

      {/* Preferences & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSavePrefs}
          className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-xs"
        >
          <h2 className="text-base font-bold text-[#14263F] dark:text-white">
            Profile &amp; Notification Preferences
          </h2>

          <label className="block">
            <span className="text-[#64748B]">Display Name</span>
            <input
              type="text"
              value={name || user.name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </label>

          <div className="space-y-2.5 pt-2">
            {(
              [
                { key: 'emailAlerts', label: 'Email notifications for triggered price alerts' },
                { key: 'ipoReminders', label: 'IPO opening, closing & allotment reminders' },
                { key: 'gmpAlerts', label: 'Significant GMP change alerts' },
                { key: 'browserNotifications', label: 'In-browser notification alerts' },
              ] as const
            ).map((opt) => (
              <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[opt.key]}
                  onChange={(e) => setPrefs({ ...prefs, [opt.key]: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {savedMsg && <p className="text-[#059669] font-semibold">{savedMsg}</p>}

          <button
            type="submit"
            className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
          >
            Save Preferences
          </button>
        </form>

        <div className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-3">
          <h2 className="text-base font-bold text-[#14263F] dark:text-white">
            Recent Notifications &amp; Activity
          </h2>
          {notifications.length === 0 ? (
            <p className="text-xs text-[#64748B]">No recent account notifications.</p>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
              {notifications.slice(0, 6).map((n) => (
                <div key={n.id} className="py-2.5 text-xs">
                  <div className="font-semibold text-[#152338] dark:text-slate-100">{n.title}</div>
                  <div className="text-[#64748B] mt-0.5">{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

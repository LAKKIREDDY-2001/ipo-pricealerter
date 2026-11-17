import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, KeyRound, Shield, Trash2 } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPrefs(user.preferences);
    }
  }, [user]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

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

  const handleToggleBrowserNotification = async (checked: boolean) => {
    if (checked && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore permission errors inside restricted iframes
        }
      }
    }
    setPrefs((prev) => ({ ...prev, browserNotifications: checked }));
  };

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(null);
    setSaveError(null);
    setSaving(true);
    try {
      await api.updatePreferences({
        name: name.trim() || user.name,
        preferences: prefs,
      });
      await refreshUserData();
      setSavedMsg('Profile & notification preferences updated.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwMsg(null);
    if (newPassword !== confirmNewPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    setPwBusy(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setPwMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setPwBusy(false);
    }
  };

  const handleExportData = async () => {
    setExportBusy(true);
    try {
      const data = await api.exportPersonalData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricealerter-account-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExportBusy(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setDeleteBusy(true);
    try {
      await api.deleteAccount(deletePassword);
      await refreshUserData();
      navigate('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete account.');
    } finally {
      setDeleteBusy(false);
    }
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

        <div className="flex flex-wrap items-center gap-2">
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
            disabled={exportBusy}
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-[#152338] dark:text-slate-200 hover:border-[#2563EB] cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exportBusy ? 'Exporting...' : 'Export Data'}
          </button>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm text-[#152338] dark:text-slate-100"
            />
          </label>

          <div className="space-y-2.5 pt-2">
            {(
              [
                { key: 'emailAlerts', label: 'Email notifications for triggered price alerts' },
                { key: 'ipoReminders', label: 'IPO opening, closing & allotment reminders' },
                { key: 'gmpAlerts', label: 'Significant GMP change alerts' },
                { key: 'browserNotifications', label: 'In-browser desktop notification alerts' },
              ] as const
            ).map((opt) => (
              <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[opt.key]}
                  onChange={(e) => {
                    if (opt.key === 'browserNotifications') {
                      void handleToggleBrowserNotification(e.target.checked);
                    } else {
                      setPrefs({ ...prefs, [opt.key]: e.target.checked });
                    }
                  }}
                  className="rounded border-slate-300"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {saveError && <p className="text-[#DC2626] font-semibold">{saveError}</p>}
          {savedMsg && <p className="text-[#059669] font-semibold">{savedMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
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

      {/* Security & Account Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleChangePassword}
          className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-base font-bold text-[#14263F] dark:text-white">
              Account Security &amp; Password
            </h2>
          </div>

          {pwError && (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-[#DC2626] dark:text-red-400">
              {pwError}
            </div>
          )}
          {pwMsg && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-[#059669] dark:text-emerald-400 font-semibold">
              {pwMsg}
            </div>
          )}

          <label className="block">
            <span className="text-[#64748B]">Current Password</span>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[#64748B]">New Password (10+ chars, letters &amp; numbers)</span>
              <input
                type="password"
                required
                minLength={10}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[#64748B]">Confirm New Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pwBusy}
            className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
          >
            {pwBusy ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="lg:col-span-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#DC2626]" />
            <h2 className="text-base font-bold text-[#14263F] dark:text-white">
              Privacy &amp; Account Deletion
            </h2>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            You can export a copy of your watchlist, price alerts, and notification history at any time, or permanently delete your PriceAlerter account and associated personal rules.
          </p>

          {user.id === 'usr-admin-root' ? (
            <p className="text-[11px] text-[#64748B] italic">
              Primary governance administrator accounts cannot be deleted from self-service.
            </p>
          ) : !deleteOpen ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded-lg border border-red-200 dark:border-red-900 px-3.5 py-2 text-xs font-semibold text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
            >
              Delete My Account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-3.5">
              {deleteError && (
                <p className="text-[#DC2626] font-medium">{deleteError}</p>
              )}
              <label className="block">
                <span className="font-medium text-[#152338] dark:text-slate-200">
                  Confirm Current Password to Permanently Delete Account
                </span>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={deleteBusy}
                  className="rounded-lg bg-[#DC2626] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
                >
                  {deleteBusy ? 'Deleting...' : 'Confirm Permanent Deletion'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-3.5 py-2 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatTimestampIN } from '../../utils/calculations';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { user, notifications, markNotificationRead, markAllNotificationsRead } = useAuth();

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] shadow-xl z-50 overflow-hidden"
      role="region"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#14263F] dark:text-slate-200" />
          <span className="text-sm font-semibold text-[#152338] dark:text-slate-100">
            Notifications
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user && notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead()}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] dark:text-blue-400 hover:underline cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="p-1 text-[#64748B] hover:text-[#152338] dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-slate-800">
        {!user ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Sign in to receive IPO reminders, GMP updates, and triggered price alerts.
            </p>
            <Link
              to="/login"
              onClick={onClose}
              className="inline-block rounded-md bg-[#14263F] dark:bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#64748B] dark:text-slate-400">
            No notifications yet. Set a stock price alert or save an IPO to your watchlist.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 transition-colors ${
                n.read
                  ? 'bg-white dark:bg-[#111C2E]'
                  : 'bg-blue-50/50 dark:bg-blue-950/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={n.link}
                  onClick={() => {
                    if (!n.read) markNotificationRead(n.id);
                    onClose();
                  }}
                  className="text-xs font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB]"
                >
                  {n.title}
                </Link>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="text-[11px] text-[#2563EB] dark:text-blue-400 shrink-0 cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                {n.message}
              </p>
              <div className="mt-1.5 text-[11px] text-[#94A3B8] font-data">
                {formatTimestampIN(n.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

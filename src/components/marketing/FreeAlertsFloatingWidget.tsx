import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export function FreeAlertsFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pricealerter_free_alerts_dismissed');
      if (stored && Date.now() - Number(stored) < 7 * 86400000) {
        setDismissed(true);
      }
    } catch {}
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('pricealerter_free_alerts_dismissed', String(Date.now()));
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim();
    if (!clean) return;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    const isPhone = /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(clean.replace(/[\s\-]/g, ''));

    if (!isEmail && !isPhone) {
      setError('Enter valid 10-digit mobile or email');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.subscribeFreeAlerts({
        email: isEmail ? clean.toLowerCase() : undefined,
        phone: isPhone ? clean : undefined,
        source: 'floating_pill_widget',
      });
      if (res.success || res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          handleDismiss();
        }, 3000);
      } else {
        setError(res.message || 'Subscription failed');
      }
    } catch {
      setError('Network error, please retry');
    } finally {
      setLoading(false);
    }
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40">
      {/* Expanded Modal / Card */}
      {isOpen ? (
        <div className="relative w-80 sm:w-88 rounded-2xl border border-emerald-500/30 bg-white dark:bg-[#0E1B2B] shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>

          {success ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Alerts Active!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You will receive instant alerts for live IPOs &amp; GMP jumps.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00D09C]/15 text-[#00D09C]">
                  <Bell className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Get Free IPO &amp; GMP Alerts
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Direct on WhatsApp or Email
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                Be the first to know when Mainboard &amp; SME IPOs open, GMP rises &gt;15%, or allotment goes live.
              </p>

              <form onSubmit={handleSubmit} className="space-y-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    setError(null);
                  }}
                  placeholder="WhatsApp Mobile No or Email"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D09C]"
                />
                {error && <p className="text-[11px] font-semibold text-rose-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#00D09C] hover:bg-[#00b588] text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Subscribing...' : 'Activate Free Alerts'}</span>
                </button>
              </form>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>100% Free · Zero Spam</span>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="hover:underline text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Don&apos;t show again
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Floating Pill Button */
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl hover:shadow-2xl hover:scale-105 transition-all border border-slate-700/50 dark:border-slate-200 cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Bell className="w-4 h-4 text-[#00D09C]" />
            <span className="text-xs font-bold tracking-tight">Free IPO &amp; GMP Alerts</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#00D09C]/20 text-[#00D09C] text-[10px] font-bold">
              FREE
            </span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs"
            title="Dismiss widget"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

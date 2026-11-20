import React, { useState } from 'react';
import { Bell, CheckCircle2, ShieldCheck, Sparkles, Send, Smartphone, Mail } from 'lucide-react';
import { api } from '../../services/api';

interface FreeAlertsLeadMagnetProps {
  source?: string;
  variant?: 'banner' | 'card' | 'compact';
  title?: string;
  description?: string;
}

export function FreeAlertsLeadMagnet({
  source = 'inline_lead_magnet',
  variant = 'card',
  title = 'Never Miss an IPO Listing Gain or GMP Surge',
  description = 'Join 45,000+ Indian retail investors getting instant WhatsApp & Email alerts when an IPO opens, GMP doubles, or allotment is declared.',
}: FreeAlertsLeadMagnetProps) {
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim();
    if (!clean) {
      setErrorMsg('Please enter your email or WhatsApp number.');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    const isPhone = /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(clean.replace(/[\s\-]/g, ''));

    if (!isEmail && !isPhone) {
      setErrorMsg('Please enter a valid 10-digit mobile number or email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.subscribeFreeAlerts({
        email: isEmail ? clean.toLowerCase() : undefined,
        phone: isPhone ? clean : undefined,
        source,
      });

      if (res.success || res.ok) {
        setSuccessMsg(res.message || '🎉 Subscription confirmed! You are set for live IPO alerts.');
        setInputVal('');
      } else {
        setErrorMsg(res.message || 'Unable to subscribe. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error. Please try again in a few moments.');
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center my-6 shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white mb-3 shadow-md shadow-emerald-500/30">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h4 className="text-lg font-bold text-[#14263F] dark:text-white mb-1">
          Alert Subscription Active!
        </h4>
        <p className="text-sm text-emerald-800 dark:text-emerald-300 max-w-md mx-auto mb-3">
          {successMsg}
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Zero Spam Guarantee · Unsubscribe anytime with 1 click
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="WhatsApp No or Email for GMP alerts"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D09C]"
          />
          <Bell className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#00D09C] hover:bg-[#00b588] text-white text-xs font-bold rounded-xl whitespace-nowrap transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? 'Subscribing...' : 'Get Free Alerts'}
        </button>
      </form>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 dark:from-[#0E1F2A] dark:via-[#112435] dark:to-[#0A1622] p-6 sm:p-8 my-6 shadow-sm">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span>100% Free · Real-Time Market Intelligence</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-[#14263F] dark:text-white tracking-tight leading-snug">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[#475569] dark:text-slate-300 leading-relaxed max-w-2xl">
          {description}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-3 flex items-center gap-1 text-slate-400">
              <Smartphone className="w-4 h-4 hidden sm:inline" />
              <Mail className="w-4 h-4 inline sm:hidden" />
            </div>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Enter WhatsApp Number or Email (e.g. 9876543210)"
              className="w-full pl-9 sm:pl-10 pr-4 py-3 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1522] text-[#14263F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D09C] transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00D09C] hover:bg-[#00b588] text-white text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? (
              <span>Subscribing...</span>
            ) : (
              <>
                <span>Get Free Alerts</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {errorMsg}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-5 text-[11px] font-medium text-[#64748B] dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            No password needed
          </span>
          <span className="flex items-center gap-1">
            <Bell className="w-3.5 h-3.5 text-indigo-500" />
            Mainboard &amp; SME alerts
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            GMP movements &gt;10%
          </span>
        </div>
      </div>
    </div>
  );
}

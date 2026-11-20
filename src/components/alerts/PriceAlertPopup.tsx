import React from 'react';
import { Link } from 'react-router-dom';
import { BellRing, ExternalLink, X, TrendingUp, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/calculations';
import type { TriggeredAlertEvent } from '../../hooks/usePriceAlertWatcher';

interface PriceAlertPopupProps {
  queue: TriggeredAlertEvent[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

export function PriceAlertPopup({ queue, onDismiss, onDismissAll }: PriceAlertPopupProps) {
  if (queue.length === 0) return null;

  // Show the latest alert at the top of the stack
  const current = queue[queue.length - 1];

  return (
    <div
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[9999] max-w-sm w-[calc(100vw-2rem)] sm:w-96 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-white dark:bg-[#111C2E] border-2 border-emerald-500/80 dark:border-emerald-500 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Pulsing Alert Banner Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-wide">
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>Price Alert Triggered!</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 1 && (
              <span className="text-[11px] font-semibold bg-emerald-800/80 px-2 py-0.5 rounded-full border border-emerald-400/40">
                +{queue.length - 1} more
              </span>
            )}
            <button
              type="button"
              onClick={() => onDismiss(current.id)}
              className="p-1 hover:bg-emerald-700/60 rounded-full transition-colors cursor-pointer text-white/90 hover:text-white"
              aria-label="Close alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#152338] dark:text-white tracking-tight">
                  {current.symbol}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded uppercase">
                  NSE / BSE
                </span>
              </div>
              <div className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-1 mt-0.5">
                {current.companyName}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {formatINR(current.currentPrice)}
              </div>
              <div className="text-[10px] text-[#94A3B8] font-data">
                LTP Trigger
              </div>
            </div>
          </div>

          {/* Condition Box */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
              {current.reason}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-1 flex items-center gap-2">
            <Link
              to={`/stock/${current.symbol}`}
              onClick={() => onDismiss(current.id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#14263F] hover:bg-[#1E3554] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-sm transition-all"
            >
              <span>View Live Chart</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => onDismiss(current.id)}
              className="px-3 py-2 text-xs font-semibold text-[#64748B] hover:text-[#152338] dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Dismiss
            </button>

            {queue.length > 1 && (
              <button
                type="button"
                onClick={onDismissAll}
                className="px-2.5 py-2 text-[11px] font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

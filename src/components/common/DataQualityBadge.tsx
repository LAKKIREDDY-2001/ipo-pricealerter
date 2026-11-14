import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import type { DataQualityStatus } from '../../types/financial';

export function DataQualityBadge({
  status,
  compact = false,
}: {
  status: DataQualityStatus;
  compact?: boolean;
}) {
  const config: Record<
    DataQualityStatus,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    VERIFIED: {
      label: 'Verified',
      cls: 'text-[#059669] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900',
      icon: <ShieldCheck className="w-3 h-3 shrink-0" />,
    },
    DELAYED: {
      label: 'Delayed',
      cls: 'text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
      icon: <Clock className="w-3 h-3 shrink-0" />,
    },
    STALE: {
      label: 'Stale',
      cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
      icon: <AlertTriangle className="w-3 h-3 shrink-0" />,
    },
    ESTIMATED: {
      label: 'Indicative',
      cls: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      icon: <HelpCircle className="w-3 h-3 shrink-0" />,
    },
    UNAVAILABLE: {
      label: 'Unavailable',
      cls: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
      icon: <Lock className="w-3 h-3 shrink-0" />,
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
      icon: <Clock className="w-3 h-3 shrink-0" />,
    },
  };

  const item = config[status] || config.UNAVAILABLE;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium whitespace-nowrap shrink-0 ${
        compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      } ${item.cls}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
}

export function IPOStatusBadge({
  status,
}: {
  status: 'Open' | 'Upcoming' | 'Closed' | 'Listed';
}) {
  const map: Record<
    'Open' | 'Upcoming' | 'Closed' | 'Listed',
    { cls: string; icon: React.ReactNode }
  > = {
    Open: {
      cls: 'text-[#059669] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
      icon: <CheckCircle2 className="w-3 h-3 shrink-0" />,
    },
    Upcoming: {
      cls: 'text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
      icon: <Clock className="w-3 h-3 shrink-0" />,
    },
    Closed: {
      cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
      icon: <Lock className="w-3 h-3 shrink-0" />,
    },
    Listed: {
      cls: 'text-[#152338] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      icon: <ShieldCheck className="w-3 h-3 shrink-0" />,
    },
  };

  const item = map[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border whitespace-nowrap shrink-0 ${item.cls}`}
    >
      {item.icon}
      <span>{status}</span>
    </span>
  );
}

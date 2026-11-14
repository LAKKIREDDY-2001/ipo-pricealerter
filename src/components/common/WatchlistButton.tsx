import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface WatchlistButtonProps {
  itemType: 'ipo' | 'stock';
  itemKey: string;
  label: string;
  compact?: boolean;
}

export function WatchlistButton({
  itemType,
  itemKey,
  label,
  compact = false,
}: WatchlistButtonProps) {
  const { user, isInWatchlist, toggleWatchlist } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const saved = isInWatchlist(itemType, itemKey);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      await toggleWatchlist(itemType, itemKey, label);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={saved ? `Remove ${label} from watchlist` : `Add ${label} to watchlist`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
        compact ? 'px-2 py-1.5 min-h-[34px]' : 'px-3 py-2 min-h-[38px]'
      } ${
        saved
          ? 'border-[#059669] bg-emerald-50 text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
          : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] text-[#64748B] dark:text-slate-300 hover:border-[#14263F] hover:text-[#152338] dark:hover:text-white'
      }`}
    >
      <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
      {!compact && <span>{saved ? 'Saved' : 'Watchlist'}</span>}
    </button>
  );
}

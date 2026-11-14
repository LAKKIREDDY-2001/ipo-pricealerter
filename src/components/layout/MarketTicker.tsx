import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import type { MarketIndexInstrument } from '../../types/financial';
import { formatNumberIN, formatTimestampIN } from '../../utils/calculations';
import { useLiveMarketStream } from '../../hooks/useLiveMarketStream';

export function MarketTicker() {
  const [indices, setIndices] = useState<MarketIndexInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadIndices = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const res = await api.getIndices(force);
      if (Array.isArray(res?.indices)) {
        setIndices(res.indices);
      }
    } catch {
      // Keep existing if refresh fails
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadIndices(false);
    const interval = setInterval(() => {
      loadIndices(true);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useLiveMarketStream({
    onIndices: () => {
      void loadIndices(false);
    },
  });

  if (loading && indices.length === 0) {
    return (
      <div className="bg-[#14263F] text-white border-b border-[#1E3554]">
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 w-36 rounded bg-[#1E3554]/80 animate-pulse shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#14263F] text-white border-b border-[#1E3554]"
      aria-label="Indian and Global Market Ticker"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {indices.map((item) => {
            const isUp = (item.change ?? 0) >= 0;
            const unavailable = item.value === null;
            return (
              <div
                key={item.id}
                title={`${item.name} · Prev Close: ${
                  item.previousClose !== null ? formatNumberIN(item.previousClose) : 'Unavailable'
                } · Provider: ${item.provenance.source} · Updated: ${formatTimestampIN(
                  item.provenance.retrievedAt
                )}`}
                className="shrink-0 rounded-md bg-[#1E3554]/75 border border-white/10 px-3 py-1.5 flex items-center gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-300 whitespace-nowrap">
                    <span>{item.symbol}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      · {item.provenance.qualityStatus === 'UNAVAILABLE' ? 'Unavailable' : 'Delayed'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-data text-xs font-semibold text-white">
                      {unavailable
                        ? 'Unavailable'
                        : item.provenance.currency === 'INR'
                          ? `₹${formatNumberIN(item.value)}`
                          : item.provenance.currency === 'USD'
                            ? `$${formatNumberIN(item.value)}`
                            : formatNumberIN(item.value)}
                    </span>
                    {!unavailable && item.change !== null && item.changePercent !== null && (
                      <span
                        className={`font-data text-[11px] font-medium ${
                          isUp ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {item.change.toFixed(2)} ({isUp ? '+' : ''}
                        {item.changePercent.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => loadIndices(true)}
          disabled={refreshing}
          title="Refresh market instruments"
          className="shrink-0 inline-flex items-center gap-1.5 rounded border border-white/15 bg-[#1E3554] px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-[#27446B] transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { StockInstrument } from '../../types/financial';

export function SectorHeatmap({ stocks }: { stocks: StockInstrument[] }) {
  const sectors = useMemo(() => {
    const map = new Map<
      string,
      { count: number; sumPct: number; validCount: number; topLeader: string }
    >();
    for (const s of stocks) {
      const entry = map.get(s.sector) ?? {
        count: 0,
        sumPct: 0,
        validCount: 0,
        topLeader: s.symbol,
      };
      entry.count += 1;
      if (s.currentPrice !== null && s.previousClose !== null && s.previousClose > 0) {
        const pct = ((s.currentPrice - s.previousClose) / s.previousClose) * 100;
        entry.sumPct += pct;
        entry.validCount += 1;
      }
      map.set(s.sector, entry);
    }
    return Array.from(map.entries())
      .map(([sector, stats]) => ({
        sector,
        count: stats.count,
        avgPct: stats.validCount > 0 ? stats.sumPct / stats.validCount : 0,
        topLeader: stats.topLeader,
      }))
      .sort((a, b) => b.avgPct - a.avgPct);
  }, [stocks]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {sectors.map((sec) => {
        const isPos = sec.avgPct >= 0;
        return (
          <Link
            key={sec.sector}
            to={`/live-prices?sector=${encodeURIComponent(sec.sector)}`}
            className={`rounded-lg border p-3.5 transition-colors ${
              isPos
                ? 'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/60 dark:bg-emerald-950/30 hover:border-emerald-400'
                : 'border-red-200 dark:border-red-900/70 bg-red-50/60 dark:bg-red-950/30 hover:border-red-400'
            }`}
          >
            <div className="text-xs font-semibold text-[#152338] dark:text-slate-100 truncate">
              {sec.sector}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span
                className={`font-data text-sm font-bold ${
                  isPos
                    ? 'text-[#16A34A] dark:text-emerald-400'
                    : 'text-[#DC2626] dark:text-red-400'
                }`}
              >
                {isPos ? '+' : ''}
                {sec.avgPct.toFixed(2)}%
              </span>
              <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-data">
                {sec.count} stocks
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { IPOGMPHistoryPoint } from '../../types/financial';
import { formatDateIN } from '../../utils/calculations';

interface GMPChartProps {
  history: IPOGMPHistoryPoint[];
  companyName: string;
}

export function GMPChart({ history, companyName }: GMPChartProps) {
  const [range, setRange] = useState<'1D' | '7D' | '1M' | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    if (!history || history.length === 0) return [];
    if (range === '1D') return history.slice(-2);
    if (range === '7D') return history.slice(-7);
    if (range === '1M') return history.slice(-30);
    return history;
  }, [history, range]);

  if (!history || history.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 text-center">
        <p className="text-sm font-semibold text-[#152338] dark:text-slate-100">
          Historical GMP Data Unavailable
        </p>
        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
          No verified unofficial GMP observations have been recorded for {companyName} yet.
        </p>
      </div>
    );
  }

  const values = filtered.map((d) => d.gmp);
  const high = Math.max(...values);
  const low = Math.min(...values);
  const latest = values[values.length - 1];
  const strokeColor = latest >= 0 ? '#059669' : '#DC2626';

  return (
    <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#152338] dark:text-slate-100">
            {companyName} — Recorded GMP Trend (Indicative)
          </h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 font-data mt-0.5">
            Range High: ₹{high} · Range Low: ₹{low} · Points: {filtered.length}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg bg-[#F6F8FB] dark:bg-slate-900 p-1 border border-[#E2E8F0] dark:border-slate-800">
          {(['1D', '7D', '1M', 'ALL'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                range === r
                  ? 'bg-white dark:bg-[#1E3554] text-[#14263F] dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#152338] dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gmpFillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.22} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.45} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDateIN(String(d))}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₹${v}`}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              formatter={(value: unknown) => [`₹${Number(value)}`, 'Indicative GMP']}
              labelFormatter={(label) => formatDateIN(String(label))}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="gmp"
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#gmpFillGrad)"
              dot={{ r: 3, fill: strokeColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

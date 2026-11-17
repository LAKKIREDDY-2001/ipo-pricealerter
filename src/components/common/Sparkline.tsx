import React from 'react';

interface SparklineProps {
  data: number[];
  positive?: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  positive = true,
  width = 84,
  height = 28,
}: SparklineProps) {
  const safeData = Array.isArray(data) ? data.filter((value) => typeof value === 'number' && Number.isFinite(value)) : [];
  if (safeData.length < 2) {
    return (
      <span className="text-[11px] text-[#94A3B8] dark:text-slate-500 font-data">
        N/A
      </span>
    );
  }

  const min = Math.min(...safeData);
  const max = Math.max(...safeData);
  const range = max - min || 1;

  const points = safeData
    .map((val, idx) => {
      const x = (idx / (safeData.length - 1)) * (width - 4) + 2;
      const y = height - 3 - ((val - min) / range) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const stroke = positive ? '#16A34A' : '#DC2626';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

import React from 'react';

interface PriceAlerterLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inverted';
  showTagline?: boolean;
}

export function PriceAlerterLogo({
  size = 'md',
  variant = 'default',
  showTagline = false,
}: PriceAlerterLogoProps) {
  const iconDim = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const titleSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const textColor =
    variant === 'inverted'
      ? 'text-white'
      : 'text-[#14263F] dark:text-slate-100';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className={`${iconDim} shrink-0`}
        aria-hidden="true"
      >
        <rect
          width="40"
          height="40"
          rx="9"
          fill={variant === 'inverted' ? '#1E3554' : '#14263F'}
        />
        <path
          d="M8.5 27.5L15.5 20L21.5 23.5L30.5 12.5"
          stroke="#059669"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M25.5 12.5H30.5V17.5"
          stroke="#059669"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="30.5" cy="12.5" r="2.2" fill="#34D399" />
        <path
          d="M8.5 31.5H31.5"
          stroke="#334E72"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={`font-display font-bold tracking-tight ${titleSize} ${textColor}`}>
          Price<span className="text-[#059669]">Alerter</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-[11px] font-medium text-[#64748B] dark:text-slate-400">
            Smarter IPO &amp; Market Intelligence
          </span>
        )}
      </span>
    </span>
  );
}

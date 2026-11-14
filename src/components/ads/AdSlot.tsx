import React, { useEffect, useRef } from 'react';
import { useCookieConsent } from '../../context/CookieConsentContext';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'auto';
  className?: string;
}

/**
 * Policy-safe Google AdSense display ad unit:
 * - Only mounts manual <ins class="adsbygoogle"> when a valid numeric Ad Unit Slot ID
 *   is configured (e.g., via VITE_ADSENSE_SLOT_*), letting AdSense Auto Ads operate
 *   without invalid slot 400 errors until manual ad unit IDs are supplied.
 * - Reserves fixed minimum height to prevent Cumulative Layout Shift (CLS).
 */
export function AdSlot({ slotId, format = 'horizontal', className = '' }: AdSlotProps) {
  const { adsenseClientId, hasConsented } = useCookieConsent();
  const pushedRef = useRef(false);

  const cleanSlotId = slotId?.trim() || '';
  const isNumericAdUnit = /^\d{8,14}$/.test(cleanSlotId);

  useEffect(() => {
    if (!adsenseClientId || !isNumericAdUnit || !hasConsented || pushedRef.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // ignore if adsbygoogle SDK is blocked by client adblocker
    }
  }, [adsenseClientId, isNumericAdUnit, hasConsented]);

  if (!adsenseClientId || !isNumericAdUnit) {
    return null;
  }

  const minHeightClass = format === 'rectangle' ? 'min-h-[250px]' : 'min-h-[90px]';

  return (
    <aside
      aria-label="Advertisement"
      className={`rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white/80 dark:bg-[#111C2E]/80 p-3 my-4 ${className}`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8] text-center mb-1.5">
        Advertisement
      </div>
      <div className={`w-full flex items-center justify-center overflow-hidden ${minHeightClass}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={adsenseClientId}
          data-ad-slot={cleanSlotId}
          data-ad-format={format === 'horizontal' ? 'horizontal' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}

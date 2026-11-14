import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { useCookieConsent } from '../../context/CookieConsentContext';

export function CookieConsentBanner() {
  const {
    consent,
    bannerOpen,
    preferencesModalOpen,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openPreferencesModal,
    closePreferencesModal,
  } = useCookieConsent();

  const [prefEnabled, setPrefEnabled] = useState(consent?.preferences ?? true);
  const [adEnabled, setAdEnabled] = useState(consent?.advertising ?? false);

  useEffect(() => {
    if (preferencesModalOpen) {
      setPrefEnabled(consent?.preferences ?? true);
      setAdEnabled(consent?.advertising ?? false);
    }
  }, [preferencesModalOpen, consent]);

  return (
    <>
      {bannerOpen && (
        <aside
          role="dialog"
          aria-label="Cookie and Privacy Consent"
          className="fixed bottom-16 md:bottom-4 inset-x-3 sm:inset-x-6 z-50 max-w-[1100px] mx-auto rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white/98 dark:bg-[#111C2E]/98 backdrop-blur-md shadow-xl p-4 sm:p-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#14263F] dark:text-white">
                <Cookie className="w-4 h-4 text-[#059669]" />
                <span>Your Privacy &amp; Cookie Choices</span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
                PriceAlerter uses strictly necessary cookies to secure your authenticated session,
                remember workspace settings, and (when enabled) allow Google AdSense and partner
                vendors to measure or personalize ads. See our{' '}
                <Link to="/privacy" className="text-[#2563EB] dark:text-blue-400 underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/cookies" className="text-[#2563EB] dark:text-blue-400 underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openPreferencesModal}
                className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F6F8FB] dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#152338] dark:text-slate-200 hover:border-[#2563EB] cursor-pointer"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="rounded-lg border border-[#CBD5E1] dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-[#152338] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {preferencesModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Manage Cookie Preferences"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#059669]" />
                <h2 className="font-display text-base font-bold text-[#14263F] dark:text-white">
                  Privacy &amp; Cookie Preference Center
                </h2>
              </div>
              <button
                type="button"
                onClick={closePreferencesModal}
                aria-label="Close privacy preferences"
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-[#64748B] dark:text-slate-300 leading-relaxed">
                Manage how cookies and similar storage are used on PriceAlerter. You can update
                your consent at any time via the Cookie Settings link in the footer.
              </p>

              {/* Essential */}
              <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 p-3.5 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#152338] dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                    Strictly Necessary &amp; Security Cookies
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                    HTTP-only signed session tokens (`pa_session`) and your privacy preference
                    record (`pa_cookie_consent_v1`). Required for authentication, watchlists, and
                    price alerts.
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-[#059669] dark:text-emerald-400 text-[11px]">
                  Always Active
                </span>
              </div>

              {/* Preferences */}
              <label className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 p-3.5 flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#152338] dark:text-white">
                    Workspace &amp; Interface Preferences
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                    Remembers theme mode (Light/Dark), chart timeframe defaults, and screener table
                    layout preferences across visits.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefEnabled}
                  onChange={(e) => setPrefEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#059669] cursor-pointer"
                />
              </label>

              {/* Advertising */}
              <label className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 p-3.5 flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#152338] dark:text-white">
                    Advertising &amp; Measurement (Google AdSense)
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                    Permits Google and certified ad partners to store cookies for ad delivery,
                    frequency capping, fraud prevention, and personalized ads. If declined, only
                    non-personalized contextual ads may run when ads are active.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adEnabled}
                  onChange={(e) => setAdEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#2563EB] cursor-pointer"
                />
              </label>
            </div>

            <div className="px-5 py-3.5 border-t border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={rejectNonEssential}
                className="rounded-lg border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-[#152338] dark:text-slate-200 cursor-pointer"
              >
                Essential Only
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => savePreferences({ preferences: prefEnabled, advertising: adEnabled })}
                  className="rounded-lg border border-[#14263F] dark:border-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-[#14263F] dark:text-blue-400 cursor-pointer"
                >
                  Save Selection
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

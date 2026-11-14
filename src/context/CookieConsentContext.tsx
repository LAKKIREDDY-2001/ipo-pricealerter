import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

export interface CookiePreferences {
  essential: true;
  preferences: boolean;
  advertising: boolean;
  updatedAt: string;
  version: number;
}

interface CookieConsentContextValue {
  consent: CookiePreferences | null;
  hasConsented: boolean;
  bannerOpen: boolean;
  preferencesModalOpen: boolean;
  adsenseClientId: string | null;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: { preferences: boolean; advertising: boolean }) => void;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
}

const STORAGE_KEY = 'pa_cookie_consent_v1';
const CONSENT_VERSION = 1;

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}

function applyGoogleConsentMode(advertisingGranted: boolean, preferencesGranted: boolean): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
  const adState = advertisingGranted ? 'granted' : 'denied';
  const prefState = preferencesGranted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    ad_storage: adState,
    ad_user_data: adState,
    ad_personalization: adState,
    analytics_storage: adState,
    functionality_storage: prefState,
    personalization_storage: prefState,
    security_storage: 'granted',
  });
}

function loadStoredConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
    if (
      typeof parsed.advertising === 'boolean' &&
      typeof parsed.preferences === 'boolean' &&
      parsed.version === CONSENT_VERSION
    ) {
      return {
        essential: true,
        preferences: parsed.preferences,
        advertising: parsed.advertising,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        version: CONSENT_VERSION,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookiePreferences | null>(() => loadStoredConsent());
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [adsenseClientId, setAdsenseClientId] = useState<string | null>(() => {
    const envId = (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined)?.trim() || '';
    if (/^ca-pub-\d{10,20}$/.test(envId)) return envId;
    if (typeof document !== 'undefined') {
      const metaContent = document
        .querySelector('meta[name="google-adsense-account"]')
        ?.getAttribute('content')
        ?.trim();
      if (metaContent && /^ca-pub-\d{10,20}$/.test(metaContent)) return metaContent;
    }
    return null;
  });

  // Set default denied consent signal prior to any advertising script load (Google Consent Mode v2)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function (...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    }
    window.gtag('consent', 'default', {
      ad_storage: consent?.advertising ? 'granted' : 'denied',
      ad_user_data: consent?.advertising ? 'granted' : 'denied',
      ad_personalization: consent?.advertising ? 'granted' : 'denied',
      analytics_storage: consent?.advertising ? 'granted' : 'denied',
      functionality_storage: consent?.preferences ? 'granted' : 'denied',
      security_storage: 'granted',
      wait_for_update: 500,
    });
  }, []);

  // Sync optional runtime AdSense publisher ID from server public-config
  useEffect(() => {
    if (adsenseClientId) return;
    api
      .getPublicConfig()
      .then((cfg) => {
        if (cfg.adsenseClientId && /^ca-pub-\d{10,20}$/.test(cfg.adsenseClientId)) {
          setAdsenseClientId(cfg.adsenseClientId);
        }
      })
      .catch(() => {});
  }, [adsenseClientId]);

  // Inject AdSense meta + script strictly ONLY when publisher ID is configured AND user recorded consent
  useEffect(() => {
    if (!adsenseClientId || !consent) return;

    let meta = document.querySelector('meta[name="google-adsense-account"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'google-adsense-account';
      document.head.appendChild(meta);
    }
    meta.content = adsenseClientId;

    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = consent.advertising ? 0 : 1;

    const scriptId = 'pa-adsense-sdk';
    const existingScript = document.querySelector('script[src*="pagead/js/adsbygoogle.js"]');
    if (!document.getElementById(scriptId) && !existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        adsenseClientId
      )}`;
      document.head.appendChild(script);
    }
  }, [adsenseClientId, consent]);

  const persistConsent = useCallback((preferences: boolean, advertising: boolean) => {
    const next: CookiePreferences = {
      essential: true,
      preferences,
      advertising,
      updatedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failure in private mode
    }
    setConsent(next);
    setPreferencesModalOpen(false);
    applyGoogleConsentMode(advertising, preferences);
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      window.adsbygoogle.requestNonPersonalizedAds = advertising ? 0 : 1;
    }
  }, []);

  const acceptAll = useCallback(() => {
    persistConsent(true, true);
  }, [persistConsent]);

  const rejectNonEssential = useCallback(() => {
    persistConsent(false, false);
  }, [persistConsent]);

  const savePreferences = useCallback(
    (prefs: { preferences: boolean; advertising: boolean }) => {
      persistConsent(prefs.preferences, prefs.advertising);
    },
    [persistConsent]
  );

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasConsented: consent !== null,
        bannerOpen: consent === null && !preferencesModalOpen,
        preferencesModalOpen,
        adsenseClientId,
        acceptAll,
        rejectNonEssential,
        savePreferences,
        openPreferencesModal: () => setPreferencesModalOpen(true),
        closePreferencesModal: () => setPreferencesModalOpen(false),
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

const CHUNK_RELOAD_KEY = 'pa_chunk_reload_ts';

function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('error loading dynamically imported module')
  );
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const msg =
      error instanceof Error ? error.message : 'An unexpected rendering issue occurred.';
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown): void {
    if (isChunkLoadError(error) && typeof window !== 'undefined') {
      try {
        const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
        if (Date.now() - lastReload > 15_000) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
          window.location.reload();
        }
      } catch {
        // ignore sessionStorage restriction
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B1220] text-[#152338] dark:text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 sm:p-8 shadow-sm space-y-4 text-center">
            <div className="mx-auto w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#14263F] dark:text-white">
              Display Interrupted — Reload Required
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
              A temporary network or cache mismatch prevented this view from loading cleanly.
              Reloading fetches the latest PriceAlerter market bundle.
            </p>
            {this.state.errorMessage && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-[#E2E8F0] dark:border-slate-800 px-3 py-2 text-[11px] font-data text-[#64748B] dark:text-slate-400 break-words">
                {this.state.errorMessage}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#14263F] dark:bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <a
                href="/"
                className="inline-flex items-center rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-[#152338] dark:text-slate-200 hover:border-[#2563EB]"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

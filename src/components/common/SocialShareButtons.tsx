import React, { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

interface SocialShareButtonsProps {
  title: string;
  summary: string;
  url?: string;
  variant?: 'compact' | 'full' | 'floating';
}

export function SocialShareButtons({
  title,
  summary,
  url,
  variant = 'compact',
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url || (typeof window !== 'undefined' ? window.location.href : 'https://pricealerter.in');
  const shareText = `${summary}\n\n👉 Track live on PriceAlerter: ${shareUrl}`;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${summary}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: summary,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      void handleCopy();
    }
  };

  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(summary)}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(summary)}&url=${encodeURIComponent(shareUrl)}`;

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
          Share:
        </span>

        {/* WhatsApp Button */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Share to WhatsApp Groups & Friends"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.54 1.761.821 2.796.821h.005c3.18 0 5.766-2.586 5.767-5.766.001-3.181-2.585-5.768-5.767-5.768zm3.398 8.163c-.143.402-.83.743-1.144.789-.313.045-.719.066-2.285-.584-1.873-.78-3.08-2.695-3.174-.819-.093-.125-.745-.992-.745-1.892 0-.9.47-1.343.637-1.528.167-.186.365-.232.486-.232.122 0 .243.002.348.007.112.006.262-.042.409.312.152.365.518 1.264.563 1.356.045.093.076.202.015.324-.061.122-.092.198-.182.304-.091.106-.192.237-.274.318-.091.091-.186.19-.08.372.106.182.471.777 1.01 1.258.694.619 1.28.811 1.462.902.182.091.289.076.395-.045.106-.122.456-.532.578-.714.122-.182.243-.152.409-.091.167.061 1.059.499 1.241.59.182.091.304.137.348.213.045.076.045.441-.098.843z" />
          </svg>
          <span>WhatsApp</span>
        </a>

        {/* Telegram Button */}
        <a
          href={telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
          title="Share to Telegram Channel"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
          </svg>
          <span className="hidden sm:inline">Telegram</span>
        </a>

        {/* Twitter / X */}
        <a
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
          title="Share on X (Twitter)"
        >
          <span className="font-bold">𝕏</span>
        </a>

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-[#152338] dark:text-slate-200 transition-colors cursor-pointer"
          title="Copy Link to Clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        {/* Native Mobile Share if supported */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer sm:hidden"
            title="More Share Options"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Full Callout Box Variant
  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Share Market Intelligence
            </span>
          </div>
          <h4 className="text-sm font-bold text-[#14263F] dark:text-white mt-1">
            Share this live analysis with your investor network &amp; trading groups
          </h4>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Help friends, family, and colleagues track live GMP, subscription multiples, and institutional research reports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.54 1.761.821 2.796.821h.005c3.18 0 5.766-2.586 5.767-5.766.001-3.181-2.585-5.768-5.767-5.768zm3.398 8.163c-.143.402-.83.743-1.144.789-.313.045-.719.066-2.285-.584-1.873-.78-3.08-2.695-3.174-.819-.093-.125-.745-.992-.745-1.892 0-.9.47-1.343.637-1.528.167-.186.365-.232.486-.232.122 0 .243.002.348.007.112.006.262-.042.409.312.152.365.518 1.264.563 1.356.045.093.076.202.015.324-.061.122-.092.198-.182.304-.091.106-.192.237-.274.318-.091.091-.186.19-.08.372.106.182.471.777 1.01 1.258.694.619 1.28.811 1.462.902.182.091.289.076.395-.045.106-.122.456-.532.578-.714.122-.182.243-.152.409-.091.167.061 1.059.499 1.241.59.182.091.304.137.348.213.045.076.045.441-.098.843z" />
            </svg>
            <span>Share on WhatsApp</span>
          </a>

          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>Telegram</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-[#152338] dark:text-slate-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

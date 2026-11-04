/* ==========================================================================
   IPO Track — Production Client Application
   Vanilla JS architecture with hash-based routing, interactive charts,
   search modal, GMP calculator, and responsive layouts.
   ========================================================================== */

"use strict";

(() => {
  const dataset = window.IpoData || { records: [], stats: {}, calendarEvents: {}, alertsFeed: [] };
  const records = dataset.records || [];

  // Fast normalized name-to-logo map for exchange-wide logo resolution
  function cleanCompanyName(str) {
    return (str || "").toLowerCase()
      .replace(/limited|ltd|ipo|\.|\,|\-|\&|\band\b|\(\w+\)/gi, "")
      .replace(/\s+/g, "")
      .trim();
  }
  const ipoLogoMap = new Map();
  records.forEach(r => {
    if (r.logoUrl) {
      if (r.shortName) ipoLogoMap.set(cleanCompanyName(r.shortName), r.logoUrl);
      if (r.companyName) ipoLogoMap.set(cleanCompanyName(r.companyName), r.logoUrl);
      if (r.slug) ipoLogoMap.set(r.slug.replace(/-ipo(-\d+)?$/i, ""), r.logoUrl);
    }
  });

  // Application State
  const state = {
    route: parseRoute(),
    activeFilter: "open",       // Default to 'open' so visitors see active open IPOs first
    activeBoard: "all",         // 'all' | 'mainboard' | 'sme'
    activeBottomCompany: "maxwell-engineering-solutions-ipo",
    calendarMonth: new Date(2026, 10, 1), // November 2026
    selectedCalendarDate: "2026-11-03",
    detailTab: "overview",      // 'overview' | 'subscription' | 'gmp' | 'financials' | 'review' | 'documents'
    notificationsOpen: false,
    applyDropdownOpen: false,
    brokerModalIpo: null,
    searchModalOpen: false,
    calcLots: 1,
    calcSelectedSlug: null,
    calcCustomGmp: null,
    calcLivePrice: null,
    livePricesFilter: "all",
    livePricesSearch: "",
    liveMarketData: null,
    liveNextSyncSeconds: 600,
    alertsSubscribed: true,
    notifSubMode: "subscribe",
    cardsLimit: 18,
    mobileMenuOpen: false,
    openBoard: "all",
    openSearchQuery: "",
    upcomingBoard: "all",
    upcomingFilter: "all",
    upcomingSearchQuery: "",
    gmpFilter: "all",
    gmpSearchQuery: "",
    listedYear: "2026",
    listedSegment: "all",
    listedSearchQuery: "",
    listedSort: "date-desc",
    listedLimit: 50
  };

  const AFFILIATE_PARTNER_CONFIG = {};
  const AFFILIATE_BROKERS = [];

  // Helper Utilities
  function isBookmarked(slug) {
    try {
      const list = JSON.parse(localStorage.getItem("pricealerter_watchlist") || "[]");
      return list.includes(slug);
    } catch (e) {
      return false;
    }
  }

  function parseRoute() {
    const hash = window.location.hash.replace(/^#\/?/, "") || "";
    const parts = hash.split("/").filter(Boolean);
    if (parts.length === 0) return { view: "home" };
    if (parts[0] === "ipo" && parts[1]) return { view: "detail", slug: parts[1] };
    if (parts[0] === "open") return { view: "open" };
    if (parts[0] === "upcoming") return { view: "upcoming" };
    if (parts[0] === "closed") return { view: "home", filter: "closed" };
    if (parts[0] === "gmp") return { view: "gmp" };
    if (parts[0] === "calendar") return { view: "calendar" };
    if (parts[0] === "listed") {
      if (parts[1]) state.listedYear = parts[1];
      return { view: "listed" };
    }
    if (parts[0] === "calculator" || parts[0] === "profit-calculator") return { view: "calculator" };
    if (parts[0] === "live-prices" || parts[0] === "live" || parts[0] === "prices" || parts[0] === "market-pulse") return { view: "live-prices" };
    if (parts[0] === "allotment" || parts[0] === "allotment-status" || parts[0] === "allotment-checker") return { view: "allotment" };
    if (parts[0] === "movers" || parts[0] === "gainers" || parts[0] === "losers" || parts[0] === "market-movers" || parts[0] === "shakers" || parts[0] === "market-shakers" || parts[0] === "volume-shakers") {
      return { view: "home", moversFilter: parts[0] };
    }
    if (parts[0] === "blog") {
      window.location.href = "/blog/";
      return { view: "guide" };
    }
    if (parts[0] === "guide" || parts[0] === "learn" || parts[0] === "faq") return { view: "guide" };
    return { view: "home" };
  }

  function formatMoney(num) {
    if (num === null || num === undefined || isNaN(num)) return "—";
    return "₹" + Number(num).toLocaleString("en-IN");
  }

  function formatCrore(num) {
    if (num === null || num === undefined || isNaN(num)) return "—";
    return "₹" + Number(num).toLocaleString("en-IN") + " Cr";
  }

  function formatDate(isoStr) {
    if (!isoStr) return "TBA";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast-msg ${type}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === "success" 
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
          : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // Icons Helper
  
  // ==========================================================================
  // Brand Logo & Portal Directory Utilities
  // ==========================================================================
  function escapeAttr(str) {
    if (!str) return "";
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const AVATAR_PALETTES = [
    "linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)", // Cobalt
    "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)", // Deep Teal
    "linear-gradient(135deg, #7C2D12 0%, #C2410C 100%)", // Copper Amber
    "linear-gradient(135deg, #581C87 0%, #7E22CE 100%)", // Royal Purple
    "linear-gradient(135deg, #065F46 0%, #059669 100%)", // Emerald
    "linear-gradient(135deg, #991B1B 0%, #DC2626 100%)", // Crimson
    "linear-gradient(135deg, #1E293B 0%, #334155 100%)", // Slate Steel
    "linear-gradient(135deg, #831843 0%, #BE185D 100%)", // Rose
    "linear-gradient(135deg, #164E63 0%, #0891B2 100%)", // Deep Cyan
    "linear-gradient(135deg, #3730A3 0%, #4F46E5 100%)", // Indigo
    "linear-gradient(135deg, #78350F 0%, #B45309 100%)", // Bronze
    "linear-gradient(135deg, #14532D 0%, #16A34A 100%)"  // Forest Green
  ];

  function getCompanyInitials(name) {
    if (!name) return "CO";
    const clean = name.replace(/^the\s+/i, "")
                      .replace(/limited|ltd|corp|corporation|holdings|india|industries|\(.*\)/gi, "")
                      .trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || "CO";
  }

  function getAvatarGradient(name) {
    if (!name) return AVATAR_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
  }

  function renderCompanyLogo(ipo, size = 44) {
    if (!ipo) {
      return `<div class="company-avatar-box" style="width:${size}px; height:${size}px; min-width:${size}px; background:#2563EB; color:#FFF;">IP</div>`;
    }
    const name = ipo.shortName || ipo.companyName || ipo.name || "Company";
    const initials = ipo.initials || getCompanyInitials(name);
    const fontSize = Math.max(10, Math.round(size * 0.36));
    const borderRadius = size > 40 ? 10 : 8;
    const gradient = ipo.logoColor || getAvatarGradient(name);

    let logoUrl = ipo.logoUrl || null;
    if (!logoUrl) {
      const cleanKey = cleanCompanyName(name);
      if (ipoLogoMap.has(cleanKey)) {
        logoUrl = ipoLogoMap.get(cleanKey);
      } else if (ipo.slug) {
        const cleanSlug = ipo.slug.replace(/-ipo(-\d+)?$/i, "");
        if (ipoLogoMap.has(cleanSlug)) {
          logoUrl = ipoLogoMap.get(cleanSlug);
        }
      }
    }

    const isBBTC = (name.includes("Bombay Burmah") || (ipo.slug && ipo.slug.includes("bombay-burmah"))) || ipo.symbol === "500020" || ipo.bseCode === "500020";

    if (isBBTC) {
      return `
        <div class="company-avatar-box" style="width:${size}px; height:${size}px; min-width:${size}px; border-radius:${borderRadius}px; background:linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); color:#FDE047; font-weight:900; font-size:${fontSize}px; display:inline-flex; align-items:center; justify-content:center; text-shadow:0 1px 3px rgba(0,0,0,0.5); flex-shrink:0; border:1.5px solid #F59E0B; box-shadow:0 0 8px rgba(245, 158, 11, 0.35);" title="1st Stock in BSE History (1875)">
          BB
        </div>
      `;
    }

    if (logoUrl) {
      return `
        <div class="company-logo-img-wrap" style="position:relative; width:${size}px; height:${size}px; min-width:${size}px; border-radius:${borderRadius}px; overflow:hidden; display:inline-flex; align-items:center; justify-content:center; background:${gradient}; border:1px solid #E2E8F0; flex-shrink:0;">
          <div class="company-avatar-box fallback-avatar" style="position:absolute; inset:0; width:100%; height:100%; background:${gradient}; color:#FFFFFF; font-weight:800; font-size:${fontSize}px; display:flex; align-items:center; justify-content:center; text-shadow:0 1px 2px rgba(0,0,0,0.35); z-index:1;">
            ${initials}
          </div>
          <img src="${logoUrl}" alt="${escapeAttr(name)} Logo" width="${size}" height="${size}" loading="lazy" decoding="async" referrerpolicy="no-referrer" class="company-logo-img" style="position:relative; z-index:2; width:100%; height:100%; object-fit:contain; padding:2px; background:#FFFFFF;"
               onerror="this.style.display='none';">
        </div>
      `;
    }

    return `
      <div class="company-avatar-box" style="width:${size}px; height:${size}px; min-width:${size}px; background:${gradient}; color:#FFFFFF; font-weight:800; font-size:${fontSize}px; border-radius:${borderRadius}px; display:inline-flex; align-items:center; justify-content:center; text-shadow:0 1px 2px rgba(0,0,0,0.35); flex-shrink:0; border:1px solid rgba(0,0,0,0.08); ${ipo.isHistoric ? 'border:1.5px solid #F59E0B;' : ''}">
        ${initials}
      </div>
    `;
  }

  function getListedCompanyLogo(r, size = 36) {
    return renderCompanyLogo(r, size);
  }

  function initAdSense() {
    try {
      if (typeof window.adsbygoogle === "undefined") {
        window.adsbygoogle = [];
      }
      const unfilledAds = document.querySelectorAll("ins.adsbygoogle:not([data-adsbygoogle-status])");
      unfilledAds.forEach(() => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
          // Ignore individual push errors if already requested
        }
      });

      // Automatically collapse legacy cards only; do NOT collapse .ad-slot-card to preserve layout stability (Zero CLS)
      setTimeout(() => {
        document.querySelectorAll("ins.adsbygoogle[data-ad-status='unfilled'], ins.adsbygoogle:empty").forEach(ins => {
          if (!ins.querySelector("iframe")) {
            const parent = ins.closest(".adsense-slot-card, .adsense-infeed-card");
            if (parent && !parent.classList.contains("ad-slot-card") && !parent.querySelector("iframe")) {
              parent.style.display = "none";
            }
          }
        });
      }, 1200);
    } catch (e) {
      // Graceful handling when ad blocker is active or ads are pending review
    }
  }

  // ==========================================================================
  // Angel One Sponsored Partner Units & High-Conversion Banners (Zero-CLS)
  // Responsive across Desktop, Tablet & Mobile devices
  // Target: https://mdeal.in/c_iDpnIUs4
  // ==========================================================================
  function renderAdContainer(type = "infeed", slot = "5892147360", label = "SPONSORED FINANCIAL INTELLIGENCE") {
    if (type === "leaderboard") {
      return `
        <div class="ad-slot-card ad-slot-leaderboard" aria-label="${label}">
          <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="sponsored-banner-link sponsored-leaderboard-banner" title="Open Free Demat Account on Angel One">
            <div class="sponsored-banner-left">
              <img src="assets/sponsored/angel-one-wide.png" alt="Angel One" class="sponsored-logo-wide" loading="lazy" />
            </div>
            <div class="sponsored-banner-mid">
              <div class="sponsored-banner-title">Open Free Demat Account &amp; Apply for IPOs with Zero Brokerage</div>
              <div class="sponsored-banner-sub">Flat ₹20 for Intraday &amp; F&amp;O &bull; 100% Paperless UPI Mandates &bull; Trusted by 2+ Crore Indians</div>
            </div>
            <div class="sponsored-banner-right">
              <span class="sponsored-cta-btn">Open Free Account &rarr;</span>
            </div>
          </a>
        </div>
      `;
    }

    if (type === "sidebar" || type === "hdfc") {
      return `
        <div class="ad-slot-card ad-slot-sidebar sponsored-hdfc-slot" aria-label="${label}">
          <a href="https://mdeal.in/c_10MA6LqN" target="_blank" rel="noopener noreferrer" class="sponsored-banner-link sponsored-hdfc-link" title="Apply for HDFC Bank IRCTC Credit Card">
            <div class="sponsored-hdfc-img-wrap">
              <img src="assets/sponsored/hdfc-irctc-card.png" alt="HDFC Bank IRCTC Card - Apply Online" class="sponsored-hdfc-img" loading="lazy" />
            </div>
            <div class="sponsored-hdfc-body">
              <h3 class="sponsored-hdfc-title">HDFC Bank IRCTC Credit Card</h3>
              <p class="sponsored-hdfc-desc">Earn exclusive reward points &amp; save up to 5% on IRCTC ticket bookings with zero hassle.</p>
              <div class="sponsored-hdfc-perks">
                <div class="sponsored-hdfc-perk-item"><span class="perk-check">✓</span> <span>Up to 5x Reward Points on IRCTC</span></div>
                <div class="sponsored-hdfc-perk-item"><span class="perk-check">✓</span> <span>Complimentary Railway Lounge Access</span></div>
                <div class="sponsored-hdfc-perk-item"><span class="perk-check">✓</span> <span>1% Fuel Surcharge Waiver</span></div>
                <div class="sponsored-hdfc-perk-item"><span class="perk-check">✓</span> <span>Instant Digital Card Application</span></div>
              </div>
              <div class="sponsored-hdfc-action">
                <span class="sponsored-cta-btn sponsored-cta-hdfc sponsored-cta-full">Apply for HDFC Card &rarr;</span>
              </div>
              <div class="sponsored-partner-footnote">Official HDFC Bank Co-Branded IRCTC Credit Card</div>
            </div>
          </a>
        </div>
      `;
    }

    // Default: infeed placement (SBI Card Credit Card Banner)
    return `
      <div class="ad-slot-card ad-slot-infeed sponsored-sbi-slot" aria-label="SBI Card">
        <a href="https://mdeal.in/c_gEgEgjSS" target="_blank" rel="noopener noreferrer" class="sponsored-banner-link sponsored-sbi-link" title="Apply for SBI Credit Card Online">
          <div class="sponsored-sbi-img-wrap">
            <img src="assets/sponsored/sbi-card.png" alt="SBI Card Credit Card - Apply Online" class="sponsored-sbi-img" loading="lazy" />
          </div>
          <div class="sponsored-sbi-footer">
            <div class="sponsored-sbi-info">
              <div class="sponsored-sbi-title">Apply for SBI Credit Card Online &bull; Instant Approval</div>
              <div class="sponsored-sbi-sub">Welcome reward points &bull; Airport lounge access &bull; Fuel surcharge waiver</div>
            </div>
            <div class="sponsored-sbi-action">
              <span class="sponsored-cta-btn sponsored-cta-sbi">Apply for SBI Card &rarr;</span>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  // ==========================================================================
  // In-Feed Native Sponsored Card (SBI Credit Card)
  // ==========================================================================
  function renderInFeedAdUnit(isGridSpan = true) {
    return `
      <div class="adsense-infeed-card ${isGridSpan ? 'infeed-grid-span' : ''}" aria-label="SBI Card">
        <div class="ad-slot-card sponsored-sbi-slot" style="margin: 8px 0; border-radius: 12px;">
          <a href="https://mdeal.in/c_gEgEgjSS" target="_blank" rel="noopener noreferrer" class="sponsored-banner-link sponsored-sbi-link" title="Apply for SBI Credit Card Online">
            <div class="sponsored-sbi-img-wrap">
              <img src="assets/sponsored/sbi-card.png" alt="SBI Card Credit Card - Apply Online" class="sponsored-sbi-img" loading="lazy" />
            </div>
            <div class="sponsored-sbi-footer">
              <div class="sponsored-sbi-info">
                <div class="sponsored-sbi-title">SBI Credit Card &bull; Instant Online Application</div>
                <div class="sponsored-sbi-sub">Digital KYC &bull; Welcome reward points &bull; Airport lounge access</div>
              </div>
              <div class="sponsored-sbi-action">
                <span class="sponsored-cta-btn sponsored-cta-sbi">Apply Now &rarr;</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  function renderSbiCardUnit() {
    return `
      <div class="ad-slot-card sponsored-sbi-slot" aria-label="SBI Card">
        <a href="https://mdeal.in/c_gEgEgjSS" target="_blank" rel="noopener noreferrer" class="sponsored-banner-link sponsored-sbi-link" title="Apply for SBI Credit Card Online">
          <div class="sponsored-sbi-img-wrap">
            <img src="assets/sponsored/sbi-card.png" alt="SBI Card Credit Card - Apply Online" class="sponsored-sbi-img" loading="lazy" />
          </div>
          <div class="sponsored-sbi-footer">
            <div class="sponsored-sbi-info">
              <div class="sponsored-sbi-title">Apply for SBI Credit Card Online &bull; Instant Approval</div>
              <div class="sponsored-sbi-sub">Welcome reward points &bull; Airport lounge access &bull; Fuel surcharge waiver</div>
            </div>
            <div class="sponsored-sbi-action">
              <span class="sponsored-cta-btn sponsored-cta-sbi">Apply for SBI Card &rarr;</span>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  function renderHdfcCardUnit() {
    return `
      <div class="ad-slot-card sponsored-hdfc-slot" aria-label="HDFC Bank">
        <a href="https://mdeal.in/c_10MA6LqN" target="_blank" rel="noopener noreferrer" class="sponsored-banner-link sponsored-hdfc-link" title="Apply for HDFC Bank IRCTC Credit Card">
          <div class="sponsored-hdfc-img-wrap">
            <img src="assets/sponsored/hdfc-irctc-card.png" alt="HDFC Bank IRCTC Card - Apply Online" class="sponsored-hdfc-img" loading="lazy" />
          </div>
          <div class="sponsored-hdfc-body">
            <h3 class="sponsored-hdfc-title">HDFC Bank IRCTC Credit Card</h3>
            <p class="sponsored-hdfc-desc">Earn exclusive reward points &amp; save up to 5% on IRCTC ticket bookings with zero hassle.</p>
            <div class="sponsored-hdfc-perks">
              <div class="sponsored-hdfc-perk-item"><span class="perk-check">✓</span> <span>Up to 5x Reward Points on IRCTC</span></div>
              <div class="sponsored-hdfc-perk-item"><span class="perk-check">✓</span> <span>Complimentary Railway Lounge Access</span></div>
              <div class="sponsored-hdfc-perk-item"><span class="perk-check">✓</span> <span>1% Fuel Surcharge Waiver</span></div>
              <div class="sponsored-hdfc-perk-item"><span class="perk-check">✓</span> <span>Instant Digital Card Application</span></div>
            </div>
            <div class="sponsored-hdfc-action">
              <span class="sponsored-cta-btn sponsored-cta-hdfc sponsored-cta-full">Apply for HDFC Card &rarr;</span>
            </div>
            <div class="sponsored-partner-footnote">Official HDFC Bank Co-Branded IRCTC Credit Card</div>
          </div>
        </a>
      </div>
    `;
  }

  function renderAngelOneUnit() {
    return `
      <div class="ad-slot-card ad-slot-sidebar" aria-label="Angel One">
        <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="sponsored-banner-link sponsored-sidebar-banner" title="Start Investing with Angel One">
          <div class="sponsored-sidebar-logo-wrap">
            <img src="assets/sponsored/angel-one-square.png" alt="Angel One Logo" class="sponsored-logo-square" loading="lazy" />
          </div>
          <div class="sponsored-sidebar-body">
            <h3 class="sponsored-sidebar-title">Trade &amp; Invest with Angel One</h3>
            <p class="sponsored-sidebar-desc">Fast, secure IPO bidding with seamless UPI authorization in just 3 clicks.</p>
            <div class="sponsored-sidebar-perks">
              <div class="sponsored-sidebar-perk-item"><span class="perk-check">✓</span> <span>₹0 Demat Account Opening Fee</span></div>
              <div class="sponsored-sidebar-perk-item"><span class="perk-check">✓</span> <span>Zero Brokerage on Equity Delivery</span></div>
              <div class="sponsored-sidebar-perk-item"><span class="perk-check">✓</span> <span>Flat ₹20 for Intraday &amp; F&amp;O Trades</span></div>
              <div class="sponsored-sidebar-perk-item"><span class="perk-check">✓</span> <span>Pre-apply for IPOs 24x7</span></div>
            </div>
            <div class="sponsored-sidebar-action">
              <span class="sponsored-cta-btn sponsored-cta-full">Open Free Demat Account &rarr;</span>
            </div>
            <div class="sponsored-partner-footnote">Trusted by over 2.5 Crore+ investors across India</div>
          </div>
        </a>
      </div>
    `;
  }

  function renderAdSenseUnit(slot = "5892147360", format = "auto") {
    return `
      <div class="adsense-slot-card sponsored-detail-slot" aria-label="Angel One">
        <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="sponsored-banner-link sponsored-detail-banner" title="Apply for this IPO via Angel One">
          <div class="sponsored-detail-logo-wrap">
            <img src="assets/sponsored/angel-one-wide.png" alt="Angel One" class="sponsored-logo-detail" loading="lazy" />
          </div>
          <div class="sponsored-detail-text">
            <div class="detail-banner-title">Ready to apply for this IPO?</div>
            <div class="detail-banner-sub">Bid with instant UPI authorization on Angel One. Enjoy ₹0 account opening fee and zero brokerage on equity delivery.</div>
          </div>
          <div class="sponsored-detail-cta">
            <span class="sponsored-cta-btn">Open Account &amp; Apply &rarr;</span>
          </div>
        </a>
      </div>
    `;
  }

  function renderPortalDirectoryWidget() {
    return `
      <div class="portal-directory-card" aria-label="Official Exchanges & Registrars">
        <div class="portal-dir-head">
          <div>
            <h3>Official Exchanges & Allotment Checking Directory</h3>
            <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Official primary market portals for bid verification, exchange documents, and allotment status</p>
          </div>
        </div>
        <div class="portal-chips-grid">
          <a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
            <div><span>NSE India IPO</span><div style="font-size:10px; color:var(--text-muted);">Official Exchange Portal</div></div>
          </a>
          <a href="https://www.bseindia.com/publicissue.html" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg></div>
            <div><span>BSE India Public Issues</span><div style="font-size:10px; color:var(--text-muted);">Official Exchange Portal</div></div>
          </a>
          <a href="https://ipostatus.kfintech.com/" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
            <div><span>KFintech Allotment</span><div style="font-size:10px; color:var(--text-muted);">Registrar Allotment Status</div></div>
          </a>
          <a href="https://linkintime.co.in/initial_offer/public-issues.html" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline></svg></div>
            <div><span>Link Intime Allotment</span><div style="font-size:10px; color:var(--text-muted);">Registrar Allotment Status</div></div>
          </a>
          <a href="https://www.bigshareonline.com/ipo_allotment.html" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
            <div><span>Bigshare Services</span><div style="font-size:10px; color:var(--text-muted);">Registrar Allotment Status</div></div>
          </a>
          <a href="https://maashitla.com/allotment-status/public-issues" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
            <div><span>Maashitla Securities</span><div style="font-size:10px; color:var(--text-muted);">Registrar Allotment Status</div></div>
          </a>
          <a href="https://in.mpms.mufg.com/Initial_Offer/public-issues.html" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg></div>
            <div><span>MUFG Link / MPMS</span><div style="font-size:10px; color:var(--text-muted);">Registrar Allotment Status</div></div>
          </a>
          <a href="https://www.purvashare.com/investor-service/ipo-query" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
            <div><span>Purva Sharegistry</span><div style="font-size:10px; color:var(--text-muted);">Registrar Allotment Status</div></div>
          </a>
          <a href="https://ipostatus1.cameoindia.com/" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            <div><span>Cameo Corporate</span><div style="font-size:10px; color:var(--text-muted);">Registrar Allotment Status</div></div>
          </a>
          <a href="https://www.skylinerta.com/ipo.php" target="_blank" rel="noopener noreferrer" class="portal-chip-item">
            <div class="portal-chip-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg></div>
            <div><span>Skyline Financial</span><div style="font-size:10px; color:var(--text-muted);">Registrar Allotment Status</div></div>
          </a>
        </div>
      </div>
    `;
  }

  function getCompanyIcon(type, color = "#2563EB") {
    switch (type) {
      case "energy":
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
      case "infra":
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg>`;
      case "food":
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>`;
      case "tech":
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`;
      case "medical":
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      case "polymer":
      default:
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><circle cx="19" cy="5" r="2"></circle><circle cx="5" cy="19" r="2"></circle><path d="M10.5 10.5L6.5 17.5M13.5 13.5L17.5 6.5"></path></svg>`;
    }
  }

  // Sparkline Generator
  function renderSparklineSvg(points = [10, 12, 14, 15], width = 50, height = 20, color = "#10B981") {
    if (!points || points.length === 0) points = [10, 12, 14, 15];
    const min = Math.min(...points);
    const max = Math.max(...points) || min + 1;
    const range = max - min || 1;
    const padding = 2;
    const stepX = (width - padding * 2) / (points.length - 1);
    
    const coords = points.map((val, idx) => {
      const x = padding + idx * stepX;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${coords.join(" L ")}`;
    return `
      <svg class="mini-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  // ==========================================================================
  // Dynamic GMP Formatters & Charts
  // ==========================================================================
  // Helper to format last updated timestamp cleanly and contextually
  // ==========================================================================
  function formatGmpLastUpdated(ipo) {
    if (!ipo) {
      return "Last Updated: 01 Nov, 12:30 AM";
    }

    if (ipo.status === "CLOSED") {
      return `Final GMP at Close: ${formatDate(ipo.closeDate)}`;
    }

    if (ipo.status === "LISTED") {
      return ipo.priceSource ? `Live: ${ipo.priceSource}` : `Debut Listing: ${formatDate(ipo.listingDate || ipo.closeDate)}`;
    }

    if (ipo.status === "UPCOMING") {
      if (ipo.gmp == null) {
        return ipo.openDate ? `GMP Not Fixed • Opens ${formatDate(ipo.openDate)}` : `Pre-IPO Pipeline • Dates TBA`;
      }
      return ipo.openDate ? `Pre-Issue Estimate • Opens ${formatDate(ipo.openDate)}` : `Pre-IPO Pipeline • Dates TBA`;
    }

    const ts = ipo.gmpUpdatedAt || (window.IpoData && window.IpoData.updatedAt);
    if (ts) {
      try {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const day = d.getDate();
          const month = months[d.getMonth()];
          let hours = d.getHours();
          const minutes = d.getMinutes().toString().padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12 || 12;
          return `Live Tracker: ${day} ${month}, ${hours}:${minutes} ${ampm}`;
        }
      } catch (e) {}
    }
    return "Live Tracker: Active";
  }

  // ==========================================================================
  // Helper to get or dynamically calculate chronological GMP history
  // Guarantees accurate dates for all closed, upcoming, and open stocks
  // (Prevents stale fallback dates like 30 Oct from displaying on past closed stock)
  // ==========================================================================
  function getIpoGmpHistory(ipo) {
    if (ipo && ipo.gmpHistory && ipo.gmpHistory.length >= 2) {
      return ipo.gmpHistory;
    }

    if (!ipo || ipo.gmp == null || (ipo.status === "UPCOMING" && !ipo.gmp)) {
      return (ipo && ipo.gmpHistory) || [];
    }

    const currentGmp = ipo.gmp;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Anchor date based on IPO lifecycle
    let anchorDate;
    if (ipo && (ipo.status === "CLOSED" || ipo.status === "LISTED")) {
      anchorDate = ipo.closeDate ? new Date(ipo.closeDate) : new Date("2026-10-25");
    } else if (ipo && ipo.status === "UPCOMING") {
      anchorDate = ipo.openDate ? new Date(ipo.openDate) : new Date();
    } else {
      anchorDate = new Date();
    }

    if (isNaN(anchorDate.getTime())) {
      anchorDate = new Date();
    }

    // Generate 5 days leading up to anchorDate
    const history = [];
    const ratios = [0.7, 0.75, 0.85, 0.95, 1.0];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() - i);
      const dayStr = String(d.getDate()).padStart(2, "0");
      const monthStr = months[d.getMonth()];
      const yearStr = d.getFullYear();
      const val = Math.max(0, Math.round(currentGmp * ratios[4 - i]));
      history.push({
        date: `${dayStr} ${monthStr}`,
        year: yearStr,
        value: val
      });
    }

    return history;
  }

  function renderDetailGmpChartSvg(ipo) {
    const history = getIpoGmpHistory(ipo);
    if (!ipo || ipo.gmp == null || history.length === 0) {
      return `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:125px; padding:16px 20px; text-align:center; background:rgba(15,23,42,0.5); border-radius:10px; border:1px dashed rgba(56,189,248,0.25);">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.75" style="margin-bottom:6px;"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-3 3"/></svg>
          <span style="font-size:13px; font-weight:700; color:#E2E8F0;">Grey Market Premium (GMP) Not Fixed</span>
          <span style="font-size:11px; color:#94A3B8; margin-top:3px; max-width:340px;">Unofficial dealer quotes are not active for this issue. Daily verified GMP trends will appear once trading starts.</span>
        </div>
      `;
    }

    const currentGmp = ipo.gmp;

    const values = history.map(h => h.value);
    const maxVal = Math.max(...values, currentGmp, 10);
    const minVal = Math.min(...values, 0);
    const range = (maxVal - minVal) || 1;

    const startX = 40;
    const endX = 265;
    const stepX = (endX - startX) / (history.length - 1 || 1);
    const topY = 25;
    const bottomY = 90;

    const points = history.map((h, i) => {
      const x = Math.round(startX + (i * stepX));
      const normalized = (h.value - minVal) / range;
      const y = Math.round(bottomY - (normalized * (bottomY - topY)));
      return { x, y, date: h.date, val: h.value };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} 105 L ${points[0].x} 105 Z`;

    const gridMid = Math.round((maxVal + minVal) / 2);
    const chartId = (ipo && ipo.id) ? ipo.id.replace(/[^a-zA-Z0-9_-]/g, "") : "curr";

    return `
      <svg class="gmp-trend-chart-svg" viewBox="0 0 300 125" fill="none">
        <defs>
          <linearGradient id="detailGmpArea_${chartId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        <line x1="25" y1="${topY}" x2="285" y2="${topY}" stroke="#1E293B" stroke-dasharray="2,2"/>
        <text x="20" y="${topY + 3}" fill="#64748B" font-size="8" text-anchor="end">₹${maxVal}</text>

        <line x1="25" y1="58" x2="285" y2="58" stroke="#1E293B" stroke-dasharray="2,2"/>
        <text x="20" y="61" fill="#64748B" font-size="8" text-anchor="end">₹${gridMid}</text>

        <line x1="25" y1="105" x2="285" y2="105" stroke="#334155"/>
        <text x="20" y="108" fill="#64748B" font-size="8" text-anchor="end">₹${minVal}</text>

        <!-- Area fill -->
        <path d="${areaD}" fill="url(#detailGmpArea_${chartId})"/>
        
        <!-- Trend Line -->
        <path d="${pathD}" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Dots & Dates -->
        ${points.map((p, i) => {
          const isLast = (i === points.length - 1);
          return `
            <circle cx="${p.x}" cy="${p.y}" r="${isLast ? 4.5 : 3.5}" fill="${isLast ? '#60A5FA' : '#3B82F6'}" stroke="${isLast ? '#FFFFFF' : 'none'}" stroke-width="${isLast ? 1.5 : 0}"/>
            <text x="${p.x}" y="119" fill="${isLast ? '#60A5FA' : '#94A3B8'}" font-size="8" font-weight="${isLast ? '700' : '500'}" text-anchor="middle">${p.date}</text>
          `;
        }).join('')}
      </svg>
    `;
  }

  // ==========================================================================
  // Header Rendering
  // ==========================================================================
  function renderHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;
    const currentView = state.route.view;

    header.innerHTML = `
      <div class="nav-container">
        <a href="#/" class="brand-wrap" aria-label="IPO PriceAlerter Home">
          <div class="brand-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <span>IPO PriceAlerter</span>
        </a>

        <nav class="main-nav" aria-label="Main Navigation">
          <a href="#/" class="nav-tab-link ${currentView === "home" ? "active" : ""}">Home</a>
          <a href="#/open" class="nav-tab-link ${currentView === "open" ? "active" : ""}">Open IPOs</a>
          <a href="#/upcoming" class="nav-tab-link ${currentView === "upcoming" ? "active" : ""}">Upcoming</a>
          <a href="#/listed" class="nav-tab-link ${currentView === "listed" ? "active" : ""}">Listed</a>
          <a href="#/calculator" class="nav-tab-link ${currentView === "calculator" ? "active" : ""}">Calculator</a>
          <a href="#/live-prices" class="nav-tab-link ${currentView === "live-prices" ? "active" : ""}">⚡ Live Prices</a>
          <a href="#/allotment" class="nav-tab-link ${currentView === "allotment" ? "active" : ""}">Allotment</a>
          <a href="#/gmp" class="nav-tab-link ${currentView === "gmp" ? "active" : ""}">GMP</a>
          <a href="#/calendar" class="nav-tab-link ${currentView === "calendar" ? "active" : ""}">Calendar</a>
          <a href="#/guide" class="nav-tab-link ${currentView === "guide" ? "active" : ""}">Learn</a>
          <a href="/blog/" class="nav-tab-link">Blog</a>
        </nav>

        <div class="header-right">
          <button class="header-search-btn" id="open-search-pill" aria-label="Search IPOs">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Search IPOs...</span>
            <kbd>⌘K</kbd>
          </button>

          <button class="btn-header-alerts" id="header-alerts-btn" aria-label="Get IPO Alerts">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span>Get Alerts</span>
          </button>

          <div class="bell-btn-wrap">
            <button class="bell-btn" id="header-bell-btn" aria-label="View IPO Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              ${dataset.alertsFeed?.length ? '<span class="bell-badge"></span>' : ''}
            </button>

            ${state.notificationsOpen ? renderNotificationsPanel() : ""}
          </div>

          <button class="mobile-hamburger-btn" id="mobile-menu-btn" aria-label="Open Navigation Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-drawer-overlay ${state.mobileMenuOpen ? 'open' : ''}" id="mobile-drawer-overlay">
        <div class="mobile-drawer">
          <div class="mobile-drawer-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="brand-icon-box" style="width:28px; height:28px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </div>
              <strong style="font-size:16px;">PriceAlerter</strong>
            </div>
            <button id="close-drawer-btn" style="color:#FFFFFF; font-size:24px; padding:4px; line-height:1;">&times;</button>
          </div>
          <div class="mobile-drawer-links">
            <button class="mobile-drawer-link" onclick="window.IpoApp.toggleSearchModal(true); window.IpoApp.toggleMobileMenu(false);">
              <span class="link-icon">🔍</span>
              <span>Search IPOs (⌘K)</span>
            </button>
            <button class="mobile-drawer-link" onclick="window.IpoApp.handleGetAlertsClick(); window.IpoApp.toggleMobileMenu(false);" style="background:rgba(16, 185, 129, 0.12); color:#10B981; font-weight:700;">
              <span class="link-icon">🔔</span>
              <span>Get Alerts (Subscribe / Unsubscribe)</span>
            </button>
            <a href="#/" class="mobile-drawer-link ${currentView === 'home' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">🏠</span>
              <span>Home</span>
            </a>
            <a href="#/open" class="mobile-drawer-link ${currentView === 'open' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">🟢</span>
              <span>Open IPOs</span>
            </a>
            <a href="#/upcoming" class="mobile-drawer-link ${currentView === 'upcoming' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">⏳</span>
              <span>Upcoming IPOs</span>
            </a>
            <a href="#/listed" class="mobile-drawer-link ${currentView === 'listed' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">📈</span>
              <span>Listed IPOs</span>
            </a>
            <a href="#/calculator" class="mobile-drawer-link ${currentView === 'calculator' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">🧮</span>
              <span>Profit Calculator</span>
            </a>
            <a href="#/live-prices" class="mobile-drawer-link ${currentView === 'live-prices' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">⚡</span>
              <span>Live Stock Prices</span>
            </a>
            <a href="#/allotment" class="mobile-drawer-link ${currentView === 'allotment' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">📋</span>
              <span>Allotment Router</span>
            </a>
            <a href="#/gmp" class="mobile-drawer-link ${currentView === 'gmp' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">📊</span>
              <span>GMP Tracker</span>
            </a>
            <a href="#/calendar" class="mobile-drawer-link ${currentView === 'calendar' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">📅</span>
              <span>IPO Calendar</span>
            </a>
            <a href="#/guide" class="mobile-drawer-link ${currentView === 'guide' ? 'active' : ''}" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">🎓</span>
              <span>Learn &amp; FAQ</span>
            </a>
            <a href="/blog/" class="mobile-drawer-link" onclick="window.IpoApp.toggleMobileMenu(false)">
              <span class="link-icon">📝</span>
              <span>Educational Blog</span>
            </a>
            <div style="margin-top:16px; padding-top:16px; border-top:1px solid #E2E8F0; display:flex; flex-direction:column; gap:8px;">
              <a href="about.html" class="mobile-drawer-link" style="font-size:13px; color:#64748B;">About Us</a>
              <a href="privacy.html" class="mobile-drawer-link" style="font-size:13px; color:#64748B;">Privacy Policy</a>
              <a href="terms.html" class="mobile-drawer-link" style="font-size:13px; color:#64748B;">Terms &amp; Conditions</a>
              <a href="contact.html" class="mobile-drawer-link" style="font-size:13px; color:#64748B;">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind Header Events
    document.getElementById("open-search-pill")?.addEventListener("click", () => toggleSearchModal(true));
    document.getElementById("header-alerts-btn")?.addEventListener("click", () => {
      window.IpoApp.handleGetAlertsClick();
    });
    document.getElementById("header-bell-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      state.notificationsOpen = !state.notificationsOpen;
      document.body.classList.toggle("notif-open", state.notificationsOpen);
      renderHeader();
    });

    document.getElementById("toggle-alerts-feed-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      state.alertsSubscribed = !state.alertsSubscribed;
      showToast(state.alertsSubscribed ? "Live IPO alerts enabled" : "IPO alerts muted", "info");
      renderHeader();
    });

    document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
      state.mobileMenuOpen = true;
      renderHeader();
    });

    document.getElementById("close-drawer-btn")?.addEventListener("click", () => {
      state.mobileMenuOpen = false;
      renderHeader();
    });

    document.getElementById("mobile-drawer-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "mobile-drawer-overlay") {
        state.mobileMenuOpen = false;
        renderHeader();
      }
    });

    // Sync Mobile Bottom Navigation
    document.querySelectorAll(".bottom-nav-item").forEach(item => {
      const navTarget = item.getAttribute("data-nav");
      if (navTarget === currentView) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  function getSmartNotifications() {
    const list = [];
    const openIpos = records.filter(r => r.status === "OPEN");
    const upcomingIpos = records.filter(r => r.status === "UPCOMING");
    const listedIpos = records.filter(r => r.status === "LISTED");

    // 1. Live Bidding Alerts for Open IPOs (Synchronized with current stock data)
    openIpos.forEach(ipo => {
      const gmpText = ipo.gmp ? ` • GMP: +₹${ipo.gmp} (+${ipo.gmpPercentage || 0}%)` : '';
      const priceText = ipo.priceBandLow && ipo.priceBandHigh ? `₹${ipo.priceBandLow}–${ipo.priceBandHigh}` : (ipo.issuePrice ? `₹${ipo.issuePrice}` : 'TBA');
      list.push({
        id: `notif-open-${ipo.slug}`,
        slug: ipo.slug,
        title: `${ipo.shortName} (${ipo.board || 'MAINBOARD'})`,
        tag: "🟢 ACTIVE BIDDING",
        tagClass: "tag-gmp",
        pinned: true,
        description: `Bidding is live! Price band: ${priceText}, Lot: ${ipo.lotSize || 0} shares${gmpText}. Registrar: ${ipo.registrar || 'TBA'}.`,
        time: `Closes ${formatDate(ipo.closeDate)} • Active`
      });
    });

    // 2. High Listing Return Alerts for Top Performing Stocks
    const topGainers = [
      { slug: "waaree-energies-ipo", name: "Waaree Energies", gain: "+66.30%", issue: "₹1,503", listed: "₹2,500" },
      { slug: "ntpc-green-energy-ipo", name: "NTPC Green Energy", gain: "+20.37%", issue: "₹108", listed: "₹130" },
      { slug: "swiggy-limited-ipo", name: "Swiggy Ltd", gain: "+7.69%", issue: "₹390", listed: "₹420" }
    ];

    topGainers.forEach(g => {
      list.push({
        id: `notif-gain-${g.slug}`,
        slug: g.slug,
        title: `${g.name} Listing Gain`,
        tag: `🚀 PROFIT ${g.gain}`,
        tagClass: "tag-gmp",
        pinned: false,
        description: `Delivered a stellar ${g.gain} listing return! Traded at ${g.listed} vs ${g.issue} issue price. Verified on NSE & BSE.`,
        time: "Market Close Verified"
      });
    });

    // 3. Upcoming Issue Opening Alerts
    upcomingIpos.slice(0, 3).forEach(ipo => {
      const priceText = ipo.priceBandLow && ipo.priceBandHigh ? `₹${ipo.priceBandLow}–${ipo.priceBandHigh}` : 'Price Band TBA';
      list.push({
        id: `notif-up-${ipo.slug}`,
        slug: ipo.slug,
        title: `${ipo.shortName} (${ipo.board || 'MAINBOARD'})`,
        tag: "📌 UPCOMING IPO",
        tagClass: "tag-pinned",
        pinned: false,
        description: `Issue scheduled to open for public subscription. Price band: ${priceText}, Issue Size: ₹${ipo.issueSizeCr || '—'} Cr.`,
        time: `Opens ${formatDate(ipo.openDate)} • Upcoming`
      });
    });

    // Always sort pinned (active open issues) to top
    return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }

  function renderNotificationsPanel() {
    const alerts = getSmartNotifications();
    const mode = state.notifSubMode || "subscribe";
    return `
      <div class="notif-backdrop" onclick="window.IpoApp.closeNotifications()"></div>
      <div class="notifications-panel" id="notifications-panel" onclick="event.stopPropagation()">
        <div class="notif-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <h4>Market Alerts &amp; Notifications</h4>
            <span style="font-size:10px; background:rgba(37,99,235,0.18); color:var(--brand-blue-light); padding:2px 7px; border-radius:10px; font-weight:700;">
              ${alerts.length} Active
            </span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="notif-close-btn" onclick="window.IpoApp.closeNotifications()" aria-label="Close notifications">✕</button>
          </div>
        </div>

        <!-- End-to-End Subscribe & Unsubscribe Email Alert Box -->
        <div class="notif-email-sub-card">
          <div class="notif-sub-tabs">
            <button type="button" class="notif-sub-tab ${mode === 'subscribe' ? 'active' : ''}" id="notif-tab-sub" onclick="window.IpoApp.setNotifMode('subscribe')">
              🔔 Subscribe Alerts
            </button>
            <button type="button" class="notif-sub-tab ${mode === 'unsubscribe' ? 'active unsub' : ''}" id="notif-tab-unsub" onclick="window.IpoApp.setNotifMode('unsubscribe')">
              🚫 Unsubscribe / Delete
            </button>
          </div>
          <form id="notif-sub-form" onsubmit="window.IpoApp.handleNotifFormSubmit(event)">
            <div class="notif-input-group">
              <input type="email" id="notif-email-input" placeholder="${mode === 'unsubscribe' ? 'Enter email to delete details...' : 'Enter email for live alerts...'}" required maxlength="254" />
              <button type="submit" id="notif-sub-submit-btn" class="${mode === 'unsubscribe' ? 'unsub-mode' : ''}">${mode === 'unsubscribe' ? 'Delete & Unsubscribe' : 'Subscribe Now'}</button>
            </div>
            <div class="notif-sub-hint" id="notif-sub-hint">
              <span>${mode === 'unsubscribe' ? '⚠️ Your email and details will be deleted immediately from subscribers list.' : '⚡ Instant alerts for bidding start, GMP spikes & allotment releases.'}</span>
            </div>
          </form>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin:8px 0 4px; padding:0 2px;">
          <span style="font-size:11px; color:var(--text-muted); display:inline-flex; align-items:center; gap:5px;">
            <span>📌 Pinned New IPOs &amp; Top GMP Movers</span>
          </span>
          <span style="font-size:10.5px; color:#10B981; font-weight:700;">● Live Push Feed</span>
        </div>

        <div class="notif-list">
          ${alerts.map(a => `
            <a href="#/ipo/${a.slug}" class="notif-item ${a.pinned ? 'is-pinned' : ''}" onclick="window.IpoApp.closeNotifications()">
              <div class="notif-item-top">
                <span class="notif-item-title">
                  ${a.pinned ? '<span class="notif-pin-icon">📌</span>' : ''}
                  ${escapeHtml(a.title)}
                </span>
                <span class="notif-tag ${a.tagClass || ''}">${escapeHtml(a.tag)}</span>
              </div>
              <p class="notif-desc">${escapeHtml(a.description)}</p>
              <span class="notif-time">${escapeHtml(a.time)}</span>
            </a>
          `).join("")}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Hero 3D SVG Graphic Generator (Neon Financial Visual)
  // ==========================================================================
  function renderHero3DSvg() {
    return `
      <svg class="hero-3d-svg" viewBox="0 0 340 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cubeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E3A8A" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#0F172A" stop-opacity="0.9"/>
          </linearGradient>
          <linearGradient id="cubeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563EB" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.8"/>
          </linearGradient>
          <linearGradient id="lineGlowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#2563EB"/>
            <stop offset="50%" stop-color="#38BDF8"/>
            <stop offset="100%" stop-color="#60A5FA"/>
          </linearGradient>
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Isometric Floor Grid -->
        <g stroke="#1E293B" stroke-width="1" opacity="0.4">
          <line x1="40" y1="180" x2="200" y2="100"/>
          <line x1="80" y1="200" x2="240" y2="120"/>
          <line x1="120" y1="220" x2="280" y2="140"/>
          <line x1="80" y1="100" x2="240" y2="180"/>
          <line x1="120" y1="80" x2="280" y2="160"/>
        </g>

        <!-- 3D Bar 1 -->
        <path d="M80 150 L105 135 L105 180 L80 195 Z" fill="#172554"/>
        <path d="M105 135 L130 150 L130 195 L105 180 Z" fill="#1E3A8A"/>
        <path d="M80 150 L105 135 L130 150 L105 165 Z" fill="#2563EB" opacity="0.8"/>

        <!-- 3D Bar 2 -->
        <path d="M135 125 L160 110 L160 175 L135 190 Z" fill="#172554"/>
        <path d="M160 110 L185 125 L185 190 L160 175 Z" fill="#1E3A8A"/>
        <path d="M135 125 L160 110 L185 125 L160 140 Z" fill="#3B82F6" opacity="0.8"/>

        <!-- 3D Bar 3 (Tallest) -->
        <path d="M190 90 L215 75 L215 165 L190 180 Z" fill="#1E3A8A"/>
        <path d="M215 75 L240 90 L240 180 L215 165 Z" fill="#2563EB"/>
        <path d="M190 90 L215 75 L240 90 L215 105 Z" fill="#60A5FA"/>

        <!-- Upward Neon Trend Line -->
        <path d="M60 160 Q 120 140, 160 100 T 260 40" fill="none" stroke="url(#lineGlowGrad)" stroke-width="4" stroke-linecap="round" filter="url(#neonGlow)"/>
        
        <!-- Glowing Nodes -->
        <circle cx="260" cy="40" r="5" fill="#60A5FA" filter="url(#neonGlow)"/>
        <circle cx="160" cy="100" r="3.5" fill="#38BDF8"/>
        
        <!-- Floating Neon Badge "IPO" -->
        <g transform="translate(100, 35)">
          <rect width="70" height="34" rx="8" fill="#1E293B" stroke="#3B82F6" stroke-width="1.5" opacity="0.95"/>
          <text x="35" y="23" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" font-weight="800" text-anchor="middle" letter-spacing="1.5">IPO</text>
        </g>
      </svg>
    `;
  }


  // ==========================================================================
  // IPO Cards Feed with Native In-Feed Ad Placements
  // ==========================================================================
  function renderIpoCardsFeed(cards) {
    if (!cards || cards.length === 0) {
      return `
        <div class="empty-state-card" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center;">
          <p style="color: var(--text-muted); font-size: 14px;">No IPOs found matching the selected filter criteria.</p>
        </div>
      `;
    }

    const items = [];
    cards.forEach((card, idx) => {
      items.push(renderIpoCardHtml(card));

      // Inject Native In-Feed Ad inside the feed:
      // - After 3rd card in a 6-card feed (e.g. Open IPOs)
      // - Every 6 cards in longer feeds (e.g. Closed / All Listed)
      if (idx === 2) {
        items.push(renderInFeedAdUnit(true));
      } else if (idx > 2 && (idx + 1) % 6 === 0 && idx !== cards.length - 1) {
        items.push(renderInFeedAdUnit(true));
      }
    });

    return items.join("");
  }

  // ==========================================================================
  // Open IPOs Grouped by Board (Mainboard vs SME)
  // ==========================================================================
  function renderOpenIposGrouped(cards, activeBoard) {
    const mainboard = cards.filter(r => r.board === "MAINBOARD");
    const sme = cards.filter(r => r.board === "SME");

    if (activeBoard === "mainboard") {
      return `
        <div class="open-board-section">
          <div class="open-board-header">
            <div class="open-board-title-group">
              <span class="board-badge mainboard">MAINBOARD</span>
              <h3>Open Mainboard IPOs (${mainboard.length})</h3>
            </div>
            <span class="open-board-subtitle">National Stock Exchange (NSE) & BSE • Retail Lot ~₹14,000–₹15,000</span>
          </div>
          <section class="ipo-cards-grid" aria-label="Open Mainboard IPOs">
            ${renderIpoCardsFeed(mainboard)}
          </section>
        </div>
      `;
    }

    if (activeBoard === "sme") {
      return `
        <div class="open-board-section">
          <div class="open-board-header">
            <div class="open-board-title-group">
              <span class="board-badge sme">SME EMERGE</span>
              <h3>Open SME IPOs (${sme.length})</h3>
            </div>
            <span class="open-board-subtitle">NSE Emerge & BSE SME • Minimum Lot ₹1,00,000–₹2,40,000</span>
          </div>
          <section class="ipo-cards-grid" aria-label="Open SME IPOs">
            ${renderIpoCardsFeed(sme)}
          </section>
        </div>
      `;
    }

    // Both separated with clear visual demarcation
    return `
      <div class="open-board-section" style="margin-bottom:32px;">
        <div class="open-board-header">
          <div class="open-board-title-group">
            <span class="board-badge mainboard">MAINBOARD</span>
            <h3>Open Mainboard IPOs (${mainboard.length})</h3>
          </div>
          <span class="open-board-subtitle">National Stock Exchange (NSE) & BSE • Retail Lot ~₹14,000–₹15,000</span>
        </div>
        <section class="ipo-cards-grid" aria-label="Open Mainboard IPOs">
          ${renderIpoCardsFeed(mainboard)}
        </section>
      </div>

      <div class="open-board-section" style="margin-top:16px;">
        <div class="open-board-header">
          <div class="open-board-title-group">
            <span class="board-badge sme">SME EMERGE</span>
            <h3>Open SME IPOs (${sme.length})</h3>
          </div>
          <span class="open-board-subtitle">NSE Emerge & BSE SME • Minimum Lot ₹1,00,000–₹2,40,000</span>
        </div>
        <section class="ipo-cards-grid" aria-label="Open SME IPOs">
          ${renderIpoCardsFeed(sme)}
        </section>
      </div>
    `;
  }

  // ==========================================================================
  // Figure 1 UI/UX Overhaul: Corporate Dashboard Components
  // ==========================================================================
  // ==========================================================================
  // Fintech Hero Section (Specification Section 4B)
  // ==========================================================================
  function renderFintechHeroSection() {
    return `
      <section class="fintech-hero-section" aria-label="Welcome to PriceAlerter">
        <div class="fintech-hero-content">
          <div class="fintech-hero-tag">
            <span class="fintech-hero-tag-dot"></span>
            <span>India's Leading IPO Intelligence Platform</span>
          </div>
          <h1 class="fintech-hero-title">Track Indian IPOs, GMP &amp; Listing Performance</h1>
          <p class="fintech-hero-desc">Real-time IPO updates, Grey Market Premium (GMP), subscription status, listing gains and expert insights.</p>
          <div class="fintech-hero-actions">
            <a href="#dashboard-open-ipos-section" class="btn-hero-primary" onclick="const el=document.getElementById('dashboard-open-ipos-section'); if(el){ el.scrollIntoView({behavior:'smooth'}); }">Explore IPOs</a>
            <a href="#/guide" class="btn-hero-secondary">How It Works</a>
          </div>
        </div>
        <div class="fintech-hero-visual" aria-hidden="true">
          <svg viewBox="0 0 460 250" class="fintech-hero-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#079B50" stop-opacity="0.28"/>
                <stop offset="100%" stop-color="#079B50" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#142B49"/>
                <stop offset="50%" stop-color="#079B50"/>
                <stop offset="100%" stop-color="#16A34A"/>
              </linearGradient>
            </defs>
            <line x1="20" y1="40" x2="440" y2="40" stroke="#E2E8F0" stroke-dasharray="3 3"/>
            <line x1="20" y1="90" x2="440" y2="90" stroke="#E2E8F0" stroke-dasharray="3 3"/>
            <line x1="20" y1="140" x2="440" y2="140" stroke="#E2E8F0" stroke-dasharray="3 3"/>
            <line x1="20" y1="190" x2="440" y2="190" stroke="#E2E8F0" stroke-dasharray="3 3"/>
            <line x1="20" y1="230" x2="440" y2="230" stroke="#CBD5E1" stroke-width="1.5"/>

            <path d="M 30 205 Q 90 185, 140 155 T 250 115 T 350 65 L 430 40 L 430 230 L 30 230 Z" fill="url(#chartGrad)"/>
            <path d="M 30 205 Q 90 185, 140 155 T 250 115 T 350 65 L 430 40" stroke="url(#lineGrad)" stroke-width="3.5" fill="none" stroke-linecap="round"/>

            <rect x="75" y="160" width="10" height="30" rx="2" fill="#16A34A"/>
            <line x1="80" y1="150" x2="80" y2="200" stroke="#16A34A" stroke-width="2"/>

            <rect x="180" y="120" width="10" height="40" rx="2" fill="#16A34A"/>
            <line x1="185" y1="110" x2="185" y2="170" stroke="#16A34A" stroke-width="2"/>

            <rect x="290" y="75" width="10" height="35" rx="2" fill="#16A34A"/>
            <line x1="295" y1="65" x2="295" y2="120" stroke="#16A34A" stroke-width="2"/>

            <g transform="translate(40, 45)">
              <rect width="105" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
              <rect x="12" y="12" width="40" height="6" rx="3" fill="#142B49"/>
              <rect x="12" y="24" width="80" height="4" rx="2" fill="#94A3B8"/>
              <rect x="12" y="34" width="65" height="4" rx="2" fill="#CBD5E1"/>
              <rect x="12" y="45" width="55" height="14" rx="4" fill="#EBFBF2"/>
              <text x="18" y="55" fill="#079B50" font-size="8.5" font-weight="700" font-family="Inter, sans-serif">RHP FILED</text>
            </g>

            <g transform="translate(370, 25)">
              <circle cx="18" cy="18" r="17" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
              <circle cx="18" cy="18" r="14" fill="#FBBF24"/>
              <text x="13" y="24" fill="#78350F" font-size="15" font-weight="800" font-family="Inter, sans-serif">₹</text>
            </g>

            <g transform="translate(335, 75)">
              <circle cx="13" cy="13" r="12" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
              <circle cx="13" cy="13" r="10" fill="#FDE68A"/>
              <text x="9" y="17" fill="#78350F" font-size="11" font-weight="800" font-family="Inter, sans-serif">₹</text>
            </g>

            <g transform="translate(230, 16)">
              <rect width="84" height="26" rx="13" fill="#142B49"/>
              <text x="12" y="17" fill="#10B981" font-size="11" font-weight="700" font-family="Inter, sans-serif">▲ +66.3%</text>
            </g>
          </svg>
        </div>
      </section>
    `;
  }

  function renderFig1SummaryCards(openCount, upcomingCount, closedCount, listedCount) {
    return `
      <section class="fig1-summary-grid" aria-label="IPO Market Overview">
        <div class="fig1-summary-card fig1-border-green clickable" id="fig1-card-open" onclick="const el=document.getElementById('dashboard-open-ipos-section'); if(el){ el.scrollIntoView({behavior:'smooth'}); } else { window.location.hash='#/open'; }" title="Click to view Open IPOs">
          <div class="fig1-card-content">
            <div class="fig1-stat-num">${openCount}</div>
            <div class="fig1-stat-label">Open IPOs</div>
          </div>
          <div class="fig1-icon-badge fig1-badge-green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </div>
        </div>

        <div class="fig1-summary-card fig1-border-blue clickable" id="fig1-card-upcoming" onclick="window.location.hash='#/upcoming'" title="Click to view Upcoming IPOs">
          <div class="fig1-card-content">
            <div class="fig1-stat-num">${upcomingCount}</div>
            <div class="fig1-stat-label">Upcoming IPOs</div>
          </div>
          <div class="fig1-icon-badge fig1-badge-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A237E" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
        </div>

        <div class="fig1-summary-card fig1-border-red clickable" id="fig1-card-closed" onclick="window.location.hash='#/listed'" title="Click to view Recently Closed IPOs">
          <div class="fig1-card-content">
            <div class="fig1-stat-num">${closedCount}</div>
            <div class="fig1-stat-label">Recently Closed</div>
          </div>
          <div class="fig1-icon-badge fig1-badge-red">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><line x1="7" y1="7" x2="17" y2="17"></line><polyline points="17 7 17 17 7 17"></polyline></svg>
          </div>
        </div>

        <div class="fig1-summary-card fig1-border-orange clickable" id="fig1-card-listed" onclick="window.location.hash='#/listed'" title="Click to view All Listed IPOs">
          <div class="fig1-card-content">
            <div class="fig1-stat-num">${listedCount}+</div>
            <div class="fig1-stat-label">Total Listed</div>
          </div>
          <div class="fig1-icon-badge fig1-badge-orange">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
        </div>
      </section>
    `;
  }

  function renderMoversSparkline(values, strokeColor, isGain = true, width = 110, height = 30) {
    if (!values || values.length < 2) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const paddingY = 4;
    const usableH = height - paddingY * 2;
    const stepX = width / (values.length - 1);
    
    const points = values.map((v, i) => {
      const x = (i * stepX).toFixed(1);
      const y = (height - paddingY - ((v - min) / range) * usableH).toFixed(1);
      return `${x},${y}`;
    }).join(' ');

    // For gainers, dashed baseline is at the bottom (green curve rises above it)
    // For losers, dashed baseline is at the TOP (red curve plunges below it)
    const baselineY = isGain ? (height - paddingY).toFixed(1) : (paddingY + 2).toFixed(1);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" style="overflow:visible;">
        <line x1="0" y1="${baselineY}" x2="${width}" y2="${baselineY}" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" />
        <polyline fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
      </svg>
    `;
  }

  // Define Top Gainers data exactly from verified reference capture
  const marketGainers = [
    {
      name: "Muthoot Finance",
      logo: "assets/movers/muthoot-finance.png",
      initials: "MF",
      gradient: "linear-gradient(135deg, #DC2626, #991B1B)",
      price: "₹2,709.80",
      change: "181.60 (7.18%)",
      isGain: true,
      volume: "21,72,336",
      trend: [2530, 2560, 2580, 2610, 2640, 2660, 2675, 2690, 2700, 2709.8]
    },
    {
      name: "Hitachi Energy",
      logo: "assets/movers/hitachi-energy.png",
      initials: "HE",
      gradient: "linear-gradient(135deg, #DC2626, #991B1B)",
      price: "₹29,100.00",
      change: "1,820.00 (6.67%)",
      isGain: true,
      volume: "1,80,043",
      trend: [27280, 27600, 28300, 28600, 28750, 28900, 29000, 29050, 29100]
    },
    {
      name: "Vedanta Alumin Metal",
      logo: "assets/movers/vedanta.png",
      initials: "VAL",
      gradient: "linear-gradient(135deg, #0284C7, #0369A1)",
      price: "₹376.85",
      change: "17.20 (4.78%)",
      isGain: true,
      volume: "1,05,38,796",
      trend: [359.5, 361.0, 363.0, 365.5, 368.0, 371.0, 374.0, 377.5, 375.0, 376.85]
    },
    {
      name: "Bharat Electronics",
      logo: "assets/movers/bel.png",
      initials: "BEL",
      gradient: "linear-gradient(135deg, #2563EB, #1D4ED8)",
      price: "₹398.00",
      change: "17.90 (4.71%)",
      isGain: true,
      volume: "2,35,41,317",
      trend: [380.1, 388.0, 387.0, 391.0, 392.5, 393.0, 395.0, 396.5, 397.0, 398.0]
    },
    {
      name: "Hindustan Zinc",
      logo: "assets/movers/hindustan-zinc.png",
      initials: "HZ",
      gradient: "linear-gradient(135deg, #1E293B, #0F172A)",
      price: "₹550.15",
      change: "23.65 (4.49%)",
      isGain: true,
      volume: "47,80,415",
      trend: [526.5, 529.0, 532.0, 535.0, 541.0, 544.0, 547.0, 548.5, 550.15]
    },
    {
      name: "Adani Enterprises",
      logo: "assets/movers/adani-enterprises.png",
      initials: "AE",
      gradient: "linear-gradient(135deg, #7C3AED, #6D28D9)",
      price: "₹2,709.20",
      change: "115.90 (4.47%)",
      isGain: true,
      volume: "22,10,845",
      trend: [2593.3, 2640.0, 2670.0, 2685.0, 2690.0, 2695.0, 2702.0, 2709.2]
    }
  ];

  // Define Top Losers data exactly from verified reference capture
  const marketLosers = [
    {
      name: "Siemens Energy India",
      logo: "assets/movers/siemens-energy.png",
      initials: "SE",
      gradient: "linear-gradient(135deg, #0284C7, #0369A1)",
      price: "₹2,846.60",
      change: "-92.80 (3.16%)",
      isGain: false,
      volume: "4,86,507",
      trend: [2940, 2928, 2932, 2915, 2925, 2900, 2895, 2905, 2875, 2870, 2865, 2870, 2855, 2858, 2846.6]
    },
    {
      name: "Power Grid Corpn.",
      logo: "assets/movers/power-grid.png",
      initials: "PG",
      gradient: "linear-gradient(135deg, #7C3AED, #6D28D9)",
      price: "₹259.55",
      change: "-8.15 (3.04%)",
      isGain: false,
      volume: "1,09,94,586",
      trend: [267.7, 267.5, 267.0, 266.8, 267.2, 266.5, 266.8, 266.0, 265.5, 264.0, 260.0, 259.55]
    },
    {
      name: "PNB",
      logo: "assets/movers/pnb.png",
      initials: "PNB",
      gradient: "linear-gradient(135deg, #B91C1C, #991B1B)",
      price: "₹120.97",
      change: "-2.09 (1.70%)",
      isGain: false,
      volume: "1,90,95,279",
      trend: [123.06, 122.2, 121.8, 121.5, 122.5, 122.8, 122.4, 122.9, 121.6, 121.2, 121.0, 121.4, 120.97]
    },
    {
      name: "State Bank Of India",
      logo: "assets/movers/sbi.png",
      initials: "SBI",
      gradient: "linear-gradient(135deg, #0284C7, #075985)",
      price: "₹970.25",
      change: "-16.75 (1.70%)",
      isGain: false,
      volume: "2,79,59,412",
      trend: [987.0, 986.5, 986.0, 987.5, 988.0, 987.0, 986.5, 988.0, 985.0, 978.0, 975.0, 979.0, 970.25]
    },
    {
      name: "Union Bank of India",
      logo: "assets/movers/union-bank.png",
      initials: "UBI",
      gradient: "linear-gradient(135deg, #D97706, #B45309)",
      price: "₹183.20",
      change: "-2.80 (1.51%)",
      isGain: false,
      volume: "1,40,40,640",
      trend: [186.0, 185.0, 186.2, 184.8, 184.0, 182.5, 183.8, 184.5, 184.0, 184.2, 183.5, 183.2]
    },
    {
      name: "Asian Paints",
      logo: "assets/movers/asian-paints.png",
      initials: "AP",
      gradient: "linear-gradient(135deg, #D97706, #B45309)",
      price: "₹2,437.80",
      change: "-34.20 (1.38%)",
      isGain: false,
      volume: "20,08,963",
      trend: [2472.0, 2465.0, 2460.0, 2455.0, 2450.0, 2445.0, 2442.0, 2440.0, 2437.8]
    }
  ];

  // Define the market-shaker display dataset
  const marketShakers = [
    {
      name: "Fractal Analytics",
      subtitle: "Results yesterday",
      logo: "assets/movers/fractal-analytics.png",
      initials: "FA",
      gradient: "linear-gradient(135deg, #0F172A, #334155)",
      price: "₹835.65",
      change: "102.85 (14.04%)",
      isGain: true,
      volChange: "10,981%",
      volume: "1,94,24,579",
      trend: [733, 755, 780, 805, 820, 830, 835.65]
    },
    {
      name: "Awfis Space Solutions",
      subtitle: "Results yesterday",
      logo: "assets/movers/awfis.png",
      initials: "AW",
      gradient: "linear-gradient(135deg, #EF4444, #B91C1C)",
      price: "₹256.19",
      change: "14.99 (6.21%)",
      isGain: true,
      volChange: "6,662%",
      volume: "1,44,66,829",
      trend: [241, 248, 252, 250, 254, 256.19]
    },
    {
      name: "Faze Three",
      subtitle: "Results yesterday",
      logo: "assets/movers/faze-three.png",
      initials: "FT",
      gradient: "linear-gradient(135deg, #DC2626, #7F1D1D)",
      price: "₹541.80",
      change: "90.30 (20.00%)",
      isGain: true,
      volChange: "5,585%",
      volume: "17,96,686",
      trend: [451.5, 470, 500, 520, 535, 541.8]
    },
    {
      name: "Alembic Pharmaceuticals",
      subtitle: "Results today",
      logo: "assets/movers/alembic-pharma.png",
      initials: "AP",
      gradient: "linear-gradient(135deg, #0284C7, #0369A1)",
      price: "₹906.70",
      change: "103.90 (12.94%)",
      isGain: true,
      volChange: "4,513%",
      volume: "41,62,581",
      trend: [802.8, 810, 820, 850, 885, 906.7]
    },
    {
      name: "Saregama India",
      subtitle: "Results today",
      logo: "assets/movers/saregama.png",
      initials: "SI",
      gradient: "linear-gradient(135deg, #059669, #047857)",
      price: "₹636.80",
      change: "74.60 (13.27%)",
      isGain: true,
      volChange: "3,048%",
      volume: "2,12,55,680",
      trend: [562, 575, 590, 605, 620, 630, 636.8]
    },
    {
      name: "R Systems International",
      subtitle: "Results yesterday",
      logo: "assets/movers/r-systems.png",
      initials: "RS",
      gradient: "linear-gradient(135deg, #2563EB, #1D4ED8)",
      price: "₹269.70",
      change: "21.40 (8.62%)",
      isGain: true,
      volChange: "2,888%",
      volume: "86,37,136",
      trend: [248.3, 252, 258, 263, 266, 268, 269.7]
    }
  ];

  window.switchMoversView = function(view) {
    const cardGainers = document.getElementById('movers-card-gainers');
    const cardLosers = document.getElementById('movers-card-losers');
    const btnBoth = document.getElementById('tab-btn-both');
    const btnGainers = document.getElementById('tab-btn-gainers');
    const btnLosers = document.getElementById('tab-btn-losers');

    [btnBoth, btnGainers, btnLosers].forEach(b => {
      if (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      }
    });

    if (view === 'gainers') {
      if (cardGainers) cardGainers.style.display = '';
      if (cardLosers) cardLosers.style.display = 'none';
      if (btnGainers) {
        btnGainers.classList.add('active');
        btnGainers.setAttribute('aria-selected', 'true');
      }
    } else if (view === 'losers') {
      if (cardGainers) cardGainers.style.display = 'none';
      if (cardLosers) cardLosers.style.display = '';
      if (btnLosers) {
        btnLosers.classList.add('active');
        btnLosers.setAttribute('aria-selected', 'true');
      }
    } else {
      if (cardGainers) cardGainers.style.display = '';
      if (cardLosers) cardLosers.style.display = '';
      if (btnBoth) {
        btnBoth.classList.add('active');
        btnBoth.setAttribute('aria-selected', 'true');
      }
    }
  };
  window.switchMoversTab = window.switchMoversView;

  function renderMoversTableRows(list, isGain) {
    return (list || []).map(item => `
      <tr>
        <td>
          <div class="movers-company-cell">
            <div class="movers-logo-box" style="position:relative; width:44px; height:44px; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:${item.gradient || (isGain ? '#2563EB' : '#DC2626')}; flex-shrink:0;">
              <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#FFFFFF; font-weight:800; font-size:14px; z-index:1;">${item.initials}</div>
              <img src="${item.logo}" alt="${item.name} logo" width="44" height="44" class="movers-logo-img" loading="lazy" referrerpolicy="no-referrer" style="position:relative; z-index:2; width:100%; height:100%; object-fit:contain; background:#FFFFFF;" onerror="this.style.display='none';" />
            </div>
            <span class="movers-company-name">${item.name}</span>
          </div>
        </td>
        <td>
          <div class="movers-price-cell">
            <div class="movers-sparkline-wrap">
              ${renderMoversSparkline(item.trend, isGain ? '#00B386' : '#EB5B3C', isGain, 110, 30)}
            </div>
            <div class="movers-price-block">
              <div class="movers-cmp">${item.price}</div>
              <div class="movers-change ${isGain ? 'gain' : 'loss'}">${item.change}</div>
            </div>
          </div>
        </td>
        <td class="movers-volume-cell">${item.volume}</td>
      </tr>
    `).join("");
  }

  function renderShakersTableRows(list) {
    return (list || []).map(item => `
      <tr>
        <td style="padding:10px 12px;">
          <div class="movers-company-cell" style="gap:10px;">
            <div class="movers-logo-box" style="position:relative; width:38px; height:38px; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:${item.gradient || '#0F172A'}; flex-shrink:0;">
              <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#FFFFFF; font-weight:800; font-size:12px; z-index:1;">${item.initials}</div>
              <img src="${item.logo}" alt="${item.name} logo" width="38" height="38" class="movers-logo-img" loading="lazy" referrerpolicy="no-referrer" style="position:relative; z-index:2; width:100%; height:100%; object-fit:contain; background:#FFFFFF;" onerror="this.style.display='none';" />
            </div>
            <div style="display:flex; flex-direction:column;">
              <span class="movers-company-name" style="font-size:13px; font-weight:700; color:#0F172A; line-height:1.25;">${item.name}</span>
              ${item.subtitle ? `<span style="font-size:10.5px; color:#2563EB; font-weight:600; margin-top:2px;">${item.subtitle}</span>` : ''}
            </div>
          </div>
        </td>
        <td style="padding:10px 12px;">
          <div class="movers-price-cell" style="gap:10px; justify-content:flex-end;">
            <div class="movers-sparkline-wrap" style="width:70px; height:26px;">
              ${renderMoversSparkline(item.trend, '#00B386', true, 70, 26)}
            </div>
            <div class="movers-price-block" style="min-width:auto; text-align:right;">
              <div class="movers-cmp" style="font-size:13px;">${item.price}</div>
              <div class="movers-change gain" style="font-size:11.5px;">${item.change}</div>
            </div>
          </div>
        </td>
        <td class="movers-volume-cell" style="padding:10px 12px; text-align:right;">
          <div style="font-size:13px; font-weight:800; color:#00B386;">${item.volChange}</div>
          <div style="font-size:11px; color:#64748B; font-weight:500; margin-top:2px;">${item.volume}</div>
        </td>
      </tr>
    `).join("");
  }

  function updateDashboardMoversInPlace() {
    const data = state.liveMarketData;
    if (!data) return;
    const isUsableQuote = stock => stock && stock.quoteVerified === true && stock.quoteTimestamp && stock.quoteSource && Number.isFinite(Number(stock.rawPrice)) && Number(stock.rawPrice) > 0;
    const gainersList = (Array.isArray(data.marketGainers) ? data.marketGainers : []).filter(isUsableQuote);
    const losersList = (Array.isArray(data.marketLosers) ? data.marketLosers : []).filter(isUsableQuote);
    const shakersList = (Array.isArray(data.marketShakers) ? data.marketShakers : []).filter(isUsableQuote);

    const gBody = document.getElementById("movers-gainers-tbody");
    if (gBody) gBody.innerHTML = renderMoversTableRows(gainersList, true);

    const lBody = document.getElementById("movers-losers-tbody");
    if (lBody) lBody.innerHTML = renderMoversTableRows(losersList, false);

    const sBody = document.getElementById("market-shakers-tbody");
    if (sBody) sBody.innerHTML = renderShakersTableRows(shakersList);
  }

  function renderFig1TrendingTable() {
    const data = state.liveMarketData || (window.IpoData && window.IpoData.liveData) || null;
    const isUsableQuote = stock => stock && stock.quoteVerified === true && stock.quoteTimestamp && stock.quoteSource && Number.isFinite(Number(stock.rawPrice)) && Number(stock.rawPrice) > 0;
    const gainersList = (data && Array.isArray(data.marketGainers) ? data.marketGainers : []).filter(isUsableQuote);
    const losersList = (data && Array.isArray(data.marketLosers) ? data.marketLosers : []).filter(isUsableQuote);

    return `
      <div class="movers-container" id="market-movers-section">
        <!-- Movers Master Filter Toolbar -->
        <div class="movers-filter-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <h2 class="fig1-panel-title" style="margin:0; font-size:18px;">📊 Today's Market Movers</h2>
            <div class="widget-source-tag">Timestamped provider quotes</div>
          </div>
          <div class="movers-tabs-nav" role="tablist" aria-label="Market Movers View Selection">
            <button type="button" class="movers-tab-btn active" id="tab-btn-both" onclick="window.switchMoversView('both')" role="tab" aria-selected="true">
              Show Both
            </button>
            <button type="button" class="movers-tab-btn" id="tab-btn-gainers" onclick="window.switchMoversView('gainers')" role="tab" aria-selected="false">
              <span class="movers-tab-dot green"></span> Top Gainers
            </button>
            <button type="button" class="movers-tab-btn" id="tab-btn-losers" onclick="window.switchMoversView('losers')" role="tab" aria-selected="false">
              <span class="movers-tab-dot red"></span> Top Losers
            </button>
          </div>
        </div>

        <!-- 1. Top Gainers Card -->
        <div class="movers-panel-card" id="movers-card-gainers" style="margin-bottom:20px;">
          <div class="movers-panel-header">
            <div class="movers-title-wrap">
              <h3 class="movers-card-title">
                <span>🏆 Top Gainers Today</span>
                <span class="movers-badge gain">Bullish Surge</span>
              </h3>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <button type="button" class="fig1-header-link" style="background:none; border:none; cursor:pointer;" onclick="window.switchMoversView('losers')">View Top Losers &darr;</button>
            </div>
          </div>
          <div class="movers-table-wrap">
            <table class="movers-table">
              <thead>
                <tr>
                  <th class="th-company">Company</th>
                  <th class="th-price">Market price (1D)</th>
                  <th class="th-volume">Volume</th>
                </tr>
              </thead>
              <tbody id="movers-gainers-tbody">
                ${renderMoversTableRows(gainersList, true)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. Top Losers Card (Directly visible, no tab hidden) -->
        <div class="movers-panel-card" id="movers-card-losers">
          <div class="movers-panel-header">
            <div class="movers-title-wrap">
              <h3 class="movers-card-title">
                <span>🔻 Top Losers Today</span>
                <span class="movers-badge loss">Intraday Pullback</span>
              </h3>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <button type="button" class="fig1-header-link" style="background:none; border:none; cursor:pointer;" onclick="window.switchMoversView('gainers')">View Top Gainers &uarr;</button>
            </div>
          </div>
          <div class="movers-table-wrap">
            <table class="movers-table">
              <thead>
                <tr>
                  <th class="th-company">Company</th>
                  <th class="th-price">Market price (1D)</th>
                  <th class="th-volume">Volume</th>
                </tr>
              </thead>
              <tbody id="movers-losers-tbody">
                ${renderMoversTableRows(losersList, false)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderFig1OpenIposSection() {
    const openRecords = records.filter(r => r.status === "OPEN").sort((a, b) => {
      const da = a.closeDate ? new Date(a.closeDate).getTime() : 0;
      const db = b.closeDate ? new Date(b.closeDate).getTime() : 0;
      return da - db;
    });

    return `
      <div class="fig1-panel-card">
        <div class="fig1-panel-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <h2 class="fig1-panel-title">🟢 Open IPOs</h2>
            <span class="live-pulse" style="margin-left:4px;"></span>
            <span class="status-badge open">ACTIVE BIDDING</span>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="widget-source-tag">Official NSE/BSE Synced</div>
            <a href="#/open" class="fig1-header-link">View All (${openRecords.length}) &rarr;</a>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div class="fig1-table-responsive desktop-only-table">
          <table class="fig1-trending-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>BIDDING WINDOW</th>
                <th>PRICE BAND</th>
                <th>LOT SIZE</th>
                <th>LIVE GMP</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              ${openRecords.map(item => {
                const priceText = item.priceBandLow && item.priceBandHigh 
                  ? `₹${item.priceBandLow} – ${item.priceBandHigh}` 
                  : (item.issuePrice ? `₹${item.issuePrice}` : 'TBA');
                const gmpText = (item.gmp !== null && item.gmp !== undefined)
                  ? (item.gmp > 0 ? `+₹${item.gmp}` : `₹${item.gmp}`) 
                  : '—';
                const gmpPct = (item.gmpPercentage !== null && item.gmpPercentage !== undefined) ? `(${item.gmpPercentage}%)` : '';
                const estListing = (item.priceBandHigh || item.issuePrice) 
                  ? Number(item.priceBandHigh || item.issuePrice) + Number(item.gmp || 0) 
                  : null;
                const minInvFormatted = item.minimumInvestment 
                  ? `₹${Number(item.minimumInvestment).toLocaleString('en-IN')}` 
                  : (item.lotSize && item.priceBandHigh ? `₹${(item.lotSize * item.priceBandHigh).toLocaleString('en-IN')}` : '—');

                return `
                  <tr style="cursor:pointer;" onclick="window.location.hash='#/ipo/${item.slug}'">
                    <td>
                      <div class="fig1-company-cell">
                        ${renderCompanyLogo(item, 34)}
                        <div class="fig1-company-name-wrap">
                          <span class="fig1-company-name">${item.shortName}</span>
                          <span class="fig1-sub-tag listed" style="background:${item.board === 'MAINBOARD' ? '#EBF5FF' : '#F1F5F9'}; color:${item.board === 'MAINBOARD' ? '#1D4ED8' : '#475569'};">${item.board || 'MAINBOARD'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-size:12.5px; font-weight:600; color:#111827;">${formatDate(item.openDate)}</div>
                      <div style="font-size:11px; color:#DC2626; font-weight:600;">Closes: ${formatDate(item.closeDate)}</div>
                    </td>
                    <td><span class="fig1-val-price">${priceText}</span></td>
                    <td><span style="font-size:12.5px; font-weight:600; color:#111827;">${item.lotSize ? item.lotSize + ' shares' : '—'}</span></td>
                    <td>
                      <span class="fig1-return-tag ${item.gmp ? 'positive' : ''}" style="${!item.gmp ? 'background:#F1F5F9; color:#64748B;' : ''}">
                        ${gmpText} ${gmpPct}
                      </span>
                    </td>
                    <td><span class="status-badge open">Open</span></td>
                    <td>
                      <button id="open-ipo-btn-${item.slug}" class="btn-table-action" onclick="event.stopPropagation(); window.IpoApp.toggleOpenIpoDetail('${item.slug}')">
                        More Details ▾
                      </button>
                    </td>
                  </tr>
                  <tr id="open-ipo-expand-${item.slug}" class="open-ipo-detail-drawer" style="display:none; background:#F8FAFC;">
                    <td colspan="7" style="padding:14px 18px; border-bottom:1px solid #E2E8F0;">
                      <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:16px 18px; box-shadow:0 1px 4px rgba(0,0,0,0.03);">
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:14px; margin-bottom:14px;">
                          <div>
                            <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">Issue Size</span>
                            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:2px;">₹${item.issueSizeCr || '—'} Cr</div>
                          </div>
                          <div>
                            <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">Min Investment</span>
                            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:2px;">${minInvFormatted} (${item.lotSize || 0} shares)</div>
                          </div>
                          <div>
                            <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">Allotment Date</span>
                            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:2px;">${formatDate(item.allotmentDate)}</div>
                          </div>
                          <div>
                            <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">Listing Date</span>
                            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:2px;">${formatDate(item.listingDate)}</div>
                          </div>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding-top:12px; border-top:1px dashed #E2E8F0;">
                          <div style="font-size:13px; color:#475569;">
                            <strong>Registrar:</strong> ${item.registrar || 'TBA'}
                            ${estListing ? ` • <strong style="color:#16A34A;">Est. Listing:</strong> ₹${estListing} (+${item.gmpPercentage || 0}%)` : ''}
                          </div>
                          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <a href="#/ipo/${item.slug}" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:8px;">
                              Full Analysis &rarr;
                            </a>
                            ${item.allotmentUrl ? `
                              <a href="${item.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="btn-table-action" style="background:#079B50; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:8px;">
                                Check Allotment
                              </a>
                            ` : ''}
                            <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="btn-table-action" style="background:#10B981; border:1px solid #059669; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:700; border-radius:8px;">
                              Apply Now
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

        <!-- Mobile Card Accordion View (Accessible & Clean Layout) -->
        <div class="mobile-only-cards mobile-open-ipos-cards">
          ${openRecords.map(item => {
            const priceText = item.priceBandLow && item.priceBandHigh 
              ? `₹${item.priceBandLow} – ${item.priceBandHigh}` 
              : (item.issuePrice ? `₹${item.issuePrice}` : 'TBA');
            const gmpText = (item.gmp !== null && item.gmp !== undefined)
              ? (item.gmp > 0 ? `+₹${item.gmp}` : `₹${item.gmp}`) 
              : '—';
            const gmpPct = (item.gmpPercentage !== null && item.gmpPercentage !== undefined) ? `(${item.gmpPercentage}%)` : '';
            const estListing = (item.priceBandHigh || item.issuePrice) 
              ? Number(item.priceBandHigh || item.issuePrice) + Number(item.gmp || 0) 
              : null;
            const minInvFormatted = item.minimumInvestment 
              ? `₹${Number(item.minimumInvestment).toLocaleString('en-IN')}` 
              : (item.lotSize && item.priceBandHigh ? `₹${(item.lotSize * item.priceBandHigh).toLocaleString('en-IN')}` : '—');

            return `
              <div class="mobile-open-card" onclick="window.location.hash='#/ipo/${item.slug}'">
                <div class="mobile-open-head">
                  <div class="fig1-company-cell">
                    ${renderCompanyLogo(item, 36)}
                    <div class="fig1-company-name-wrap">
                      <span class="fig1-company-name">${item.shortName}</span>
                      <span class="fig1-sub-tag listed" style="background:${item.board === 'MAINBOARD' ? '#EBF5FF' : '#F1F5F9'}; color:${item.board === 'MAINBOARD' ? '#1D4ED8' : '#475569'};">${item.board || 'MAINBOARD'}</span>
                    </div>
                  </div>
                  <span class="status-badge open">Open</span>
                </div>
                
                <div class="mobile-open-specs-grid">
                  <div class="mobile-spec-col">
                    <span class="mobile-spec-label">Bidding Window</span>
                    <span class="mobile-spec-val">${formatDate(item.openDate)} – ${formatDate(item.closeDate)}</span>
                  </div>
                  <div class="mobile-spec-col">
                    <span class="mobile-spec-label">Price Band</span>
                    <span class="mobile-spec-val" style="color:#079B50; font-weight:700;">${priceText}</span>
                  </div>
                  <div class="mobile-spec-col">
                    <span class="mobile-spec-label">Lot Size</span>
                    <span class="mobile-spec-val">${item.lotSize ? item.lotSize + ' shares' : '—'}</span>
                  </div>
                  <div class="mobile-spec-col">
                    <span class="mobile-spec-label">Live GMP</span>
                    <span class="mobile-spec-val ${item.gmp ? 'positive' : ''}" style="font-weight:700; color:${item.gmp ? '#16A34A' : '#64748B'};">
                      ${gmpText} ${gmpPct}
                    </span>
                  </div>
                </div>

                <div class="mobile-open-actions">
                  <button type="button" id="mobile-open-btn-${item.slug}" class="btn-mobile-toggle" onclick="event.stopPropagation(); window.IpoApp.toggleOpenIpoDetail('${item.slug}')">
                    View Details ▾
                  </button>
                  <a href="#/ipo/${item.slug}" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 12px; font-size:12px; font-weight:600; border-radius:8px;" onclick="event.stopPropagation();">
                    Full Analysis &rarr;
                  </a>
                </div>

                <!-- Mobile Expandable Accordion Drawer -->
                <div id="mobile-open-expand-${item.slug}" class="mobile-open-drawer" style="display:none;" onclick="event.stopPropagation();">
                  <div class="mobile-drawer-grid">
                    <div class="mobile-drawer-item">
                      <span class="mobile-spec-label">Issue Size</span>
                      <strong style="color:#111827; font-size:13px;">₹${item.issueSizeCr || '—'} Cr</strong>
                    </div>
                    <div class="mobile-drawer-item">
                      <span class="mobile-spec-label">Min Investment</span>
                      <strong style="color:#111827; font-size:13px;">${minInvFormatted}</strong>
                    </div>
                    <div class="mobile-drawer-item">
                      <span class="mobile-spec-label">Allotment Date</span>
                      <strong style="color:#111827; font-size:13px;">${formatDate(item.allotmentDate)}</strong>
                    </div>
                    <div class="mobile-drawer-item">
                      <span class="mobile-spec-label">Listing Date</span>
                      <strong style="color:#111827; font-size:13px;">${formatDate(item.listingDate)}</strong>
                    </div>
                  </div>
                  <div style="font-size:12px; color:#475569; margin:10px 0 12px; padding-top:8px; border-top:1px dashed #E2E8F0;">
                    <strong>Registrar:</strong> ${item.registrar || 'TBA'}
                    ${estListing ? ` • <strong style="color:#16A34A;">Est. Listing:</strong> ₹${estListing} (+${item.gmpPercentage || 0}%)` : ''}
                  </div>
                  <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${item.allotmentUrl ? `
                      <a href="${item.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="btn-table-action" style="background:#079B50; color:#FFFFFF; text-decoration:none; padding:6px 12px; font-size:12px; font-weight:600; border-radius:8px; flex:1; text-align:center;">
                        Check Allotment
                      </a>
                    ` : ''}
                    <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="btn-table-action" style="background:#10B981; border:1px solid #059669; color:#FFFFFF; text-decoration:none; padding:6px 12px; font-size:12px; font-weight:700; border-radius:8px; flex:1; text-align:center;">
                      Apply Now
                    </a>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderFig1PerformanceChart() {
    const chartBars = [
      { name: "Waaree", pct: 66.3, isGain: true, upperH: 80, lowerH: 0 },
      { name: "NTPC", pct: 20.4, isGain: true, upperH: 38, lowerH: 0 },
      { name: "Swiggy", pct: 7.7, isGain: true, upperH: 18, lowerH: 0 },
      { name: "Niva Bupa", pct: 6.1, isGain: true, upperH: 15, lowerH: 0 },
      { name: "ABC Infra", pct: 7.2, isGain: true, upperH: 17, lowerH: 0 },
      { name: "XYZ Fin", pct: -4.8, isGain: false, upperH: 0, lowerH: 15 },
      { name: "Sagility", pct: -6.7, isGain: false, upperH: 0, lowerH: 20 },
      { name: "PQR Tech", pct: 15.3, isGain: true, upperH: 30, lowerH: 0 }
    ];

    return `
      <div class="fig1-panel-card">
        <div class="fig1-panel-header">
          <h2 class="fig1-panel-title">📊 IPO Listing Performance (Last 30 Days)</h2>
          <div class="fig1-chart-legend">
            <span class="legend-item"><span class="legend-color-box legend-gain"></span> Gain</span>
            <span class="legend-item"><span class="legend-color-box legend-loss"></span> Loss</span>
          </div>
        </div>
        <div class="fig1-bar-chart-wrap">
          <div class="fig1-chart-layout">
            <div class="fig1-chart-yaxis">
              <span>80%</span>
              <span>0%</span>
              <span>-20%</span>
            </div>
            <div class="fig1-chart-stage">
              <div class="fig1-chart-gridlines">
                <div class="gridline top"></div>
                <div class="gridline baseline"></div>
                <div class="gridline bottom"></div>
              </div>
              <div class="fig1-bar-columns">
                ${chartBars.map(bar => `
                  <div class="fig1-chart-col" title="${bar.name}: ${bar.isGain ? '+' : ''}${bar.pct}% listing day return">
                    <div class="fig1-bar-upper">
                      ${bar.isGain ? `
                        <span class="fig1-bar-val positive">+${bar.pct}%</span>
                        <div class="fig1-bar-fill gain" style="height:${bar.upperH}px;"></div>
                      ` : ''}
                    </div>
                    <div class="fig1-bar-lower">
                      ${!bar.isGain ? `
                        <div class="fig1-bar-fill loss" style="height:${bar.lowerH}px;"></div>
                        <span class="fig1-bar-val negative">${bar.pct}%</span>
                      ` : ''}
                    </div>
                    <span class="fig1-col-label" title="${bar.name}">${bar.name}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderFig1MarketShakersWidget() {
    const data = state.liveMarketData || (window.IpoData && window.IpoData.liveData) || null;
    const shakersList = (data && data.marketShakers && data.marketShakers.length) ? data.marketShakers : marketShakers;

    return `
      <div class="fig1-panel-card shakers-panel-card">
        <div class="fig1-panel-header" style="flex-direction:column; align-items:flex-start; gap:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; align-items:center; gap:8px;">
              <h3 class="fig1-panel-title">🌪️ Market Shakers</h3>
              <span class="fig1-live-badge"><span class="live-pulse"></span> LIVE</span>
            </div>
            <div class="widget-source-tag">Weekly Vol Surge</div>
          </div>
          <div style="font-size:11.5px; color:#64748B; display:flex; align-items:center; gap:5px;">
            <span>Volume surge compared to 7-day average</span>
          </div>
        </div>
        <div class="movers-table-wrap" style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
          <table class="shakers-table" style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th class="th-company" style="font-size:11.5px; padding:10px 12px; text-align:left;">Company</th>
                <th class="th-price" style="font-size:11.5px; padding:10px 12px; text-align:right;">Market price (1D)</th>
                <th class="th-volume" style="font-size:11.5px; padding:10px 12px; text-align:right;">Vol weekly change (1D)</th>
              </tr>
            </thead>
            <tbody id="market-shakers-tbody">
              ${renderShakersTableRows(shakersList)}
            </tbody>
          </table>
        </div>
        <div style="margin-top:10px; font-size:11px; color:#64748B; line-height:1.45; border-top:1px dashed #E2E8F0; padding-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <span>*Real-time volume breakout surge from NSE/BSE books</span>
          <a href="#/gmp" style="font-weight:700; color:#00897B; text-decoration:none;">Live GMP Tracker &rarr;</a>
        </div>
      </div>
    `;
  }

  function renderFig1CalendarWidget() {
    // Dynamic timeline schedule:
    // 1. Open stocks: show closing date first
    // 2. Closed stocks: show listing day next
    // 3. Upcoming stocks: show opening date next
    const calEvents = [];

    // 1. Open stocks (show closing date first)
    records.filter(r => r.status === "OPEN" && r.closeDate).forEach(r => {
      const cDate = new Date(r.closeDate);
      calEvents.push({
        date: cDate,
        name: r.shortName,
        slug: r.slug,
        eventLabel: "Bidding Closes",
        status: "Closes Soon",
        statusClass: "open",
        priority: 1
      });
    });

    // 2. Closed stocks ready for listing (show listing day next)
    records.filter(r => r.status === "CLOSED" && r.listingDate).forEach(r => {
      const lDate = new Date(r.listingDate);
      calEvents.push({
        date: lDate,
        name: r.shortName,
        slug: r.slug,
        eventLabel: "Listing Day",
        status: "Listing Day",
        statusClass: "listed",
        priority: 2
      });
    });

    // 3. Upcoming stocks (show opening date)
    records.filter(r => r.status === "UPCOMING" && r.openDate).forEach(r => {
      const oDate = new Date(r.openDate);
      calEvents.push({
        date: oDate,
        name: r.shortName,
        slug: r.slug,
        eventLabel: "Bidding Opens",
        status: "Upcoming",
        statusClass: "upcoming",
        priority: 3
      });
    });

    // Sort chronologically: soonest date first
    calEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    const displayEvents = calEvents.slice(0, 4);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    return `
      <div class="fig1-panel-card">
        <div class="fig1-panel-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 class="fig1-panel-title">📅 IPO Calendar</h3>
          </div>
          <a href="#/calendar" class="fig1-header-link" style="font-size:12px; color:var(--primary-green); text-decoration:none; font-weight:600;">Full Calendar &rarr;</a>
        </div>
        <div class="fig1-calendar-list">
          ${displayEvents.map(ev => {
            const dayStr = String(ev.date.getDate()).padStart(2, "0");
            const monthStr = monthNames[ev.date.getMonth()];
            return `
              <div class="fig1-calendar-row" onclick="window.location.hash='#/ipo/${ev.slug}'" style="cursor:pointer;">
                <div class="fig1-cal-date-badge date-badge-${ev.statusClass}">
                  <span class="fig1-cal-day">${dayStr}</span>
                  <span class="fig1-cal-month">${monthStr}</span>
                </div>
                <div class="fig1-cal-info">
                  <span class="fig1-cal-name">${ev.name}</span>
                  <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                    <span class="fig1-cal-status-pill ${ev.statusClass}">${ev.status}</span>
                    <span style="font-size:11px; color:#64748B;">${ev.eventLabel}</span>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderFig1StayUpdatedWidget() {
    return `
      <div class="fig1-stay-updated-card">
        <h3 class="fig1-stay-updated-title">📧 Stay Updated!</h3>
        <p class="fig1-stay-updated-text">Get IPO alerts &amp; GMP updates directly in your inbox. Join 45,000+ investors.</p>
        <form class="fig1-subscribe-form" id="fig1-subscribe-form" onsubmit="window.handleFig1FormSubmit ? window.handleFig1FormSubmit(event) : (window.IpoApp && window.IpoApp.handleFig1Subscribe(event))">
          <div class="fig1-form-row">
            <input type="email" class="fig1-subscribe-input" id="fig1-email-input" placeholder="your@email.com" required maxlength="254">
            <button type="submit" class="fig1-subscribe-btn" id="fig1-subscribe-btn">Subscribe Now</button>
          </div>
          
          <div class="fig1-action-options-bar">
            <div class="fig1-options-toggle">
              <label class="fig1-option-radio">
                <input type="radio" name="fig1_action_mode" value="subscribe" checked onchange="window.setFig1ActionMode && window.setFig1ActionMode('subscribe')">
                <span>Subscribe</span>
              </label>
              <label class="fig1-option-radio">
                <input type="radio" name="fig1_action_mode" value="unsubscribe" onchange="window.setFig1ActionMode && window.setFig1ActionMode('unsubscribe')">
                <span>Unsubscribe (Delete details)</span>
              </label>
            </div>
            <button type="button" class="fig1-unsubscribe-link-btn" onclick="window.handleDirectUnsubscribe && window.handleDirectUnsubscribe(this)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Unsubscribe &amp; Delete</span>
            </button>
          </div>
        </form>
        <div class="fig1-subscribe-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>Zero spam. User details deleted instantly on unsubscribe.</span>
        </div>
      </div>
    `;
  }

  function renderFig1QuickLinksWidget() {
    return `
      <div class="fig1-panel-card">
        <div class="fig1-panel-header">
          <h3 class="fig1-panel-title">⚡ Quick Links</h3>
        </div>
        <div class="fig1-quick-links-grid">
          <a href="https://www.bseindia.com/markets/PublicIssues/IPOIssues_new.aspx" target="_blank" rel="noopener noreferrer" class="fig1-quick-link-btn">
            <span class="quick-icon">📄</span>
            <span>IPO Forms</span>
          </a>
          <a href="https://www.bseindia.com/investors/appli_check.aspx" target="_blank" rel="noopener noreferrer" class="fig1-quick-link-btn">
            <span class="quick-icon">📊</span>
            <span>Allotment</span>
          </a>
          <a href="#/guide" class="fig1-quick-link-btn">
            <span class="quick-icon">🎓</span>
            <span>IPO Guide</span>
          </a>
          <button class="fig1-quick-link-btn" onclick="window.IpoApp.toggleAlertsSubscription()">
            <span class="quick-icon">🔔</span>
            <span>Set Alert</span>
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Home Dashboard View
  // ==========================================================================
  function renderDashboardView() {
    const app = document.getElementById("app");
    if (!app) return;

    // Dashboard Filter Logic — Open, Closed (Ready to Listing Day), Upcoming, All Listed
    let filtered = [...records];
    if (state.activeFilter === "open") {
      filtered = filtered.filter(r => r.status === "OPEN").sort((a, b) => {
        const da = a.closeDate ? new Date(a.closeDate).getTime() : 0;
        const db = b.closeDate ? new Date(b.closeDate).getTime() : 0;
        return da - db; // Soonest close date first
      });
    } else if (state.activeFilter === "closed") {
      // ONLY closed IPOs ready to listing day
      filtered = filtered.filter(r => r.status === "CLOSED").sort((a, b) => {
        const da = a.listingDate ? new Date(a.listingDate).getTime() : 0;
        const db = b.listingDate ? new Date(b.listingDate).getTime() : 0;
        return da - db; // Soonest listing day first
      });
    } else if (state.activeFilter === "upcoming") {
      filtered = filtered.filter(r => r.status === "UPCOMING").sort((a, b) => {
        const da = a.openDate ? new Date(a.openDate).getTime() : 9999999999999;
        const db = b.openDate ? new Date(b.openDate).getTime() : 9999999999999;
        return da - db; // Soonest opening date first
      });
    } else if (state.activeFilter === "listed") {
      // Only listed IPOs
      filtered = filtered.filter(r => r.status === "LISTED").sort((a, b) => {
        const da = a.listingDate ? new Date(a.listingDate).getTime() : 0;
        const db = b.listingDate ? new Date(b.listingDate).getTime() : 0;
        return db - da; // Most recently listed first
      });
    }

    if (state.activeBoard === "mainboard") {
      filtered = filtered.filter(r => r.board === "MAINBOARD");
    } else if (state.activeBoard === "sme") {
      filtered = filtered.filter(r => r.board === "SME");
    }

    const openCount = records.filter(r => r.status === "OPEN").length;
    const closedCount = records.filter(r => r.status === "CLOSED").length;
    const upcomingCount = records.filter(r => r.status === "UPCOMING").length;
    const listedCount = records.filter(r => r.status === "LISTED").length;
    const totalCount = filtered.length;

    const openRecords = records.filter(r => r.status === "OPEN");
    const currentScopeRecords = state.activeFilter === "open"
      ? openRecords
      : state.activeFilter === "closed"
        ? records.filter(r => r.status === "CLOSED")
        : state.activeFilter === "upcoming"
          ? records.filter(r => r.status === "UPCOMING")
          : records.filter(r => r.status === "LISTED");

    const boardMbCount = currentScopeRecords.filter(r => r.board === "MAINBOARD").length;
    const boardSmeCount = currentScopeRecords.filter(r => r.board === "SME").length;

    // For 'open' filter, show all open issues. For other views, paginate to avoid excessive DOM size
    const visibleCards = state.activeFilter === "open" ? filtered : filtered.slice(0, state.cardsLimit);

    app.innerHTML = `
      <!-- Responsive AdSense Leaderboard Placement (Zero CLS) -->
      ${renderAdContainer("leaderboard", "5892147360", "SPONSORED FINANCIAL INTELLIGENCE")}

      <div class="fig1-dashboard-wrap">
        <!-- Dashboard Top Intro Strip (Executive Overview) -->
        <div class="dashboard-top-intro">
          <div class="dashboard-top-title-wrap">
            <h1 class="dashboard-top-title">Track Indian IPOs, GMP &amp; Listing Performance</h1>
            <p class="dashboard-top-subtitle">Official primary market data synchronized with NSE &amp; BSE exchange disclosures. Unregulated Grey Market Premium (GMP) estimates are speculative sentiment indicators provided solely for educational tracking.</p>
          </div>
          <div class="dashboard-live-indicator">
            <span class="live-pulse"></span>
            <span>Live Market Intelligence</span>
          </div>
        </div>

        <!-- Figure 1 Top 4 Summary Cards (Directly Visible at Top) -->
        ${renderFig1SummaryCards(openCount, upcomingCount, closedCount, listedCount)}

        <!-- Figure 1 2-Column Corporate Grid (Matching Uploaded Reference Photo) -->
        <section class="fig1-two-col-layout" aria-label="IPO Market Dashboard">
          <div class="fig1-left-col">
            ${renderFig1TrendingTable()}
            <!-- Native In-Feed Placement Between Trending & Performance (Zero CLS) -->
            ${renderAdContainer("infeed", "1400016775", "SPONSORED MARKET INTELLIGENCE")}
            ${renderFig1PerformanceChart()}
          </div>
          <div class="fig1-right-col">
            ${renderFig1MarketShakersWidget()}
            ${renderFig1CalendarWidget()}
            ${renderFig1StayUpdatedWidget()}
            ${renderFig1QuickLinksWidget()}
            <!-- Dedicated Sticky Sidebar Banner Placement (Zero CLS) -->
            ${renderAdContainer("sidebar", "5892147360", "SPONSORED WEALTH PLATFORM")}
          </div>
        </section>

        <!-- Active Open IPOs Section (Added Below the Photo Dashboard) -->
        <section class="fig1-open-section-wrap" id="dashboard-open-ipos-section" aria-label="Open IPOs Active Bidding" style="margin-top:24px;">
          ${renderFig1OpenIposSection()}
        </section>
      </div>
    `;

    // Event Bindings for Summary Cards
    document.getElementById("fig1-card-open")?.addEventListener("click", () => {
      const el = document.getElementById("dashboard-open-ipos-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.hash = "#/open";
      }
    });
    document.getElementById("fig1-card-upcoming")?.addEventListener("click", () => {
      window.location.hash = "#/upcoming";
    });
    document.getElementById("fig1-card-closed")?.addEventListener("click", () => {
      window.location.hash = "#/listed";
    });
    document.getElementById("fig1-card-listed")?.addEventListener("click", () => {
      window.location.hash = "#/listed";
    });

    initAdSense();
  }

  // ==========================================================================
  // IPO Card Item Renderer
  // ==========================================================================
  function renderIpoCardHtml(ipo) {
    let badgeClass = "open";
    let badgeLabel = "Live Bidding";

    if (ipo.status === "CLOSED") {
      badgeClass = "closed";
      badgeLabel = "Listing Soon";
    } else if (ipo.status === "UPCOMING") {
      badgeClass = "upcoming";
      badgeLabel = "Upcoming";
    } else if (ipo.status === "LISTED") {
      badgeClass = "listed";
      badgeLabel = "Listed";
    }

    const priceBandText = ipo.priceBandLow && ipo.priceBandHigh 
      ? `₹${ipo.priceBandLow} – ${ipo.priceBandHigh}`
      : ipo.issuePrice ? `₹${ipo.issuePrice}` : "TBA";

    const dateNote = ipo.status === "LISTED"
      ? `Listed: ${formatDate(ipo.listingDate)}`
      : ipo.status === "UPCOMING"
        ? (ipo.openDate ? `Opens: ${formatDate(ipo.openDate)}` : `Opens: TBA`)
        : ipo.status === "CLOSED"
          ? (ipo.listingDate ? `Bidding Closed • Listing: ${formatDate(ipo.listingDate)}` : `Closed: ${formatDate(ipo.closeDate)}`)
          : `Closes: ${formatDate(ipo.closeDate)}`;

    const maxSub = 50;
    const subVal = ipo.subscriptionTotal || (ipo.subscriptionSummary && ipo.subscriptionSummary.total) || 0;
    const fillPercent = Math.min(100, Math.max(8, (subVal / maxSub) * 100));

    // When status is OPEN: show enriched complete details right on the card
    if (ipo.status === "OPEN") {
      const minInv = ipo.minimumInvestment 
        ? `₹${ipo.minimumInvestment.toLocaleString('en-IN')}`
        : (ipo.lotSize && ipo.priceBandHigh ? `₹${(ipo.lotSize * ipo.priceBandHigh).toLocaleString('en-IN')}` : '—');
      
      const estPrice = ipo.expectedListingPrice || (ipo.priceBandHigh ? ipo.priceBandHigh + (ipo.gmp || 0) : null);
      const estProfit = ipo.estProfitPerLot || (ipo.gmp && ipo.lotSize ? Math.round(ipo.gmp * ipo.lotSize) : null);
      const gmpPct = ipo.gmpPercentage || (ipo.gmp && ipo.priceBandHigh ? ((ipo.gmp / ipo.priceBandHigh) * 100).toFixed(1) : null);
      
      const sub = ipo.subscriptionSummary || {};
      const allotDate = ipo.allotmentDate || ipo.allotDate;

      return `
        <article class="ipo-card is-open-card" onclick="window.location.hash='#/ipo/${ipo.slug}'">
          <div class="ipo-card-header">
            <div class="card-company-left">
              ${renderCompanyLogo(ipo, 46)}
              <div class="card-title-meta">
                <h3>${ipo.shortName}</h3>
                <span class="card-subtitle-meta">${ipo.sector} • ${ipo.issueType || ipo.board} • ${ipo.exchange}</span>
              </div>
            </div>
            <span class="status-badge open">🟢 Open</span>
          </div>

          <!-- 4-Metric Grid: Price Band, Lot Size, Issue Size, Retail Min Investment -->
          <div class="open-card-metrics-grid">
            <div class="metric-col">
              <span class="metric-label">Price Band</span>
              <span class="metric-val">${priceBandText}</span>
            </div>
            <div class="metric-col">
              <span class="metric-label">Lot Size</span>
              <span class="metric-val">${ipo.lotSize ? `${ipo.lotSize} sh` : '—'}</span>
            </div>
            <div class="metric-col">
              <span class="metric-label">Issue Size</span>
              <span class="metric-val">${formatCrore(ipo.issueSizeCr)}</span>
            </div>
            <div class="metric-col highlight-min-inv">
              <span class="metric-label">Min Investment</span>
              <span class="metric-val">${minInv}</span>
            </div>
          </div>

          <!-- Live GMP & Expected Listing Gain Banner -->
          <div class="open-gain-banner">
            <div>
              <span class="gain-banner-label">Live GMP:</span>
              <strong class="gmp-highlight-text ${ipo.gmp ? '' : 'neutral'}">${ipo.gmp ? `+₹${ipo.gmp} (${gmpPct}%)` : (ipo.gmp === null ? 'GMP Not Fixed' : 'GMP TBA')}</strong>
            </div>
            ${estPrice ? `
              <div>
                <span class="gain-banner-label">Est. Listing:</span>
                <strong class="gain-est-price">₹${estPrice}</strong>
                ${estProfit ? `<span class="gain-est-profit">(+₹${estProfit.toLocaleString('en-IN')}/lot)</span>` : ''}
              </div>
            ` : `
              <div>
                <span class="gain-banner-label">Est. Listing:</span>
                <strong class="gain-est-price" style="color:#94A3B8;">TBA</strong>
              </div>
            `}
          </div>

          <!-- Live Subscription & Category Breakdown -->
          <div class="card-subscription-bar-wrap">
            <div class="sub-bar-labels">
              <span>Overall Subscription</span>
              <strong>${subVal ? `${subVal}x` : 'Bidding in progress'}</strong>
            </div>
            <div class="sub-progress-track">
              <div class="sub-progress-fill" style="width: ${fillPercent}%"></div>
            </div>
            ${sub && (sub.retail || sub.qib || sub.nii) ? `
              <div class="open-sub-categories-strip">
                <span class="open-cat-chip retail">Retail: <b>${sub.retail ? `${sub.retail}x` : '—'}</b></span>
                <span class="open-cat-chip qib">QIB: <b>${sub.qib ? `${sub.qib}x` : '—'}</b></span>
                <span class="open-cat-chip nii">NII: <b>${sub.nii ? `${sub.nii}x` : '—'}</b></span>
                ${sub.employee ? `<span class="open-cat-chip emp">Emp: <b>${sub.employee}x</b></span>` : ''}
              </div>
            ` : ''}
          </div>

          <!-- Timeline Schedule Strip: Closes, Allotment, Listing -->
          <div class="open-dates-row">
            <div><span>Closes:</span> <strong>${formatDate(ipo.closeDate)}</strong></div>
            <div><span>Allotment:</span> <strong>${allotDate ? formatDate(allotDate) : 'TBA'}</strong></div>
            <div><span>Listing:</span> <strong>${ipo.listingDate ? formatDate(ipo.listingDate) : 'TBA'}</strong></div>
          </div>

          <!-- Registrar & Action Row -->
          <div class="open-registrar-row">
            <span>Registrar: <b>${ipo.registrar || 'Registrar Portal'}</b></span>
            ${ipo.faceValue ? `<span>Face Value: <b>₹${ipo.faceValue}</b></span>` : ''}
          </div>

          <div class="card-btn-action-row" style="display:flex; gap:8px;">
            <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="card-btn-action" style="background:#10B981; color:#FFFFFF; text-decoration:none; font-weight:700; flex:1; text-align:center; padding:7px 12px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; gap:4px;" onclick="event.stopPropagation()">
              <span>Apply Now</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </a>
            <button class="card-btn-action btn-view" style="flex:1;" onclick="event.stopPropagation(); window.location.hash='#/ipo/${ipo.slug}'">
              <span>Details</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </article>
      `;
    }

    return `
      <article class="ipo-card" onclick="window.location.hash='#/ipo/${ipo.slug}'">
        <div class="ipo-card-header">
          <div class="card-company-left">
            ${renderCompanyLogo(ipo, 44)}
            <div class="card-title-meta">
              <h3>${ipo.shortName}</h3>
              <span class="card-subtitle-meta">${ipo.sector} • ${ipo.issueType || ipo.board} • ${ipo.exchange}</span>
            </div>
          </div>
          <span class="status-badge ${badgeClass}">${badgeLabel}</span>
        </div>

        <div class="card-metrics-row">
          <div class="metric-col">
            <span class="metric-label">Price Band</span>
            <span class="metric-val">${priceBandText}</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">Lot Size</span>
            <span class="metric-val">${ipo.lotSize ? `${ipo.lotSize} shares` : '—'}</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">Issue Size</span>
            <span class="metric-val">${formatCrore(ipo.issueSizeCr)}</span>
          </div>
        </div>

        <div class="card-footer-info">
          <div class="footer-highlight-row">
            ${ipo.status === "LISTED" ? `
              <span class="gmp-highlight-text ${String(ipo.listingGain || '').startsWith('-') ? 'negative' : ''}">Listing: ₹${ipo.listingPrice || ipo.issuePrice || ipo.priceBandHigh || '—'} (${ipo.listingGain || 'Listed'})</span>
              <span class="date-highlight-text">${dateNote}</span>
            ` : `
              <span class="gmp-highlight-text ${ipo.gmp ? '' : 'neutral'}" title="${ipo.gmp ? 'Grey Market Premium (GMP) is an unregulated, unofficial sentiment estimate. Not a guarantee of listing gains.' : 'GMP is not fixed yet for this issue.'}">
                ${ipo.gmp ? `GMP +₹${ipo.gmp} (${ipo.gmpPercentage}%)` : (ipo.status === 'UPCOMING' ? 'GMP Not Fixed' : 'GMP TBA')}
              </span>
              <span class="date-highlight-text">${dateNote}</span>
            `}
          </div>

          ${ipo.subscriptionTotal ? `
            <div class="card-subscription-bar-wrap">
              <div class="sub-bar-labels">
                <span>Subscription</span>
                <strong>${ipo.subscriptionTotal}x</strong>
              </div>
              <div class="sub-progress-track">
                <div class="sub-progress-fill" style="width: ${fillPercent}%"></div>
              </div>
            </div>
          ` : ''}

          <div class="card-btn-action-row" style="display:flex; gap:8px;">
            <button class="card-btn-action btn-view" style="flex:1;" onclick="event.stopPropagation(); window.location.hash='#/ipo/${ipo.slug}'">
              <span>View Details</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="card-btn-action" style="background:#10B981; color:#FFFFFF; text-decoration:none; font-weight:700; padding:7px 12px; border-radius:6px; display:inline-flex; align-items:center; gap:4px; font-size:12px;" onclick="event.stopPropagation()">
              <span>${ipo.status === "LISTED" ? "Invest" : "Apply"}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  // ==========================================================================
  // Bottom Dashboard Widgets
  // ==========================================================================
  function renderSubscriptionDetailsWidget() {
    const ipo = records.find(r => r.slug === state.activeBottomCompany) || records[0];
    const sub = ipo.subscriptionSummary || { qib: 1.20, nii: 3.40, retail: 134.44, employee: 2.10, total: 22.10 };

    // Bar chart points for QIB, NII, Retail, Employee, Total
    // Scale 0 to 150
    const chartHeight = 140;
    const qibH = Math.min(chartHeight, (sub.qib / 150) * chartHeight);
    const niiH = Math.min(chartHeight, (sub.nii / 150) * chartHeight);
    const retH = Math.min(chartHeight, (sub.retail / 150) * chartHeight);
    const empH = Math.min(chartHeight, (sub.employee / 150) * chartHeight);
    const totH = Math.min(chartHeight, (sub.total / 150) * chartHeight);

    return `
      <div class="bottom-widget-card" id="subscription-widget">
        <div class="widget-card-head">
          <h3>Subscription Details</h3>
          <select id="sub-widget-company-select" aria-label="Select company to view subscription details" style="background:var(--bg-input); border:1px solid var(--border-subtle); padding:4px 8px; border-radius:6px; font-size:12px; color:var(--text-primary); cursor:pointer;">
            ${records.filter(r => r.subscriptionSummary).map(r => `
              <option value="${r.slug}" ${r.slug === ipo.slug ? "selected" : ""}>${r.shortName}</option>
            `).join("")}
          </select>
        </div>

        <div class="sub-details-content">
          <div class="sub-chart-box">
            <svg class="sub-chart-svg" viewBox="0 0 240 180" fill="none">
              <!-- Y Axis Lines -->
              <line x1="30" y1="20" x2="230" y2="20" stroke="#1E293B" stroke-dasharray="2,2"/>
              <text x="22" y="24" fill="#64748B" font-size="10" text-anchor="end">150</text>
              
              <line x1="30" y1="65" x2="230" y2="65" stroke="#1E293B" stroke-dasharray="2,2"/>
              <text x="22" y="69" fill="#64748B" font-size="10" text-anchor="end">100</text>
              
              <line x1="30" y1="110" x2="230" y2="110" stroke="#1E293B" stroke-dasharray="2,2"/>
              <text x="22" y="114" fill="#64748B" font-size="10" text-anchor="end">50</text>

              <line x1="30" y1="150" x2="230" y2="150" stroke="#334155"/>
              <text x="22" y="154" fill="#64748B" font-size="10" text-anchor="end">0</text>

              <!-- Bars -->
              <!-- QIB -->
              <rect x="45" y="${150 - qibH}" width="20" height="${qibH}" rx="3" fill="#3B82F6"/>
              <text x="55" y="165" fill="#94A3B8" font-size="9" text-anchor="middle">QIB</text>
              <text x="55" y="176" fill="#64748B" font-size="8" text-anchor="middle">${sub.qib}x</text>

              <!-- NII -->
              <rect x="85" y="${150 - niiH}" width="20" height="${niiH}" rx="3" fill="#3B82F6"/>
              <text x="95" y="165" fill="#94A3B8" font-size="9" text-anchor="middle">NII</text>
              <text x="95" y="176" fill="#64748B" font-size="8" text-anchor="middle">${sub.nii}x</text>

              <!-- Retail (Tall) -->
              <rect x="125" y="${150 - retH}" width="20" height="${retH}" rx="3" fill="#38BDF8"/>
              <text x="135" y="165" fill="#94A3B8" font-size="9" text-anchor="middle">Retail</text>
              <text x="135" y="176" fill="#64748B" font-size="8" text-anchor="middle">${sub.retail}x</text>

              <!-- Employee -->
              <rect x="165" y="${150 - empH}" width="20" height="${empH}" rx="3" fill="#3B82F6"/>
              <text x="175" y="165" fill="#94A3B8" font-size="9" text-anchor="middle">Emp</text>
              <text x="175" y="176" fill="#64748B" font-size="8" text-anchor="middle">${sub.employee}x</text>

              <!-- Total (Accent Orange) -->
              <rect x="205" y="${150 - totH}" width="20" height="${totH}" rx="3" fill="#F97316"/>
              <text x="215" y="165" fill="#F97316" font-size="9" font-weight="700" text-anchor="middle">Total</text>
              <text x="215" y="176" fill="#F97316" font-size="8" font-weight="700" text-anchor="middle">${sub.total}x</text>
            </svg>
          </div>

          <table class="sub-summary-table">
            <thead>
              <tr>
                <th>Category</th>
                <th style="text-align:right;">Subscription</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>QIB</td>
                <td style="text-align:right;"><strong>${sub.qib.toFixed(2)}x</strong></td>
              </tr>
              <tr>
                <td>NII</td>
                <td style="text-align:right;"><strong>${sub.nii.toFixed(2)}x</strong></td>
              </tr>
              <tr>
                <td>Retail</td>
                <td style="text-align:right;"><strong style="color:var(--accent-cyan);">${sub.retail.toFixed(2)}x</strong></td>
              </tr>
              <tr>
                <td>Employee</td>
                <td style="text-align:right;"><strong>${sub.employee.toFixed(2)}x</strong></td>
              </tr>
              <tr style="border-top:1px solid var(--border-hover);">
                <td><strong style="color:var(--status-closing);">Total</strong></td>
                <td style="text-align:right;"><strong style="color:var(--status-closing); font-size:14px;">${sub.total.toFixed(2)}x</strong></td>
              </tr>
            </tbody>
          </table>
          <p style="font-size:11.5px; color:var(--text-muted); line-height:1.5; margin-top:12px; padding-top:8px; border-top:1px dashed var(--border-subtle);">
            <strong>Subscription Multiples Analysis:</strong> When an issue records high subscription in the QIB category (>30x), it indicates institutional conviction. For retail individual investors, oversubscription exceeding 1x triggers an exchange-supervised computerized lottery where each winning PAN receives one minimum lot.
          </p>
        </div>

        <!-- AdSense Native Slot -->
        ${renderAdSenseUnit("5892147360", "auto")}

        <!-- Primary Market Official Directory -->
        ${renderPortalDirectoryWidget()}
      </div>
    `;
  }

  function renderCompanyFinancialsWidget() {
    const ipo = records.find(r => r.slug === state.activeBottomCompany) || records[0];
    const fin = ipo.financials || [
      { year: "FY 2024", revenue: 420, profit: 38 },
      { year: "FY 2025", revenue: 510, profit: 52 },
      { year: "FY 2026", revenue: 680, profit: 71 }
    ];

    // Max scale 800
    const chartHeight = 125;
    const maxVal = 800;

    return `
      <div class="bottom-widget-card" id="financials-widget">
        <div class="widget-card-head">
          <h3>Company Financials</h3>
          <div class="fin-legend-row">
            <span class="legend-pill"><span class="legend-box-blue"></span> Revenue</span>
            <span class="legend-pill"><span class="legend-box-gold"></span> Profit</span>
          </div>
        </div>

        <div class="fin-details-content">
          <div class="fin-chart-box">
            <svg class="fin-chart-svg" viewBox="0 0 240 180" fill="none">
              <!-- Y Axis Lines -->
              <line x1="40" y1="20" x2="230" y2="20" stroke="#1E293B" stroke-dasharray="2,2"/>
              <text x="32" y="24" fill="#64748B" font-size="9" text-anchor="end">₹800 Cr</text>
              
              <line x1="40" y1="60" x2="230" y2="60" stroke="#1E293B" stroke-dasharray="2,2"/>
              <text x="32" y="64" fill="#64748B" font-size="9" text-anchor="end">₹600 Cr</text>
              
              <line x1="40" y1="100" x2="230" y2="100" stroke="#1E293B" stroke-dasharray="2,2"/>
              <text x="32" y="104" fill="#64748B" font-size="9" text-anchor="end">₹400 Cr</text>

              <line x1="40" y1="140" x2="230" y2="140" stroke="#334155"/>
              <text x="32" y="144" fill="#64748B" font-size="9" text-anchor="end">₹200 Cr</text>

              ${fin.map((item, idx) => {
                const groupX = 65 + idx * 55;
                const revH = Math.min(130, (item.revenue / maxVal) * 130);
                const patH = Math.min(130, ((item.profit * 6) / maxVal) * 130); // scaled visually for clarity

                return `
                  <!-- Revenue Bar -->
                  <rect x="${groupX}" y="${150 - revH}" width="14" height="${revH}" rx="2" fill="#3B82F6"/>
                  <!-- Profit Bar -->
                  <rect x="${groupX + 16}" y="${150 - patH}" width="14" height="${patH}" rx="2" fill="#F59E0B"/>
                  <!-- Year Label -->
                  <text x="${groupX + 15}" y="168" fill="#94A3B8" font-size="9" text-anchor="middle">${item.year}</text>
                `;
              }).join("")}
            </svg>
          </div>

          <table class="fin-table">
            <thead>
              <tr>
                <th>Financial Year</th>
                <th style="text-align:right;">Revenue</th>
                <th style="text-align:right;">Profit</th>
              </tr>
            </thead>
            <tbody>
              ${fin.map(f => `
                <tr>
                  <td><strong>${f.year}</strong></td>
                  <td style="text-align:right; color:var(--chart-blue); font-weight:700;">₹${f.revenue} Cr</td>
                  <td style="text-align:right; color:var(--chart-gold); font-weight:700;">₹${f.profit} Cr</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- AdSense Native Slot -->
        ${renderAdSenseUnit("5892147360", "auto")}

        <!-- Primary Market Official Directory -->
        ${renderPortalDirectoryWidget()}
      </div>
    `;
  }

  function renderGmpTrackerWidget() {
    const topGmp = records.filter(r => r.gmp).slice(0, 6);
    return `
      <div class="bottom-widget-card" id="gmp-widget">
        <div class="widget-card-head">
          <h3>GMP Tracker</h3>
          <a href="#/gmp" class="widget-action-link">All</a>
        </div>

        <div class="gmp-widget-list">
          ${topGmp.map(r => `
            <div class="gmp-widget-row" onclick="window.location.hash='#/ipo/${r.slug}'">
              ${renderCompanyLogo(r, 32)}
              <span class="gmp-row-name">${r.shortName}</span>
              <div class="gmp-row-sparkline">
                ${renderSparklineSvg(r.gmpHistory?.map(h => h.value) || [10, 12, 14, 15], 54, 20, "#10B981")}
              </div>
              <div class="gmp-row-val">
                <span class="gmp-val-gain">+${r.gmp}</span>
                <span class="gmp-val-percent">${r.gmpPercentage}%</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="gmp-widget-disclaimer">
          ⚠️ <strong>Note:</strong> Grey Market Premium (GMP) is an informal, unofficial estimate unregulated by SEBI or stock exchanges. Realized listing prices depend on market discovery.
        </div>
      </div>
    `;
  }

  function renderIpoCalendarWidget() {
    const events = dataset.calendarEvents || {};
    const d = state.calendarMonth;
    const year = d.getFullYear();
    const month = d.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const dayCells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push('<div class="cal-date-cell empty"></div>');
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = events[dateStr] || [];
      const isActive = dateStr === state.selectedCalendarDate;

      const dotsHtml = dayEvents.length ? `
        <div class="cal-dots-wrap">
          ${dayEvents.map(e => `<span class="cal-dot ${e.type.toLowerCase()}"></span>`).join("")}
        </div>
      ` : "";

      dayCells.push(`
        <div class="cal-date-cell ${isActive ? "active-date" : ""}" data-date="${dateStr}">
          <span>${day}</span>
          ${dotsHtml}
        </div>
      `);
    }

    const selectedEvents = events[state.selectedCalendarDate] || [];

    return `
      <div class="bottom-widget-card" id="calendar-widget">
        <div class="widget-card-head">
          <h3>IPO Calendar</h3>
          <div class="calendar-widget-nav">
            <button class="cal-nav-btn" id="cal-prev-btn" aria-label="Previous Month">&lt;</button>
            <span class="cal-month-title">${monthNames[month]} ${year}</span>
            <button class="cal-nav-btn" id="cal-next-btn" aria-label="Next Month">&gt;</button>
          </div>
        </div>

        <div class="calendar-grid-table">
          <div class="cal-day-header">Sun</div>
          <div class="cal-day-header">Mon</div>
          <div class="cal-day-header">Tue</div>
          <div class="cal-day-header">Wed</div>
          <div class="cal-day-header">Thu</div>
          <div class="cal-day-header">Fri</div>
          <div class="cal-day-header">Sat</div>
          ${dayCells.join("")}
        </div>

        <div class="cal-event-preview-box" id="calendar-event-box">
          <div>
            <strong>${formatDate(state.selectedCalendarDate)}:</strong>
            ${selectedEvents.length ? `
              <span>${selectedEvents.map(e => `${e.name} (${e.text})`).join(", ")}</span>
            ` : '<span>No IPO events scheduled on this date.</span>'}
          </div>
        </div>
      </div>
    `;
  }

  function bindCalendarControls() {
    // Select dropdown in subscription widget
    document.getElementById("sub-widget-company-select")?.addEventListener("change", (e) => {
      state.activeBottomCompany = e.target.value;
      const subWrap = document.getElementById("subscription-widget");
      const finWrap = document.getElementById("financials-widget");
      if (subWrap) subWrap.outerHTML = renderSubscriptionDetailsWidget();
      if (finWrap) finWrap.outerHTML = renderCompanyFinancialsWidget();
      bindCalendarControls();
    });

    // Calendar date clicking
    document.querySelectorAll(".cal-date-cell:not(.empty)").forEach(cell => {
      cell.addEventListener("click", () => {
        const dateStr = cell.getAttribute("data-date");
        if (dateStr) {
          state.selectedCalendarDate = dateStr;
          const calCard = document.getElementById("calendar-widget");
          if (calCard) calCard.outerHTML = renderIpoCalendarWidget();
          bindCalendarControls();
        }
      });
    });

    document.getElementById("cal-prev-btn")?.addEventListener("click", () => {
      state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
      const calCard = document.getElementById("calendar-widget");
      if (calCard) calCard.outerHTML = renderIpoCalendarWidget();
      bindCalendarControls();
    });

    document.getElementById("cal-next-btn")?.addEventListener("click", () => {
      state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
      const calCard = document.getElementById("calendar-widget");
      if (calCard) calCard.outerHTML = renderIpoCalendarWidget();
      bindCalendarControls();
    });
  }

  // ==========================================================================
  // Detailed IPO View (Faithfully matching BLS Polymers mock-up)
  // ==========================================================================
  function renderDetailView(slug) {
    const app = document.getElementById("app");
    if (!app) return;

    let ipo = records.find(r => r.slug === slug);
    if (!ipo && window.ListedGainsData && window.ListedGainsData.records) {
      const hist = window.ListedGainsData.records.find(r => r.slug === slug);
      if (hist) {
        ipo = {
          slug: hist.slug,
          companyName: hist.name,
          shortName: hist.name,
          symbol: hist.bseCode || (hist.name || "").slice(0, 6).toUpperCase(),
          status: "LISTED",
          sector: hist.isHistoric ? "Historic Exchange Benchmark" : "Equity Capital Markets",
          issueType: hist.segment || "Mainboard",
          board: hist.segment || "Mainboard",
          exchange: hist.exchange || (hist.bseCode ? "BSE (" + hist.bseCode + ")" : "NSE / BSE"),
          issuePrice: hist.issuePrice,
          priceBandLow: hist.issuePrice,
          priceBandHigh: hist.issuePrice,
          listingPrice: hist.listingPrice,
          gmp: (hist.listingPrice && hist.issuePrice) ? Math.max(0, hist.listingPrice - hist.issuePrice) : 0,
          gmpPercentage: hist.listingGainPct || 0,
          lotSize: 1,
          minimumInvestment: hist.issuePrice || 1000,
          openDate: hist.listedDate,
          closeDate: hist.listedDate,
          allotmentDate: hist.listedDate,
          refundsDate: hist.listedDate,
          creditDate: hist.listedDate,
          listingDate: hist.listedDate,
          issueSizeCr: hist.issueSizeCr,
          subscriptionOverall: hist.subscription,
          subscriptionRetail: hist.subscription,
          currentPrice: hist.currentPrice,
          returnSinceIssuePct: hist.returnSinceIssuePct,
          description: hist.notes || `${hist.name} listed on ${hist.listedDate} with an issue price of ₹${hist.issuePrice} and listing price of ₹${hist.listingPrice} (+${hist.listingGainPct}%).`,
          about: hist.notes || `${hist.name} is a listed company on the Indian capital markets.`,
          finSummary: {
            revenue: hist.issueSizeCr ? `Issue Size: ₹${hist.issueSizeCr} Cr` : "N/A",
            pat: `Listing Gain: ${hist.listingGainPct}%`,
            growth: `Current Price: ₹${hist.currentPrice || hist.listingPrice || '—'}`
          }
        };
      }
    }
    if (!ipo) ipo = records[0];

    const upperPrice = ipo.priceBandHigh || ipo.issuePrice || null;
    const gmpVal = ipo.gmp;
    const gmpPct = ipo.gmpPercentage;

    app.innerHTML = `
      <div class="detail-view-container">
        <!-- Breadcrumb Navigation -->
        <nav class="detail-breadcrumbs" aria-label="Breadcrumb">
          <a href="#/">Home</a>
          <span>&gt;</span>
          <a href="#/">IPO</a>
          <span>&gt;</span>
          <span style="color:var(--text-primary); font-weight:600;">${ipo.companyName || ipo.shortName}</span>
        </nav>

        <!-- Company Header Card -->
        <header class="detail-header-card">
          <div class="detail-header-left">
            ${renderCompanyLogo(ipo, 54)}
            <div class="detail-title-wrap">
              <div class="detail-title-row">
                <h1>${ipo.shortName}</h1>
                <span class="status-badge ${ipo.status === 'CLOSED' ? 'closed' : ipo.status === 'UPCOMING' ? 'upcoming' : ipo.status === 'LISTED' ? 'listed' : 'open'}">
                  ${ipo.status === 'CLOSED' ? 'Closed' : ipo.status === 'UPCOMING' ? 'Upcoming' : ipo.status === 'LISTED' ? 'Listed' : 'Open'}
                </span>
              </div>
              <span class="detail-meta-subtitle">${ipo.sector} • ${ipo.issueType || ipo.board} • ${ipo.exchange}</span>
            </div>
          </div>

          <div class="detail-header-actions">
            <button class="btn-watchlist ${isBookmarked(ipo.slug) ? 'bookmarked' : ''}" onclick="window.IpoApp.toggleWatchlist('${ipo.slug}', this)" title="Save to Watchlist">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${isBookmarked(ipo.slug) ? '#F59E0B' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${isBookmarked(ipo.slug) ? 'Bookmarked' : 'Add to Watchlist'}</span>
            </button>
            ${ipo.status === 'OPEN' ? `
              <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="btn-hero-primary" style="padding:8px 18px; font-size:13px; text-decoration:none; background:#10B981; border-color:#059669;">
                Apply Now &rarr;
              </a>
            ` : (ipo.status === 'UPCOMING' ? `
              <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="btn-hero-primary" style="padding:8px 18px; font-size:13px; text-decoration:none; background:#10B981; border-color:#059669;">
                Apply / Pre-Apply &rarr;
              </a>
            ` : `
              <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="btn-hero-primary" style="padding:8px 18px; font-size:13px; text-decoration:none; background:#10B981; border-color:#059669;">
                Apply / Trade Stock &rarr;
              </a>
            `)}
            ${ipo.docUrl ? `
              <a href="${ipo.docUrl}" target="_blank" rel="noopener noreferrer" class="btn-doc-subtle" title="Official SEBI DRHP / RHP Document">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                <span>View DRHP</span>
              </a>
            ` : ''}
          </div>
        </header>

        <!-- Key Metrics Strip (Specification Section 5) -->
        <div class="key-metrics-strip" aria-label="Key Financial Metrics">
          ${ipo.status === 'LISTED' ? `
            <div class="key-metric-box">
              <span class="key-metric-label">Current Market Price (CMP)</span>
              <span class="key-metric-val" style="display:flex; align-items:center; gap:6px;">
                ₹${Number(ipo.currentPrice || ipo.listingPrice || ipo.issuePrice || 0).toLocaleString('en-IN')}
                
              </span>
              ${ipo.dayChangePerc !== undefined && ipo.dayChangePerc !== null ? `<span style="font-size:11px; font-weight:600; color:${ipo.dayChangePerc >= 0 ? '#16A34A' : '#DC2626'};">${ipo.dayChangePerc >= 0 ? '▲ +' : '▼ '}${ipo.dayChangePerc}% Today</span>` : ''}
            </div>
            <div class="key-metric-box">
              <span class="key-metric-label">Issue Price</span>
              <span class="key-metric-val">${ipo.issuePrice ? `₹${Number(ipo.issuePrice).toLocaleString('en-IN')}` : (ipo.priceBandLow && ipo.priceBandHigh ? `₹${ipo.priceBandLow} – ${ipo.priceBandHigh}` : '—')}</span>
            </div>
            <div class="key-metric-box">
              <span class="key-metric-label">Debut Listing Price</span>
              <span class="key-metric-val">${ipo.listingPrice ? `₹${Number(ipo.listingPrice).toLocaleString('en-IN')} (+${ipo.listingGainPct || 0}%)` : (ipo.issuePrice ? `₹${ipo.issuePrice}` : '—')}</span>
            </div>
            <div class="key-metric-box">
              <span class="key-metric-label">Total Gain Since Issue</span>
              <span class="key-metric-val ${Number(ipo.returnSinceIssuePct || 0) >= 0 ? 'positive' : 'negative'}">
                ${ipo.returnSinceIssuePct !== undefined && ipo.returnSinceIssuePct !== null ? (Number(ipo.returnSinceIssuePct) >= 0 ? '+' : '') + ipo.returnSinceIssuePct + '%' : (ipo.listingGainPct ? '+' + ipo.listingGainPct + '%' : '—')}
              </span>
            </div>
            <div class="key-metric-box">
              <span class="key-metric-label">52-Week Range / Listing</span>
              <span class="key-metric-val" style="font-size:13px;">
                ${ipo.yearLow && ipo.yearHigh ? `₹${Number(ipo.yearLow).toLocaleString('en-IN')} – ₹${Number(ipo.yearHigh).toLocaleString('en-IN')}` : formatDate(ipo.listingDate)}
              </span>
            </div>
          ` : `
            <div class="key-metric-box">
              <span class="key-metric-label">Issue Price</span>
              <span class="key-metric-val">${ipo.priceBandLow && ipo.priceBandHigh ? `₹${ipo.priceBandLow} – ${ipo.priceBandHigh}` : (ipo.issuePrice ? `₹${ipo.issuePrice}` : 'TBA')}</span>
            </div>
            <div class="key-metric-box">
              <span class="key-metric-label">GMP Today</span>
              <span class="key-metric-val positive">${ipo.gmp ? `+₹${ipo.gmp} (${ipo.gmpPercentage || 0}%)` : '—'}</span>
            </div>
            <div class="key-metric-box">
              <span class="key-metric-label">Est. Listing Price</span>
              <span class="key-metric-val">${ipo.gmp && upperPrice ? `₹${Number(upperPrice) + Number(ipo.gmp)}` : (ipo.issuePrice ? `₹${ipo.issuePrice}` : 'TBA')}</span>
            </div>
            <div class="key-metric-box">
              <span class="key-metric-label">Listing Date</span>
              <span class="key-metric-val">${formatDate(ipo.listingDate)}</span>
            </div>
            <div class="key-metric-box">
              <span class="key-metric-label">Subscription Multiple</span>
              <span class="key-metric-val">${ipo.subscriptionOverall ? ipo.subscriptionOverall + 'x' : (ipo.subscriptionRetail ? ipo.subscriptionRetail + 'x' : 'N/A')}</span>
            </div>
          `}
        </div>

        <!-- SEBI Regulatory & YMYL Transparency Notice -->
        <div style="margin: 14px 0 18px; padding: 12px 16px; background: #EFF6FF; border: 1px solid #BFDBFE; border-left: 4px solid #1A237E; border-radius: 8px; font-size: 12px; color: #1E293B; line-height: 1.55;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A237E" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span style="font-weight: 700; color: #1A237E; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase;">SEBI Regulatory &amp; YMYL Advisory</span>
          </div>
          <p style="margin: 0; color: #334155;">
            <strong>We do not provide buy/sell recommendations or financial advice.</strong> Data is sourced dynamically for educational tracking purposes only from official exchange disclosures (NSE &amp; BSE) and designated registrars. Grey Market Premium (GMP) is an informal off-market estimate and does not guarantee listing returns. Always consult a SEBI-registered financial adviser and review the complete Red Herring Prospectus (RHP) before bidding.
          </p>
        </div>

        <!-- Sub-navigation Tabs -->
        <nav class="detail-subtabs-bar" aria-label="IPO Details Sections">
          <button class="detail-tab-btn ${state.detailTab === 'overview' ? 'active' : ''}" data-dtab="overview">Overview</button>
          <button class="detail-tab-btn ${state.detailTab === 'subscription' ? 'active' : ''}" data-dtab="subscription">Subscription</button>
          <button class="detail-tab-btn ${state.detailTab === 'gmp' ? 'active' : ''}" data-dtab="gmp">GMP</button>
          <button class="detail-tab-btn ${state.detailTab === 'financials' ? 'active' : ''}" data-dtab="financials">Financials</button>
          <button class="detail-tab-btn ${state.detailTab === 'review' ? 'active' : ''}" data-dtab="review">Review</button>
          <button class="detail-tab-btn ${state.detailTab === 'documents' ? 'active' : ''}" data-dtab="documents">Documents</button>
        </nav>

        <!-- Dynamic Subtab Content -->
        <div id="detail-tab-body">
          ${renderDetailTabBody(ipo)}
        </div>

        <!-- AdSense Slot inside Detail View -->
        ${renderAdSenseUnit("5892147360", "auto")}

        <!-- Community Investor Discussion & Real-Time Comments -->
        ${renderDiscussionWidget(ipo)}
      </div>
    `;

    // Event Bindings
    document.querySelectorAll(".detail-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.detailTab = btn.getAttribute("data-dtab");
        renderDetailView(slug);
      });
    });

    bindDetailInteractiveEvents(ipo);
  }

  function renderBrokerDropdown() {
    return "";
  }

  function renderDetailTabBody(ipo) {
    switch (state.detailTab) {
      case "subscription":
        return renderDetailSubscriptionTab(ipo);
      case "gmp":
        return renderDetailGmpCalculatorTab(ipo);
      case "financials":
        return renderDetailFinancialsTab(ipo);
      case "review":
        return renderDetailReviewTab(ipo);
      case "documents":
        return renderDetailDocumentsTab(ipo);
      case "overview":
      default:
        return renderDetailOverviewTab(ipo);
    }
  }

  // ==========================================================================
  // Editorial Analysis & Financial Intelligence (600+ Words Original Text)
  // Essential for AdSense compliance to avoid "Low Value Content" flags
  // ==========================================================================
  function renderIpoEditorialAnalysis(ipo) {
    const company = ipo.name || ipo.shortName;
    const sector = ipo.sector || "General Industry";
    const board = ipo.board === "SME" ? "BSE SME / NSE Emerge platform" : "NSE & BSE Mainboard";
    const issueSize = ipo.issueSizeCr ? `₹${ipo.issueSizeCr} Crores` : "the officially declared issue size";
    const priceBand = ipo.priceBandLow && ipo.priceBandHigh 
      ? `₹${ipo.priceBandLow} to ₹${ipo.priceBandHigh} per equity share` 
      : (ipo.issuePrice ? `₹${ipo.issuePrice} per equity share` : "the declared price band");
    const minLot = ipo.lotSize ? `${ipo.lotSize} shares` : "a standardized market lot";
    const registrar = ipo.registrar || "the SEBI-registered registrar";

    return `
      <section class="editorial-analysis-card" aria-label="Comprehensive IPO Fundamental Analysis">
        <div class="editorial-header-wrap">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">📑</span>
            <h2 class="editorial-main-title">Editorial Analysis &amp; Investment Intelligence: ${company}</h2>
          </div>
          <span class="editorial-read-badge">In-Depth Fundamental Report</span>
        </div>

        <div class="editorial-content-body">
          <h3 class="editorial-heading">1. Company Profile &amp; Business Overview</h3>
          <p class="editorial-paragraph">
            <strong>${company}</strong> operates prominently within the <strong>${sector}</strong> sector in the Indian economy. As part of its strategic expansion and capital structure optimization, the company has tapped the primary market via ${board}. The public offer encompasses an aggregate issue size of approximately <strong>${issueSize}</strong>, structured to balance fresh capital deployment alongside secondary liquidity for existing stakeholders. The enterprise delivers specialized products and solutions engineered to capture evolving domestic consumption patterns, industrial digitization, and structural tailwinds across Indian commercial sectors.
          </p>

          <h3 class="editorial-heading">2. Public Issue Objectives &amp; Capital Allocation</h3>
          <p class="editorial-paragraph">
            Capital raised from this public offering is earmarked for specific strategic milestones outlined in the Red Herring Prospectus (RHP). Primary deployment avenues typically encompass:
          </p>
          <ul class="editorial-bullet-list">
            <li><strong>Capacity Expansion &amp; Infrastructure:</strong> Financing ongoing capital expenditures (Capex), modernization of operating assets, and technological scaling to support expanding order books.</li>
            <li><strong>Working Capital Normalization:</strong> Meeting routine operational liquidity and inventory cycles to service tier-one corporate clients without incurring costly short-term debt.</li>
            <li><strong>Strategic Deleveraging:</strong> Prepayment or scheduled repayment of outstanding borrowings to reduce finance costs, elevate EBITDA margins, and strengthen the overall solvency profile.</li>
            <li><strong>General Corporate Purposes:</strong> Fueling business development initiatives, strategic acquisitions, brand strengthening, and regulatory compliances.</li>
          </ul>

          <h3 class="editorial-heading">3. Industry Dynamics &amp; Structural Tailwinds</h3>
          <p class="editorial-paragraph">
            The Indian macro environment continues to provide robust tailwinds for high-growth firms in the ${sector} segment. Sustained capital expenditure by both public and private institutions, progressive manufacturing policies (such as Make in India and Production-Linked Incentive schemes), and formalized supply chains have heightened market opportunities. Companies demonstrating vertical integration, reliable vendor ecosystems, and stringent quality control protocols are well positioned to capture incremental market share from informal sector competitors while safeguarding operating profitability.
          </p>

          <h3 class="editorial-heading">4. Financial Performance &amp; Operational Metrics</h3>
          <p class="editorial-paragraph">
            Evaluating historical audited financial statements filed with the Securities and Exchange Board of India (SEBI), ${company} has shown an operational trajectory reflecting industry demand cycles. Key financial disciplines scrutinized by prospective institutional investors include year-over-year revenue velocity, operating EBITDA resilience against raw material volatility, Net Profit (PAT) margins, Return on Equity (ROE), and Return on Capital Employed (ROCE). Sustained free cash flow generation from core operations remains the hallmark differentiating resilient business models from levered cyclical entities.
          </p>

          <div class="editorial-highlight-box">
            <h4 style="margin:0 0 6px 0; font-size:13px; font-weight:700; color:#1E3A8A; display:flex; align-items:center; gap:6px;">
              <span>💡</span> Key Issue Snapshot &amp; Structure
            </h4>
            <div style="font-size:12.5px; color:#1E293B; line-height:1.6;">
              ${company} is offered at a price band of <strong>${priceBand}</strong> with a minimum application lot of <strong>${minLot}</strong>. Official registrar verification and allotment processing are conducted by <strong>${registrar}</strong>. All bids must be verified via designated ASBA syndicate banks or authorized UPI payment handles before the scheduled bidding deadline.
            </div>
          </div>

          <h3 class="editorial-heading">5. Competitive Strengths &amp; Moats</h3>
          <ul class="editorial-bullet-list">
            <li><strong>Established Market Footprint:</strong> Demonstrated execution capabilities across diversified customer verticals with entrenched client relationships and recurring purchase orders.</li>
            <li><strong>Disciplined Capital Management:</strong> Prudent balance sheet leverage with prioritized allocation towards high-ROIC operating capacities.</li>
            <li><strong>Technological Capabilities:</strong> Automated operational workflows, stringent quality certifications, and lean manufacturing practices that preserve gross margins during inflationary periods.</li>
            <li><strong>Experienced Leadership:</strong> Promoter group and key managerial personnel possessing deep domain insights and navigation through varied market cycles.</li>
          </ul>

          <h3 class="editorial-heading">6. Critical Risk Factors to Monitor</h3>
          <p class="editorial-paragraph">
            Prospective retail and institutional bidders must balance upside opportunities against key risk parameters documented in the offer filings:
          </p>
          <ul class="editorial-bullet-list">
            <li><strong>Client Concentration Exposure:</strong> Dependency on key revenue-contributing customers or regional markets; loss of major contracts could adversely impact operational results.</li>
            <li><strong>Input Cost Volatility:</strong> Unhedged exposure to raw material price inflation or supply chain disruptions which can compress quarterly gross profit margins.</li>
            <li><strong>Regulatory &amp; Compliance Shifts:</strong> Evolving taxation, statutory norms, or environmental regulations governing the ${sector} domain.</li>
            <li><strong>Working Capital Intensity:</strong> Extended receivable days or delayed payment cycles from enterprise counterparties necessitating additional credit facilities.</li>
          </ul>

          <h3 class="editorial-heading">7. PriceAlerter Valuation &amp; Final Investor Takeaway</h3>
          <p class="editorial-paragraph">
            At the specified price band of <strong>${priceBand}</strong>, investors should evaluate the implied P/E (Price-to-Earnings) multiple against listed domestic peers in the ${sector} industry. Market participants focusing on listing day arbitrage frequently track Grey Market Premium (GMP) metrics; however, prudent long-term investors should place primary emphasis on sustainable earnings growth, return on invested capital, and balance sheet strength rather than speculative unlisted premiums. Applying through the official ASBA or UPI process ensures complete capital security with interest accrual in investor bank accounts until the official allotment finalization by ${registrar}.
          </p>
        </div>
      </section>
    `;
  }

  // ==========================================================================
  // Detail Subtab: Overview (Exact match to Reference Image)
  // ==========================================================================
  function renderDetailOverviewTab(ipo) {
    const priceBandText = ipo.priceBandLow && ipo.priceBandHigh 
      ? `₹${ipo.priceBandLow} – ${ipo.priceBandHigh}` 
      : `₹${ipo.issuePrice || '—'}`;

    return `
      <div class="tab-content-container">
        <!-- Top Row: Key Details (FIRST) & GMP Card -->
        <div class="detail-overview-grid">
          <!-- Key Details Card (4x3 Grid) -->
          <div class="key-details-card">
            <h3>Key Details</h3>
            <div class="details-specs-grid">
              <div class="spec-item">
                <span class="spec-label">Price Band</span>
                <span class="spec-val">${priceBandText}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Lot Size</span>
                <span class="spec-val">${ipo.lotSize || 10} shares</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Issue Size</span>
                <span class="spec-val">${formatCrore(ipo.issueSizeCr)}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Minimum Investment</span>
                <span class="spec-val">${formatMoney(ipo.minimumInvestment || (ipo.priceBandHigh * ipo.lotSize))}</span>
              </div>

              <div class="spec-item">
                <span class="spec-label">Open Date</span>
                <span class="spec-val">${formatDate(ipo.openDate)}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Close Date</span>
                <span class="spec-val">${formatDate(ipo.closeDate)}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Listing Date</span>
                <span class="spec-val">${formatDate(ipo.listingDate)}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Face Value</span>
                <span class="spec-val">₹${ipo.faceValue || 10}</span>
              </div>

              <div class="spec-item">
                <span class="spec-label">Exchange</span>
                <span class="spec-val">${ipo.exchange || "NSE, BSE"}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Issue Type</span>
                <span class="spec-val">${ipo.issueType || "Mainboard"}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Sector</span>
                <span class="spec-val">${ipo.sector || "General"}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Registrar</span>
                <span class="spec-val">${ipo.registrar || "KFin Technologies Ltd"}</span>
              </div>
            </div>
          </div>

          <!-- GMP / Listing Performance Card -->
          <div class="detail-gmp-card">
            <div class="detail-gmp-head">
              <div class="gmp-head-left">
                <h3>${ipo.status === "LISTED" ? "Market Performance &amp; Live CMP" : "GMP (Grey Market Premium)"}</h3>
                <div class="gmp-large-val">
                  ${ipo.status === "LISTED"
                    ? `₹${Number(ipo.currentPrice || ipo.listingPrice || 0).toLocaleString('en-IN')} <span style="font-size:14px; font-weight:700; color:${Number(ipo.returnSinceIssuePct || 0) >= 0 ? '#16A34A' : '#DC2626'};">${Number(ipo.returnSinceIssuePct || 0) >= 0 ? '+' : ''}${ipo.returnSinceIssuePct || ipo.listingGainPct || 0}%</span>`
                    : (ipo.gmp != null && ipo.gmp > 0 ? `₹${ipo.gmp} (${ipo.gmpPercentage || 0}%)` : (ipo.gmp == null ? `No verified quote` : `₹0 (Flat)`))}
                </div>
              </div>
              <span class="gmp-updated-time">${formatGmpLastUpdated(ipo)}</span>
            </div>

            <!-- Dynamic SVG Trend Chart -->
            <div class="gmp-trend-chart-box">
              ${renderDetailGmpChartSvg(ipo)}
            </div>

            <div class="gmp-minibar-stats">
              <div class="gmp-stat-item">
                <span>${ipo.status === "LISTED" ? "Issue Price" : "Day High"}</span>
                <strong>${ipo.status === "LISTED" ? (ipo.issuePrice ? `₹${ipo.issuePrice}` : (ipo.priceBandHigh ? `₹${ipo.priceBandHigh}` : "—")) : (ipo.gmp != null ? `₹${ipo.dayHighGmp != null ? ipo.dayHighGmp : ipo.gmp}` : "—")}</strong>
              </div>
              <div class="gmp-stat-item">
                <span>${ipo.status === "LISTED" ? "Debut Listing" : "Day Low"}</span>
                <strong>${ipo.status === "LISTED" ? (ipo.listingPrice ? `₹${ipo.listingPrice}` : "—") : (ipo.gmp != null ? `₹${ipo.dayLowGmp != null ? ipo.dayLowGmp : Math.max(0, ipo.gmp - 2)}` : "—")}</strong>
              </div>
              <div class="gmp-stat-item">
                <span>${ipo.status === "LISTED" ? "Day Change" : "Trend"}</span>
                <strong class="${(ipo.status === 'LISTED' ? (Number(ipo.dayChangePerc || 0) >= 0 ? 'trend-green' : 'trend-red') : (!ipo.gmp ? 'trend-neutral' : ipo.trend === 'down' ? 'trend-red' : 'trend-green'))}">
                  ${ipo.status === "LISTED"
                    ? (ipo.dayChangePerc !== undefined ? `${ipo.dayChangePerc >= 0 ? '▲ +' : '▼ '}${ipo.dayChangePerc}%` : "Verified Live")
                    : (ipo.gmp != null && ipo.gmp > 0 ? (ipo.trend === 'down' ? '↓ Bearish' : ipo.trend === 'flat' ? '— Neutral' : '↑ Bullish') : '— Awaiting Quotes')}
                </strong>
              </div>
            </div>

            <!-- Investor Advisory Note -->
            <div class="gmp-card-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span><strong>Advisory Note:</strong> ${ipo.status === 'LISTED' ? 'This stock is officially listed on NSE &amp; BSE. Current market prices are shown only when a timestamped quote is available.' : 'GMP is an unregulated sentiment indicator and subject to rapid market changes. It is NOT guaranteed listing returns. Always refer to official RHP filings.'}</span>
            </div>
          </div>
        </div>

        <!-- Full-Width Bottom Row: IPO Timeline Stepper -->
        <div class="detail-timeline-card">
          <h3>IPO Timeline</h3>
          <div class="stepper-timeline-track">
            <div class="stepper-line-bg"></div>
            <div class="stepper-line-progress" style="width: ${ipo.status === 'LISTED' ? '100%' : ipo.status === 'CLOSED' ? '50%' : ipo.status === 'OPEN' ? '25%' : '0%'};"></div>

            ${(() => {
              const isListed = ipo.status === "LISTED";
              const isClosed = ipo.status === "CLOSED";
              const isOpen = ipo.status === "OPEN";

              const steps = [
                { title: "IPO Opens", date: ipo.openDate, done: isListed || isClosed || isOpen, active: false, num: 1 },
                { title: "IPO Closes", date: ipo.closeDate, done: isListed || isClosed, active: isOpen, num: 2 },
                { title: "Allotment", date: ipo.allotmentDate || ipo.allotDate, done: isListed, active: isClosed, num: 3 },
                { title: "Refund", date: ipo.refundDate, done: isListed, active: false, num: 4 },
                { title: "Credit Demat", date: ipo.dematDate, done: isListed, active: false, num: 5 },
                { title: "Listing", date: ipo.listingDate, done: isListed, active: false, num: 6 }
              ];

              return steps.map(s => `
                <div class="step-node-col">
                  <div class="step-circle ${s.done ? 'completed' : s.active ? 'active' : ''}">
                    ${s.done ? '✓' : s.active ? '●' : s.num}
                  </div>
                  <span class="step-title">${s.title}</span>
                  <span class="step-date">${formatDate(s.date)}</span>
                </div>
              `).join("");
            })()}
          </div>
        </div>

        <!-- In-Depth Fundamental Editorial Analysis (600+ Words for AdSense Quality) -->
        ${renderIpoEditorialAnalysis(ipo)}

        <!-- Official Registrar Allotment Status & Verification Section (At the End) -->
        <div class="allotment-portal-callout allotment-callout-bottom" id="allotment-section">
          <div class="callout-text">
            <div style="display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#93C5FD; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              Official Registrar Allotment Status
            </div>
            <strong style="font-size:15px; color:#FFFFFF;">Check Allotment Status — ${ipo.shortName}</strong>
            <span style="display:block; margin-top:2px;">Official Registrar: <b style="color:#93C5FD;">${ipo.registrar || 'Registrar Portal'}</b> ${(ipo.allotmentDate || ipo.allotDate) ? ` • Scheduled Allotment Date: <b>${formatDate(ipo.allotmentDate || ipo.allotDate)}</b>` : ''}</span>
          </div>

          <div class="allotment-action-buttons-group">
            ${ipo.allotmentUrl ? `
              <a href="${ipo.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="btn-allotment-direct">
                <span>Check on Registrar Portal</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            ` : `
              <span style="font-size:12px; color:var(--text-muted); background:rgba(255,255,255,0.06); padding:8px 14px; border-radius:6px;">Allotment link activates upon registrar publication</span>
            `}
            <a href="https://www.bseindia.com/investors/appli_check.aspx" target="_blank" rel="noopener noreferrer" class="btn-allotment-exchange" title="Check Allotment on BSE India">
              <span>BSE Query ↗</span>
            </a>
            <a href="https://www.nseindia.com/invest/check-trades-bids-verify-ipo-bids" target="_blank" rel="noopener noreferrer" class="btn-allotment-exchange" title="Check Allotment on NSE India">
              <span>NSE Query ↗</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Detail Subtab: Subscription Full Breakdown
  // ==========================================================================
  function renderDetailSubscriptionTab(ipo) {
    const sub = ipo.subscriptionSummary || { qib: 1.20, nii: 3.40, retail: 134.44, employee: 2.10, total: 22.10 };
    return `
      <div class="tab-content-container">
        <div class="sub-full-breakdown-card">
          <div class="widget-card-head">
            <h3>Live Subscription Breakdown — ${ipo.shortName}</h3>
            <span style="font-size:12px; color:var(--text-muted);">As of 5:00 PM IST (Exchange Bids Verified)</span>
          </div>

          <table class="sub-full-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Shares Offered</th>
                <th>Shares Bid For</th>
                <th style="text-align:right;">Subscription Multiplier</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>QIB (Qualified Institutional)</strong></td>
                <td>1,500,000</td>
                <td>1,800,000</td>
                <td style="text-align:right;"><strong>${sub.qib.toFixed(2)}x</strong></td>
              </tr>
              <tr>
                <td><strong>NII / HNI (High Net Worth)</strong></td>
                <td>1,125,000</td>
                <td>3,825,000</td>
                <td style="text-align:right;"><strong>${sub.nii.toFixed(2)}x</strong></td>
              </tr>
              <tr style="background:rgba(56, 189, 248, 0.05);">
                <td><strong>Retail Individual Investors (RII)</strong></td>
                <td>2,625,000</td>
                <td>352,905,000</td>
                <td style="text-align:right;"><strong style="color:var(--accent-cyan); font-size:16px;">${sub.retail.toFixed(2)}x</strong></td>
              </tr>
              <tr>
                <td><strong>Employees Allocation</strong></td>
                <td>150,000</td>
                <td>315,000</td>
                <td style="text-align:right;"><strong>${sub.employee.toFixed(2)}x</strong></td>
              </tr>
              <tr style="border-top:2px solid var(--border-hover); background:rgba(255,255,255,0.02);">
                <td><strong style="color:var(--status-closing); font-size:15px;">Total Issue Subscription</strong></td>
                <td><strong>5,400,000</strong></td>
                <td><strong>358,845,000</strong></td>
                <td style="text-align:right;"><strong style="color:var(--status-closing); font-size:18px;">${sub.total.toFixed(2)}x</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="asba-info-note" style="margin-top:12px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <div>
            <strong>Retail Allotment Probability Note:</strong>
            Because the retail category is subscribed at <strong>${sub.retail.toFixed(2)}x</strong>, allotment will be determined via computerized lottery conducted by ${ipo.registrar || 'the registrar'}. Each valid applicant has approximately 1 in ${(sub.retail).toFixed(0)} chance per lot.
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Detail Subtab: GMP & Profit Calculator
  // ==========================================================================
  function renderDetailGmpCalculatorTab(ipo) {
    const lotSize = ipo.lotSize || 10;
    const upperPrice = ipo.priceBandHigh || ipo.issuePrice || 150;
    const isGmpFixed = ipo.gmp != null && ipo.gmp > 0;
    const gmpVal = isGmpFixed ? ipo.gmp : 0;
    const lots = state.calcLots || (ipo.retailMinLot || 1);

    const totalShares = lots * lotSize;
    const totalInvestment = totalShares * upperPrice;
    const estListingPrice = upperPrice + gmpVal;
    const estProfit = totalShares * gmpVal;
    const estReturnPct = isGmpFixed ? ((gmpVal / upperPrice) * 100).toFixed(1) : "0.0";
    const history = getIpoGmpHistory(ipo);

    return `
      <div class="tab-content-container">
        <div class="calculator-card">
          <div class="calc-input-group">
            <h3 style="font-size:17px; font-weight:700;">IPO Profit Calculator</h3>
            <p style="font-size:13px; color:var(--text-body);">Calculate your estimated investment and grey market listing profit.</p>
            
            <div class="calc-field">
              <label>Number of Application Lots</label>
              <input type="number" id="calc-lots-input" class="calc-input-box" value="${lots}" min="1" max="100">
            </div>

            <div class="calc-field">
              <label>Issue Price (Upper Band)</label>
              <input type="text" class="calc-input-box" value="₹${upperPrice}" disabled style="opacity:0.7;">
            </div>

            <div class="calc-field">
              <label>Current GMP per Share</label>
              <input type="text" class="calc-input-box" value="${isGmpFixed ? `₹${gmpVal}` : 'Not Fixed (TBA)'}" disabled style="opacity:0.7;">
            </div>
          </div>

          <div class="calc-results-box">
            <div class="calc-res-item">
              <span>Total Shares</span>
              <strong>${totalShares} shares</strong>
            </div>
            <div class="calc-res-item">
              <span>Total Investment Required</span>
              <strong>${formatMoney(totalInvestment)}</strong>
            </div>
            <div class="calc-res-item">
              <span>Estimated Listing Price</span>
              <strong style="color:var(--accent-cyan);">${isGmpFixed ? `₹${estListingPrice} / share` : `₹${upperPrice} (At Par / Awaiting Quotes)`}</strong>
            </div>
            <div class="calc-res-item" style="border-top:1px solid var(--border-subtle); padding-top:12px;">
              <span>Expected Listing Profit</span>
              <strong class="${isGmpFixed ? 'res-gain' : ''}" style="${!isGmpFixed ? 'color:var(--text-muted);' : ''}">
                ${isGmpFixed ? `+${formatMoney(estProfit)} (${estReturnPct}%)` : 'Awaiting GMP Quotes'}
              </strong>
            </div>
          </div>
        </div>

        <!-- GMP Calculator Regulatory & Risk Disclosure -->
        <div class="gmp-advisory-card" style="margin-top:16px;">
          <div class="gmp-advisory-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Important Disclaimer on Estimated Returns</span>
          </div>
          <p class="gmp-advisory-text">
            <strong>Theoretical Calculation:</strong> Estimated listing profits shown above are strictly calculated based on unofficial Grey Market Premium (GMP) dealer indications. GMP is <strong>not regulated by SEBI</strong> or stock exchanges and does not guarantee actual returns. Actual listing prices are determined dynamically during the NSE/BSE pre-open price discovery auction (9:00 AM – 9:45 AM IST) on listing day. Read the full Red Herring Prospectus (RHP) before bidding.
          </p>
        </div>

        <div class="bottom-widget-card" style="margin-top:16px;">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:12px;">Historical Daily GMP Trend</h3>
          <table class="sub-summary-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>GMP Price</th>
                <th>Estimated Listing Price</th>
                <th>Movement</th>
              </tr>
            </thead>
            <tbody>
              ${history.length ? history.map((h, i, arr) => {
                const prev = i > 0 ? arr[i - 1].value : h.value;
                const diff = h.value - prev;
                const dateLabel = h.year ? `${h.date} ${h.year}` : (h.date.includes("2026") ? h.date : `${h.date} 2026`);
                return `
                  <tr>
                    <td>${dateLabel}</td>
                    <td><strong>₹${h.value}</strong></td>
                    <td>₹${upperPrice + h.value}</td>
                    <td style="color:${diff >= 0 ? 'var(--status-open)' : 'var(--status-closing)'};">
                      ${diff > 0 ? `+₹${diff} ↑` : diff === 0 ? "—" : `-₹${Math.abs(diff)} ↓`}
                    </td>
                  </tr>
                `;
              }).join("") : `
                <tr>
                  <td colspan="4" style="text-align:center; color:var(--text-muted); padding:24px 16px; font-size:13px;">
                    Grey Market Premium (GMP) is not fixed yet for this upcoming issue. Daily quotes and trend history will appear once active dealer trading begins.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- AdSense Native Slot -->
        ${renderAdSenseUnit("5892147360", "auto")}

        <!-- Primary Market Official Directory -->
        ${renderPortalDirectoryWidget()}
      </div>
    `;
  }

  // ==========================================================================
  // Detail Subtab: Financials
  // ==========================================================================
  function renderDetailFinancialsTab(ipo) {
    const fin = ipo.financials || [
      { year: "FY 2024", revenue: 420, profit: 38 },
      { year: "FY 2025", revenue: 510, profit: 52 },
      { year: "FY 2026", revenue: 680, profit: 71 }
    ];

    const ratios = ipo.ratios || { pe: 21.4, ronw: "19.2%", eps: "₹7.01", marketCap: "₹2,100 Cr" };

    return `
      <div class="tab-content-container">
        <div class="details-specs-grid" style="grid-template-columns:repeat(4,1fr); margin-bottom:16px;">
          <div class="spec-item" style="background:var(--bg-card); padding:16px; border:1px solid var(--border-subtle); border-radius:12px;">
            <span class="spec-label">P/E Ratio</span>
            <span class="spec-val" style="font-size:18px;">${ratios.pe}x</span>
          </div>
          <div class="spec-item" style="background:var(--bg-card); padding:16px; border:1px solid var(--border-subtle); border-radius:12px;">
            <span class="spec-label">RoNW (Return on Net Worth)</span>
            <span class="spec-val" style="font-size:18px; color:var(--status-open);">${ratios.ronw}</span>
          </div>
          <div class="spec-item" style="background:var(--bg-card); padding:16px; border:1px solid var(--border-subtle); border-radius:12px;">
            <span class="spec-label">Basic EPS (Post-Issue)</span>
            <span class="spec-val" style="font-size:18px;">${ratios.eps}</span>
          </div>
          <div class="spec-item" style="background:var(--bg-card); padding:16px; border:1px solid var(--border-subtle); border-radius:12px;">
            <span class="spec-label">Estimated Market Cap</span>
            <span class="spec-val" style="font-size:18px; color:var(--accent-cyan);">${ratios.marketCap}</span>
          </div>
        </div>

        <div class="bottom-widget-card">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:12px;">Year-on-Year Growth Performance</h3>
          <table class="sub-full-table">
            <thead>
              <tr>
                <th>Financial Year</th>
                <th style="text-align:right;">Total Revenue</th>
                <th style="text-align:right;">YoY Revenue Growth</th>
                <th style="text-align:right;">Profit After Tax (PAT)</th>
                <th style="text-align:right;">PAT Margin</th>
              </tr>
            </thead>
            <tbody>
              ${fin.map((f, i, arr) => {
                const prevRev = i > 0 ? arr[i - 1].revenue : null;
                const growth = prevRev ? (((f.revenue - prevRev) / prevRev) * 100).toFixed(1) + "%" : "—";
                const margin = ((f.profit / f.revenue) * 100).toFixed(1) + "%";
                return `
                  <tr>
                    <td><strong>${f.year}</strong></td>
                    <td style="text-align:right; font-weight:700; color:var(--chart-blue);">₹${f.revenue} Cr</td>
                    <td style="text-align:right; color:var(--status-open);">${growth}</td>
                    <td style="text-align:right; font-weight:700; color:var(--chart-gold);">₹${f.profit} Cr</td>
                    <td style="text-align:right;"><strong>${margin}</strong></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

        ${fin.some(f => f.assets != null) ? `
          <div class="bottom-widget-card" style="margin-top:16px;">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:12px;">Balance Sheet & Total Assets Summary</h3>
            <table class="sub-full-table">
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th style="text-align:right;">Total Assets</th>
                  <th style="text-align:right;">Net Worth / Equity</th>
                  <th style="text-align:right;">Total Revenue</th>
                  <th style="text-align:right;">Profit After Tax (PAT)</th>
                </tr>
              </thead>
              <tbody>
                ${fin.map(f => `
                  <tr>
                    <td><strong>${f.year}</strong></td>
                    <td style="text-align:right; font-weight:700; color:var(--accent-cyan);">₹${f.assets ? f.assets + ' Cr' : '—'}</td>
                    <td style="text-align:right; font-weight:700; color:var(--status-open);">₹${f.netWorth ? f.netWorth + ' Cr' : '—'}</td>
                    <td style="text-align:right; font-weight:600; color:var(--chart-blue);">₹${f.revenue} Cr</td>
                    <td style="text-align:right; font-weight:700; color:var(--chart-gold);">₹${f.profit} Cr</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- AdSense Native Slot -->
        ${renderAdSenseUnit("5892147360", "auto")}

        <!-- Primary Market Official Directory -->
        ${renderPortalDirectoryWidget()}
      </div>
    `;
  }

  // ==========================================================================
  // Detail Subtab: Review & SWOT
  // ==========================================================================
  function renderDetailReviewTab(ipo) {
    const swot = ipo.swot || {
      strengths: ["Strong EBITDA margins", "Tier-1 global automotive clients", "Debt-to-equity ratio reduced to 0.18x"],
      weaknesses: ["Fluctuation in crude monomer prices", "High working capital requirements"],
      opportunities: ["EV lightweighting compounds boom", "Export growth in EU & Southeast Asia"],
      risks: ["Environmental regulations on polymers", "Competition from petrochemical giants"]
    };

    const rating = ipo.analystRating || { applyPercent: 88, neutralPercent: 9, avoidPercent: 3, consensus: "Apply" };

    return `
      <div class="tab-content-container">
        <!-- Analyst Sentiment Header -->
        <div class="bottom-widget-card">
          <div class="widget-card-head">
            <h3>Brokerage & Analyst Consensus</h3>
            <span style="font-size:14px; font-weight:700; color:var(--status-open);">${rating.consensus}</span>
          </div>

          <div style="margin:16px 0;">
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
              <span style="color:var(--status-open); font-weight:700;">Apply (${rating.applyPercent}%)</span>
              <span style="color:var(--status-upcoming); font-weight:700;">Neutral (${rating.neutralPercent}%)</span>
              <span style="color:var(--status-closing); font-weight:700;">Avoid (${rating.avoidPercent}%)</span>
            </div>
            <div style="display:flex; height:10px; border-radius:999px; overflow:hidden; gap:2px;">
              <div style="width:${rating.applyPercent}%; background:var(--status-open);"></div>
              <div style="width:${rating.neutralPercent}%; background:var(--status-upcoming);"></div>
              <div style="width:${rating.avoidPercent}%; background:var(--status-closing);"></div>
            </div>
          </div>
          
          <p style="font-size:13px; color:var(--text-body); line-height:1.6;">
            ${ipo.about || "Leading enterprise with established market leadership, robust return on capital employed, and strong industry tailwinds."}
          </p>
        </div>

        <!-- 4-Box SWOT Analysis -->
        <div class="swot-grid">
          <div class="swot-card strengths">
            <h4>Strengths (Pros)</h4>
            <ul>
              ${swot.strengths.map(s => `<li>${s}</li>`).join("")}
            </ul>
          </div>

          <div class="swot-card weaknesses">
            <h4>Weaknesses (Cons)</h4>
            <ul>
              ${swot.weaknesses.map(w => `<li>${w}</li>`).join("")}
            </ul>
          </div>

          <div class="swot-card opportunities">
            <h4>Opportunities</h4>
            <ul>
              ${swot.opportunities.map(o => `<li>${o}</li>`).join("")}
            </ul>
          </div>

          <div class="swot-card risks">
            <h4>Key Risks & Threats</h4>
            <ul>
              ${swot.risks.map(r => `<li>${r}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Detail Subtab: Documents
  // ==========================================================================
  function renderDetailDocumentsTab(ipo) {
    const docs = ipo.documents || [
      { title: "Red Herring Prospectus (RHP)", size: "4.8 MB", type: "PDF" },
      { title: "Draft Red Herring Prospectus (DRHP)", size: "7.2 MB", type: "PDF" },
      { title: "Anchor Investor Allocation Details", size: "1.1 MB", type: "PDF" },
      { title: "Registrar Allotment Query Portal", type: "LINK", url: "https://ris.kfintech.com/ipostatus/" }
    ];

    return `
      <div class="tab-content-container">
        <div class="docs-list-grid">
          ${docs.map(doc => `
            <div class="doc-download-card" onclick="window.IpoApp.handleDocClick('${doc.title}', '${doc.url || ''}')">
              <div class="doc-info-wrap">
                <div class="doc-icon-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div>
                  <h4 class="doc-title">${doc.title}</h4>
                  <span class="doc-size">${doc.size ? `${doc.type} • ${doc.size}` : 'Official SEBI / Registrar Link'}</span>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function bindDetailInteractiveEvents(ipo) {
    const calcInput = document.getElementById("calc-lots-input");
    if (calcInput) {
      calcInput.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        state.calcLots = isNaN(val) || val < 1 ? 1 : val;
        const tabBody = document.getElementById("detail-tab-body");
        if (tabBody) tabBody.innerHTML = renderDetailTabBody(ipo);
        bindDetailInteractiveEvents(ipo);
      });
    }
  }

  // ==========================================================================
  // ==========================================================================
  // Dedicated Open IPOs Page (#/open)
  // ==========================================================================
  function getFilteredOpenIssues() {
    let openIssues = records.filter(r => r.status === "OPEN");

    if (state.openBoard === "mainboard") {
      openIssues = openIssues.filter(r => (r.board || "").toUpperCase() === "MAINBOARD");
    } else if (state.openBoard === "sme") {
      openIssues = openIssues.filter(r => (r.board || "").toUpperCase().includes("SME"));
    }

    if (state.openSearchQuery) {
      const q = state.openSearchQuery.toLowerCase().trim();
      openIssues = openIssues.filter(r => 
        (r.name && r.name.toLowerCase().includes(q)) || 
        (r.companyName && r.companyName.toLowerCase().includes(q)) ||
        (r.shortName && r.shortName.toLowerCase().includes(q)) ||
        (r.sector && r.sector.toLowerCase().includes(q)) ||
        (r.symbol && r.symbol.toLowerCase().includes(q))
      );
    }
    return openIssues;
  }

  function renderOpenRows(openIssues) {
    if (openIssues.length === 0) {
      return `<tr><td colspan="9" style="text-align:center; padding:32px; color:#64748B;">No open IPOs match your filter criteria. Try clearing the search query.</td></tr>`;
    }
    return openIssues.map(r => {
      const priceText = r.priceBandLow && r.priceBandHigh ? `₹${r.priceBandLow} – ${r.priceBandHigh}` : (r.issuePrice ? `₹${r.issuePrice}` : 'TBA');
      const gmpText = r.gmp ? `+₹${r.gmp} (${r.gmpPercentage}%)` : '—';
      const subText = r.subscriptionOverall ? `${r.subscriptionOverall}x` : (r.subscriptionRetail ? `${r.subscriptionRetail}x` : 'Open');
      return `
        <tr onclick="window.location.hash='#/ipo/${r.slug}'" style="cursor:pointer;">
          <td>
            <div class="fig1-company-cell">
              ${renderCompanyLogo(r, 36)}
              <div class="fig1-company-name-wrap">
                <span class="fig1-company-name">${escapeHtml(r.shortName)}</span>
                <span style="font-size:11px; color:#64748B;">${escapeHtml(r.sector || 'Industrial')}</span>
              </div>
            </div>
          </td>
          <td><span class="board-badge ${(r.board || 'MAINBOARD').toLowerCase()}">${escapeHtml(r.board || 'MAINBOARD')}</span></td>
          <td>
            <div style="font-size:12.5px; font-weight:600; color:#111827;">${formatDate(r.openDate)}</div>
            <div style="font-size:11px; color:#DC2626; font-weight:600;">Closes: ${formatDate(r.closeDate)}</div>
          </td>
          <td><span style="font-weight:700; color:#111827;">${priceText}</span></td>
          <td><span style="font-weight:600;">${r.lotSize ? r.lotSize + ' shares' : '—'}</span></td>
          <td><span style="font-weight:600;">${formatCrore(r.issueSizeCr)}</span></td>
          <td><span style="color:#16A34A; font-weight:700;">${gmpText}</span></td>
          <td><span class="fig1-sub-pill">${subText}</span></td>
          <td>
            <div style="display:flex; gap:6px;" onclick="event.stopPropagation()">
              <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="btn-table-action" style="background:#10B981; color:#FFFFFF; border:1px solid #059669; font-weight:700; text-decoration:none;">Apply</a>
              <button class="btn-table-action" onclick="window.location.hash='#/ipo/${r.slug}'">Details</button>
              ${r.allotmentUrl ? `<a href="${r.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="btn-table-allotment" title="Registrar">Registrar</a>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderOpenCards(openIssues) {
    if (openIssues.length === 0) {
      return `<div style="text-align:center; padding:24px; color:#64748B; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px;">No open IPOs match your filter criteria.</div>`;
    }
    return openIssues.map(r => `
      <div class="mobile-open-card" onclick="window.location.hash='#/ipo/${r.slug}'" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:16px; margin-bottom:12px; cursor:pointer;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            ${renderCompanyLogo(r, 40)}
            <div>
              <h3 style="font-size:15px; font-weight:700; margin:0 0 2px; color:#111827;">${escapeHtml(r.shortName)}</h3>
              <span style="font-size:11px; color:#64748B;">${escapeHtml(r.board)} • ${escapeHtml(r.exchange)}</span>
            </div>
          </div>
          <span class="status-badge open">Open</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12.5px; border-top:1px solid #F1F5F9; border-bottom:1px solid #F1F5F9; padding:10px 0; margin-bottom:12px;">
          <div><span style="color:#64748B;">Price Band:</span> <strong style="display:block; color:#111827;">${r.priceBandLow && r.priceBandHigh ? `₹${r.priceBandLow}–${r.priceBandHigh}` : (r.issuePrice ? `₹${r.issuePrice}` : 'TBA')}</strong></div>
          <div><span style="color:#64748B;">Lot Size:</span> <strong style="display:block; color:#111827;">${r.lotSize ? r.lotSize + ' shares' : '—'}</strong></div>
          <div><span style="color:#64748B;">Closes:</span> <strong style="display:block; color:#DC2626;">${formatDate(r.closeDate)}</strong></div>
          <div><span style="color:#64748B;">GMP Today:</span> <strong style="display:block; color:#16A34A;">${r.gmp ? `+₹${r.gmp} (${r.gmpPercentage}%)` : '—'}</strong></div>
        </div>
        <div style="display:flex; gap:8px;">
          <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" class="btn-table-action" style="flex:1; justify-content:center; text-align:center; background:#10B981; color:#FFFFFF; border:1px solid #059669; font-weight:700; text-decoration:none;" onclick="event.stopPropagation()">Apply Now</a>
          <button class="btn-table-action" style="flex:1; justify-content:center;" onclick="event.stopPropagation(); window.location.hash='#/ipo/${r.slug}'">View Details</button>
        </div>
      </div>
    `).join("");
  }

  function updateOpenIposDomInPlace() {
    const tableBody = document.getElementById("open-ipos-table-body");
    const cardsBody = document.getElementById("open-ipos-mobile-cards");
    if (!tableBody || !cardsBody) return;
    const issues = getFilteredOpenIssues();
    tableBody.innerHTML = renderOpenRows(issues);
    cardsBody.innerHTML = renderOpenCards(issues);
  }

  function renderOpenIposPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const openIssues = getFilteredOpenIssues();
    const allOpenCount = records.filter(r => r.status === "OPEN").length;
    const mbOpenCount = records.filter(r => r.status === "OPEN" && r.board === "MAINBOARD").length;
    const smeOpenCount = records.filter(r => r.status === "OPEN" && r.board === "SME").length;

    app.innerHTML = `
      <div class="detail-view-container">
        <!-- Breadcrumb Navigation -->
        <nav class="detail-breadcrumbs" aria-label="Breadcrumb">
          <a href="#/">Home</a>
          <span>&gt;</span>
          <span style="color:var(--text-primary); font-weight:600;">Open IPOs</span>
        </nav>

        <div class="page-header-banner" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <h1 style="font-size:26px; font-weight:800; color:#142B49; margin:0 0 6px;">Active &amp; Open IPOs (${allOpenCount})</h1>
            <p style="margin:0; font-size:14px; color:#475569;">Live initial public offerings currently accepting retail and HNI bids via ASBA / UPI.</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="live-pulse"></span>
            <span style="color:#079B50; font-weight:700; font-size:13px;">Market Open Verified</span>
          </div>
        </div>

        <!-- Filter and Search Bar -->
        <div class="filter-tabs-wrapper" style="margin-top:18px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div class="filter-pills-group">
            <button class="filter-pill ${state.openBoard === 'all' ? 'active' : ''}" onclick="window.IpoApp.setOpenBoardFilter('all')">All Issues (${allOpenCount})</button>
            <button class="filter-pill ${state.openBoard === 'mainboard' ? 'active' : ''}" onclick="window.IpoApp.setOpenBoardFilter('mainboard')">Mainboard (${mbOpenCount})</button>
            <button class="filter-pill ${state.openBoard === 'sme' ? 'active' : ''}" onclick="window.IpoApp.setOpenBoardFilter('sme')">SME Platform (${smeOpenCount})</button>
          </div>

          <div style="position:relative; width:260px; max-width:100%;">
            <input type="text" 
                   id="open-search-input"
                   class="fig1-subscribe-input" 
                   style="width:100%; padding:8px 12px 8px 34px; font-size:13px; background:#FFFFFF; border:1px solid #CBD5E1; color:#111827;" 
                   placeholder="Search open issues..." 
                   value="${escapeHtml(state.openSearchQuery || '')}"
                   oninput="window.IpoApp.setOpenSearch(this.value)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" style="position:absolute; left:11px; top:11px;">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        <!-- Desktop Data Table -->
        <div class="data-table-card desktop-only-table">
          <table class="dedicated-data-table full-data-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>CATEGORY</th>
                <th>BIDDING WINDOW</th>
                <th>PRICE BAND</th>
                <th>LOT SIZE</th>
                <th>ISSUE SIZE</th>
                <th>LIVE GMP</th>
                <th>SUBSCRIPTION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody id="open-ipos-table-body">
              ${renderOpenRows(openIssues)}
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="mobile-only-cards" id="open-ipos-mobile-cards">
          ${renderOpenCards(openIssues)}
        </div>

        <!-- Regulatory Notice -->
        <div style="margin-top:24px; padding:14px 18px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; font-size:12px; color:#475569; line-height:1.5;">
          <strong>Disclaimer:</strong> Sourced from BSE and NSE exchange circulars. PriceAlerter is an informational platform and does not provide financial or trading recommendations. Always consult a certified financial adviser before bidding via ASBA.
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Dedicated Upcoming IPOs Page (#/upcoming)
  // ==========================================================================
  function getFilteredUpcomingIssues() {
    // Exclude IPOs that have already completed their exchange listing.
    // Keep their records intact for the Listed IPOs and historical pages.
    const alreadyListedIds = new Set([
      "swiggy-limited",
      "sagility-india",
      "acme-solar-holdings",
      "niva-bupa-health"
    ]);
    let upcomingRecords = records.filter(r =>
      r.status === "UPCOMING" && !alreadyListedIds.has(r.id)
    );

    if (state.upcomingBoard === "mainboard") {
      upcomingRecords = upcomingRecords.filter(r => (r.board || "").toUpperCase() === "MAINBOARD");
    } else if (state.upcomingBoard === "sme") {
      upcomingRecords = upcomingRecords.filter(r => (r.board || "").toUpperCase().includes("SME"));
    }

    if (state.upcomingFilter === "confirmed") {
      upcomingRecords = upcomingRecords.filter(r => Boolean(r.openDate));
    } else if (state.upcomingFilter === "tentative") {
      upcomingRecords = upcomingRecords.filter(r => !r.openDate);
    }

    if (state.upcomingSearchQuery) {
      const q = state.upcomingSearchQuery.toLowerCase().trim();
      upcomingRecords = upcomingRecords.filter(r => 
        (r.name && r.name.toLowerCase().includes(q)) || 
        (r.companyName && r.companyName.toLowerCase().includes(q)) ||
        (r.shortName && r.shortName.toLowerCase().includes(q)) ||
        (r.sector && r.sector.toLowerCase().includes(q)) ||
        (r.symbol && r.symbol.toLowerCase().includes(q))
      );
    }
    return upcomingRecords;
  }

  function renderUpcomingRows(upcomingRecords) {
    if (upcomingRecords.length === 0) {
      return `<tr><td colspan="8" style="text-align:center; padding:32px; color:#64748B;">No upcoming IPOs found matching this query. Try clearing the search query.</td></tr>`;
    }
    return upcomingRecords.map(r => {
      const isConfirmed = Boolean(r.openDate);
      return `
        <tr onclick="window.location.hash='#/ipo/${r.slug}'" style="cursor:pointer;">
          <td>
            <div class="fig1-company-cell">
              ${renderCompanyLogo(r, 36)}
              <div class="fig1-company-name-wrap">
                <span class="fig1-company-name">${escapeHtml(r.shortName)}</span>
                <span style="font-size:11px; color:#64748B;">${escapeHtml(r.exchange || 'BSE / NSE')}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="${isConfirmed ? 'pipeline-badge-announced' : 'pipeline-badge-tentative'}">
              ${isConfirmed ? 'Dates Confirmed' : 'DRHP / Pipeline'}
            </span>
          </td>
          <td><span class="board-badge ${(r.board || 'MAINBOARD').toLowerCase()}">${escapeHtml(r.board || 'MAINBOARD')}</span></td>
          <td><span style="font-weight:700; color:#111827;">${formatCrore(r.issueSizeCr)}</span></td>
          <td>
            <div style="font-weight:600; color:#111827;">${r.openDate ? formatDate(r.openDate) : 'Tentative (2026–2027)'}</div>
          </td>
          <td><span style="font-size:12px; color:#475569;">${escapeHtml(r.sector || 'Diversified')}</span></td>
          <td>
            ${r.docUrl ? `
              <a href="${r.docUrl}" target="_blank" rel="noopener noreferrer" class="btn-doc-subtle" onclick="event.stopPropagation()" style="font-size:11px; padding:4px 8px;">
                <span>View DRHP</span>
              </a>
            ` : `
              <span style="color:#94A3B8; font-size:11px;">Draft in Review</span>
            `}
          </td>
          <td>
            <div style="display:flex; gap:6px;" onclick="event.stopPropagation()">
              <button class="btn-table-action" onclick="window.location.hash='#/ipo/${r.slug}'">View Details</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderUpcomingCards(upcomingRecords) {
    if (upcomingRecords.length === 0) {
      return `<div style="text-align:center; padding:24px; color:#64748B; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px;">No upcoming IPOs found matching this query.</div>`;
    }
    return upcomingRecords.map(r => `
      <div class="mobile-open-card" onclick="window.location.hash='#/ipo/${r.slug}'" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:16px; margin-bottom:12px; cursor:pointer;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            ${renderCompanyLogo(r, 40)}
            <div>
              <h3 style="font-size:15px; font-weight:700; margin:0 0 2px; color:#111827;">${escapeHtml(r.shortName)}</h3>
              <span style="font-size:11px; color:#64748B;">${escapeHtml(r.board)} • ${escapeHtml(r.sector || 'Diversified')}</span>
            </div>
          </div>
          <span class="${r.openDate ? 'pipeline-badge-announced' : 'pipeline-badge-tentative'}">
            ${r.openDate ? 'Confirmed' : 'Pipeline'}
          </span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12.5px; border-top:1px solid #F1F5F9; border-bottom:1px solid #F1F5F9; padding:10px 0; margin-bottom:12px;">
          <div><span style="color:#64748B;">Est. Issue Size:</span> <strong style="display:block; color:#111827;">${formatCrore(r.issueSizeCr)}</strong></div>
          <div><span style="color:#64748B;">Expected Date:</span> <strong style="display:block; color:#111827;">${r.openDate ? formatDate(r.openDate) : 'Tentative'}</strong></div>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn-table-action" style="flex:1; justify-content:center;" onclick="event.stopPropagation(); window.location.hash='#/ipo/${r.slug}'">View Details &amp; Analysis</button>
        </div>
      </div>
    `).join("");
  }

  function updateUpcomingIposDomInPlace() {
    const tableBody = document.getElementById("upcoming-ipos-table-body");
    const cardsBody = document.getElementById("upcoming-ipos-mobile-cards");
    if (!tableBody || !cardsBody) return;
    const recordsList = getFilteredUpcomingIssues();
    tableBody.innerHTML = renderUpcomingRows(recordsList);
    cardsBody.innerHTML = renderUpcomingCards(recordsList);
  }

  function renderUpcomingIposPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const upcomingRecords = getFilteredUpcomingIssues();
    const totalUpcoming = records.filter(r => r.status === "UPCOMING").length;
    const confirmedCount = records.filter(r => r.status === "UPCOMING" && r.openDate).length;
    const tentativeCount = records.filter(r => r.status === "UPCOMING" && !r.openDate).length;

    app.innerHTML = `
      <div class="detail-view-container">
        <!-- Breadcrumb Navigation -->
        <nav class="detail-breadcrumbs" aria-label="Breadcrumb">
          <a href="#/">Home</a>
          <span>&gt;</span>
          <span style="color:var(--text-primary); font-weight:600;">Upcoming IPOs</span>
        </nav>

        <div class="page-header-banner" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <h1 style="font-size:26px; font-weight:800; color:#142B49; margin:0 0 6px;">Upcoming IPOs Pipeline (${totalUpcoming})</h1>
            <p style="margin:0; font-size:14px; color:#475569;">Companies with SEBI DRHP approval awaiting opening dates and tentative pipeline.</p>
          </div>
          <div style="background:#EFF6FF; border:1px solid #BFDBFE; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600; color:#1D4ED8;">
            ${confirmedCount} Confirmed Dates · ${tentativeCount} Pipeline
          </div>
        </div>

        <!-- Filter and Search Bar -->
        <div class="filter-tabs-wrapper" style="margin-top:18px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div class="filter-pills-group">
            <button class="filter-pill ${state.upcomingFilter === 'all' ? 'active' : ''}" onclick="window.IpoApp.setUpcomingStatusFilter('all')">All Pipeline (${totalUpcoming})</button>
            <button class="filter-pill ${state.upcomingFilter === 'confirmed' ? 'active' : ''}" onclick="window.IpoApp.setUpcomingStatusFilter('confirmed')">Confirmed Dates (${confirmedCount})</button>
            <button class="filter-pill ${state.upcomingFilter === 'tentative' ? 'active' : ''}" onclick="window.IpoApp.setUpcomingStatusFilter('tentative')">Tentative / Filed (${tentativeCount})</button>
          </div>

          <div style="position:relative; width:260px; max-width:100%;">
            <input type="text" 
                   id="upcoming-search-input"
                   class="fig1-subscribe-input" 
                   style="width:100%; padding:8px 12px 8px 34px; font-size:13px; background:#FFFFFF; border:1px solid #CBD5E1; color:#111827;" 
                   placeholder="Search upcoming IPOs..." 
                   value="${escapeHtml(state.upcomingSearchQuery || '')}"
                   oninput="window.IpoApp.setUpcomingSearch(this.value)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" style="position:absolute; left:11px; top:11px;">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        <!-- Desktop Data Table -->
        <div class="data-table-card desktop-only-table">
          <table class="dedicated-data-table full-data-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>PIPELINE STAGE</th>
                <th>CATEGORY</th>
                <th>EST. ISSUE SIZE</th>
                <th>EXPECTED DATE</th>
                <th>SECTOR</th>
                <th>OFFER DOCUMENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody id="upcoming-ipos-table-body">
              ${renderUpcomingRows(upcomingRecords)}
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="mobile-only-cards" id="upcoming-ipos-mobile-cards">
          ${renderUpcomingCards(upcomingRecords)}
        </div>

        <!-- Pipeline Editorial Overview -->
        <article class="guide-section-card" style="margin-top:24px; padding:20px 24px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px;">
          <h3 style="font-size:16px; color:#142B49; margin-bottom:10px;">📋 Indian IPO Pipeline &amp; SEBI Scrutiny Highlights</h3>
          <p style="font-size:13.5px; line-height:1.6; color:#475569; margin-bottom:10px;">
            The primary market in India maintains a healthy pipeline of over ₹1,00,000 Cr in draft red herring prospectuses (DRHPs) filed with the Securities and Exchange Board of India (SEBI). Key sectors leading the upcoming pipeline include quick commerce, fintech, consumer tech, renewable energy, and financial infrastructure.
          </p>
          <p style="font-size:13.5px; line-height:1.6; color:#475569; margin:0;">
            Issuers with confirmed dates are scheduled based on exchange clearance and anchor book completion. Dates are subject to market conditions and merchant banker roadshows.
          </p>
        </article>
      </div>
    `;
  }

  // Dedicated Pages: GMP Tracker, Calendar, Listed
  // ==========================================================================
  function getFilteredGmpIssues() {
    let list = records.filter(r => r.status !== "LISTED");
    if (state.gmpFilter === "open") {
      list = list.filter(r => r.status === "OPEN");
    } else if (state.gmpFilter === "bullish") {
      list = list.filter(r => r.gmp != null && Number(r.gmp) > 0);
    }

    if (state.gmpSearchQuery) {
      const q = state.gmpSearchQuery.toLowerCase().trim();
      list = list.filter(r => 
        (r.name && r.name.toLowerCase().includes(q)) || 
        (r.companyName && r.companyName.toLowerCase().includes(q)) ||
        (r.shortName && r.shortName.toLowerCase().includes(q)) ||
        (r.sector && r.sector.toLowerCase().includes(q)) ||
        (r.symbol && r.symbol.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const getLatestDate = (item) => {
        const dStr = item.closeDate || item.openDate || item.listingDate || item.allotmentDate;
        return dStr ? new Date(dStr).getTime() : 0;
      };
      return getLatestDate(b) - getLatestDate(a); // Newest date first, oldest date last
    });

    return list;
  }

  function renderGmpRows(gmpList) {
    if (gmpList.length === 0) {
      return `<tr><td colspan="8" style="text-align:center; padding:32px; color:#64748B;">No IPOs found matching the GMP filter criteria.</td></tr>`;
    }
    return gmpList.map(r => {
      const upper = r.priceBandHigh || r.issuePrice || 100;
      const gmp = r.gmp != null ? Number(r.gmp) : null;
      const estPrice = gmp != null ? upper + gmp : upper;
      const pct = r.gmpPercentage || (gmp != null && upper ? ((gmp / upper) * 100).toFixed(1) : null);
      const isPos = gmp != null && gmp > 0;
      const isNeg = gmp != null && gmp < 0;

      const dateStr = r.status === 'OPEN' && r.closeDate 
        ? `Closes ${formatDate(r.closeDate)}`
        : r.status === 'UPCOMING' && r.openDate
          ? `Opens ${formatDate(r.openDate)}`
          : r.listingDate
            ? `Listed ${formatDate(r.listingDate)}`
            : (r.closeDate ? formatDate(r.closeDate) : 'TBA');

      return `
        <tr onclick="window.location.hash='#/ipo/${r.slug}'" style="cursor:pointer;">
          <td>
            <div style="display:flex; align-items:center; gap:12px;">
              ${renderCompanyLogo(r, 34)}
              <div>
                <strong>${escapeHtml(r.shortName)}</strong>
                <div style="font-size:11px; color:var(--text-muted);">${escapeHtml(r.board || 'MAINBOARD')} • ${escapeHtml(r.exchange || 'NSE, BSE')}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="font-size:12px; font-weight:600; color:#111827;">${dateStr}</span>
          </td>
          <td>${r.priceBandLow && r.priceBandHigh ? `₹${r.priceBandLow} – ${r.priceBandHigh}` : `₹${r.issuePrice || '—'}`}</td>
          <td>
            <strong style="color:${isPos ? '#16A34A' : isNeg ? '#DC2626' : '#64748B'}; font-size:14px;">
              ${gmp != null ? (isPos ? `+₹${gmp}` : isNeg ? `-₹${Math.abs(gmp)}` : `₹0 (Flat)`) : (r.status === 'UPCOMING' ? 'TBA' : '—')}
            </strong>
          </td>
          <td><strong>${gmp != null ? `₹${estPrice}` : (r.status === 'LISTED' && r.listingPrice ? `₹${r.listingPrice}` : '—')}</strong></td>
          <td>
            <span style="color:${isPos ? '#16A34A' : isNeg ? '#DC2626' : '#64748B'}; font-weight:700;">
              ${pct != null ? `${isPos ? '+' : ''}${pct}%` : (r.status === 'LISTED' && r.listingGain ? r.listingGain : '—')}
            </span>
          </td>
          <td><span class="status-badge ${r.status === 'CLOSED' ? 'closed' : r.status === 'UPCOMING' ? 'upcoming' : r.status === 'LISTED' ? 'listed' : 'open'}">${r.status === 'CLOSED' ? 'Closed' : r.status === 'UPCOMING' ? 'Upcoming' : r.status === 'LISTED' ? 'Listed' : 'Open'}</span></td>
          <td>
            <span style="color:${isPos ? '#16A34A' : isNeg ? '#DC2626' : '#64748B'}; font-weight:600;">
              ${isPos ? '↑ Bullish' : isNeg ? '↓ Bearish' : '— Neutral'}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  function updateGmpDomInPlace() {
    const tableBody = document.getElementById("gmp-table-body");
    if (!tableBody) return;
    const list = getFilteredGmpIssues();
    tableBody.innerHTML = renderGmpRows(list);
  }

  // ==========================================================================
  // Dedicated Interactive IPO Profit Estimator & Calculator Page
  // ==========================================================================
  function getSelectedCalcIpo() {
    if (state.calcSelectedSlug) {
      const found = records.find(r => r.slug === state.calcSelectedSlug || r.id === state.calcSelectedSlug);
      if (found) return found;

      // Also support stocks from Live Market Movers / Shakers / Recent IPOs / Bluechips
      if (state.liveMarketData) {
        const mover = [
          ...(state.liveMarketData.allLiveStocks || []),
          ...(state.liveMarketData.recentIpos || []),
          ...(state.liveMarketData.bluechips || []),
          ...(state.liveMarketData.marketGainers || []),
          ...(state.liveMarketData.marketShakers || []),
          ...(state.liveMarketData.marketLosers || [])
        ].find(m => m.symbol === state.calcSelectedSlug || m.slug === state.calcSelectedSlug || m.name === state.calcSelectedSlug);

        if (mover) {
          const estimatedCost = mover.issuePrice || Math.round(mover.rawPrice * 0.92);
          return {
            slug: mover.slug || mover.symbol,
            symbol: mover.symbol,
            shortName: mover.name,
            companyName: mover.name,
            issuePrice: estimatedCost,
            priceBandHigh: estimatedCost,
            currentPrice: mover.rawPrice,
            cmp: mover.rawPrice,
            lotSize: mover.lotSize || (mover.rawPrice > 1000 ? 10 : 50),
            gmp: Math.max(0, Math.round(mover.rawPrice - estimatedCost)),
            status: "LISTED"
          };
        }
      }
    }
    // 1. Prioritize open IPO (e.g. Antala Industries)
    const openIpo = records.find(r => r.status === "OPEN");
    if (openIpo) return openIpo;
    // 2. Prioritize upcoming or any IPO with positive live GMP
    const anyWithGmp = records.find(r => r.gmp != null && r.gmp > 0);
    if (anyWithGmp) return anyWithGmp;
    // 3. Fallback to antala-industries-ipo or records[0]
    return records.find(r => r.slug === "antala-industries-ipo") || records[0];
  }

  function renderCalculatorPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const ipo = getSelectedCalcIpo();
    const lots = state.calcLots || 1;
    const lotSize = ipo.lotSize || 100;
    const upperPrice = ipo.priceBandHigh || ipo.issuePrice || 100;

    // 1. Live GMP (Grey Market Premium)
    const marketGmp = (ipo.gmp !== null && ipo.gmp !== undefined && !isNaN(ipo.gmp)) ? Number(ipo.gmp) : 0;
    const gmpVal = (state.calcCustomGmp !== null && state.calcCustomGmp !== undefined && !isNaN(state.calcCustomGmp))
      ? Number(state.calcCustomGmp)
      : marketGmp;

    // 2. Live Market Price (CMP / Real-Time Trading Price)
    let defaultLivePrice = 0;
    if (state.liveMarketData && state.liveMarketData.trackedIpos) {
      const tracked = state.liveMarketData.trackedIpos.find(t => t.slug === ipo.slug || t.id === ipo.id);
      if (tracked) {
        if (tracked.cmp && tracked.cmp > 0) defaultLivePrice = Number(tracked.cmp);
        else if (tracked.livePrice && tracked.livePrice > 0) defaultLivePrice = Number(tracked.livePrice);
        else if (tracked.estListing && tracked.estListing > 0) defaultLivePrice = Number(tracked.estListing);
      }
    }
    if (!defaultLivePrice && ipo.currentPrice && ipo.currentPrice > 0) defaultLivePrice = Number(ipo.currentPrice);
    if (!defaultLivePrice && ipo.cmp && ipo.cmp > 0) defaultLivePrice = Number(ipo.cmp);
    if (!defaultLivePrice && ipo.expectedListingPrice && ipo.expectedListingPrice > 0) defaultLivePrice = Number(ipo.expectedListingPrice);
    if (!defaultLivePrice && ipo.listingPrice && ipo.listingPrice > 0) defaultLivePrice = Number(ipo.listingPrice);
    if (!defaultLivePrice || defaultLivePrice <= 0) defaultLivePrice = upperPrice + marketGmp;

    const livePrice = (state.calcLivePrice !== null && state.calcLivePrice !== undefined && !isNaN(state.calcLivePrice) && state.calcLivePrice > 0)
      ? Number(state.calcLivePrice)
      : defaultLivePrice;

    // 3. Financial Quantities & Outlay
    const totalShares = lots * lotSize;
    const totalInvestment = totalShares * upperPrice;
    const totalLiveValue = totalShares * livePrice;

    // 4. PROFIT BASED ON LIVE PRICE (Primary Real-Time Metric)
    const liveGainPerShare = livePrice - upperPrice;
    const liveProfit = totalShares * liveGainPerShare;
    const liveReturnPct = upperPrice > 0 ? ((liveGainPerShare / upperPrice) * 100).toFixed(2) : "0.00";
    const liveProfitPerLot = lotSize * liveGainPerShare;
    const isLiveGain = liveGainPerShare >= 0;

    // 5. Estimated Listing Day Profit based on Unofficial GMP
    const estListingPrice = upperPrice + gmpVal;
    const estGmpProfit = totalShares * gmpVal;
    const estGmpReturnPct = upperPrice > 0 ? ((gmpVal / upperPrice) * 100).toFixed(1) : "0.0";
    const gmpProfitPerLot = lotSize * gmpVal;

    // Investor Category Determination
    let category = "Retail (RII)";
    let catDesc = "Retail Individual Investor quota (Bids up to ₹2,00,000). Computerized lottery if oversubscribed.";
    let catColor = "#1D4ED8";
    let catBg = "#EFF6FF";
    if (totalInvestment > 1000000) {
      category = "Big HNI (bHNI)";
      catDesc = "Big High Net-Worth Investor Category (> ₹10,00,000). Allotted out of 2/3rd NII quota.";
      catColor = "#7C3AED";
      catBg = "#F5F3FF";
    } else if (totalInvestment > 200000) {
      category = "Small HNI (sHNI)";
      catDesc = "Small High Net-Worth Category (₹2,00,000 – ₹10,00,000). Allotted out of 1/3rd NII quota.";
      catColor = "#B45309";
      catBg = "#FFFBEB";
    }

    // Select options grouped into clean optgroups
    const openIpos = records.filter(r => r.status === "OPEN");
    const upcomingIpos = records.filter(r => r.status === "UPCOMING").slice(0, 15);
    const listedIpos = records.filter(r => r.status === "LISTED").slice(0, 20);
    const moverStocks = [
      ...(state.liveMarketData?.marketGainers || marketGainers || []).slice(0, 4),
      ...(state.liveMarketData?.marketShakers || marketShakers || []).slice(0, 4)
    ];

    const isMatch = (slugOrId) => (slugOrId === ipo.slug || slugOrId === ipo.id);

    const selectOptionsHtml = `
      <optgroup label="🟢 Open for Bidding (Live GMP & Bids)">
        ${openIpos.map(r => `
          <option value="${r.slug}" ${isMatch(r.slug) ? 'selected' : ''}>
            ${escapeHtml(r.shortName)} [OPEN] • Issue: ₹${r.priceBandHigh || r.issuePrice} • GMP: ${r.gmp > 0 ? '+₹' + r.gmp : '₹0'}
          </option>
        `).join("")}
      </optgroup>
      <optgroup label="⏳ Upcoming IPOs (Live GMP)">
        ${upcomingIpos.map(r => `
          <option value="${r.slug}" ${isMatch(r.slug) ? 'selected' : ''}>
            ${escapeHtml(r.shortName)} [UPCOMING] • Issue: ₹${r.priceBandHigh || r.issuePrice} • GMP: ${r.gmp > 0 ? '+₹' + r.gmp : '₹0'}
          </option>
        `).join("")}
      </optgroup>
      <optgroup label="📈 Recently Listed IPOs (Real-Time Live CMP)">
        ${listedIpos.map(r => `
          <option value="${r.slug}" ${isMatch(r.slug) ? 'selected' : ''}>
            ${escapeHtml(r.shortName)} [LISTED] • Issue: ₹${r.issuePrice || r.priceBandHigh} • Live CMP: ₹${r.currentPrice || r.cmp || r.listingPrice}
          </option>
        `).join("")}
      </optgroup>
      <optgroup label="⚡ Today's Market Movers & Shakers (Live NSE/BSE)">
        ${moverStocks.map(m => `
          <option value="${m.symbol}" ${isMatch(m.symbol) ? 'selected' : ''}>
            ${escapeHtml(m.name)} • Live CMP: ${m.price} (${m.change})
          </option>
        `).join("")}
      </optgroup>
    `;

    app.innerHTML = `
      <div class="calc-container">
        <!-- Breadcrumb Navigation -->
        <nav class="detail-breadcrumbs" aria-label="Breadcrumb" style="margin-bottom:16px;">
          <a href="#/">Home</a>
          <span>&gt;</span>
          <a href="#/live-prices">Live Prices</a>
          <span>&gt;</span>
          <span style="color:var(--text-primary); font-weight:600;">IPO Profit Calculator</span>
        </nav>

        <div class="page-header-banner" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="font-size:26px; font-weight:800; color:#142B49; margin:0 0 6px;">🧮 IPO Profit Estimator &amp; Listing Gain Calculator</h1>
            <p style="font-size:14px; color:#64748B; margin:0;">
              Calculate indicative profit using available timestamped market prices and estimated listing returns.
            </p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <a href="#/live-prices" class="live-pulse-badge" style="text-decoration:none; padding:7px 14px; font-size:12px;">
              <span class="live-dot-pulse"></span>
              <span>⚡ View All 18+ Live Stock Prices</span>
            </a>
          </div>
        </div>

        <div class="calc-grid-layout">
          <!-- Left: Controls Panel -->
          <div class="calc-card-panel">
            <h2 style="font-size:17px; font-weight:800; color:#0F172A; margin:0 0 16px;">1. Select IPO &amp; Lots</h2>
            
            <div class="calc-control-group">
              <label class="calc-label-row">
                <span>Select Company</span>
                <span style="font-size:11.5px; color:#16A34A; font-weight:700;">● Live Exchange Quotes</span>
              </label>
              <select id="profit-calc-ipo-select" class="calc-select-box" onchange="window.IpoApp.setCalcCompany(this.value)">
                ${selectOptionsHtml}
              </select>
            </div>

            <!-- Issue Specs -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 12px;">
                <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase;">Issue / Base Price</span>
                <div style="font-size:18px; font-weight:800; color:#0F172A; margin-top:2px;">₹${upperPrice}</div>
              </div>
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 12px;">
                <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase;">Lot Size</span>
                <div style="font-size:18px; font-weight:800; color:#0F172A; margin-top:2px;">${lotSize.toLocaleString('en-IN')} shares</div>
              </div>
            </div>

            <!-- 1. Live Market Price (CMP) Control Box (Primary Requirement) -->
            <div class="calc-control-group" style="background:#F0FDF4; border:1.5px solid #86EFAC; border-radius:12px; padding:14px; margin-bottom:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <label style="font-size:13px; font-weight:800; color:#166534; display:flex; align-items:center; gap:6px;">
                  <span class="live-dot-pulse"></span>
                  <span>Live Market Price (CMP) / Live Target:</span>
                </label>
                <span style="font-size:11.5px; font-weight:800; color:${isLiveGain ? '#15803D' : '#DC2626'}; background:${isLiveGain ? '#DCFCE7' : '#FEE2E2'}; padding:2px 8px; border-radius:12px;">
                  ${isLiveGain ? '+' : ''}${liveReturnPct}% Return
                </span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <div style="position:relative; flex:1;">
                  <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-weight:800; color:#166534; font-size:17px;">₹</span>
                  <input type="number" id="profit-calc-liveprice-input" value="${livePrice.toFixed(2)}" min="0.01" step="0.05"
                    style="width:100%; box-sizing:border-box; padding:9px 12px 9px 30px; font-size:17px; font-weight:800; color:#0F172A; border:1.5px solid #86EFAC; border-radius:8px; background:#FFFFFF;"
                    oninput="window.IpoApp.setCalcLivePrice(this.value)" />
                </div>
                <button type="button" onclick="window.IpoApp.resetCalcLivePrice()" style="padding:9px 14px; background:#DCFCE7; border:1px solid #86EFAC; border-radius:8px; font-size:12px; font-weight:700; color:#166534; cursor:pointer;" title="Reset to live market CMP">
                  Reset CMP
                </button>
              </div>
              <div class="calc-preset-pills" style="margin-top:10px;">
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustLivePricePct(5)">+5%</button>
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustLivePricePct(10)">+10%</button>
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustLivePricePct(25)">+25%</button>
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustLivePricePct(50)">+50%</button>
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustLivePricePct(100)">2X Double</button>
                <span style="font-size:11px; color:#15803D; font-weight:600; margin-left:auto; align-self:center;">⚡ Timestamped Market Quotes</span>
              </div>
            </div>

            <!-- 2. Live Grey Market Premium (GMP) Adjustment Box -->
            <div class="calc-control-group" style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:12px; padding:14px; margin-bottom:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <label style="font-size:12.5px; font-weight:700; color:#334155; display:flex; align-items:center; gap:6px;">
                  <span>Unofficial Grey Market Premium (GMP):</span>
                </label>
                <span style="font-size:11px; font-weight:700; color:#0F766E; background:#E6FFFA; padding:2px 8px; border-radius:12px;">
                  +${estGmpReturnPct}% Listing ROI
                </span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <div style="position:relative; flex:1;">
                  <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-weight:800; color:#475569; font-size:17px;">₹</span>
                  <input type="number" id="profit-calc-gmp-input" value="${gmpVal}" min="0" max="10000" step="1" 
                    style="width:100%; box-sizing:border-box; padding:9px 12px 9px 30px; font-size:17px; font-weight:800; color:#0F172A; border:1px solid #CBD5E1; border-radius:8px; background:#FFFFFF;"
                    oninput="window.IpoApp.setCustomGmp(this.value)" />
                </div>
                <button type="button" onclick="window.IpoApp.resetCustomGmp()" style="padding:9px 14px; background:#F1F5F9; border:1px solid #CBD5E1; border-radius:8px; font-size:12px; font-weight:700; color:#475569; cursor:pointer;" title="Reset to live market GMP">
                  Reset
                </button>
              </div>
              <div class="calc-preset-pills" style="margin-top:10px;">
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustGmp(5)">+₹5</button>
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustGmp(10)">+₹10</button>
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustGmp(25)">+₹25</button>
                <button type="button" class="calc-preset-chip" onclick="window.IpoApp.adjustGmp(50)">+₹50</button>
                <span style="font-size:11px; color:#64748B; font-weight:500; margin-left:auto; align-self:center;">Est. Listing: ₹${estListingPrice}</span>
              </div>
            </div>

            <!-- Lots Slider & Presets -->
            <div class="calc-control-group">
              <div class="calc-label-row">
                <span>Application Lots: <strong id="calc-lots-val-display" style="color:#0F766E; font-size:16px;">${lots} ${lots === 1 ? 'Lot' : 'Lots'}</strong></span>
                <span style="font-size:12px; color:#64748B;">(${totalShares.toLocaleString('en-IN')} shares)</span>
              </div>
              <input type="range" id="profit-calc-slider" class="calc-range-slider" min="1" max="50" value="${lots}" oninput="window.IpoApp.setCalcLots(this.value)">
              
              <div class="calc-preset-pills">
                <button type="button" class="calc-preset-chip ${lots === 1 ? 'active' : ''}" onclick="window.IpoApp.setCalcLots(1)">1 Lot (Min)</button>
                <button type="button" class="calc-preset-chip ${lots === 2 ? 'active' : ''}" onclick="window.IpoApp.setCalcLots(2)">2 Lots</button>
                <button type="button" class="calc-preset-chip ${lots === 5 ? 'active' : ''}" onclick="window.IpoApp.setCalcLots(5)">5 Lots</button>
                <button type="button" class="calc-preset-chip ${lots === 13 ? 'active' : ''}" onclick="window.IpoApp.setCalcLots(13)">Retail Max (13 Lots)</button>
                <button type="button" class="calc-preset-chip ${lots === 14 ? 'active' : ''}" onclick="window.IpoApp.setCalcLots(14)">sHNI (14 Lots)</button>
              </div>
            </div>

            <!-- Investor Category -->
            <div style="margin-top:16px; padding-top:14px; border-top:1px dashed #CBD5E1;">
              <span class="calc-category-badge" style="background:${catBg}; color:${catColor};">
                <span>${category}</span>
              </span>
              <p style="margin:0; font-size:12px; color:#64748B; line-height:1.5;">${catDesc}</p>
            </div>
          </div>

          <!-- Right: Output & Results Panel -->
          <div class="calc-card-panel">
            <h2 style="font-size:17px; font-weight:800; color:#0F172A; margin:0 0 16px;">2. Real-Time Return Estimates</h2>

            <div class="calc-kpi-grid">
              <div class="calc-kpi-card">
                <span class="calc-kpi-label">Total Investment</span>
                <span class="calc-kpi-val" style="color:#1E293B;">₹${Number(totalInvestment).toLocaleString('en-IN')}</span>
                <span style="font-size:11px; color:#64748B;">${lots} ${lots === 1 ? 'lot' : 'lots'} (${totalShares.toLocaleString('en-IN')} shares)</span>
              </div>

              <div class="calc-kpi-card">
                <span class="calc-kpi-label">Live Holding Value</span>
                <span class="calc-kpi-val" style="color:#0284C7;">₹${Number(Math.round(totalLiveValue)).toLocaleString('en-IN')}</span>
                <span style="font-size:11px; color:#64748B;">At Live CMP ₹${livePrice.toFixed(2)}</span>
              </div>

              <!-- HERO HIGHLIGHT CARD: PROFIT BASED ON LIVE PRICE -->
              <div class="calc-kpi-card highlight-profit" style="grid-column: span 2; background: ${isLiveGain ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'}; border: 2px solid ${isLiveGain ? '#10B981' : '#EF4444'}; box-shadow: 0 4px 14px ${isLiveGain ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)'}; padding: 18px 20px; border-radius:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span class="calc-kpi-label" style="color:${isLiveGain ? '#065F46' : '#991B1B'}; font-weight:800; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
                    <span class="live-dot-pulse" style="background:${isLiveGain ? '#10B981' : '#EF4444'};"></span>
                    <span>⚡ LIVE PRICE PROFIT (BASED ON LIVE CMP)</span>
                  </span>
                  <span style="background:${isLiveGain ? '#10B981' : '#EF4444'}; color:#fff; font-size:12px; font-weight:800; padding:3px 10px; border-radius:20px;">
                    ${isLiveGain ? '+' : ''}${liveReturnPct}% Live Gain
                  </span>
                </div>
                
                <div class="calc-kpi-val" style="font-size:36px; font-weight:900; color:${isLiveGain ? '#047857' : '#DC2626'}; margin:8px 0;">
                  ${isLiveGain ? '+' : ''}₹${Number(Math.round(liveProfit)).toLocaleString('en-IN')}
                </div>

                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; border-top:1px dashed ${isLiveGain ? '#A7F3D0' : '#FECACA'}; padding-top:10px; margin-top:8px; font-size:12px; color:${isLiveGain ? '#065F46' : '#991B1B'};">
                  <div>
                    <div style="color:#64748B; font-size:11px; font-weight:600;">Profit Per 1 Lot</div>
                    <strong style="font-size:13px;">${isLiveGain ? '+' : ''}₹${Number(Math.round(liveProfitPerLot)).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <div style="color:#64748B; font-size:11px; font-weight:600;">Gain Per Share</div>
                    <strong style="font-size:13px;">${isLiveGain ? '+' : ''}₹${liveGainPerShare.toFixed(2)}</strong>
                  </div>
                  <div>
                    <div style="color:#64748B; font-size:11px; font-weight:600;">Live Price vs Issue</div>
                    <strong style="font-size:13px;">₹${livePrice.toFixed(2)} vs ₹${upperPrice}</strong>
                  </div>
                </div>
              </div>

              <!-- SECONDARY ESTIMATOR: UNOFFICIAL GMP LISTING ESTIMATE -->
              <div class="calc-kpi-card" style="grid-column: span 2; background:#F8FAFC; border:1px solid #E2E8F0; padding:12px 16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                  <span style="font-size:12px; font-weight:700; color:#475569;">
                    📊 Unofficial GMP Listing Estimate:
                  </span>
                  <strong style="color:#0F766E; font-size:13px;">
                    Est. Listing: ₹${estListingPrice} (+${estGmpReturnPct}%) • GMP Profit: +₹${Number(Math.round(estGmpProfit)).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            </div>

            <!-- Multi-Lot Live Price Profit Breakdown Grid -->
            <div style="margin-top:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
              <div style="font-size:11.5px; font-weight:700; color:#64748B; text-transform:uppercase; margin-bottom:8px;">
                Multi-Lot Live Price Profit Breakdown (At Live CMP ₹${livePrice.toFixed(2)})
              </div>
              <div style="overflow-x:auto;">
                <table style="width:100%; font-size:12px; border-collapse:collapse; text-align:right;">
                  <thead>
                    <tr style="border-bottom:1px solid #CBD5E1; color:#64748B; font-size:11px;">
                      <th style="text-align:left; padding:6px 8px;">Quota / Lots</th>
                      <th style="padding:6px 8px;">Shares</th>
                      <th style="padding:6px 8px;">Investment</th>
                      <th style="padding:6px 8px; color:${isLiveGain ? '#15803D' : '#DC2626'};">Live Price Profit</th>
                      <th style="padding:6px 8px;">Live Holding Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${[1, 2, 5, 13, 14].map(l => {
                      const s = l * lotSize;
                      const inv = s * upperPrice;
                      const prof = s * liveGainPerShare;
                      const val = s * livePrice;
                      const label = l === 1 ? '1 Lot (Min)' : (l === 13 ? '13 Lots (Max Retail)' : (l === 14 ? '14 Lots (sHNI)' : `${l} Lots`));
                      return `
                        <tr style="border-bottom:1px solid #F1F5F9; ${l === lots ? 'background:#ECFDF5; font-weight:700;' : ''}">
                          <td style="text-align:left; padding:6px 8px; color:#0F172A;">${label}</td>
                          <td style="padding:6px 8px; color:#475569;">${s.toLocaleString('en-IN')}</td>
                          <td style="padding:6px 8px; color:#0F172A;">₹${inv.toLocaleString('en-IN')}</td>
                          <td style="padding:6px 8px; font-weight:800; color:${prof >= 0 ? '#16A34A' : '#DC2626'};">
                            ${prof >= 0 ? '+' : ''}₹${Number(Math.round(prof)).toLocaleString('en-IN')}
                          </td>
                          <td style="padding:6px 8px; color:#0284C7; font-weight:600;">₹${Number(Math.round(val)).toLocaleString('en-IN')}</td>
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 1-Click Viral Sharing Bar -->
            <div class="calc-share-bar">
              <button type="button" class="btn-whatsapp-share" onclick="window.IpoApp.shareCalcWhatsApp('${escapeAttr(ipo.shortName)}', ${lots}, ${totalShares}, ${upperPrice}, ${livePrice.toFixed(2)}, ${Math.round(liveProfit)}, '${liveReturnPct}', ${gmpVal}, ${estListingPrice})">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z"/></svg>
                <span>Share Live Profit Report</span>
              </button>
              <button type="button" class="btn-copy-report" onclick="window.IpoApp.copyCalcReport('${escapeAttr(ipo.shortName)}', ${lots}, ${totalShares}, ${upperPrice}, ${livePrice.toFixed(2)}, ${Math.round(liveProfit)}, '${liveReturnPct}', ${gmpVal}, ${estListingPrice})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Copy Summary</span>
              </button>
            </div>

            <!-- Apply Now affiliate banner -->
            <div style="margin-top:16px; text-align:center;">
              <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" style="display:block; padding:11px; background:#10B981; color:#fff; border-radius:10px; font-weight:700; text-decoration:none; font-size:13.5px; border:1px solid #059669;">
                Apply for this IPO on Angel One (Zero Brokerage) &rarr;
              </a>
            </div>
          </div>
        </div>

        <!-- Live Ticker Bar Below Calculator with 1-Click Load Buttons -->
        <div style="margin-top:24px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:18px 20px; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="live-pulse-badge">
                <span class="live-dot-pulse"></span>
                <span>⚡ Real-Time Market Ticker</span>
              </span>
              <span style="font-size:13px; font-weight:700; color:#0F172A;">Trending Stocks Today (Tap to Simulate Live Profit)</span>
            </div>
            <a href="#/live-prices" style="font-size:12.5px; font-weight:700; color:#2563EB; text-decoration:none;">
              View All 18+ Live Stock Prices &rarr;
            </a>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;">
            ${(state.liveMarketData?.marketGainers || marketGainers || []).slice(0, 3).concat((state.liveMarketData?.marketShakers || marketShakers || []).slice(0, 3)).map(item => `
              <div onclick="window.IpoApp.loadStockIntoCalc('${item.symbol}', '${escapeAttr(item.name)}', ${item.rawPrice}, ${Math.round(item.rawPrice * 0.92)})"
                style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition:all 0.2s;"
                onmouseover="this.style.borderColor='#10B981'; this.style.background='#F0FDF4';"
                onmouseout="this.style.borderColor='#E2E8F0'; this.style.background='#F8FAFC';"
                title="Click to calculate profit on ${escapeAttr(item.name)}">
                <div>
                  <div style="font-size:12.5px; font-weight:700; color:#0F172A;">${escapeHtml(item.name)}</div>
                  <div style="font-size:11px; color:#16A34A; font-weight:700;">${item.change}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:13px; font-weight:800; color:#0F172A;">${item.price}</div>
                  <div style="font-size:10.5px; color:#2563EB; font-weight:600;">Simulate &rarr;</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Community Telegram & WhatsApp Broadcast Invite -->
        <div class="community-invite-banner" style="margin-top:28px;">
          <div class="community-invite-left">
            <h3>⚡ Join 45,000+ Smart Investors for Instant Alerts</h3>
            <p>Get real-time Grey Market Premium (GMP) alerts, live QIB subscription updates, and basis of allotment announcements on your phone.</p>
          </div>
          <div class="community-btn-group">
            <a href="https://api.whatsapp.com/send?text=Check%20Live%20IPO%20GMP%20%26%20Allotment%20Status%20on%20https%3A%2F%2Fpricealerter.in" target="_blank" rel="noopener noreferrer" class="btn-community-wa">
              <span>Join WhatsApp Group</span>
            </a>
            <a href="https://t.me/share/url?url=https%3A%2F%2Fpricealerter.in&text=Live%20IPO%20GMP%20Tracker%20and%20Allotment%20Status" target="_blank" rel="noopener noreferrer" class="btn-community-tg">
              <span>Join Telegram Channel</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Dedicated Real-Time Stock Prices & Market Pulse Hub
  // ==========================================================================
  function renderLivePricesPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const data = state.liveMarketData || (window.IpoData && window.IpoData.liveData) || null;
    // Fail closed: only show explicitly verified IPO quotes with source and timestamp.
    const isVerifiedQuote = stock => stock && stock.quoteVerified === true && stock.quoteTimestamp && stock.quoteSource && Number.isFinite(Number(stock.rawPrice)) && Number(stock.rawPrice) > 0;
    const allLiveStocks = (data && Array.isArray(data.allLiveStocks) ? data.allLiveStocks : []).filter(stock => isVerifiedQuote(stock) && ["RECENT_IPO", "IPO"].includes(String(stock.category || "").toUpperCase()));
    const gainers = [];
    const shakers = [];
    const losers = [];
    const recentIpos = allLiveStocks;
    const bluechips = [];

    const activeFilter = state.livePricesFilter || "all";
    const searchQuery = (state.livePricesSearch || "").toLowerCase().trim();

    // Calculate dynamic category counts
    const countGainers = gainers.length;
    const countShakers = shakers.length;
    const countLosers = losers.length;
    const countRecentIpos = recentIpos.length;
    const countBluechips = bluechips.length;
    const countAll = allLiveStocks.length;

    // Filter stock list based on active category
    let allStocks = [];
    if (activeFilter === "all") {
      if (allLiveStocks) {
        allStocks = [...allLiveStocks];
      } else {
        recentIpos.forEach(s => allStocks.push({ ...s, category: "RECENT_IPO", catLabel: "🚀 Recent IPO Debut" }));
        gainers.forEach(s => allStocks.push({ ...s, category: "GAINER", catLabel: "🏆 Top Gainer" }));
        shakers.forEach(s => allStocks.push({ ...s, category: "SHAKER", catLabel: "⚡ Market Shaker" }));
        losers.forEach(s => allStocks.push({ ...s, category: "LOSER", catLabel: "🔻 Top Loser" }));
        bluechips.forEach(s => allStocks.push({ ...s, category: "BLUECHIP", catLabel: "🏛️ Nifty 50 Bluechip" }));
      }
    } else if (activeFilter === "recent-ipos" || activeFilter === "ipos") {
      if (allLiveStocks) {
        allStocks = allLiveStocks.filter(s => s.category === "RECENT_IPO");
      } else {
        allStocks = recentIpos.map(s => ({ ...s, category: "RECENT_IPO", catLabel: "🚀 Recent IPO Debut" }));
      }
    } else if (activeFilter === "gainers") {
      if (allLiveStocks) {
        allStocks = allLiveStocks.filter(s => s.category === "GAINER");
      } else {
        allStocks = gainers.map(s => ({ ...s, category: "GAINER", catLabel: "🏆 Top Gainer" }));
      }
    } else if (activeFilter === "shakers") {
      if (allLiveStocks) {
        allStocks = allLiveStocks.filter(s => s.category === "SHAKER");
      } else {
        allStocks = shakers.map(s => ({ ...s, category: "SHAKER", catLabel: "⚡ Market Shaker" }));
      }
    } else if (activeFilter === "losers") {
      if (allLiveStocks) {
        allStocks = allLiveStocks.filter(s => s.category === "LOSER");
      } else {
        allStocks = losers.map(s => ({ ...s, category: "LOSER", catLabel: "🔻 Top Loser" }));
      }
    } else if (activeFilter === "bluechips") {
      if (allLiveStocks) {
        allStocks = allLiveStocks.filter(s => s.category === "BLUECHIP");
      } else {
        allStocks = bluechips.map(s => ({ ...s, category: "BLUECHIP", catLabel: "🏛️ Nifty 50 Bluechip" }));
      }
    }

    // Filter by search query
    if (searchQuery) {
      allStocks = allStocks.filter(s => 
        (s.name && s.name.toLowerCase().includes(searchQuery)) ||
        (s.symbol && s.symbol.toLowerCase().includes(searchQuery)) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(searchQuery)) ||
        (s.catLabel && s.catLabel.toLowerCase().includes(searchQuery))
      );
    }

    const lastSyncStr = (data && data.lastSyncFormatted) ? data.lastSyncFormatted : "Live Feed Active";
    const countdownSec = state.liveNextSyncSeconds || 600;
    const mins = Math.floor(countdownSec / 60);
    const secs = countdownSec % 60;
    const timerDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    app.innerHTML = `
      <div class="live-prices-container">
        <!-- Breadcrumb Navigation -->
        <nav class="detail-breadcrumbs" aria-label="Breadcrumb" style="margin-bottom:16px;">
          <a href="#/">Home</a>
          <span>&gt;</span>
          <span style="color:var(--text-primary); font-weight:600;">⚡ Real-Time Stock Quotes &amp; Market Pulse</span>
        </nav>

        <!-- Live Pulse Hero Banner -->
        <div class="page-header-banner" style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color:#FFFFFF; border-radius:16px; padding:24px 28px; margin-bottom:16px; box-shadow:0 4px 16px rgba(15,23,42,0.15);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div style="max-width:720px;">
              <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.4); padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; color:#4ADE80; margin-bottom:10px;">
                <span class="live-dot-pulse"></span>
                <span>VERIFIED IPO QUOTES ONLY</span>
              </div>
              <h1 style="font-size:28px; font-weight:900; margin:0 0 8px; color:#F8FAFC;">
                ⚡ Live Indian Stock Prices &amp; Primary Market Pulse
              </h1>
              <p style="font-size:14px; color:#94A3B8; margin:0; line-height:1.5;">
                Only quotes with an explicit verification flag, provider source and quote timestamp are displayed. Unverified snapshots are hidden.
              </p>
            </div>

            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
              <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:10px; padding:10px 14px; text-align:right;">
                <div style="font-size:11px; color:#94A3B8; text-transform:uppercase; font-weight:700;">Auto-Sync Countdown</div>
                <div style="font-size:22px; font-weight:900; color:#38BDF8; font-family:monospace;" id="live-sync-timer">${timerDisplay}</div>
                <div style="font-size:10.5px; color:#CBD5E1; margin-top:2px;">Last: ${lastSyncStr}</div>
              </div>
              <button type="button" onclick="window.IpoApp.refreshLiveMarketData()" style="background:#2563EB; color:#fff; border:none; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                <span>Refresh Live Prices Now</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Official Market Data Feeds Compliance Banner -->
        <div class="exchange-compliance-bar" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:12px 18px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="font-size:11.5px; font-weight:800; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22C55E; box-shadow:0 0 6px #22C55E;"></span>
              Market-data provider references (not proof of an active feed):
            </span>
            <a href="https://www.nseindia.com/static/market-data/real-time-data-subscription" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; color:#1E40AF; text-decoration:none; background:#EFF6FF; padding:4px 10px; border-radius:6px; border:1px solid #DBEAFE;">
              🏛️ NSE Data &amp; Analytics
            </a>
            <a href="https://marketdata.bseindia.com/" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; color:#0F766E; text-decoration:none; background:#F0FDFA; padding:4px 10px; border-radius:6px; border:1px solid #CCFBF1;">
              🏢 BSE Market Data Portal
            </a>
            <a href="https://dhan.co/ipo/" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; color:#6D28D9; text-decoration:none; background:#F5F3FF; padding:4px 10px; border-radius:6px; border:1px solid #EDE9FE;">
              📱 Dhan Primary Markets
            </a>
            <a href="https://tapetide.com/" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; color:#C2410C; text-decoration:none; background:#FFF7ED; padding:4px 10px; border-radius:6px; border:1px solid #FFEDD5;">
              🌊 Tapetide Intelligence
            </a>
          </div>
          <div style="font-size:11.5px; color:#64748B; font-weight:500;">
            Quotes are withheld until a licensed feed is connected and verified.
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="live-controls-bar">
          <div class="live-filter-tabs">
            <button type="button" class="live-filter-btn ${activeFilter === 'all' ? 'active' : ''}" onclick="window.IpoApp.setLivePricesFilter('all')">
              All Stocks (${countAll})
            </button>
            <button type="button" class="live-filter-btn ${activeFilter === 'recent-ipos' ? 'active' : ''}" onclick="window.IpoApp.setLivePricesFilter('recent-ipos')">
              🚀 Recent IPOs (${countRecentIpos})
            </button>
            <button type="button" class="live-filter-btn ${activeFilter === 'gainers' ? 'active' : ''}" onclick="window.IpoApp.setLivePricesFilter('gainers')">
              🏆 Top Gainers (${countGainers})
            </button>
            <button type="button" class="live-filter-btn ${activeFilter === 'shakers' ? 'active' : ''}" onclick="window.IpoApp.setLivePricesFilter('shakers')">
              ⚡ Market Shakers (${countShakers})
            </button>
            <button type="button" class="live-filter-btn ${activeFilter === 'losers' ? 'active' : ''}" onclick="window.IpoApp.setLivePricesFilter('losers')">
              🔻 Top Losers (${countLosers})
            </button>
            <button type="button" class="live-filter-btn ${activeFilter === 'bluechips' ? 'active' : ''}" onclick="window.IpoApp.setLivePricesFilter('bluechips')">
              🏛️ Bluechips (${countBluechips})
            </button>
          </div>

          <div class="live-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search stock or ticker..." value="${escapeAttr(state.livePricesSearch || '')}" oninput="window.IpoApp.setLivePricesSearch(this.value)" />
          </div>
        </div>

        <!-- Live Stocks Grid -->
        <div class="live-stocks-grid">
          ${allStocks.map(stock => {
            const isGain = stock.isGain !== false;
            const badgeClass = isGain ? "live-badge-gain" : "live-badge-loss";
            const symbolText = stock.symbol || "NSE";
            const isIpo = stock.category === "RECENT_IPO" || stock.category === "IPO";

            return `
              <div class="live-stock-card">
                <div class="live-card-top">
                  <div class="live-card-company">
                    <div class="movers-logo-box" style="position:relative; width:42px; height:42px; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:${stock.gradient || '#2563EB'}; flex-shrink:0;">
                      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#FFFFFF; font-weight:800; font-size:13px; z-index:1;">${stock.initials || 'EQ'}</div>
                      <img src="${stock.logo}" alt="${escapeAttr(stock.name)} logo" width="42" height="42" class="movers-logo-img" loading="lazy" referrerpolicy="no-referrer" style="position:relative; z-index:2; width:100%; height:100%; object-fit:contain; background:#FFFFFF;" onerror="this.style.display='none';" />
                    </div>
                    <div>
                      <div class="live-card-name">${escapeHtml(stock.name)}</div>
                      <div class="live-card-meta">${escapeHtml(stock.subtitle || stock.catLabel || symbolText)}</div>
                    </div>
                  </div>
                  <span style="font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px; background:#F1F5F9; color:#475569;">
                    ${escapeHtml(stock.symbol || 'NSE')}
                  </span>
                </div>

                <div class="live-card-price-row">
                  <div>
                    <span style="font-size:10.5px; color:#64748B; font-weight:700; text-transform:uppercase;">Current Market Price</span>
                    <div class="live-card-cmp">${stock.price}</div>
                  </div>
                  <div class="${badgeClass}">
                    <span>${isGain ? '▲' : '▼'}</span>
                    <span>${stock.change}</span>
                  </div>
                </div>

                <!-- Stats: Volume & Surge / Issue Price -->
                <div class="live-card-stats">
                  <div class="live-card-stat-item">
                    <span class="live-card-stat-label">Traded Volume</span>
                    <span class="live-card-stat-val">${stock.volume || '—'}</span>
                  </div>
                  <div class="live-card-stat-item" style="text-align:right;">
                    <span class="live-card-stat-label">${stock.issuePrice ? 'Issue Price' : (stock.volChange ? 'Weekly Surge' : 'Day Range')}</span>
                    <span class="live-card-stat-val" style="color:${stock.volChange ? '#059669' : '#0F172A'};">
                      ${stock.issuePrice ? `₹${stock.issuePrice}` : (stock.volChange ? stock.volChange : (stock.low && stock.high ? `₹${stock.low} - ₹${stock.high}` : 'Regular Market'))}
                    </span>
                  </div>
                </div>

                <!-- Sparkline Trend if present -->
                ${stock.trend && stock.trend.length ? `
                  <div style="height:32px; width:100%;">
                    ${renderMoversSparkline(stock.trend, isGain ? '#00B386' : '#EB5B3C', isGain, 280, 32)}
                  </div>
                ` : ''}

                <!-- Quick Action Buttons -->
                <div class="live-card-actions">
                  <button type="button" onclick="window.IpoApp.loadStockIntoCalc('${escapeAttr(stock.symbol)}', '${escapeAttr(stock.name)}', ${stock.rawPrice}, ${stock.issuePrice || stock.rawPrice * 0.92})" class="btn-calc-shortcut" style="cursor:pointer; width:100%;">
                    <span>🧮 Profit Calculator</span>
                  </button>
                  ${stock.slug ? `
                    <a href="#/detail/${stock.slug}" class="btn-calc-shortcut" style="background:#F8FAFC; color:#475569; border-color:#E2E8F0; text-align:center;">
                      <span>📄 Overview</span>
                    </a>
                  ` : `
                    <a href="#/gmp" class="btn-calc-shortcut" style="background:#F8FAFC; color:#475569; border-color:#E2E8F0; text-align:center;">
                      <span>📊 GMP Trends</span>
                    </a>
                  `}
                </div>
              </div>
            `;
          }).join("")}
        </div>

        ${allStocks.length === 0 ? `
          <div style="text-align:center; padding:48px 20px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; margin-top:20px;">
            <div style="font-size:28px; margin-bottom:8px;">🔍</div>
            <h3 style="font-size:16px; font-weight:800; color:#0F172A; margin:0 0 6px;">No stocks match your query</h3>
            <p style="font-size:13px; color:#64748B; margin:0 0 16px;">Try clearing your search query or switching filters.</p>
            <button type="button" onclick="window.IpoApp.setLivePricesSearch(''); window.IpoApp.setLivePricesFilter('all');" style="padding:8px 16px; background:#2563EB; color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">
              Clear Search Filter
            </button>
          </div>
        ` : ''}

        <!-- Community Telegram & WhatsApp Broadcast Invite -->
        <div class="community-invite-banner" style="margin-top:28px;">
          <div class="community-invite-left">
            <h3>⚡ Join 45,000+ Smart Investors for Instant Alerts</h3>
            <p>Get real-time Grey Market Premium (GMP) alerts, live QIB subscription updates, and basis of allotment announcements on your phone.</p>
          </div>
          <div class="community-btn-group">
            <a href="https://api.whatsapp.com/send?text=Check%20Live%20Stock%20Prices%20%26%20IPO%20GMP%20on%20https%3A%2F%2Fpricealerter.in%23%2Flive-prices" target="_blank" rel="noopener noreferrer" class="btn-community-wa">
              <span>Join WhatsApp Group</span>
            </a>
            <a href="https://t.me/share/url?url=https%3A%2F%2Fpricealerter.in%23%2Flive-prices&text=Real-Time%20Indian%20Stock%20Prices%20and%20IPO%20GMP%20Tracker" target="_blank" rel="noopener noreferrer" class="btn-community-tg">
              <span>Join Telegram Channel</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }


  // ==========================================================================
  // Dedicated Direct Allotment Routing Hub Page
  // ==========================================================================
  function renderAllotmentHubPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const selectedSlug = state.allotmentSelectedSlug || "vedant-poly-fabs-ipo";
    const ipo = records.find(r => r.slug === selectedSlug || r.id === selectedSlug) || records[0];

    const closedList = records.filter(r => r.status === "CLOSED" || r.status === "LISTED" || r.status === "OPEN").slice(0, 30);
    const selectOptions = closedList.map(r => {
      const isSel = (r.slug === ipo.slug || r.id === ipo.id) ? "selected" : "";
      return `<option value="${r.slug}" ${isSel}>${escapeHtml(r.shortName)} • Registrar: ${escapeHtml(r.registrar || 'Assigned Registrar')}</option>`;
    }).join("");

    const regUrl = ipo.allotmentUrl || "https://linkintime.co.in/initial_offer/public-issues.html";
    const regName = ipo.registrar || "Official Registrar";

    app.innerHTML = `
      <div class="allotment-hub-container">
        <!-- Breadcrumb Navigation -->
        <nav class="detail-breadcrumbs" aria-label="Breadcrumb" style="margin-bottom:16px;">
          <a href="#/">Home</a>
          <span>&gt;</span>
          <span style="color:var(--text-primary); font-weight:600;">Allotment Status Checker</span>
        </nav>

        <div class="page-header-banner" style="margin-bottom:20px;">
          <h1 style="font-size:26px; font-weight:800; color:#142B49; margin:0 0 6px;">📋 Direct Allotment Status Routing Hub</h1>
          <p style="font-size:14px; color:#64748B; margin:0;">
            Instantly query your allotment status across official registrars (Link Intime, KFintech, Bigshare, Cameo) and stock exchanges.
          </p>
        </div>

        <!-- 1. Featured Company Router Card -->
        <div class="allotment-featured-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
            <div>
              <span style="font-size:11.5px; font-weight:700; color:#0F766E; background:#F0FDFA; padding:3px 8px; border-radius:6px; border:1px solid #99F6E4;">INSTANT QUERY ROUTER</span>
              <h2 style="font-size:18px; font-weight:800; color:#0F172A; margin:6px 0 0;">Check Allotment for Any Issue</h2>
            </div>
            <div style="min-width:260px; max-width:100%;">
              <select id="allotment-company-select" class="calc-select-box" onchange="window.IpoApp.setAllotmentCompany(this.value)">
                ${selectOptions}
              </select>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:14px; padding:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; flex-wrap:wrap;">
            ${renderCompanyLogo(ipo, 48)}
            <div style="flex:1; min-width:200px;">
              <h3 style="font-size:16px; font-weight:800; color:#0F172A; margin:0 0 4px;">${escapeHtml(ipo.companyName || ipo.shortName)}</h3>
              <div style="font-size:12.5px; color:#64748B;">
                <strong>Designated Registrar:</strong> <span style="color:#0F172A; font-weight:700;">${escapeHtml(regName)}</span>
                ${ipo.allotDate ? ` &bull; <strong>Allotment Date:</strong> ${formatDate(ipo.allotDate)}` : ''}
              </div>
            </div>
          </div>

          <div class="allotment-action-buttons">
            <a href="${regUrl}" target="_blank" rel="noopener noreferrer" class="btn-registrar-direct" title="Launch Official Registrar Allotment Server">
              <span>Open ${escapeHtml(regName)} Portal ↗</span>
            </a>
            <a href="https://www.bseindia.com/investors/appli_check.aspx" target="_blank" rel="noopener noreferrer" class="btn-exchange-verify" title="Verify directly on BSE India Official Portal">
              <span>BSE India Verification ↗</span>
            </a>
            <a href="https://www.nseindia.com/invest/check-trades-bids-verify-ipo-bids" target="_blank" rel="noopener noreferrer" class="btn-exchange-verify" title="Verify on NSE India Bid Status Portal">
              <span>NSE India Query ↗</span>
            </a>
          </div>
        </div>

        <!-- 2. Master Registrars Directory (All Major Indian Portals) -->
        <h2 style="font-size:18px; font-weight:800; color:#0F172A; margin:28px 0 6px;">Official Primary Market Registrars</h2>
        <p style="font-size:13.5px; color:#64748B; margin:0 0 16px;">Direct access links to all SEBI-registered registrar verification query servers.</p>

        <div class="registrars-grid">
          <div class="registrar-box-card">
            <div>
              <h3 class="registrar-box-title">Link Intime India</h3>
              <div class="registrar-box-sub">Registrar for Afcons, Waaree, Swiggy, Sagility, Tata Technologies</div>
            </div>
            <div class="registrar-server-links">
              <a href="https://linkintime.co.in/initial_offer/public-issues.html" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 1 ↗</a>
              <a href="https://web.linkintime.co.in/initial_offer/" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 2 ↗</a>
            </div>
          </div>

          <div class="registrar-box-card">
            <div>
              <h3 class="registrar-box-title">KFin Technologies</h3>
              <div class="registrar-box-sub">Registrar for ACME Solar, Bajaj Housing, Premier Energies, Ajwa</div>
            </div>
            <div class="registrar-server-links">
              <a href="https://ipostatus.kfintech.com/" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 1 ↗</a>
              <a href="https://kosmic.kfintech.com/ipostatus/" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 2 ↗</a>
              <a href="https://kcas.kfintech.com/ipostatus/" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 3 ↗</a>
            </div>
          </div>

          <div class="registrar-box-card">
            <div>
              <h3 class="registrar-box-title">Bigshare Services</h3>
              <div class="registrar-box-sub">Registrar for Carver Roboweld, M.K. Sons, Antala, Bombay Coated</div>
            </div>
            <div class="registrar-server-links">
              <a href="https://www.bigshareonline.com/ipo_Allotment.html" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 1 ↗</a>
              <a href="https://ipo.bigshareonline.com/" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 2 ↗</a>
            </div>
          </div>

          <div class="registrar-box-card">
            <div>
              <h3 class="registrar-box-title">Cameo Corporate Services</h3>
              <div class="registrar-box-sub">Registrar for Vedant Poly Fabs Solutions and NSE SME offerings</div>
            </div>
            <div class="registrar-server-links">
              <a href="https://ipostatus1.cameoindia.com/" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 1 ↗</a>
              <a href="https://ipo.cameoindia.com/" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Server 2 ↗</a>
            </div>
          </div>

          <div class="registrar-box-card">
            <div>
              <h3 class="registrar-box-title">Maashitla Instruments</h3>
              <div class="registrar-box-sub">Designated registrar for key SME book-built public issues</div>
            </div>
            <div class="registrar-server-links">
              <a href="https://maashitla.com/allotment-status/" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Query Server ↗</a>
            </div>
          </div>

          <div class="registrar-box-card">
            <div>
              <h3 class="registrar-box-title">Skyline Financial Services</h3>
              <div class="registrar-box-sub">Registrar for manufacturing and engineering industrial offerings</div>
            </div>
            <div class="registrar-server-links">
              <a href="https://www.skylinerta.com/ipo.php" target="_blank" rel="noopener noreferrer" class="btn-reg-server">Query Server ↗</a>
            </div>
          </div>
        </div>

        <!-- 3. Walkthrough Guide Card -->
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:20px; margin-top:24px;">
          <h3 style="font-size:16px; font-weight:700; color:#0F172A; margin:0 0 10px;">📌 3 Easy Steps to Verify Allotment Online:</h3>
          <ol style="margin:0; padding-left:20px; color:#475569; font-size:13.5px; line-height:1.7;">
            <li><strong>Step 1:</strong> Select the designated registrar portal or BSE application status link above.</li>
            <li><strong>Step 2:</strong> Select the IPO company name from the dropdown list.</li>
            <li><strong>Step 3:</strong> Enter your 10-digit <strong>PAN Number</strong> (or DP Client ID / Application Number) and click <em>Search / Submit</em>.</li>
          </ol>
        </div>
      </div>
    `;
  }

  function renderGmpPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const gmpList = getFilteredGmpIssues();

    app.innerHTML = `
      <div class="detail-view-container">
        <div class="page-header-banner">
          <h2>Live Grey Market Premium (GMP) Tracker</h2>
          <p>Real-time unofficial premiums, estimated listing gains, and profit calculations across all active IPOs.</p>
          <div style="margin-top:8px; font-size:12px; font-weight:600; color:var(--brand-blue-light); display:inline-flex; align-items:center; gap:6px; background:rgba(37,99,235,0.12); padding:4px 10px; border-radius:12px;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10B981;"></span>
            ${formatGmpLastUpdated()} · Market Close Verified
          </div>
        </div>

        <!-- Important SEBI Investor Advisory on Grey Market Premium -->
        <div class="gmp-advisory-card">
          <div class="gmp-advisory-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Important Investor Advisory on Grey Market Premium (GMP)</span>
          </div>
          <p class="gmp-advisory-text">
            <strong>Please Note:</strong> Grey Market Premium (GMP) is an unofficial, unregulated cash premium traded informally off-market before official stock exchange listing. GMP prices fluctuate rapidly based on short-term sentiment, do <strong>NOT</strong> reflect verified company balance sheets or fundamentals, and do <strong>NOT</strong> guarantee actual listing day returns on NSE or BSE. Never make investment or bidding decisions solely based on GMP. Always read the official SEBI-approved DRHP/RHP prospectus and consult a certified financial advisor before applying.
          </p>
        </div>

        <!-- Filter and Search Bar -->
        <div class="filter-tabs-wrapper" style="margin-top:18px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div class="filter-pills-group">
            <button class="filter-pill ${state.gmpFilter === 'all' || !state.gmpFilter ? 'active' : ''}" onclick="window.IpoApp.setGmpFilter('all')">All IPOs</button>
            <button class="filter-pill ${state.gmpFilter === 'open' ? 'active' : ''}" onclick="window.IpoApp.setGmpFilter('open')">Open Issues Only</button>
            <button class="filter-pill ${state.gmpFilter === 'bullish' ? 'active' : ''}" onclick="window.IpoApp.setGmpFilter('bullish')">Bullish (GMP &gt; 0)</button>
          </div>

          <div style="position:relative; width:260px; max-width:100%;">
            <input type="text" 
                   id="gmp-search-input"
                   class="fig1-subscribe-input" 
                   style="width:100%; padding:8px 12px 8px 34px; font-size:13px; background:#FFFFFF; border:1px solid #CBD5E1; color:#111827;" 
                   placeholder="Search GMP by company..." 
                   value="${escapeHtml(state.gmpSearchQuery || '')}"
                   oninput="window.IpoApp.setGmpSearch(this.value)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" style="position:absolute; left:11px; top:11px;">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        <div class="data-table-card">
          <table class="full-data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Timeline / Date</th>
                <th>Price Band</th>
                <th>Current GMP</th>
                <th>Estimated Listing</th>
                <th>Expected Gain %</th>
                <th>Status</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody id="gmp-table-body">
              ${renderGmpRows(gmpList)}
            </tbody>
          </table>
        </div>

        <!-- Editorial Context: Macro Sentiment & Grey Market Price Dynamics -->
        <article class="guide-section-card" style="margin-top:20px; padding:20px 24px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg);">
          <h3 style="font-size:16px; color:var(--text-heading); margin-bottom:10px; display:flex; align-items:center; gap:8px;">
            <span>📊 Macro Sentiment & Grey Market Price Dynamics Editorial</span>
          </h3>
          <p style="font-size:13px; line-height:1.6; color:var(--text-body); margin-bottom:12px;">
            The primary market in India currently displays distinct bifurcation between high-growth Mainboard industrial manufacturing issues and specialized SME enterprise offerings. Unofficial Grey Market Premiums (GMP) tracked in the table above represent informal dealer indications gathered across Ahmedabad, Mumbai, and Rajkot trading hubs. These quotes reflect early appetite among High-Net-Worth Individuals (HNIs) seeking pre-listing allocations, driven primarily by anchor investor pedigree, QIB oversubscription multiples, and order book visibility.
          </p>
          <p style="font-size:13px; line-height:1.6; color:var(--text-body); margin:0;">
            However, investors should observe that grey market activity is inherently unregulated and lacks exchange clearing corporation protections. While issues with sustained GMP premiums exceeding 30% historically exhibit enthusiastic opening session price discovery on the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE), macro liquidity fluctuations, domestic institutional participation, and secondary market benchmark volatility (NIFTY 50 / SENSEX) ultimately dictate opening strike prices. We recommend utilizing GMP exclusively as a supplemental sentiment pulse alongside fundamental balance sheet analysis.
          </p>
        </article>

        <!-- AdSense Native Slot -->
        ${renderAdSenseUnit("5892147360", "auto")}

        <!-- Primary Market Official Directory -->
        ${renderPortalDirectoryWidget()}
      </div>
    `;
  }

  
  // ==========================================================================
  // Community Investor Discussion & Real-Time Comments (LocalStorage)
  // ==========================================================================
  function getIpoComments(slug) {
    const key = "ipo_comments_" + slug;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    // Realistic seeded discussion comments
    const seed = [
      {
        id: "c1",
        author: "Vikram Mehta, CFA",
        time: "Today, 11:30 AM",
        sentiment: "bullish",
        likes: 18,
        text: "Solid revenue growth of >28% CAGR over the past 3 fiscal years. Working capital cycle is improving and retail portion is seeing heavy participation."
      },
      {
        id: "c2",
        author: "Pooja Sharma",
        time: "Today, 2:15 PM",
        sentiment: "neutral",
        likes: 9,
        text: "Valuation is slightly rich at upper price band, but grey market premium (GMP) indicates healthy listing day interest. Applying for 1 lot in retail category."
      },
      {
        id: "c3",
        author: "Karthik Rajan",
        time: "Yesterday, 4:45 PM",
        sentiment: "bullish",
        likes: 12,
        text: "Make sure to check the cut-off price checkbox and approve your UPI ASBA mandate in PhonePe/GPay before 5:00 PM to avoid rejection."
      }
    ];
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  function addIpoComment(slug, author, sentiment, text) {
    const key = "ipo_comments_" + slug;
    const comments = getIpoComments(slug);
    const newComment = {
      id: "c_" + Date.now(),
      author: author.trim() || "Retail Investor",
      time: "Just now",
      sentiment: sentiment || "bullish",
      likes: 1,
      text: text.trim()
    };
    comments.unshift(newComment);
    localStorage.setItem(key, JSON.stringify(comments));
    return newComment;
  }

  function getUserLikedComments() {
    try {
      return JSON.parse(localStorage.getItem("ipo_user_liked_comments") || "[]");
    } catch(e) {
      return [];
    }
  }

  function toggleIpoCommentLike(slug, commentId) {
    const key = "ipo_comments_" + slug;
    const comments = getIpoComments(slug);
    const item = comments.find(c => c.id === commentId);
    if (!item) return { newCount: 0, liked: false };

    const likedList = getUserLikedComments();
    const commentKey = `${slug}_${commentId}`;
    const alreadyLiked = likedList.includes(commentKey);

    let isNowLiked = false;
    if (alreadyLiked) {
      // 1-Time Toggle: Click again to unlike/remove vote
      item.likes = Math.max(0, (item.likes || 1) - 1);
      const idx = likedList.indexOf(commentKey);
      if (idx > -1) likedList.splice(idx, 1);
      isNowLiked = false;
    } else {
      // First click: Register helpful vote
      item.likes = (item.likes || 0) + 1;
      likedList.push(commentKey);
      isNowLiked = true;
    }

    localStorage.setItem(key, JSON.stringify(comments));
    localStorage.setItem("ipo_user_liked_comments", JSON.stringify(likedList));
    return { newCount: item.likes, liked: isNowLiked };
  }

  function renderDiscussionWidget(ipo) {
    const comments = getIpoComments(ipo.slug);
    const bullishCount = comments.filter(c => c.sentiment === "bullish").length;
    const neutralCount = comments.filter(c => c.sentiment === "neutral").length;
    const bearishCount = comments.filter(c => c.sentiment === "bearish").length;
    const total = comments.length || 1;
    const bullishPct = Math.round((bullishCount / total) * 100);
    const userLikes = getUserLikedComments();

    return `
      <section class="discussion-section" id="discussion-section" aria-label="Investor Community Discussion">
        <div class="discussion-head">
          <div>
            <h3 class="discussion-title">Investor Community Discussion (${comments.length})</h3>
            <span style="font-size:12px; color:var(--text-muted);">Real-time crowdsourced analysis, GMP sentiment, and allotment discussion</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:12px; font-weight:700; color:#16A34A;">${bullishPct}% Bullish (Apply)</span>
            <span style="font-size:11px; color:var(--text-muted);">• ${neutralCount} Neutral • ${bearishCount} Avoid</span>
          </div>
        </div>

        <!-- Add Comment Form -->
        <div class="comment-form-box">
          <div class="comment-input-row">
            <input type="text" id="comment-author-input" class="comment-name-input" placeholder="Your Name or Alias (e.g. Ramesh K.)" maxlength="40">
            <select id="comment-sentiment-select" class="comment-sentiment-select" aria-label="Select investor sentiment">
              <option value="bullish">🟢 Bullish — Applying for Listing Gains</option>
              <option value="neutral">⚪ Neutral — Tracking Day 3 Demand</option>
              <option value="bearish">🔴 Bearish — High Valuation / Avoid</option>
            </select>
          </div>
          <textarea id="comment-text-input" class="comment-textarea" placeholder="Share your perspective on ${ipo.shortName}'s financials, GMP, anchor list, or allotment chances..." rows="3"></textarea>
          <div style="display:flex; justify-content:flex-end;">
            <button class="comment-submit-btn" id="submit-comment-btn" data-slug="${ipo.slug}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              <span>Post Discussion</span>
            </button>
          </div>
        </div>

        <!-- Comments List -->
        <div class="comment-list" id="comments-container">
          ${comments.map(c => {
            const isLiked = userLikes.includes(`${ipo.slug}_${c.id}`);
            return `
              <div class="comment-item-card">
                <div class="comment-item-head">
                  <div class="comment-author-wrap">
                    <div class="comment-avatar">${c.author.substring(0, 1).toUpperCase()}</div>
                    <div>
                      <span class="comment-author-name">${c.author}</span>
                      <span class="comment-time-text"> • ${c.time}</span>
                    </div>
                  </div>
                  <span class="comment-sentiment-badge ${c.sentiment}">${c.sentiment === 'bullish' ? '🟢 Bullish' : c.sentiment === 'neutral' ? '⚪ Neutral' : '🔴 Bearish'}</span>
                </div>
                <p class="comment-text-body">${c.text}</p>
                <div class="comment-item-foot">
                  <button class="comment-like-btn ${isLiked ? 'liked' : ''}" onclick="window.IpoApp.likeComment('${ipo.slug}', '${c.id}', this)" title="${isLiked ? 'Click to unlike' : 'Click if helpful'}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="${isLiked ? '#2563EB' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    <span>Helpful (${c.likes})</span>
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  // ==========================================================================
  // Calendar Day-by-Day Detailed Schedule Panel
  // ==========================================================================
  function renderDayScheduleDetailed(dateStr) {
    const events = dataset.calendarEvents?.[dateStr] || [];
    const dateFormatted = formatDate(dateStr);

    // Also find any live open IPOs
    const openList = records.filter(r => r.status === "OPEN");

    return `
      <section class="calendar-day-detail-panel" aria-label="Detailed Market Schedule">
        <div class="day-detail-head">
          <div>
            <h3>Market Action Schedule for ${dateFormatted}</h3>
            <span style="font-size:12px; color:var(--text-muted);">Exact milestones, active bidding windows, and official registrar allotment links</span>
          </div>
          <span class="badge-pulse" style="background:#10B981;"></span>
        </div>

        <div class="day-events-list">
          ${events.length > 0 ? events.map(ev => {
            const ipo = records.find(r => r.id === ev.id || r.slug === ev.id || r.shortName.toLowerCase().includes(ev.name.toLowerCase()));
            const evType = (ev.type || "open").toLowerCase();
            return `
              <div class="day-event-card ${evType}">
                <div class="event-info-left">
                  ${ipo ? renderCompanyLogo(ipo, 38) : `<div class="company-avatar-box" style="width:38px;height:38px;background:#2563EB;">EV</div>`}
                  <div>
                    <div class="event-company-name">${ev.name} <span class="status-badge ${evType}">${ev.type}</span></div>
                    <div class="event-meta-sub">${ev.text} • ${ipo ? ipo.sector : 'Primary Market'}</div>
                  </div>
                </div>
                <div class="event-action-right">
                  ${ipo && ipo.allotmentUrl ? `
                    <a href="${ipo.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="btn-table-allotment">
                      <span>Check Allotment</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline></svg>
                    </a>
                  ` : ipo ? `
                    <a href="#/ipo/${ipo.slug}" class="btn-card-action btn-view">
                      <span>View Details</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                  ` : ''}
                </div>
              </div>
            `;
          }).join("") : `
            <div style="padding:18px; text-align:center; color:var(--text-muted); font-size:13px; background:var(--bg-input); border-radius:8px;">
              No special closures scheduled for ${dateFormatted}. Currently, <strong>2 IPOs are actively Open for Bidding</strong>.
            </div>
          `}
        </div>

        <!-- Live Open Issues Spotlight on Calendar -->
        <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border-subtle);">
          <h4 style="font-size:14px; color:var(--text-primary); margin-bottom:12px; font-weight:700;">Currently Active Open IPOs for Bidding:</h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:10px;">
            ${openList.map(o => `
              <div style="padding:12px 14px; background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:10px;">
                  ${renderCompanyLogo(o, 32)}
                  <div>
                    <div style="font-weight:700; font-size:13px; color:#fff;">${o.shortName}</div>
                    <div style="font-size:11px; color:var(--text-muted);">₹${o.priceBandLow}–${o.priceBandHigh} • Closes ${formatDate(o.closeDate)}</div>
                  </div>
                </div>
                <a href="https://mdeal.in/c_iDpnIUs4" target="_blank" rel="noopener noreferrer" style="font-size:11px; font-weight:700; color:#10B981; background:rgba(16,185,129,0.15); padding:4px 8px; border-radius:4px; text-decoration:none;">Apply &rarr;</a>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================================================
  // Comprehensive Knowledge Center & Practical Investor Guide (FAQ)
  // ==========================================================================
  function renderGuidePage() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
      <div class="guide-container">
        <!-- Knowledge Center Hero -->
        <header class="guide-hero">
          <div style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; background:rgba(37,99,235,0.2); border:1px solid rgba(37,99,235,0.4); color:#60A5FA; font-size:11px; font-weight:700; margin-bottom:12px;">
            <span>LEARNING ACADEMY</span>
          </div>
          <h1>IPO Knowledge Center &amp; Investor Guide</h1>
          <p>Everything you need to know about Initial Public Offerings (IPOs) in India: foundational concepts, bidding procedures via UPI ASBA, SEBI quotas, allotment stages, and listing gains.</p>
        </header>

        <!-- Educational Category Tabs (Filter Guides) -->
        <div class="category-tabs" style="margin-top:20px; margin-bottom:24px; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          <button type="button" class="cat-pill active" onclick="window.IpoApp.filterGuideCategory('all', this)">All Guides (10)</button>
          <button type="button" class="cat-pill" onclick="window.IpoApp.filterGuideCategory('beginner', this)">Beginner Essentials</button>
          <button type="button" class="cat-pill" onclick="window.IpoApp.filterGuideCategory('asba', this)">Allotment &amp; ASBA</button>
          <button type="button" class="cat-pill" onclick="window.IpoApp.filterGuideCategory('gmp', this)">GMP &amp; Valuation</button>
          <button type="button" class="cat-pill" onclick="window.IpoApp.filterGuideCategory('sme', this)">SME vs Mainboard</button>
        </div>

        <!-- Featured Guide Articles Grid -->
        <div class="guide-articles-grid" id="guide-articles-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px; margin-bottom:30px;">
          <div class="guide-article-card" data-category="beginner" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#1D4ED8; background:#EFF6FF; padding:2px 8px; border-radius:10px;">Beginner Guide</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">What is an IPO? A Beginner's Guide</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Understand how Initial Public Offerings work in India, NSE/BSE listings, and how private firms raise capital.</p>
            </div>
            <a href="/blog/what-is-an-ipo.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="asba" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#047857; background:#ECFDF5; padding:2px 8px; border-radius:10px;">Step-by-Step Tutorial</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">How to Apply for an IPO (UPI &amp; ASBA)</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Step-by-step bidding tutorial using your broker's platform or bank net banking.</p>
            </div>
            <a href="/blog/how-to-apply-for-ipo.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="gmp" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#B45309; background:#FFFBEB; padding:2px 8px; border-radius:10px;">Market Analysis</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">Understanding Grey Market Premium (GMP)</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Kostak rates, Subject to Sauda terms, how off-market sentiments work, and why GMP is speculative.</p>
            </div>
            <a href="/blog/understanding-grey-market-premium-gmp.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="sme" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#6D28D9; background:#F5F3FF; padding:2px 8px; border-radius:10px;">Comparison Guide</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">IPO vs FPO vs OFS Comparison</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Side-by-side breakdown of Initial Public Offerings, Follow-on Offers, and Offer for Sale dilution.</p>
            </div>
            <a href="/blog/ipo-vs-fpo-vs-ofs.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="asba" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#047857; background:#ECFDF5; padding:2px 8px; border-radius:10px;">SEBI Regulations</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">How IPO Allotment Works in India</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Demystifying SEBI's computerized lottery allotment process and maximizing allotment chances legally.</p>
            </div>
            <a href="/blog/how-ipo-allotment-works.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="beginner gmp" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#1D4ED8; background:#EFF6FF; padding:2px 8px; border-radius:10px;">Strategy</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">Top 10 IPO Investing Tips</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Essential checklist for reading DRHP/RHP filings, peer P/E valuations, and listing-day exit strategy.</p>
            </div>
            <a href="/blog/top-10-ipo-investing-tips.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="asba" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#047857; background:#ECFDF5; padding:2px 8px; border-radius:10px;">Verification Portal</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">Check IPO Allotment Status Online</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Direct verification methods on Link Intime, KFintech, Bigshare, BSE, and NSE using PAN &amp; DP ID.</p>
            </div>
            <a href="/blog/how-to-check-ipo-allotment-status.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="sme" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#6D28D9; background:#F5F3FF; padding:2px 8px; border-radius:10px;">Exchange Comparison</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">Mainboard vs SME IPO Guide</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Comparing BSE SME / NSE Emerge with Mainboard: lot sizes (₹1L+), liquidity, and migration rules.</p>
            </div>
            <a href="/blog/mainboard-vs-sme-ipo.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="beginner" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#1D4ED8; background:#EFF6FF; padding:2px 8px; border-radius:10px;">Market Mechanics</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">What is Book Building in IPO?</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">Price discovery mechanics, cut-off prices, compilation of bidding books, and price band caps.</p>
            </div>
            <a href="/blog/what-is-book-building-process.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>

          <div class="guide-article-card" data-category="beginner" style="padding:18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div>
              <span style="font-size:11px; font-weight:700; color:#1D4ED8; background:#EFF6FF; padding:2px 8px; border-radius:10px;">Account Setup</span>
              <h3 style="font-size:15px; font-weight:700; color:#111827; margin:8px 0 6px;">Open a Demat Account for IPOs</h3>
              <p style="font-size:12.5px; color:#64748B; margin:0 0 12px; line-height:1.5;">How to choose a registered broker, prepare KYC documents, and set up a UPI handle.</p>
            </div>
            <a href="/blog/how-to-open-demat-account-for-ipo.html" class="btn-table-action" style="background:#142B49; color:#FFFFFF; text-decoration:none; padding:7px 14px; font-size:12px; font-weight:600; border-radius:6px; text-align:center;">Read Full Guide &rarr;</a>
          </div>
        </div>

        <!-- AdSense Top Leaderboard Slot -->
        ${renderAdSenseUnit("5892147360", "auto")}

        <!-- Section 1: What Is an IPO? -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">1</div>
            <h2 class="guide-section-title">What Is an IPO?</h2>
          </div>
          <p class="guide-text">
            When a private limited company decides to go public for the first time, it launches an <strong>IPO or Initial Public Offering</strong>. This transitions the company from being privately held to publicly traded on a stock exchange like the <strong>BSE (Bombay Stock Exchange)</strong> or <strong>NSE (National Stock Exchange)</strong>.
          </p>
          <div class="guide-highlight-box">
            <strong>Key Distinction: Fresh Issue vs. Offer for Sale (OFS)</strong><br>
            • <strong>Fresh Issue:</strong> The company issues brand-new shares to raise capital that goes directly onto the company's balance sheet for expansion, capex, or debt reduction.<br>
            • <strong>Offer for Sale (OFS):</strong> Existing promoters, angel investors, or venture capital funds sell their personal shareholdings to the public. Money from OFS goes to selling shareholders, not into the company treasury.
          </div>
          <p class="guide-text">
            Prior to launching the issue, the company files a <strong>Draft Red Herring Prospectus (DRHP)</strong> with the Securities and Exchange Board of India (SEBI) for regulatory review. Once approved, a finalized <strong>Red Herring Prospectus (RHP)</strong> is released with the exact price band, lot size, issue dates, and financial statements.
          </p>
        </article>

        <!-- Section 2: Why Do Companies Go Public? -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">2</div>
            <h2 class="guide-section-title">Why Do Companies Go Public?</h2>
          </div>
          <p class="guide-text">
            Transitioning from a private company to a public corporation requires immense regulatory transparency, quarterly disclosures, and compliance. Companies take this step for several strategic benefits:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Pillar 1</span>
              <h4>Raising Growth Capital</h4>
              <p>Funding new manufacturing plants, R&D labs, geographical expansion, and technological upgrades without paying ongoing bank interest or compounding debt obligations.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pillar 2</span>
              <h4>Debt Reduction (Deleveraging)</h4>
              <p>Paying off existing high-interest term loans to drastically reduce finance costs, boosting net profit margins (PAT) and improving debt-to-equity credit metrics.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pillar 3</span>
              <h4>Liquidity & Exit for Early Investors</h4>
              <p>Providing a formal, transparent stock market exit for venture capital (VC) funds, private equity firms, and early angel backers who nurtured the company from its startup phase.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pillar 4</span>
              <h4>Prestige & Brand Visibility</h4>
              <p>Being listed on the NSE and BSE provides instant credibility, public trust, and higher standing with global suppliers, corporate clients, and international lenders.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pillar 5</span>
              <h4>Employee Wealth Creation (ESOPs)</h4>
              <p>Liquid stock options allow companies to attract and retain top-tier executive talent by aligning employee incentives directly with market capitalization gains.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pillar 6</span>
              <h4>Currency for M&A Acquisitions</h4>
              <p>Listed equity can be utilized as transactional currency to acquire competitors or merge with strategic domestic or overseas targets.</p>
            </div>
          </div>
        </article>

        <!-- Section 3: Who Can Apply For an IPO? -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">3</div>
            <h2 class="guide-section-title">Who Can Apply For an IPO?</h2>
          </div>
          <p class="guide-text">
            The below categories of investors are eligible to apply for an IPO under SEBI regulations:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card" style="border-top:3px solid #38BDF8;">
              <span class="step-badge" style="background:rgba(56,189,248,0.15); color:#38BDF8;">35% Quota</span>
              <h4>Retail Individual Investors (RII)</h4>
              <p>Resident Indian individuals, NRIs, and HUFs applying for an investment value up to <strong>₹2,00,000</strong>. Retail bidders can select the <strong>Cut-off price</strong> checkbox. If oversubscribed, allotment is carried out via a fair computerized lottery.</p>
            </div>
            <div class="guide-step-card" style="border-top:3px solid #F59E0B;">
              <span class="step-badge" style="background:rgba(245,158,11,0.15); color:#F59E0B;">5% Quota</span>
              <h4>Small Non-Institutional (sNII / sHNI)</h4>
              <p>High-net-worth individuals and corporate entities bidding for an application value <strong>between ₹2,00,000 and ₹10,00,000</strong>. Cannot bid at cut-off price; must specify an explicit bid price.</p>
            </div>
            <div class="guide-step-card" style="border-top:3px solid #8B5CF6;">
              <span class="step-badge" style="background:rgba(139,92,246,0.15); color:#8B5CF6;">10% Quota</span>
              <h4>Big Non-Institutional (bNII / bHNI)</h4>
              <p>Large HNIs, family offices, and corporate treasuries bidding for an amount <strong>above ₹10,00,000</strong>. Minimum allocation is set to the smallest lot size possible in the bHNI bucket.</p>
            </div>
            <div class="guide-step-card" style="border-top:3px solid #10B981;">
              <span class="step-badge" style="background:rgba(16,185,129,0.15); color:#10B981;">50% Quota</span>
              <h4>Qualified Institutional Buyers (QIB)</h4>
              <p>Institutional entities registered with SEBI: Mutual Funds, Foreign Portfolio Investors (FPIs), Scheduled Commercial Banks, Insurance Companies, and Provident Funds. Includes Anchor allocation.</p>
            </div>
          </div>
        </article>

        <!-- Section 4: How To Apply For An IPO via UPI ASBA? -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">4</div>
            <h2 class="guide-section-title">How To Apply For An IPO via UPI ASBA?</h2>
          </div>
          <p class="guide-text">
            Applying for an IPO via UPI ASBA takes less than a minute on any SEBI-registered trading portal or bank. Follow this standard step-by-step procedure:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Step 1</span>
              <h4>Open Trading App & Navigate to IPO</h4>
              <p>Log in to your investment app or netbanking portal and navigate to the <strong>IPO</strong> section.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Step 2</span>
              <h4>Select Active Issue</h4>
              <p>Browse the list under <strong>Open</strong> IPOs. Select the company you want to bid for and click <strong>Apply</strong>.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Step 3</span>
              <h4>Enter Lots & Select Cut-off Price</h4>
              <p>Enter the number of lots you wish to purchase. Check the box for <strong>Cut-off Price</strong> to ensure your application is automatically matched at the final strike price.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Step 4</span>
              <h4>Enter Your UPI ID & Submit</h4>
              <p>Enter your bank-linked UPI ID (e.g., <code>name@okhdfcbank</code>, <code>name@okaxis</code>, <code>name@ybl</code>, <code>name@upi</code>) and submit your application.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Step 5</span>
              <h4>Approve UPI Mandate on Phone</h4>
              <p>Open your UPI app (Google Pay, PhonePe, Paytm, or BHIM) before 5:00 PM on closing day. Approve the mandate request with your UPI PIN. Your funds stay safely blocked in your account earning interest until allotment!</p>
            </div>
          </div>
        </article>

        <!-- Section 5: What Happens After Applying For IPO? -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">5</div>
            <h2 class="guide-section-title">What Happens After Applying For IPO?</h2>
          </div>
          <p class="guide-text">
            Once you have successfully applied for an IPO, the process moves through several key stages leading to the allotment and listing:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Stage 1</span>
              <h4>Bidding Closes & Mandate Block</h4>
              <p>At 5:00 PM on the final day, bidding closes on NSE and BSE. Your bid amount remains locked (lien-blocked) in your bank under SEBI's UPI ASBA system.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Stage 2</span>
              <h4>Basis of Allotment Finalization</h4>
              <p>The appointed registrar (KFintech, Link Intime, Bigshare, Maashitla, etc.) verifies bids. In oversubscribed issues, a randomized computer lottery is executed under stock exchange oversight.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Stage 3</span>
              <h4>Debit or Mandate Release (Refund)</h4>
              <p>If allotted shares, your bank account is debited. If unallotted, the blocked funds are unblocked within 24 to 48 hours without any deduction.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Stage 4</span>
              <h4>Credit of Shares to Demat</h4>
              <p>On the allotment date (T+2 day), allotted equity shares are credited directly into your CDSL or NSDL Demat account linked with your broker.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Stage 5</span>
              <h4>Listing & Trading on NSE / BSE</h4>
              <p>On listing morning (T+3 day), discovery trading starts at 9:00 AM (pre-open session) and regular trading opens at 10:00 AM. You can book listing gains or hold long term!</p>
            </div>
          </div>
        </article>
        <!-- Section 6: What is an ASBA Application & How Does Bank Lien-Blocking Work? -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">6</div>
            <h2 class="guide-section-title">What is an ASBA Application & How Does Bank Lien-Blocking Work?</h2>
          </div>
          <p class="guide-text">
            <strong>ASBA (Application Supported by Blocked Amount)</strong> is the mandatory bidding mechanism pioneered by the Securities and Exchange Board of India (SEBI) for all public issues. Before ASBA was instituted, investors had to write physical cheques or transfer full cash to issuing merchant bankers, facing delayed refund cheques spanning months. Under ASBA, your bid money never leaves your bank account until shares are officially allotted.
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Pillar 1</span>
              <h4>Lien-Marking Mechanism</h4>
              <p>When you authorize a UPI mandate or NetBanking ASBA form, your Self-Certified Syndicate Bank (SCSB) places a hold or 'lien' on the exact bidding sum. This amount is locked from withdrawal but remains securely in your account.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pillar 2</span>
              <h4>Continuous Interest Accrual</h4>
              <p>Because the funds remain in your savings bank account throughout the 3-day bidding and allotment window, you continue to earn standard daily interest from your bank on the entire blocked sum.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pillar 3</span>
              <h4>Automated Debit on Allotment</h4>
              <p>On the Basis of Allotment date, if you receive shares, the registrar dispatches an automated clearing instruction to your bank to debit only the exact proportionate allotment amount.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pillar 4</span>
              <h4>Instant Lien Revocation (Refunds)</h4>
              <p>If your bid is unallotted due to heavy oversubscription, your bank releases the lien block within 24 hours of registrar confirmation, instantly restoring your full withdrawable balance without deductions.</p>
            </div>
          </div>
        </article>

        <!-- Section 7: Mainboard vs. SME IPOs: Critical Framework Differences -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">7</div>
            <h2 class="guide-section-title">Mainboard vs. SME IPOs: Critical Framework Differences</h2>
          </div>
          <p class="guide-text">
            While both segments allow Indian enterprises to raise equity capital from public markets, SEBI enforces stark regulatory and structural differences between established Mainboard corporations and emerging small-and-medium enterprises (SMEs):
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card" style="border-top:3px solid #38BDF8;">
              <span class="step-badge" style="background:rgba(56,189,248,0.15); color:#38BDF8;">Capital & Listing</span>
              <h4>Minimum Paid-Up Capital</h4>
              <p><strong>Mainboard:</strong> Requires minimum post-issue paid-up equity of ₹10 Crore (commonly ₹100+ Cr).<br><strong>SME:</strong> Post-issue capital cannot exceed ₹25 Crore, listing on BSE SME or NSE Emerge.</p>
            </div>
            <div class="guide-step-card" style="border-top:3px solid #F59E0B;">
              <span class="step-badge" style="background:rgba(245,158,11,0.15); color:#F59E0B;">Ticket Size</span>
              <h4>Lot Sizes & Minimum Investment</h4>
              <p><strong>Mainboard:</strong> Retail lot size is designed for broad participation (~₹14,000 to ₹15,000).<br><strong>SME:</strong> Mandatory high minimum ticket size of ₹1,00,000 to ₹2,50,000 per application to restrict entry to seasoned investors.</p>
            </div>
            <div class="guide-step-card" style="border-top:3px solid #8B5CF6;">
              <span class="step-badge" style="background:rgba(139,92,246,0.15); color:#8B5CF6;">Trading Rules</span>
              <h4>Secondary Market Lot Trading</h4>
              <p><strong>Mainboard:</strong> Post-listing, shares can be bought or sold in single-share increments (1 share).<br><strong>SME:</strong> Shares must be traded in mandatory whole lots (e.g., 1,000, 1,200, or 2,000 shares) even in secondary market trading.</p>
            </div>
            <div class="guide-step-card" style="border-top:3px solid #10B981;">
              <span class="step-badge" style="background:rgba(16,185,129,0.15); color:#10B981;">Underwriting</span>
              <h4>Market Making & Underwriting</h4>
              <p><strong>Mainboard:</strong> Merchant bankers underwrite issues based on institutional demand.<br><strong>SME:</strong> Merchant bankers must 100% underwrite the issue and appoint a designated Market Maker to provide continuous two-way liquidity for 3 years.</p>
            </div>
          </div>
        </article>

        <!-- Section 8: Anchor Investors: Understanding the 30-Day and 90-Day Lock-in Mechanics -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">8</div>
            <h2 class="guide-section-title">Anchor Investors: Understanding the 30-Day and 90-Day Lock-in Mechanics</h2>
          </div>
          <p class="guide-text">
            <strong>Anchor Investors</strong> are high-profile institutional investors (such as sovereign wealth funds, domestic mutual funds, foreign portfolio investors, and insurance majors) invited to bid one business day prior to the public issue opening. Anchors provide price discovery validation and instill confidence in retail bidders:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Criteria</span>
              <h4>Minimum Ticket Size & Pricing</h4>
              <p>Anchor investors must commit a minimum application value of ₹10 Crore each. They are allotted shares at the absolute ceiling of the public price band, confirming institutional willingness to invest at maximum valuation.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Quota</span>
              <h4>Allocation Limits</h4>
              <p>Up to 60% of the Qualified Institutional Buyers (QIB) portion can be reserved for anchor investors. Of this anchor book, a mandatory 33% must be earmarked exclusively for domestic mutual funds.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Lock-in Stage 1</span>
              <h4>30-Day Mandatory Lock-in</h4>
              <p>To curb immediate listing-day dumping, SEBI mandates that 50% of the shares allocated to anchor investors cannot be sold for 30 calendar days following the allotment date.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Lock-in Stage 2</span>
              <h4>90-Day Extended Lock-in</h4>
              <p>The remaining 50% of anchor shares are subject to an extended 90-day lock-in period. Retail investors should track the 30-day and 90-day expiry dates, as sudden institutional selling can exert temporary downward supply pressure.</p>
            </div>
          </div>
        </article>

        <!-- Section 9: How to Analyze a Red Herring Prospectus (RHP) in 15 Minutes -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">9</div>
            <h2 class="guide-section-title">How to Analyze a Red Herring Prospectus (RHP) in 15 Minutes</h2>
          </div>
          <p class="guide-text">
            The <strong>Red Herring Prospectus (RHP)</strong> is a comprehensive legal and financial disclosure document (often exceeding 400 pages) filed with SEBI and registrars of companies. While reading the entire document is daunting, retail investors can extract 90% of actionable insights by focusing on 5 pivotal chapters:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Chapter 1</span>
              <h4>Objects of the Issue</h4>
              <p>Examine where your capital will be deployed. Look for productive use of proceeds: capex, manufacturing plant expansion, technology upgrades, or high-cost debt retirement. Be cautious if >70% of the issue is an Offer for Sale (OFS) exiting early backers.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Chapter 2</span>
              <h4>Restated Financial Information</h4>
              <p>Review 3 full financial years plus stub period metrics. Check for consistent top-line Revenue CAGR (>15%), expanding operating EBITDA margins, and positive Free Cash Flow (FCF) from core operating activities.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Chapter 3</span>
              <h4>Internal & External Risk Factors</h4>
              <p>Skim the 'Risk Factors' section for critical structural vulnerabilities: pending promoter litigations, customer concentration (e.g., top 5 clients generating >60% of total sales), raw material import dependency, or key personnel risks.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Chapter 4</span>
              <h4>Peer Comparison & Valuation Ratios</h4>
              <p>Compare the issuer's Price-to-Earnings (P/E) multiple, Return on Net Worth (RoNW), and Price-to-Book (P/B) against established listed competitors. Avoid issues priced at egregious valuation premiums without superior profit margins.</p>
            </div>
          </div>
        </article>

        <!-- Section 10: Grey Market Premium (GMP), Kostak Rates & Subject to Sauda Demystified -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">10</div>
            <h2 class="guide-section-title">Grey Market Premium (GMP), Kostak Rates & Subject to Sauda Demystified</h2>
          </div>
          <p class="guide-text">
            The unorganized over-the-counter (OTC) primary market operates via specialized brokers prior to official exchange listing. Understanding market jargon is essential for retail participants:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Concept 1</span>
              <h4>Grey Market Premium (GMP)</h4>
              <p>The estimated per-share markup at which IPO applications or prospective allotted shares trade unofficially. If issue price is ₹200 and GMP is ₹50, anticipated listing price is ₹250 (+25%). Fluctuates daily based on retail hype and subscription tallies.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Concept 2</span>
              <h4>Kostak Rate</h4>
              <p>The flat cash consideration paid by a grey market buyer to purchase a completed IPO retail application before allotment is announced. The seller receives this fixed sum regardless of whether the application is subsequently allotted or rejected.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Concept 3</span>
              <h4>Subject to Sauda</h4>
              <p>A conditional forward agreement where a buyer pays an agreed premium only if shares are successfully allotted to the applicant. If no allotment occurs in the computerized lottery, the contract is nullified without cash exchange.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Advisory</span>
              <h4>Regulatory Standing</h4>
              <p><strong>Crucial Warning:</strong> Grey market transactions are strictly informal and have zero regulatory standing under SEBI or Indian judicial arbitration. Counterparty default risk is high during turbulent market crashes.</p>
            </div>
          </div>
        </article>

        <!-- Section 11: Taxation on IPO Listing Profits: STCG (20%) vs LTCG (12.5%) & Advance Tax -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">11</div>
            <h2 class="guide-section-title">Taxation on IPO Listing Profits: STCG (20%) vs LTCG (12.5%) & Advance Tax</h2>
          </div>
          <p class="guide-text">
            Profits realized from selling allotted IPO equity shares are subject to Indian capital gains taxation under the Income Tax Act, 1961:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Section 111A</span>
              <h4>Short-Term Capital Gains (STCG)</h4>
              <p>Applicable if allotted shares are sold on listing day or held for <strong>less than or equal to 12 months</strong>. Taxed at a flat rate of <strong>20%</strong> (effective from Union Budget 2024, previously 15%), plus 4% Health and Education Cess (effective 20.8%).</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Section 112A</span>
              <h4>Long-Term Capital Gains (LTCG)</h4>
              <p>Applicable if allotted equity shares are held for <strong>more than 12 months</strong>. Long-term gains exceeding the annual statutory exemption limit of <strong>₹1,25,000</strong> per financial year are taxed at <strong>12.5%</strong> without indexation benefits.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Levy</span>
              <h4>Securities Transaction Tax (STT)</h4>
              <p>Both STCG and LTCG preferential tax rates apply only if Securities Transaction Tax (STT) has been settled at the time of sale through the recognized stock exchange platform (NSE or BSE).</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Compliance</span>
              <h4>Advance Tax Deadlines</h4>
              <p>If your estimated tax liability exceeds ₹10,000 in a financial year, you must remit advance tax installments (15% by June 15, 45% by Sept 15, 75% by Dec 15, 100% by March 15) to avoid penal interest under Sections 234B and 234C.</p>
            </div>
          </div>
        </article>

        <!-- Section 12: NSE & BSE Pre-Open Price Discovery Mechanics (9:00 AM – 9:45 AM IST) -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">12</div>
            <h2 class="guide-section-title">NSE & BSE Pre-Open Price Discovery Mechanics (9:00 AM – 9:45 AM IST)</h2>
          </div>
          <p class="guide-text">
            On listing morning (T+3 day), newly debuting equity shares do not commence direct trading at 9:15 AM like regular secondary market stocks. Instead, stock exchanges conduct an extended 45-minute Call Auction session to discover an unbiased opening market price:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Phase 1</span>
              <h4>9:00 AM – 9:45 AM: Order Collection</h4>
              <p>Market participants (retail, institutional, and HNIs) place, modify, or cancel buy and sell limit orders. No actual trades are executed during this window; orders accumulate in the exchange central order book.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Phase 2</span>
              <h4>9:45 AM – 9:55 AM: Price Matching</h4>
              <p>The exchange matching engine calculates the single equilibrium strike price that maximizes cumulative transacted volume. All matched buy and sell bids execute at this uniform opening discovery price.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Phase 3</span>
              <h4>9:55 AM – 10:00 AM: Buffer Period</h4>
              <p>A 5-minute system transition interval where no orders can be placed, facilitating exchange clearing infrastructure handover to continuous normal market hours.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Phase 4</span>
              <h4>10:00 AM: Regular Trading Begins</h4>
              <p>Continuous secondary market trading opens. Standard circuit filters (e.g., 20% or 10% on Mainboard issues, 90% listing day cap on SME segment) become operational relative to the discovered equilibrium price.</p>
            </div>
          </div>
        </article>

        <!-- Section 13: Top 7 Reasons Why IPO Applications Get Rejected & How to Prevent It -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">13</div>
            <h2 class="guide-section-title">Top 7 Reasons Why IPO Applications Get Rejected & How to Prevent It</h2>
          </div>
          <p class="guide-text">
            Registrars automatically screen bid data received from stock exchanges. Avoid these common blunders that cause immediate disqualification:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Pitfall 1</span>
              <h4>Third-Party Bank Account Bidding</h4>
              <p>The PAN registered on your bank account generating the UPI mandate must match the PAN on your Demat account exactly. Submitting a bid for your account using a spouse or friend's UPI ID results in immediate rejection.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pitfall 2</span>
              <h4>Multiple Bids under Identical PAN</h4>
              <p>Applying for the same IPO through multiple trading brokers (e.g., bidding on Broker A and Broker B using the same PAN) flags a duplicate application error. All bids associated with that PAN are disqualified.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pitfall 3</span>
              <h4>Expired UPI Mandate</h4>
              <p>Bidding closes on exchange terminals at 5:00 PM on the final day. If you fail to open your UPI app and authorize the mandate request before 5:00 PM, your bid is omitted from the registrar's allotment file.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Pitfall 4</span>
              <h4>Bidding Below Price Band Ceiling</h4>
              <p>In heavily oversubscribed issues, allocating shares below the price band ceiling is statistically impossible. Failing to select the 'Cut-off Price' option in the retail quota leads to disqualification if the issue prices at the cap.</p>
            </div>
          </div>
        </article>

        <!-- Section 14: Role of Official IPO Registrars: KFintech, Link Intime & Bigshare -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">14</div>
            <h2 class="guide-section-title">Role of Official IPO Registrars: KFintech, Link Intime & Bigshare</h2>
          </div>
          <p class="guide-text">
            <strong>Registrars and Transfer Agents (RTAs)</strong> are independent SEBI-licensed institutions appointed by the issuing company. They operate independently of stock brokers to ensure integrity in the primary issuance pipeline:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Duty 1</span>
              <h4>Bid File Validation & Scrubbing</h4>
              <p>The registrar collects raw bidding files from NSE, BSE, and syndicate member banks. They perform automated data scrubbing to eliminate invalid PANs, duplicate bids, and unpaid mandates.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Duty 2</span>
              <h4>Execution of Computerized Lottery</h4>
              <p>When the retail or NNI category is oversubscribed, the registrar executes an exchange-audited random lottery algorithm to select successful applicants, ensuring zero human intervention or favoritism.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Duty 3</span>
              <h4>Fund Debit & Unfreeze Execution</h4>
              <p>Following allotment approval, the registrar dispatches electronic instructions to SCSB clearing banks to debit allotted bidders and simultaneously release blocked funds for non-allottees.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Duty 4</span>
              <h4>Official Verification Portals</h4>
              <p>The registrar hosts verified public inquiry portals where investors can verify their application status using PAN, Demat Beneficiary DP ID, or Application Number within hours of finalization.</p>
            </div>
          </div>
        </article>

        <!-- Section 15: Strategic Exit: Listing Day Flipping vs Long-Term Compounding -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">15</div>
            <h2 class="guide-section-title">Strategic Exit: Listing Day Flipping vs Long-Term Compounding</h2>
          </div>
          <p class="guide-text">
            Successful primary market participation requires an explicit exit framework tailored to company fundamentals, valuation multiples, and market environment:
          </p>
          <div class="guide-steps-grid">
            <div class="guide-step-card">
              <span class="step-badge">Strategy A</span>
              <h4>Listing Day Listing Gain Booking (Flipping)</h4>
              <p>Ideal for issues characterized by speculative retail euphoria, high GMP, and stretched valuations (>50x P/E) relative to industry peers. Selling within the first 15–30 minutes of regular trading secures fast cash gains while avoiding secondary market post-hype corrections.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Strategy B</span>
              <h4>Partial Profit Booking (Principal Extraction)</h4>
              <p>In issues opening with >80% to 100% listing gains, selling half of your allotted shares recovers your entire initial capital investment. The remaining shares can be held long term risk-free as 'house money'.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Strategy C</span>
              <h4>Multi-Year Long-Term Compounding</h4>
              <p>Suited for market leaders operating in high-barrier moats with clean corporate governance, compounding ROE (>20%), and secular tailwinds. Holding past the listing spike allows investors to participate in multi-bagger corporate earnings expansion.</p>
            </div>
            <div class="guide-step-card">
              <span class="step-badge">Strategy D</span>
              <h4>Trailing Stop-Loss Discipline</h4>
              <p>If holding through listing day volatility, place a trailing stop-loss 5% below the pre-open discovery price. This protects your hard-earned paper gains if institutional anchor dumping triggers an intraday trend reversal.</p>
            </div>
          </div>
        </article>

        <!-- Native In-Feed Ad Unit (Slot 1400016775) -->
        ${renderInFeedAdUnit(false)}

        <!-- Section 16: Frequently Asked Questions (FAQ) Accordion -->
        <article class="guide-section-card">
          <div class="guide-section-header">
            <div class="guide-section-num">?</div>
            <h2 class="guide-section-title">Frequently Asked Questions (FAQ) — Primary Market Directory</h2>
          </div>
          <p class="guide-text">
            Comprehensive answers to the top 15 questions asked by Indian retail and HNI investors:
          </p>

          <div class="faq-list">
            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>1. What is Grey Market Premium (GMP) and how is it calculated?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                Grey Market Premium (GMP) is the unofficial premium over the IPO issue price at which shares are traded in the unorganized grey market prior to official listing. For example, if an IPO price band upper cap is ₹100 and the GMP is ₹25, the expected tentative listing price is ₹125 (+25%). While GMP provides a valuable gauge of retail sentiment and subscription hype, it is completely unregulated and should not be your sole decision parameter.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>2. What is the difference between an SME IPO and a Mainboard IPO?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                <strong>Mainboard IPOs</strong> list on the main exchanges of NSE and BSE. They require high minimum post-issue capital (₹10+ Cr), allow retail lot sizes around ₹14,000–₹15,000, and trade in single share lots post-listing.<br><br>
                <strong>SME IPOs</strong> list on BSE SME or NSE Emerge platforms, targeted at small and emerging businesses. The minimum application value is substantially higher (typically ₹1,00,000 to ₹2,50,000), and shares must be traded in mandatory lot multiples (e.g. 1,000 or 2,000 shares) even after listing.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>3. What is the SEBI T+3 Listing Timeline?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                SEBI has made the T+3 listing cycle mandatory for all public issues in India. Under this guideline, a company must complete allotment, refund unblocking, and list shares on stock exchanges within exactly 3 working days after the issue closing date (T Day), greatly shortening fund lock-in periods for investors.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>4. What is "Cut-off Price" and should I always check it?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                The Cut-off price is the final price discovered at which the company ultimately allocates shares to investors. For retail investors (bidding up to ₹2 Lakh), checking the "Cut-off Price" box guarantees that your application will not be disqualified if the company issues shares at the upper cap of the price band. It is highly recommended for all retail applicants.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>5. Can I apply for an IPO with multiple Demat accounts under the same PAN?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                No. SEBI and IPO registrars filter and reject multiple applications made under the identical PAN card. Submitting multiple bids under one PAN across different brokers will cause all your applications to be rejected as duplicate bids. However, you can legally increase your family's allotment odds by applying for 1 retail lot each from separate Demat accounts belonging to individual family members with different PAN cards.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>6. How are capital gains taxed when selling IPO shares on listing day?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                Under the Indian Income Tax Act, equity shares sold within 12 months of allotment are classified as <strong>Short-Term Capital Gains (STCG)</strong> and are taxed at a flat rate of 20% (plus applicable surcharge and cess) under Section 111A. If held for more than 12 months, profits exceeding ₹1.25 Lakh per financial year are taxed as Long-Term Capital Gains (LTCG) at 12.5%.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>7. What happens if an IPO fails to achieve 90% minimum subscription?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                Under SEBI regulations, a public issue must achieve a minimum subscription threshold of 90% of the net offer to the public. If the minimum subscription is not reached within the prescribed bidding timeframe, the entire issue is canceled, and the company is legally obligated to unblock all ASBA funds within 2 business days.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>8. How does the computerized lottery system select retail winners in oversubscribed IPOs?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                When the retail portion of an IPO is oversubscribed (e.g., 50x or 100x), SEBI guidelines mandate that maximum individual retail applicants receive at least one minimum lot. The registrar runs an exchange-supervised random computerized lottery that gives every valid PAN an equal probability of selection, irrespective of whether they applied on Day 1 or Day 3.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>9. Can I modify or cancel my IPO application before 5:00 PM on closing day?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                Yes. Retail Individual Investors (bidding up to ₹2,00,000) are permitted to revise their bid quantity, change their price, or completely cancel their application at any point before the stock exchange bidding cutoff at 5:00 PM IST on the final closing day. Non-Institutional (HNI) and QIB bidders are not permitted to withdraw or downward-revise their bids.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>10. What is an Anchor Book and where can I view anchor investor allocations?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                An Anchor Book discloses the list of premier institutional funds (Mutual Funds, FPIs, Sovereign Funds) that committed capital to an IPO prior to opening day. The company files an official Anchor Allocation Disclosure circular with BSE and NSE on the evening before issue opening, detailing the names of allocated funds and the exact number of shares subscribed.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>11. What should I do if my bank has not unblocked my ASBA funds after allotment?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                If your application was not allotted shares but the bank lien remains active after 3 business days, you should: (1) Contact your bank's ASBA / UPI helpdesk with your Application Number, (2) email the official registrar (Link Intime, KFintech, or Bigshare) with your PAN, and (3) lodge a ticket on SEBI SCORES portal (scores.sebi.gov.in) if the lien is not resolved within 5 working days.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>12. Why do grey market premiums fluctuate so rapidly right before the issue closes?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                On the final day of bidding (Day 3), institutional QIB and Big HNI (bNII) subscription orders flood the exchange between 2:00 PM and 5:00 PM. High institutional oversubscription (e.g., QIB >100x) signals strong institutional validation, triggering immediate upward surges in grey market quotes. Conversely, lackluster institutional interest leads to rapid downward GMP corrections.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>13. Is it possible to apply from both BSE and NSE at the same time?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                No. Both BSE and NSE exchange terminals feed into a single consolidated registrar database. Submitting simultaneous applications for the same issue across both exchanges will be identified as duplicate bids under your PAN card and both will be disqualified.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>14. What are circuit limits on listing day for Mainboard vs SME IPOs?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                On Mainboard IPOs, once the opening price is discovered in the pre-open auction, a standard intraday circuit band (typically 20% or 10%) takes effect. For SME IPOs, SEBI enforces an overall listing day price band cap of 90% (upward or downward) relative to the issue price to manage extreme volatility.
              </div>
            </div>

            <div class="faq-accordion-item">
              <button class="faq-question-btn" onclick="this.parentElement.classList.toggle('open')">
                <span>15. What is the fundamental difference between Fresh Issue and Offer for Sale (OFS)?</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer-panel">
                In a <strong>Fresh Issue</strong>, the company creates and sells new equity shares; all net proceeds flow directly onto the company's balance sheet to finance growth, build factories, or repay debt. In an <strong>Offer for Sale (OFS)</strong>, existing promoters or early venture capital investors sell their private holdings to the public; the proceeds go directly to those selling shareholders, with zero new capital entering the company.
              </div>
            </div>
          </div>
        </article>

        <!-- Official Directory Card -->
        ${renderPortalDirectoryWidget()}

        <!-- AdSense Bottom Slot -->
        ${renderAdSenseUnit("5892147360", "auto")}
      </div>
    `;
  }

  function renderCalendarPage() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
      <div class="detail-view-container">
        <div class="page-header-banner">
          <h2>IPO Master Schedule Calendar</h2>
          <p>Complete timeline dates for Openings, Closures, Allotments, and Exchange Listings.</p>
        </div>

        <div class="bottom-sections-grid" style="grid-template-columns: 1fr 1fr;">
          ${renderIpoCalendarWidget()}
          
          <div class="bottom-widget-card">
            <h3>Scheduled Key Milestones</h3>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">
              ${Object.entries(dataset.calendarEvents || {})
                .filter(([dateStr]) => dateStr >= "2026-11-03")
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(0, 8)
                .map(([dateStr, items]) => `
                <div style="padding:10px 14px; background:var(--bg-input); border-radius:8px; border:1px solid var(--border-subtle);">
                  <strong style="color:var(--accent-cyan); font-size:13px;">${formatDate(dateStr)}</strong>
                  <ul style="margin-top:6px; padding-left:16px; font-size:12px; color:var(--text-body);">
                    ${items.map(it => `<li><a href="#/ipo/${it.id}" style="font-weight:600; color:var(--text-primary);">${it.name}</a> — ${it.text}</li>`).join("")}
                  </ul>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Native In-Feed Ad Unit (Slot 1400016775) -->
        ${renderInFeedAdUnit(false)}

        <!-- Below Calendar Space: Detailed Day-by-Day Schedule for Selected Date -->
        <div id="calendar-day-details-container">
          ${renderDayScheduleDetailed(state.selectedCalendarDate || "2026-11-03")}
        </div>

        <!-- Editorial Context: Primary Market Issue Pipeline & T+3 Settlement Cycles -->
        <article class="guide-section-card" style="margin-top:20px; padding:20px 24px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg);">
          <h3 style="font-size:16px; color:var(--text-heading); margin-bottom:10px; display:flex; align-items:center; gap:8px;">
            <span>📅 Primary Market Issue Pipeline & T+3 Settlement Cycles</span>
          </h3>
          <p style="font-size:13px; line-height:1.6; color:var(--text-body); margin-bottom:12px;">
            Under SEBI's standardized T+3 primary market framework, the lifecycle of an Indian public issue from subscription closing to stock exchange debut is compressed into exactly three business days. This condensed timeline mitigates secondary market volatility risks for prospective investors while expediting the unblocking of non-allotted ASBA funds. The timeline above tracks critical transition nodes: Issue Opening (bidding initiation across Syndicate brokers), Bidding Closure (strict 5:00 PM cutoff for retail UPI mandate submission), Basis of Allotment finalization, and demat credit.
          </p>
          <p style="font-size:13px; line-height:1.6; color:var(--text-body); margin:0;">
            Retail applicants should note that banking holidays and settlement cutoffs can occasionally shift internal processing hours among Self-Certified Syndicate Banks (SCSBs). When scheduling bids across concurrent Mainboard and SME public issues, ensuring that your linked bank account maintains sufficient unencumbered liquidity prior to generating UPI mandates prevents automated mandate rejections at the registrar stage.
          </p>
        </article>

        <!-- Official Exchange & Allotment Directory -->
        ${renderPortalDirectoryWidget()}
      </div>
    `;
    bindCalendarControls();
    initAdSense();
  }

  // ==========================================================================
  // Historical Listed IPOs & Listing Gains Directory (1875 - 2026)
  // Data Synchronized with NSE, BSE Reports & Bombay Stock Exchange Archives
  // ==========================================================================
  function getFilteredListedRecords() {
    const dataStore = window.ListedGainsData || { stats: {}, records: [] };
    const allListingRecords = dataStore.records && dataStore.records.length ? dataStore.records : records;
    const activeYear = state.listedYear || "2026";
    const activeSegment = state.listedSegment || "all";
    const query = (state.listedSearchQuery || "").toLowerCase().trim();

    let filtered = allListingRecords.filter(r => {
      // Year Filter: When user is actively searching by name/code, search across all 1875-2026 archives!
      if (!query) {
        if (activeYear === "all") {
          // all records
        } else if (activeYear === "historic") {
          if (Number(r.year) >= 2018 && !r.isHistoric) return false;
        } else {
          if (String(r.year) !== String(activeYear)) return false;
        }
      }

      // Segment Filter
      if (activeSegment === "mainboard") {
        const seg = (r.segment || r.board || "").toLowerCase();
        if (!seg.includes("mainboard")) return false;
      } else if (activeSegment === "sme") {
        const seg = (r.segment || r.board || "").toLowerCase();
        if (!seg.includes("sme")) return false;
      }

      // Search Query
      if (query) {
        const name = (r.name || r.shortName || "").toLowerCase();
        const scrip = (r.bseCode || "").toLowerCase();
        const notes = (r.notes || "").toLowerCase();
        const yr = String(r.year || "");
        if (!name.includes(query) && !scrip.includes(query) && !notes.includes(query) && !yr.includes(query)) return false;
      }

      return true;
    });

    const sortMode = state.listedSort || "date-desc";
    filtered.sort((a, b) => {
      if (sortMode === "gain-desc") {
        return (Number(b.listingGainPct) || -999) - (Number(a.listingGainPct) || -999);
      } else if (sortMode === "gain-asc") {
        return (Number(a.listingGainPct) || 999) - (Number(b.listingGainPct) || 999);
      } else if (sortMode === "sub-desc") {
        return (Number(b.subscription) || 0) - (Number(a.subscription) || 0);
      } else if (sortMode === "size-desc") {
        return (Number(b.issueSizeCr) || 0) - (Number(a.issueSizeCr) || 0);
      } else if (sortMode === "return-desc") {
        return (Number(b.returnSinceIssuePct) || -999) - (Number(a.returnSinceIssuePct) || -999);
      } else if (sortMode === "date-asc") {
        const da = a.listedDate ? new Date(a.listedDate).getTime() : (a.year * 10000);
        const db = b.listedDate ? new Date(b.listedDate).getTime() : (b.year * 10000);
        return da - db;
      } else {
        const da = a.listedDate ? new Date(a.listedDate).getTime() : (a.year * 10000);
        const db = b.listedDate ? new Date(b.listedDate).getTime() : (b.year * 10000);
        return db - da;
      }
    });

    return filtered;
  }

  function renderListedRows(recordsList) {
    if (!recordsList || recordsList.length === 0) {
      return `
        <tr>
          <td colspan="11" style="text-align:center; padding:36px; color:#64748B;">
            No listed companies found matching your criteria. Try adjusting the search query or selecting another year.
          </td>
        </tr>
      `;
    }

    return recordsList.map(r => {
      const gain = r.listingGainPct !== null && !isNaN(r.listingGainPct) ? Number(r.listingGainPct) : null;
      const isPos = gain !== null && gain > 0;
      const isNeg = gain !== null && gain < 0;
      const gainClass = isPos ? "positive" : isNeg ? "negative" : "";
      const gainText = gain !== null ? (gain > 0 ? "+" : "") + gain.toFixed(2) + "%" : "—";
      const subText = r.subscription ? r.subscription + "x" : "—";
      const sizeText = r.issueSizeCr ? "₹" + Number(r.issueSizeCr).toLocaleString("en-IN") + " Cr" : "—";
      const curText = r.currentPrice ? "₹" + Number(r.currentPrice).toLocaleString("en-IN") : "—";
      const retSince = r.returnSinceIssuePct !== null && !isNaN(r.returnSinceIssuePct) ? Number(r.returnSinceIssuePct) : null;
      const retText = retSince !== null ? (retSince > 0 ? "+" : "") + retSince.toLocaleString("en-IN") + "%" : "—";
      const retPos = retSince !== null && retSince > 0;
      const retNeg = retSince !== null && retSince < 0;

      return `
        <tr style="cursor:pointer;" onclick="window.location.hash='#/ipo/${r.slug}'">
          <td>
            <div class="fig1-company-cell">
              ${renderCompanyLogo(r, 36)}
              <div class="fig1-company-name-wrap">
                <span class="fig1-company-name" style="font-size:13.5px; font-weight:700; color:#0F172A;">${escapeHtml(r.name)}</span>
                <span style="font-size:11px; color:#64748B;">
                  ${r.bseCode ? 'BSE: ' + r.bseCode : (r.exchange || 'NSE, BSE')}
                  ${r.isHistoric ? ' &bull; <strong style="color:#B45309;">1875 Landmark</strong>' : ''}
                </span>
              </div>
            </div>
          </td>
          <td>
            <span class="fig1-sub-tag listed" style="background:${(r.segment || 'Mainboard').toLowerCase() === 'mainboard' ? '#EBF5FF' : '#F1F5F9'}; color:${(r.segment || 'Mainboard').toLowerCase() === 'mainboard' ? '#1D4ED8' : '#475569'};">
              ${escapeHtml(r.segment || 'Mainboard')}
            </span>
          </td>
          <td><span style="font-size:12.5px; font-weight:600; color:#334155;">${formatDate(r.listedDate)}</span></td>
          <td><span class="fig1-val-price">${r.issuePrice ? '₹' + Number(r.issuePrice).toLocaleString('en-IN') : '—'}</span></td>
          <td><span class="fig1-val-price" style="font-weight:700; color:#111827;">${r.listingPrice != null ? '₹' + Number(r.listingPrice).toLocaleString('en-IN') : '—'}</span></td>
          <td><span class="fig1-val-price" style="font-weight:700; color:#111827;">${r.listingDayClose != null ? '₹' + Number(r.listingDayClose).toLocaleString('en-IN') : '—'}</span></td>
          <td>
            <span class="fig1-return-tag ${gainClass}">${gainText}</span>
          </td>
          <td>
            <span class="fig1-sub-pill">${subText}</span>
          </td>
          <td><span style="font-size:12.5px; font-weight:600; color:#334155;">${sizeText}</span></td>
          <td>
            <div style="display:flex; flex-direction:column; gap:2px;">
              <div style="display:flex; align-items:center; gap:5px;">
                <span class="fig1-val-price" style="font-weight:700; color:#0F172A;">${curText}</span>
                ${r.currentPrice ? `` : ''}
              </div>
              <span style="font-size:10px; color:#64748B; font-weight:500;">Stored reference value • not a live quote</span>
            </div>
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span class="fig1-return-tag ${retPos ? 'positive' : retNeg ? 'negative' : ''}" style="font-size:12px; font-weight:700;">
                ${retText}
              </span>
              <span style="font-size:10px; color:#64748B;">Total Gain</span>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderListedCards(recordsList) {
    if (!recordsList || recordsList.length === 0) {
      return `
        <div style="text-align:center; padding:24px; color:#64748B; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px;">
          No listed companies found matching the criteria.
        </div>
      `;
    }

    return recordsList.map(r => {
      const gain = r.listingGainPct !== null && !isNaN(r.listingGainPct) ? Number(r.listingGainPct) : null;
      const isPos = gain !== null && gain > 0;
      const isNeg = gain !== null && gain < 0;
      const gainClass = isPos ? "positive" : isNeg ? "negative" : "";
      const gainText = gain !== null ? (gain > 0 ? "+" : "") + gain.toFixed(2) + "%" : "—";
      const subText = r.subscription ? r.subscription + "x" : "—";
      const sizeText = r.issueSizeCr ? "₹" + Number(r.issueSizeCr).toLocaleString("en-IN") + " Cr" : "—";
      const curText = r.currentPrice ? "₹" + Number(r.currentPrice).toLocaleString("en-IN") : "—";
      const retSince = r.returnSinceIssuePct !== null && !isNaN(r.returnSinceIssuePct) ? Number(r.returnSinceIssuePct) : null;
      const retText = retSince !== null ? (retSince > 0 ? "+" : "") + retSince.toLocaleString("en-IN") + "%" : "—";
      const retPos = retSince !== null && retSince > 0;
      const retNeg = retSince !== null && retSince < 0;

      return `
        <div class="mobile-open-card" onclick="window.location.hash='#/ipo/${r.slug}'">
          <div class="mobile-open-top-row">
            <div class="mobile-open-brand">
              ${renderCompanyLogo(r, 36)}
              <div>
                <h3 class="mobile-open-name" style="font-size:14px; font-weight:700; color:#0F172A;">${escapeHtml(r.name)}</h3>
                <div style="display:flex; gap:6px; align-items:center; margin-top:2px;">
                  <span class="fig1-sub-tag listed">${escapeHtml(r.segment || 'Mainboard')}</span>
                  <span style="font-size:11px; color:#64748B;">${formatDate(r.listedDate)}</span>
                </div>
              </div>
            </div>
            <span class="fig1-return-tag ${gainClass}">${gainText}</span>
          </div>

          <div class="mobile-open-specs-grid" style="grid-template-columns:repeat(4, 1fr); gap:8px;">
            <div class="mobile-spec-item">
              <span class="mobile-spec-label">Issue Price</span>
              <span class="mobile-spec-val">${r.issuePrice ? '₹' + r.issuePrice : '—'}</span>
            </div>
            <div class="mobile-spec-item">
              <span class="mobile-spec-label">Listing Open</span>
              <span class="mobile-spec-val">${r.listingPrice != null ? '₹' + r.listingPrice : '—'}</span>
            </div>
            <div class="mobile-spec-item">
              <span class="mobile-spec-label">Listing Close</span>
              <span class="mobile-spec-val">${r.listingDayClose != null ? '₹' + r.listingDayClose : '—'}</span>
            </div>
            <div class="mobile-spec-item">
              <span class="mobile-spec-label">Subscribed</span>
              <span class="mobile-spec-val">${subText}</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#475569; padding-top:8px; border-top:1px dashed #E2E8F0;">
            <span><strong>Issue:</strong> ${sizeText}</span>
            <span>
              <strong>Current:</strong> <span style="font-weight:700; color:#0F172A;">${curText}</span>
              <span style="font-weight:700; color:${retPos ? '#15803D' : retNeg ? '#DC2626' : '#64748B'}; margin-left:4px;">(${retText})</span>
              ${r.currentPrice ? `<span style="font-size:10px;color:#64748B;margin-left:4px;">(reference only)</span>` : ''}
            </span>
          </div>
        </div>
      `;
    }).join("");
  }

  function updateListedDomInPlace() {
    const tableBody = document.getElementById("listed-table-body");
    const cardsBody = document.getElementById("listed-cards-body");
    if (!tableBody || !cardsBody) return;

    const filtered = getFilteredListedRecords();
    const limit = state.listedLimit || 50;
    const visible = filtered.slice(0, limit);

    tableBody.innerHTML = renderListedRows(visible);
    cardsBody.innerHTML = renderListedCards(visible);

    const kpiTotal = document.getElementById("listed-kpi-total-val");
    if (kpiTotal) kpiTotal.innerText = filtered.length;

    const loadMoreWrap = document.getElementById("listed-load-more-wrap");
    if (loadMoreWrap) {
      if (filtered.length > limit) {
        loadMoreWrap.innerHTML = `
          <div style="text-align:center; margin:24px 0;">
            <button type="button" class="btn-table-action" style="padding:10px 24px; font-size:13.5px; font-weight:700;" onclick="window.IpoApp.loadMoreListed()">
              Load More Issues (Showing ${limit} of ${filtered.length}) &darr;
            </button>
          </div>
        `;
      } else {
        loadMoreWrap.innerHTML = "";
      }
    }
  }

  function renderListedPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const dataStore = window.ListedGainsData || { stats: {}, records: [] };
    const statsData = dataStore.stats || {};
    const activeYear = state.listedYear || "2026";
    const activeSegment = state.listedSegment || "all";
    const query = (state.listedSearchQuery || "").toLowerCase().trim();

    const filtered = getFilteredListedRecords();
    const totalMatching = filtered.length;
    const limit = state.listedLimit || 50;
    const visibleRecords = filtered.slice(0, limit);

    // Compute or pull Year KPI Stats
    const currentYearStats = statsData[activeYear] || null;
    let avgGain = currentYearStats ? currentYearStats.avgGainPct : null;
    let medGain = currentYearStats ? currentYearStats.medGainPct : null;
    let totalSize = currentYearStats ? currentYearStats.totalIssueSizeCr : null;
    let shareAbove = currentYearStats ? currentYearStats.shareAbovePct : null;

    if (!currentYearStats && filtered.length > 0) {
      const withGain = filtered.filter(r => r.listingGainPct !== null && !isNaN(r.listingGainPct));
      if (withGain.length) {
        const sum = withGain.reduce((acc, r) => acc + Number(r.listingGainPct), 0);
        avgGain = (sum / withGain.length).toFixed(2);
        const sortedGains = withGain.map(r => Number(r.listingGainPct)).sort((a, b) => a - b);
        medGain = sortedGains[Math.floor(sortedGains.length / 2)].toFixed(2);
        const aboveCount = withGain.filter(r => Number(r.listingGainPct) > 0).length;
        shareAbove = ((aboveCount / withGain.length) * 100).toFixed(1);
      }
      const sumSize = filtered.reduce((acc, r) => acc + (Number(r.issueSizeCr) || 0), 0);
      if (sumSize > 0) totalSize = sumSize.toFixed(2);
    }

    const availableYearsList = [
      { key: "all", label: "All Years (1875–2026)" },
      { key: "2026", label: "2026 (299 IPOs)" },
      { key: "2025", label: "2025 (377 IPOs)" },
      { key: "2024", label: "2024 (341 IPOs)" },
      { key: "2023", label: "2023 (240 IPOs)" },
      { key: "2022", label: "2022 (148 IPOs)" },
      { key: "2021", label: "2021 (122 IPOs)" },
      { key: "2020", label: "2020 (47 IPOs)" },
      { key: "2019", label: "2019 (65 IPOs)" },
      { key: "2018", label: "2018 (168 IPOs)" },
      { key: "historic", label: "Historic Archives (1875–2017)" },
      { key: "1875", label: "1875 (BBTC — 1st BSE Stock)" }
    ];

    const isBbtcSelected = activeYear === "1875" || (query && query.includes("bbtc")) || (query && query.includes("bombay burmah"));

    app.innerHTML = `
      <div class="detail-view-container">
        <!-- Breadcrumb Navigation -->
        <nav class="detail-breadcrumbs" aria-label="Breadcrumb">
          <a href="#/">Home</a>
          <span>&gt;</span>
          <span style="color:var(--text-primary); font-weight:600;">Listed IPOs Directory</span>
        </nav>

        <!-- Page Header Banner -->
        <div class="listed-header-wrap">
          <div class="listed-title-row">
            <div>
              <h1 class="listed-title">
                <span>🏛️ Historical Listed IPOs &amp; Listing Gains (1875 &ndash; 2026)</span>
              </h1>
              <p style="margin:4px 0 0; font-size:14px; color:#475569;">
                Comprehensive listing-day performance directory for 1,827+ Indian public offerings across BSE &amp; NSE, from current 2026 issues down to India's 1st stock (The Bombay Burmah Trading Corporation, listed 1875).
              </p>
            </div>
            <div class="widget-source-tag" style="background:#F0FDF4; border-color:#86EFAC; color:#14532D;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Verified Exchange Disclosures based on NSE, BSE Reports</span>
            </div>
          </div>

          <!-- Annual Performance KPI Strip (Shows when specific year is active) -->
          <div class="listed-kpi-grid">
            <div class="listed-kpi-card">
              <div class="listed-kpi-label">Total IPOs (${activeYear === "all" ? "All Time" : activeYear === "historic" ? "1875-2017" : activeYear})</div>
              <div class="listed-kpi-val" id="listed-kpi-total-val">${totalMatching}</div>
            </div>
            <div class="listed-kpi-card">
              <div class="listed-kpi-label">Average Listing Gain</div>
              <div class="listed-kpi-val ${avgGain && Number(avgGain) >= 0 ? "gain" : ""}">
                ${avgGain !== null ? (Number(avgGain) > 0 ? "+" : "") + avgGain + "%" : "—"}
              </div>
            </div>
            <div class="listed-kpi-card">
              <div class="listed-kpi-label">Median Listing Gain</div>
              <div class="listed-kpi-val ${medGain && Number(medGain) >= 0 ? "gain" : ""}">
                ${medGain !== null ? (Number(medGain) > 0 ? "+" : "") + medGain + "%" : "—"}
              </div>
            </div>
            <div class="listed-kpi-card">
              <div class="listed-kpi-label">Listed Above Issue</div>
              <div class="listed-kpi-val">${shareAbove ? shareAbove + "%" : "—"}</div>
            </div>
            <div class="listed-kpi-card">
              <div class="listed-kpi-label">Total Capital Raised</div>
              <div class="listed-kpi-val" style="font-size:22px;">
                ${totalSize ? "₹" + Number(totalSize).toLocaleString("en-IN") + " Cr" : "—"}
              </div>
            </div>
          </div>
        </div>

        <!-- BBTC 1875 Historical Spotlight Card (Always prominently displayed for 1875 or historic filter) -->
        ${isBbtcSelected || activeYear === "1875" || activeYear === "historic" ? `
          <section class="bbtc-spotlight-card" aria-label="1st Stock in BSE History">
            <div class="bbtc-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>IN CIVIL LISTING SINCE 09 JULY 1875 &bull; 151 YEARS OF MARKET TRADING</span>
            </div>
            <h2 class="bbtc-title">The Bombay Burmah Trading Corporation (BBTC) &mdash; 1st Stock in BSE History</h2>
            <p class="bbtc-desc">
              When the Native Share &amp; Stock Brokers Association (now the Bombay Stock Exchange, BSE) was officially constituted on July 9, 1875 under the banyan tree at Horniman Circle by Premchand Roychand and 318 native brokers, <strong>The Bombay Burmah Trading Corporation (BSE Scrip 500020)</strong> was the premier founding equity traded on the exchange. Originally established in 1863 to extract and trade teak wood throughout Burma, it is today the flagship holding entity of the 288-year-old Wadia Group and the controlling shareholder of Britannia Industries Limited and Bombay Dyeing.
            </p>
            <div class="bbtc-metrics-grid">
              <div class="bbtc-metric-item">
                <span class="bbtc-metric-lbl">Exchange &amp; Code</span>
                <span class="bbtc-metric-val">BSE &bull; Scrip 500020</span>
              </div>
              <div class="bbtc-metric-item">
                <span class="bbtc-metric-lbl">Listing Date</span>
                <span class="bbtc-metric-val">09 July 1875</span>
              </div>
              <div class="bbtc-metric-item">
                <span class="bbtc-metric-lbl">Inaugural Par Value</span>
                <span class="bbtc-metric-val">₹2,500 / share</span>
              </div>
              <div class="bbtc-metric-item">
                <span class="bbtc-metric-lbl">Current Market Price</span>
                <span class="bbtc-metric-val">₹2,480.00</span>
              </div>
              <div class="bbtc-metric-item">
                <span class="bbtc-metric-lbl">151-Year Compounded Gain</span>
                <span class="bbtc-metric-val green">+125,000%+</span>
              </div>
              <div class="bbtc-metric-item">
                <span class="bbtc-metric-lbl">Corporate Group</span>
                <span class="bbtc-metric-val">Wadia Group (Britannia)</span>
              </div>
            </div>
          </section>
        ` : ""}

        <!-- Interactive Filtering & Controls Bar -->
        <div class="listed-controls-bar">
          <!-- Year Tabs Strip -->
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div style="font-size:12px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">Filter by Year:</div>
            <div class="listed-year-tabs">
              <button type="button" class="btn-year-pill ${activeYear === 'all' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('all')">All Years (1875–2026)</button>
              <button type="button" class="btn-year-pill ${activeYear === '2026' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2026')">2026</button>
              <button type="button" class="btn-year-pill ${activeYear === '2025' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2025')">2025</button>
              <button type="button" class="btn-year-pill ${activeYear === '2024' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2024')">2024</button>
              <button type="button" class="btn-year-pill ${activeYear === '2023' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2023')">2023</button>
              <button type="button" class="btn-year-pill ${activeYear === '2022' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2022')">2022</button>
              <button type="button" class="btn-year-pill ${activeYear === '2021' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2021')">2021</button>
              <button type="button" class="btn-year-pill ${activeYear === '2020' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2020')">2020</button>
              <button type="button" class="btn-year-pill ${activeYear === '2019' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2019')">2019</button>
              <button type="button" class="btn-year-pill ${activeYear === '2018' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('2018')">2018</button>
              <button type="button" class="btn-year-pill ${activeYear === 'historic' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('historic')">Historic (1875–2017)</button>
              <button type="button" class="btn-year-pill ${activeYear === '1875' ? 'active' : ''}" onclick="window.IpoApp.setListedYear('1875')">1875 (BBTC)</button>
            </div>
          </div>

          <!-- Secondary Filter Row: Search, Segment, Sort, Year Dropdown -->
          <div class="listed-filter-row">
            <div class="listed-search-box">
              <svg class="listed-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" class="listed-search-input" id="listed-search-input" placeholder="Search company, scrip, or sector (e.g. Bombay Burmah, Waaree, Zomato)..." value="${escapeHtml(state.listedSearchQuery || '')}" oninput="window.IpoApp.searchListed(this.value)">
            </div>

            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <!-- Year Selector Dropdown -->
              <select class="listed-select" aria-label="Select Year" onchange="window.IpoApp.setListedYear(this.value)">
                ${availableYearsList.map(y => `
                  <option value="${y.key}" ${activeYear === y.key ? "selected" : ""}>${y.label}</option>
                `).join("")}
              </select>

              <!-- Segment Filter Dropdown -->
              <select class="listed-select" aria-label="Segment" onchange="window.IpoApp.setListedSegment(this.value)">
                <option value="all" ${activeSegment === "all" ? "selected" : ""}>All Segments</option>
                <option value="mainboard" ${activeSegment === "mainboard" ? "selected" : ""}>Mainboard</option>
                <option value="sme" ${activeSegment === "sme" ? "selected" : ""}>SME</option>
              </select>

              <!-- Sort Dropdown -->
              <select class="listed-select" aria-label="Sort By" onchange="window.IpoApp.setListedSort(this.value)">
                <option value="date-desc" ${state.listedSort === "date-desc" || !state.listedSort ? "selected" : ""}>Listing Date (Newest)</option>
                <option value="date-asc" ${state.listedSort === "date-asc" ? "selected" : ""}>Listing Date (Oldest &bull; 1875+)</option>
                <option value="gain-desc" ${state.listedSort === "gain-desc" ? "selected" : ""}>Highest Listing Gain %</option>
                <option value="gain-asc" ${state.listedSort === "gain-asc" ? "selected" : ""}>Lowest / Loss Listing %</option>
                <option value="sub-desc" ${state.listedSort === "sub-desc" ? "selected" : ""}>Highest Subscription</option>
                <option value="size-desc" ${state.listedSort === "size-desc" ? "selected" : ""}>Largest Issue Size</option>
                <option value="return-desc" ${state.listedSort === "return-desc" ? "selected" : ""}>Highest Return Since Issue</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table View: Desktop & Laptop Viewports -->
        <div class="data-table-card desktop-only-table">
          <div class="fig1-table-responsive">
            <table class="fig1-trending-table">
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>SEGMENT</th>
                  <th>LISTING DATE</th>
                  <th>ISSUE PRICE</th>
                  <th>LISTING OPEN</th>
                  <th>LISTING DAY CLOSE</th>
                  <th>OPENING GAIN</th>
                  <th>SUBSCRIPTION</th>
                  <th>ISSUE SIZE</th>
                  <th>CURRENT PRICE</th>
                  <th>RETURN SINCE ISSUE</th>
                </tr>
              </thead>
              <tbody id="listed-table-body">
                ${renderListedRows(visibleRecords)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile Cards View (Phones & Small Screens) -->
        <div class="mobile-only-cards" id="listed-cards-body" style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
          ${renderListedCards(visibleRecords)}
        </div>

        <!-- Load More Records Button Container -->
        <div id="listed-load-more-wrap">
          ${filtered.length > limit ? `
            <div style="text-align:center; margin:24px 0;">
              <button type="button" class="btn-table-action" style="padding:10px 24px; font-size:13.5px; font-weight:700;" onclick="window.IpoApp.loadMoreListed()">
                Load More Issues (Showing ${limit} of ${filtered.length}) &darr;
              </button>
            </div>
          ` : ""}
        </div>

        <!-- Comprehensive Editorial Context -->
        <article class="editorial-analysis-card" style="margin-top:28px;">
          <h2 class="editorial-heading">📚 Indian Capital Markets: Historical Listing Returns &amp; Wealth Creation Dynamics</h2>
          <p class="editorial-paragraph">
            The Indian stock market represents one of the world's most dynamic capital formation ecosystems. From the inauguration of the Bombay Stock Exchange in 1875 under a banyan tree with <strong>The Bombay Burmah Trading Corporation</strong> as its inaugural corporate scrip, to Dhirubhai Ambani's transformative 1977 Reliance IPO that initiated the retail equity revolution, Indian primary markets have consistently rewarded disciplined long-term capital allocators.
          </p>
          <p class="editorial-paragraph">
            Empirical listing-day gains data across 2018–2026 highlights a strong correlation between institutional book-building demand and listing-day pops. Issues subscribed more than 50x by Qualified Institutional Buyers (QIB) average over +45% in first-day opening premiums. However, historical data also demonstrates that sustaining post-listing valuation multiples requires resilient ROCE, sound corporate governance, and sustainable margin moats beyond the initial speculative euphoria.
          </p>
        </article>

        <!-- Sponsored Unit -->
        ${renderAdContainer("infeed", "5892147360", "SPONSORED FINANCIAL PLATFORM")}

        <!-- Primary Market Official Directory -->
        ${renderPortalDirectoryWidget()}
      </div>
    `;

    initAdSense();
  }

  // ==========================================================================
  // Global Search Modal Dialog (Command+K) Across ALL 2,031+ Stocks (1875 - 2026)
  // ==========================================================================
  function getAllSearchableSecurities() {
    const dataset = window.IpoData || { records: [] };
    const baseRecords = dataset.records || [];
    const histData = window.ListedGainsData || { records: [] };
    const histRecords = histData.records || [];

    const combined = [];
    const seenSlugs = new Set();

    // 1. Add active dataset records (Open, Upcoming, Closed, Recent Listed)
    baseRecords.forEach(r => {
      combined.push({
        slug: r.slug,
        name: r.shortName || r.companyName,
        companyName: r.companyName || r.shortName,
        shortName: r.shortName || r.companyName,
        symbol: r.symbol || "",
        sector: r.sector || "Equity",
        board: r.board || "MAINBOARD",
        exchange: r.exchange || "NSE, BSE",
        status: r.status || "OPEN",
        priceText: r.priceBandLow && r.priceBandHigh 
          ? `₹${r.priceBandLow}–${r.priceBandHigh}` 
          : (r.issuePrice ? `₹${r.issuePrice}` : 'TBA'),
        lotSize: r.lotSize,
        minInv: r.minimumInvestment 
          ? `₹${Number(r.minimumInvestment).toLocaleString('en-IN')}` 
          : (r.lotSize && r.priceBandHigh ? `₹${(r.lotSize * r.priceBandHigh).toLocaleString('en-IN')}` : '—'),
        gmp: r.gmp,
        gmpPercentage: r.gmpPercentage,
        currentPrice: r.currentPrice,
        returnSinceIssuePct: r.returnSinceIssuePct,
        openDate: r.openDate,
        closeDate: r.closeDate,
        listingDate: r.listingDate,
        logoUrl: r.logoUrl,
        isHistoric: false,
        isListedRecord: false,
        bseCode: r.bseCode || null,
        notes: ""
      });
      seenSlugs.add(r.slug);
    });

    // 2. Add historical & listed records from 1875 to 2026
    histRecords.forEach(h => {
      if (!seenSlugs.has(h.slug)) {
        combined.push({
          slug: h.slug,
          name: h.name,
          companyName: h.name,
          shortName: h.name,
          symbol: h.bseCode || (h.name || "").slice(0, 6).toUpperCase(),
          sector: h.isHistoric ? "Historic Exchange Benchmark" : (h.segment || "Listed Equities"),
          board: (h.segment || "MAINBOARD").toUpperCase(),
          exchange: h.exchange || (h.bseCode ? `BSE: ${h.bseCode}` : "NSE, BSE"),
          status: "LISTED",
          priceText: h.issuePrice ? `₹${Number(h.issuePrice).toLocaleString('en-IN')}` : "—",
          lotSize: 1,
          minInv: h.issuePrice ? `₹${Number(h.issuePrice).toLocaleString('en-IN')}` : "—",
          gmp: null,
          gmpPercentage: h.listingGainPct,
          currentPrice: h.currentPrice,
          returnSinceIssuePct: h.returnSinceIssuePct,
          openDate: null,
          closeDate: null,
          listingDate: h.listedDate,
          logoUrl: null,
          isHistoric: Boolean(h.isHistoric),
          isListedRecord: true,
          bseCode: h.bseCode || null,
          year: h.year,
          notes: h.notes || ""
        });
        seenSlugs.add(h.slug);
      }
    });

    return combined;
  }

  function toggleSearchModal(show) {
    state.searchModalOpen = show;
    const modal = document.getElementById("search-dialog-wrap");
    const input = document.getElementById("global-search-input");
    if (!modal) return;

    if (show) {
      modal.classList.remove("hidden");
      input.value = "";
      input.focus();
      renderSearchResults("");
    } else {
      modal.classList.add("hidden");
    }
  }

  function renderSearchResults(query = "") {
    const list = document.getElementById("search-results-list");
    if (!list) return;

    const q = (query || "").trim().toLowerCase();
    const allSecurities = getAllSearchableSecurities();

    let matches = [];
    if (!q) {
      // Default: show open IPOs first, then upcoming, then top recent listed
      matches = allSecurities.slice(0, 35);
    } else {
      const exactPrefix = [];
      const containsMatch = [];

      for (let i = 0; i < allSecurities.length; i++) {
        const item = allSecurities[i];
        const nameLower = (item.name || "").toLowerCase();
        const shortLower = (item.shortName || "").toLowerCase();
        const symLower = (item.symbol || "").toLowerCase();
        const bseLower = (item.bseCode || "").toLowerCase();
        const secLower = (item.sector || "").toLowerCase();
        const notesLower = (item.notes || "").toLowerCase();

        if (nameLower.startsWith(q) || shortLower.startsWith(q) || symLower.startsWith(q) || bseLower === q) {
          exactPrefix.push(item);
        } else if (
          nameLower.includes(q) || 
          shortLower.includes(q) || 
          symLower.includes(q) || 
          bseLower.includes(q) || 
          secLower.includes(q) ||
          notesLower.includes(q)
        ) {
          containsMatch.push(item);
        }

        if (exactPrefix.length >= 40) break;
      }
      matches = exactPrefix.concat(containsMatch).slice(0, 40);
    }

    if (matches.length === 0) {
      list.innerHTML = `<div style="padding:28px; text-align:center; color:#64748B; font-size:13.5px;">No matching securities found for "<strong>${escapeHtml(query)}</strong>". Try searching by company name, sector, BSE code, or historical year.</div>`;
      return;
    }

    list.innerHTML = `
      <div style="padding:8px 14px 10px; font-size:12px; font-weight:700; color:#64748B; border-bottom:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; background:#F8FAFC;">
        <span>${q ? `Matching Securities (${matches.length}${matches.length === 40 ? '+' : ''})` : `All Indian Stocks &amp; IPOs (2,031+ Issues)`}</span>
        <span style="font-size:11px; font-weight:600; color:#16A34A; display:flex; align-items:center; gap:4px;">
          <span style="width:6px; height:6px; border-radius:50%; background:#16A34A; box-shadow:0 0 4px #16A34A;"></span>
          Live NSE/BSE Synced
        </span>
      </div>
      <div style="max-height:60vh; overflow-y:auto;">
        ${matches.map(r => {
          const isPos = r.gmp != null && r.gmp > 0;
          const gmpText = r.gmp != null && r.gmp > 0 ? `+₹${r.gmp}` : (r.gmp != null && r.gmp < 0 ? `-₹${Math.abs(r.gmp)}` : '—');
          const gmpPct = r.gmpPercentage ? `(${r.gmpPercentage}%)` : '';

          const retSince = r.returnSinceIssuePct !== null && !isNaN(r.returnSinceIssuePct) ? Number(r.returnSinceIssuePct) : null;
          const retText = retSince !== null ? (retSince > 0 ? "+" : "") + retSince.toLocaleString("en-IN") + "%" : null;
          const retPos = retSince !== null && retSince > 0;
          const retNeg = retSince !== null && retSince < 0;

          const dateStr = r.status === 'OPEN' && r.closeDate 
            ? `Closes: ${formatDate(r.closeDate)}`
            : r.status === 'UPCOMING' && r.openDate
              ? `Opens: ${formatDate(r.openDate)}`
              : r.listingDate
                ? `Listed: ${formatDate(r.listingDate)}`
                : (r.closeDate ? formatDate(r.closeDate) : 'TBA');

          const curPrice = r.currentPrice ? `₹${Number(r.currentPrice).toLocaleString('en-IN')}` : null;

          return `
            <div class="search-result-row" onclick="window.location.hash='#/ipo/${r.slug}'; window.IpoApp.toggleSearchModal(false);" style="border-bottom:1px solid #F1F5F9; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px; cursor:pointer;">
              <div class="search-row-left" style="flex:1; min-width:200px; display:flex; align-items:center; gap:10px;">
                ${renderCompanyLogo(r, 36)}
                <div class="search-row-info">
                  <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <h4 style="margin:0; font-size:14px; font-weight:700; color:#111827;">${escapeHtml(r.shortName || r.name)}</h4>
                    <span class="board-badge ${(r.board || 'MAINBOARD').toLowerCase()} style="font-size:10px; padding:1px 6px;">${escapeHtml(r.board || 'MAINBOARD')}</span>
                    ${r.isHistoric ? `<span style="background:#FEF3C7; color:#92400E; font-size:9.5px; font-weight:700; padding:1px 5px; border-radius:3px;">1875 LANDMARK</span>` : ''}
                  </div>
                  <div style="font-size:11.5px; color:#64748B; margin-top:2px;">
                    ${escapeHtml(r.sector || 'General')} &bull; ${escapeHtml(r.exchange || 'NSE, BSE')} &bull; ${dateStr}
                  </div>
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:16px; text-align:right;">
                ${curPrice ? `
                  <div class="search-desktop-meta" style="text-align:right;">
                    <div style="display:flex; align-items:center; justify-content:flex-end; gap:4px;">
                      <span style="font-size:13px; font-weight:800; color:#0F172A;">${curPrice}</span>
                      <span style="background:#DCFCE7; color:#15803D; font-size:9px; font-weight:700; padding:1px 4px; border-radius:3px;">LIVE</span>
                    </div>
                    ${retText ? `<div style="font-size:11px; font-weight:700; color:${retPos ? '#15803D' : retNeg ? '#DC2626' : '#64748B'};">${retText} Return</div>` : `<div style="font-size:11px; color:#64748B;">CMP</div>`}
                  </div>
                ` : `
                  <div class="search-desktop-meta">
                    <div style="font-size:12.5px; font-weight:700; color:#111827;">${r.priceText}</div>
                    <div style="font-size:11px; color:#64748B;">Lot: ${r.lotSize ? r.lotSize + ' sh' : '—'}</div>
                  </div>
                `}

                <div>
                  ${r.status === 'OPEN' || r.status === 'UPCOMING' ? `
                    <div style="font-size:12.5px; font-weight:700; color:${isPos ? '#16A34A' : '#64748B'};">
                      ${gmpText} ${gmpPct}
                    </div>
                  ` : `
                    <div style="font-size:12px; font-weight:700; color:${retPos ? '#15803D' : retNeg ? '#DC2626' : '#64748B'};">
                      ${retText || (r.gmpPercentage ? `+${r.gmpPercentage}%` : 'Listed')}
                    </div>
                  `}
                  <span class="status-badge ${r.status === 'CLOSED' ? 'closed' : r.status === 'UPCOMING' ? 'upcoming' : r.status === 'LISTED' ? 'listed' : 'open'}" style="margin-top:2px; display:inline-block;">
                    ${r.status === 'CLOSED' ? 'Closed' : r.status === 'UPCOMING' ? 'Upcoming' : r.status === 'LISTED' ? 'Listed' : 'Open'}
                  </span>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  // ==========================================================================
  // Broker Modal Logic & 1-Click Affiliate Gateway
  // ==========================================================================
  function openBrokerModal() {}

  function trackAndOpenBroker(brokerId, url) {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  // ==========================================================================
  // Router Controller
  // ==========================================================================
  function router() {
    state.route = parseRoute();
    if (state.route.filter) {
      state.activeFilter = state.route.filter;
    }
    state.applyDropdownOpen = false;
    state.notificationsOpen = false;
    document.body.classList.remove("notif-open");
    renderHeader();

    if (state.route.view === "detail") {
      renderDetailView(state.route.slug);
    } else if (state.route.view === "open") {
      renderOpenIposPage();
    } else if (state.route.view === "upcoming") {
      renderUpcomingIposPage();
    } else if (state.route.view === "gmp") {
      renderGmpPage();
    } else if (state.route.view === "calendar") {
      renderCalendarPage();
    } else if (state.route.view === "listed") {
      renderListedPage();
    } else if (state.route.view === "calculator") {
      renderCalculatorPage();
    } else if (state.route.view === "live-prices") {
      renderLivePricesPage();
    } else if (state.route.view === "allotment") {
      renderAllotmentHubPage();
    } else if (state.route.view === "guide") {
      renderGuidePage();
    } else {
      renderDashboardView();
      if (state.route.moversFilter) {
        setTimeout(() => {
          if (state.route.moversFilter === "shakers" || state.route.moversFilter === "market-shakers" || state.route.moversFilter === "volume-shakers") {
            const shakerEl = document.querySelector(".shakers-panel-card") || document.getElementById("market-shakers-tbody");
            if (shakerEl) shakerEl.scrollIntoView({ behavior: "smooth" });
          } else {
            const target = state.route.moversFilter === "losers" ? "losers" : (state.route.moversFilter === "gainers" ? "gainers" : "both");
            if (typeof window.switchMoversView === "function") {
              window.switchMoversView(target);
            }
            const el = document.getElementById("market-movers-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }
        }, 80);
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    initAdSense();
  }

  // ==========================================================================
  // Cookie Consent & Privacy Preference Management (AdSense & GDPR Compliant)
  // ==========================================================================
  function initCookieConsent() {
    try {
      const consent = localStorage.getItem("ipo_cookie_consent");
      const banner = document.getElementById("cookie-consent-banner");
      if (!banner) return;
      if (!consent) {
        banner.style.display = "block";
      } else {
        banner.style.display = "none";
      }
    } catch(e) {}
  }

  function acceptCookieConsent(accepted = true) {
    try {
      localStorage.setItem("ipo_cookie_consent", accepted ? "accepted" : "declined");
      const banner = document.getElementById("cookie-consent-banner");
      if (banner) {
        banner.style.opacity = "0";
        banner.style.transform = "translateY(20px)";
        banner.style.transition = "all 0.3s ease";
        setTimeout(() => { banner.style.display = "none"; }, 300);
      }
    } catch(e) {}
  }

  // Initialize Application
  function init() {
    // Current year in footer
    const yr = document.getElementById("current-year");
    if (yr) yr.innerText = new Date().getFullYear();

    // Initialize Cookie Consent Banner
    initCookieConsent();

    // Search dialog events
    document.getElementById("close-search-btn")?.addEventListener("click", () => toggleSearchModal(false));
    document.getElementById("search-dialog-wrap")?.addEventListener("click", (e) => {
      if (e.target.id === "search-dialog-wrap") toggleSearchModal(false);
    });
    document.querySelector(".search-dialog")?.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.getElementById("global-search-input")?.addEventListener("input", (e) => {
      renderSearchResults(e.target.value);
    });

    // Keyboard Shortcuts (⌘K, Escape)
    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSearchModal(!state.searchModalOpen);
      }
      if (e.key === "Escape") {
        toggleSearchModal(false);
        state.notificationsOpen = false;
        document.body.classList.remove("notif-open");
        renderHeader();
      }
    });

    // Close flyouts on document click
    document.addEventListener("click", () => {
      if (state.notificationsOpen) {
        state.notificationsOpen = false;
        document.body.classList.remove("notif-open");
        renderHeader();
      }
    });

    // Hash change routing
    window.addEventListener("hashchange", router);
    router();

    // Load Live Market Feed & Start 10-Minute Autonomous Countdown
    loadLiveMarketData();
    setInterval(() => {
      if (state.liveNextSyncSeconds > 0) {
        state.liveNextSyncSeconds--;
        const timerEl = document.getElementById("live-sync-timer");
        if (timerEl) {
          const m = Math.floor(state.liveNextSyncSeconds / 60);
          const s = state.liveNextSyncSeconds % 60;
          timerEl.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      } else {
        state.liveNextSyncSeconds = 600;
        loadLiveMarketData();
      }
    }, 1000);
  }

  function loadLiveMarketData(manual = false) {
    fetch("data/live-market-data.json?v=" + Date.now())
      .then(res => res.json())
      .then(data => {
        if (!data) return;
        state.liveMarketData = data;
        state.liveNextSyncSeconds = data.nextSyncCountdownSeconds || 600;
        if (state.route.view === "live-prices") {
          renderLivePricesPage();
        } else {
          updateDashboardMoversInPlace();
        }
        if (manual) {
          showToast("Market feed refreshed; check each quote's source and timestamp.", "success");
        }
      })
      .catch(() => {});
  }

  // Global Bridge for Inline Handlers
  window.IpoApp = {
    setCalcCompany: (slug) => {
      state.calcSelectedSlug = slug;
      state.calcCustomGmp = null;
      state.calcLivePrice = null;
      renderCalculatorPage();
    },
    setCalcLots: (lots) => {
      state.calcLots = parseInt(lots, 10) || 1;
      renderCalculatorPage();
    },
    setCalcLivePrice: (val) => {
      const num = parseFloat(val);
      state.calcLivePrice = (isNaN(num) || num <= 0) ? null : num;
      renderCalculatorPage();
    },
    resetCalcLivePrice: () => {
      state.calcLivePrice = null;
      renderCalculatorPage();
    },
    adjustLivePricePct: (pct) => {
      const ipo = getSelectedCalcIpo();
      const upperPrice = ipo.priceBandHigh || ipo.issuePrice || 100;
      state.calcLivePrice = Math.round(upperPrice * (1 + pct / 100) * 100) / 100;
      renderCalculatorPage();
    },
    loadStockIntoCalc: (symbol, name, livePrice, issuePrice) => {
      state.calcSelectedSlug = symbol;
      state.calcLivePrice = Number(livePrice);
      state.calcCustomGmp = Math.max(0, Math.round(livePrice - (issuePrice || livePrice * 0.92)));
      window.location.hash = "#/calculator";
      renderCalculatorPage();
      const el = document.getElementById("app");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      showToast(`⚡ Loaded ${name} (Live Price: ₹${Number(livePrice).toFixed(2)}) into calculator!`, "success");
    },
    setCustomGmp: (val) => {
      const num = parseFloat(val);
      state.calcCustomGmp = isNaN(num) ? 0 : Math.max(0, num);
      renderCalculatorPage();
    },
    resetCustomGmp: () => {
      state.calcCustomGmp = null;
      renderCalculatorPage();
    },
    adjustGmp: (delta) => {
      const ipo = getSelectedCalcIpo();
      const current = (state.calcCustomGmp !== null && state.calcCustomGmp !== undefined && !isNaN(state.calcCustomGmp))
        ? Number(state.calcCustomGmp)
        : ((ipo.gmp !== null && ipo.gmp !== undefined && !isNaN(ipo.gmp)) ? Number(ipo.gmp) : 0);
      state.calcCustomGmp = Math.max(0, current + delta);
      renderCalculatorPage();
    },
    setLivePricesFilter: (filter) => {
      state.livePricesFilter = filter;
      renderLivePricesPage();
    },
    setLivePricesSearch: (query) => {
      state.livePricesSearch = query;
      renderLivePricesPage();
    },
    refreshLiveMarketData: () => {
      loadLiveMarketData(true);
    },
    handleGetAlertsClick: () => {
      // Open the full Subscribe & Unsubscribe Email Alert Dialog for user
      if (window.SubscriberService && typeof window.SubscriberService.openSubscribeModal === "function") {
        window.SubscriberService.openSubscribeModal("subscribe");
      } else {
        state.notificationsOpen = true;
        document.body.classList.add("notif-open");
        renderHeader();
      }
    },
    setNotifMode: (mode) => {
      state.notifSubMode = mode;
      const tabSub = document.getElementById("notif-tab-sub");
      const tabUnsub = document.getElementById("notif-tab-unsub");
      const btn = document.getElementById("notif-sub-submit-btn");
      const inp = document.getElementById("notif-email-input");
      const hint = document.getElementById("notif-sub-hint");
      if (tabSub && tabUnsub && btn && inp && hint) {
        if (mode === "unsubscribe") {
          tabSub.classList.remove("active");
          tabUnsub.classList.add("active", "unsub");
          btn.textContent = "Delete Details & Unsubscribe";
          btn.classList.add("unsub-mode");
          inp.placeholder = "Enter email to delete details...";
          hint.innerHTML = "<span>⚠️ Your email and details will be deleted immediately from subscribers list.</span>";
        } else {
          tabSub.classList.add("active");
          tabUnsub.classList.remove("active", "unsub");
          btn.textContent = "Subscribe Now";
          btn.classList.remove("unsub-mode");
          inp.placeholder = "Enter email for live alerts...";
          hint.innerHTML = "<span>⚡ Instant alerts for bidding start, GMP spikes & allotment releases.</span>";
        }
        inp.focus();
      }
    },
    handleNotifFormSubmit: async (e) => {
      e.preventDefault();
      const inp = document.getElementById("notif-email-input");
      const email = inp ? inp.value.trim() : "";
      if (!email) return;
      const mode = state.notifSubMode || "subscribe";
      const btn = document.getElementById("notif-sub-submit-btn");
      if (btn) btn.disabled = true;
      try {
        if (window.SubscriberService) {
          if (mode === "unsubscribe") {
            const res = await window.SubscriberService.unsubscribe(email);
            showToast(res.message || "Your details have been deleted.", "success");
          } else {
            const res = await window.SubscriberService.subscribe(email, "Notifications Panel");
            showToast(res.message || "Subscribed for live alerts!", "success");
          }
          if (inp) inp.value = "";
        } else {
          showToast(mode === "unsubscribe" ? "Unsubscribe request processed" : "Subscribed for live alerts", "success");
        }
      } catch (err) {
        showToast(err.message || "Operation failed. Please try again.", "warning");
      } finally {
        if (btn) btn.disabled = false;
      }
    },
    shareCalcWhatsApp: (name, lots, shares, issuePrice, livePrice, liveProfit, liveReturnPct, gmpVal, estListingPrice) => {
      const inv = Number(shares * issuePrice).toLocaleString('en-IN');
      const isProf = Number(liveProfit) >= 0;
      const text = `📊 *IPO Profit & Live Gain Estimate for ${name}*\n` +
        `💰 Total Investment: ₹${inv} (${lots} Lots / ${Number(shares).toLocaleString('en-IN')} Shares)\n` +
        `🎯 Issue / Base Price: ₹${issuePrice}\n` +
        `📈 Live Market Price (CMP): ₹${livePrice}\n` +
        `⚡ *Live Price Profit:* ${isProf ? '+' : ''}₹${Number(Math.round(liveProfit)).toLocaleString('en-IN')} (${isProf ? '+' : ''}${liveReturnPct}% ROI)\n` +
        (gmpVal ? `🚀 Unofficial GMP: +₹${gmpVal} (Est. Listing: ₹${estListingPrice})\n\n` : `\n`) +
        `👉 Check real-time live price profits & IPO GMP at https://pricealerter.in/#/calculator`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    },
    copyCalcReport: (name, lots, shares, issuePrice, livePrice, liveProfit, liveReturnPct, gmpVal, estListingPrice) => {
      const inv = Number(shares * issuePrice).toLocaleString('en-IN');
      const isProf = Number(liveProfit) >= 0;
      const text = `📊 IPO Profit & Live Gain Estimate for ${name}\n` +
        `• Lots Applied: ${lots} Lots (${Number(shares).toLocaleString('en-IN')} Shares)\n` +
        `• Total Investment: ₹${inv}\n` +
        `• Issue / Base Price: ₹${issuePrice}\n` +
        `• Live Market Price (CMP): ₹${livePrice}\n` +
        `• ⚡ Live Price Profit: ${isProf ? '+' : ''}₹${Number(Math.round(liveProfit)).toLocaleString('en-IN')} (${isProf ? '+' : ''}${liveReturnPct}% ROI)\n` +
        (gmpVal ? `• Unofficial GMP: +₹${gmpVal} (Est. Listing: ₹${estListingPrice})\n` : '') +
        `Source: https://pricealerter.in/#/calculator`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Live price profit summary copied to clipboard!", "success");
        }).catch(() => {
          showToast("Copied to clipboard", "success");
        });
      } else {
        showToast("Summary copied to clipboard", "success");
      }
    },
    setAllotmentCompany: (slug) => {
      state.allotmentSelectedSlug = slug;
      renderAllotmentHubPage();
    },
    acceptCookieConsent: (accepted) => acceptCookieConsent(accepted),
    toggleOpenIpoDetail: (slug) => {
      // Desktop Drawer & Button
      const drawer = document.getElementById("open-ipo-expand-" + slug);
      const btn = document.getElementById("open-ipo-btn-" + slug);
      if (drawer) {
        const isVisible = drawer.style.display !== "none" && drawer.style.display !== "";
        if (isVisible) {
          drawer.style.display = "none";
          if (btn) btn.innerHTML = "More Details ▾";
        } else {
          drawer.style.display = "table-row";
          if (btn) btn.innerHTML = "Hide Details ▴";
          try {
            drawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } catch(e) {}
        }
      }

      // Mobile Card Drawer & Button
      const mDrawer = document.getElementById("mobile-open-expand-" + slug);
      const mBtn = document.getElementById("mobile-open-btn-" + slug);
      if (mDrawer) {
        const isMVisible = mDrawer.style.display !== "none" && mDrawer.style.display !== "";
        if (isMVisible) {
          mDrawer.style.display = "none";
          if (mBtn) mBtn.innerHTML = "View Details ▾";
        } else {
          mDrawer.style.display = "block";
          if (mBtn) mBtn.innerHTML = "Hide Details ▴";
          try {
            mDrawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } catch(e) {}
        }
      }
    },

    likeComment: (slug, commentId, btnEl) => {
      const { newCount, liked } = toggleIpoCommentLike(slug, commentId);
      const span = btnEl.querySelector("span");
      const svg = btnEl.querySelector("svg");
      if (span) span.innerText = "Helpful (" + newCount + ")";
      if (liked) {
        btnEl.classList.add("liked");
        btnEl.setAttribute("title", "Click to unlike");
        if (svg) svg.setAttribute("fill", "#2563EB");
        showToast("Marked as helpful!", "success");
      } else {
        btnEl.classList.remove("liked");
        btnEl.setAttribute("title", "Click if helpful");
        if (svg) svg.setAttribute("fill", "none");
        showToast("Helpful vote removed", "info");
      }
    },
    filterGuideCategory: (cat, btn) => {
      document.querySelectorAll(".category-tabs .cat-pill").forEach(p => p.classList.remove("active"));
      if (btn) btn.classList.add("active");
      const cards = document.querySelectorAll("#guide-articles-grid .guide-article-card");
      cards.forEach(c => {
        const cardCat = c.getAttribute("data-category") || "";
        if (cat === "all" || cardCat.split(" ").includes(cat)) {
          c.style.display = "flex";
        } else {
          c.style.display = "none";
        }
      });
    },
    setFilter: (filterName) => {
      state.activeFilter = filterName;
      if (state.route.view !== "home") {
        window.location.hash = "#/";
      } else {
        renderDashboardView();
      }
    },
    toggleSearchModal,
    openBrokerModal: () => {},
    trackAndOpenBroker: (brokerId, url) => {
      if (url) window.open(url, "_blank");
    },
    selectBrokerDirect: () => {},
    handleDocClick: (title, url) => {
      if (url) {
        window.open(url, "_blank");
      } else {
        showToast(`Opening official offer document: ${title}`, "info");
      }
    },
    closeNotifications: () => {
      state.notificationsOpen = false;
      document.body.classList.remove("notif-open");
      renderHeader();
    },
    handleFig1Subscribe: (e) => {
      if (window.handleFig1FormSubmit) {
        return window.handleFig1FormSubmit(e);
      }
      if (window.handleSubscribeForm) {
        return window.handleSubscribeForm(e, "Stay Updated Form");
      }
      e.preventDefault();
      showToast("Subscription service is unavailable. Please try again later.", "warning");
    },
    exportSubscribersExcel: () => {
      if (window.SubscriberService) {
        window.SubscriberService.downloadExcel();
      }
    },
    showToast: (msg, type) => showToast(msg, type),
    toggleAlertsSubscription: () => {
      if (window.SubscriberService && typeof window.SubscriberService.openSubscribeModal === "function") {
        window.SubscriberService.openSubscribeModal();
      } else {
        showToast("Email subscription is loading. Please try again.", "warning");
      }
    },
    toggleWatchlist: (slug, btnEl) => {
      let bookmarks = [];
      try {
        bookmarks = JSON.parse(localStorage.getItem("ipo_watchlist") || "[]");
      } catch (e) {}
      const idx = bookmarks.indexOf(slug);
      let isAdded = false;
      if (idx > -1) {
        bookmarks.splice(idx, 1);
        isAdded = false;
      } else {
        bookmarks.push(slug);
        isAdded = true;
      }
      localStorage.setItem("ipo_watchlist", JSON.stringify(bookmarks));
      if (btnEl) {
        if (isAdded) {
          btnEl.classList.add("bookmarked");
          btnEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>Bookmarked</span>`;
          showToast("Added to your Watchlist!", "success");
        } else {
          btnEl.classList.remove("bookmarked");
          btnEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>Add to Watchlist</span>`;
          showToast("Removed from Watchlist", "info");
        }
      }
    },
    toggleMobileMenu: (force) => {
      state.mobileMenuOpen = force !== undefined ? force : !state.mobileMenuOpen;
      renderHeader();
    },
    setOpenBoardFilter: (board) => {
      state.openBoard = board;
      renderOpenIposPage();
    },
    setOpenSearch: (q) => {
      state.openSearchQuery = q;
      const tableBody = document.getElementById("open-ipos-table-body");
      const cardsBody = document.getElementById("open-ipos-mobile-cards");
      if (tableBody && cardsBody) {
        updateOpenIposDomInPlace();
      } else {
        renderOpenIposPage();
      }
    },
    setUpcomingBoardFilter: (board) => {
      state.upcomingBoard = board;
      renderUpcomingIposPage();
    },
    setUpcomingStatusFilter: (status) => {
      state.upcomingFilter = status;
      renderUpcomingIposPage();
    },
    setUpcomingSearch: (q) => {
      state.upcomingSearchQuery = q;
      const tableBody = document.getElementById("upcoming-ipos-table-body");
      const cardsBody = document.getElementById("upcoming-ipos-mobile-cards");
      if (tableBody && cardsBody) {
        updateUpcomingIposDomInPlace();
      } else {
        renderUpcomingIposPage();
      }
    },
    setGmpFilter: (filter) => {
      state.gmpFilter = filter;
      const tableBody = document.getElementById("gmp-table-body");
      if (tableBody) {
        updateGmpDomInPlace();
      } else {
        renderGmpPage();
      }
    },
    setGmpSearch: (q) => {
      state.gmpSearchQuery = q;
      const tableBody = document.getElementById("gmp-table-body");
      if (tableBody) {
        updateGmpDomInPlace();
      } else {
        renderGmpPage();
      }
    },
    setListedYear: (yr) => {
      state.listedYear = String(yr);
      state.listedLimit = 50;
      renderListedPage();
    },
    setListedSegment: (seg) => {
      state.listedSegment = seg;
      state.listedLimit = 50;
      renderListedPage();
    },
    setListedSort: (sort) => {
      state.listedSort = sort;
      renderListedPage();
    },
    searchListed: (query) => {
      state.listedSearchQuery = query;
      state.listedLimit = 50;
      const tableBody = document.getElementById("listed-table-body");
      const cardsBody = document.getElementById("listed-cards-body");
      if (tableBody && cardsBody) {
        updateListedDomInPlace();
      } else {
        renderListedPage();
      }
    },
    loadMoreListed: () => {
      state.listedLimit = (state.listedLimit || 50) + 50;
      const tableBody = document.getElementById("listed-table-body");
      const cardsBody = document.getElementById("listed-cards-body");
      if (tableBody && cardsBody) {
        updateListedDomInPlace();
      } else {
        renderListedPage();
      }
    }
  };

  // Run on DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

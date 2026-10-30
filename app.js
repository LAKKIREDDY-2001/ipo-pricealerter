/* ==========================================================================
   IPO Track — Production Client Application
   Vanilla JS architecture with hash-based routing, interactive charts,
   search modal, GMP calculator, and responsive layouts.
   ========================================================================== */

"use strict";

(() => {
  const dataset = window.IpoData || { records: [], stats: {}, calendarEvents: {}, alertsFeed: [] };
  const records = dataset.records || [];

  // Application State
  const state = {
    route: parseRoute(),
    activeFilter: "all",        // 'all' | 'open' | 'upcoming' | 'closing-today' | 'listed'
    activeBoard: "all",         // 'all' | 'mainboard' | 'sme'
    activeBottomCompany: "bombay-coated-and-special-steels-ipo",
    calendarMonth: new Date(2026, 9, 1), // October 2026
    selectedCalendarDate: "2026-10-30",
    detailTab: "overview",      // 'overview' | 'subscription' | 'gmp' | 'financials' | 'review' | 'documents'
    notificationsOpen: false,
    applyDropdownOpen: false,
    brokerModalIpo: null,
    searchModalOpen: false,
    calcLots: 1,
    alertsSubscribed: true
  };

  // Helper Utilities
  function parseRoute() {
    const hash = window.location.hash.replace(/^#\/?/, "") || "";
    const parts = hash.split("/").filter(Boolean);
    if (parts.length === 0) return { view: "home" };
    if (parts[0] === "ipo" && parts[1]) return { view: "detail", slug: parts[1] };
    if (parts[0] === "gmp") return { view: "gmp" };
    if (parts[0] === "calendar") return { view: "calendar" };
    if (parts[0] === "listed") return { view: "listed" };
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
  // Header Rendering
  // ==========================================================================
  function renderHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;
    const currentView = state.route.view;

    header.innerHTML = `
      <div class="nav-container">
        <a href="#/" class="brand-wrap" aria-label="IPO Track Home">
          <span>IPO</span>
          <span class="brand-dot-pulse"></span>
          <span>Track</span>
        </a>

        <nav class="main-nav" aria-label="Main Navigation">
          <a href="#/" class="nav-tab-link ${currentView === "home" ? "active" : ""}">Home</a>
          <a href="#/gmp" class="nav-tab-link ${currentView === "gmp" ? "active" : ""}">GMP</a>
          <a href="#/calendar" class="nav-tab-link ${currentView === "calendar" ? "active" : ""}">Calendar</a>
          <a href="#/listed" class="nav-tab-link ${currentView === "listed" ? "active" : ""}">Listed</a>
        </nav>

        <div class="header-right">
          <button class="header-search-btn" id="open-search-pill" aria-label="Search IPOs">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Search IPOs, companies...</span>
            <kbd>⌘K</kbd>
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
    `;

    // Bind Header Events
    document.getElementById("open-search-pill")?.addEventListener("click", () => toggleSearchModal(true));
    document.getElementById("header-bell-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      state.notificationsOpen = !state.notificationsOpen;
      renderHeader();
    });

    document.getElementById("toggle-alerts-feed-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      state.alertsSubscribed = !state.alertsSubscribed;
      showToast(state.alertsSubscribed ? "Live IPO alerts enabled" : "IPO alerts muted", "info");
      renderHeader();
    });

    document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
      toggleSearchModal(true);
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

  function renderNotificationsPanel() {
    const alerts = dataset.alertsFeed || [];
    return `
      <div class="notifications-panel" id="notifications-panel" onclick="event.stopPropagation()">
        <div class="notif-header">
          <h4>Market Alerts & Updates</h4>
          <button class="notif-toggle-alerts" id="toggle-alerts-feed-btn">
            ${state.alertsSubscribed ? "Mute" : "Enable"}
          </button>
        </div>
        <div class="notif-list">
          ${alerts.map(a => `
            <a href="#/ipo/${a.slug}" class="notif-item" onclick="window.IpoApp.closeNotifications()">
              <div class="notif-item-top">
                <span class="notif-item-title">${a.title}</span>
                <span class="notif-tag">${a.tag}</span>
              </div>
              <p class="notif-desc">${a.description}</p>
              <span class="notif-time">${a.time}</span>
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
  // Home Dashboard View
  // ==========================================================================
  function renderDashboardView() {
    const app = document.getElementById("app");
    if (!app) return;

    // Filter Logic — "closed and listed is same"
    let filtered = records;
    if (state.activeFilter === "open") {
      filtered = filtered.filter(r => r.status === "OPEN");
    } else if (state.activeFilter === "closed" || state.activeFilter === "listed") {
      filtered = filtered.filter(r => r.status === "CLOSED" || r.status === "LISTED");
    } else if (state.activeFilter === "upcoming") {
      filtered = filtered.filter(r => r.status === "UPCOMING");
    }

    if (state.activeBoard === "mainboard") {
      filtered = filtered.filter(r => r.board === "MAINBOARD");
    } else if (state.activeBoard === "sme") {
      filtered = filtered.filter(r => r.board === "SME");
    }

    app.innerHTML = `
      <!-- Hero Section -->
      <section class="hero-wrapper" aria-label="IPO Intelligence Hero">
        <div class="hero-left">
          <div class="hero-badge-pill">
            <span class="badge-pulse"></span>
            <span>LIVE IPO TRACKER</span>
          </div>
          <h1 class="hero-title">IPO Intelligence</h1>
          <p class="hero-sub">Track. Analyze. Decide.</p>
          
          <div class="hero-stats-row">
            <div class="hero-stat-box clickable" id="hero-stat-open" title="Click to view Open IPOs">
              <span class="hero-stat-num">${dataset.stats?.openCount || 6}</span>
              <span class="hero-stat-label">Open</span>
            </div>
            <div class="hero-stat-box clickable" id="hero-stat-closed" title="Click to view Closed IPOs">
              <span class="hero-stat-num">${dataset.stats?.closedCount || 165}</span>
              <span class="hero-stat-label">Closed</span>
            </div>
            <div class="hero-stat-box clickable" id="hero-stat-upcoming" title="Click to view Upcoming IPOs">
              <span class="hero-stat-num">${dataset.stats?.upcomingCount || 26}</span>
              <span class="hero-stat-label">Upcoming</span>
            </div>
            <div class="hero-stat-box clickable" id="hero-stat-listed" title="Click to view All Listed IPOs">
              <span class="hero-stat-num">${dataset.stats?.listedCount || 165}</span>
              <span class="hero-stat-label">All Listed</span>
            </div>
          </div>

          <div class="hero-actions-row">
            <button class="btn-primary-blue" id="hero-view-open-btn">
              <span>View Open IPOs</span>
            </button>
            <button class="btn-glass-outline" id="hero-enable-alerts-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>${state.alertsSubscribed ? "Alerts Active" : "Enable Alerts"}</span>
            </button>
          </div>
        </div>

        <div class="hero-right-3d">
          ${renderHero3DSvg()}
        </div>
      </section>

      <!-- Live GMP Ticker Bar -->
      <section class="gmp-ticker-bar" aria-label="GMP Live Ticker">
        <div class="gmp-ticker-label">
          <span class="live-dot"></span>
          <span>GMP Live</span>
        </div>
        <div class="ticker-scroll-track" id="ticker-scroll-track">
          ${records.filter(r => r.gmp).map(r => `
            <div class="ticker-item" onclick="window.location.hash='#/ipo/${r.slug}'">
              <span class="ticker-name">${r.shortName}</span>
              <span class="ticker-val-green">+${r.gmp} (${r.gmpPercentage}%)</span>
              ${renderSparklineSvg(r.gmpHistory?.map(h => h.value) || [10, 12, 14, 15], 44, 18, "#10B981")}
            </div>
          `).join("")}
        </div>
      </section>

      <!-- Category Filter Tabs -->
      <section class="filter-tabs-wrapper" aria-label="Filter Options">
        <div class="filter-pills-group" id="status-filter-group">
          <button class="filter-pill ${state.activeFilter === "all" ? "active" : ""}" data-status="all">All (${records.length})</button>
          <button class="filter-pill ${state.activeFilter === "open" ? "active" : ""}" data-status="open">Open (${dataset.stats?.openCount || 6})</button>
          <button class="filter-pill ${state.activeFilter === "closed" ? "active" : ""}" data-status="closed">Closed (${dataset.stats?.closedCount || 165})</button>
          <button class="filter-pill ${state.activeFilter === "upcoming" ? "active" : ""}" data-status="upcoming">Upcoming (${dataset.stats?.upcomingCount || 26})</button>
          <button class="filter-pill ${state.activeFilter === "listed" ? "active" : ""}" data-status="listed">All Listed (${dataset.stats?.listedCount || 165})</button>
        </div>

        <div class="filter-pills-group" id="board-filter-group">
          <button class="filter-pill ${state.activeBoard === "all" ? "active" : ""}" data-board="all">All</button>
          <button class="filter-pill ${state.activeBoard === "mainboard" ? "active" : ""}" data-board="mainboard">Mainboard</button>
          <button class="filter-pill ${state.activeBoard === "sme" ? "active" : ""}" data-board="sme">SME</button>
        </div>
      </section>

      <!-- Main IPO Cards Grid -->
      <section class="ipo-cards-grid" aria-label="Active and Upcoming IPOs">
        ${filtered.map(r => renderIpoCardHtml(r)).join("")}
      </section>

      <!-- Bottom Dashboard 4 Sections (2x2 Grid) -->
      <section class="bottom-sections-grid" aria-label="Market Details and Schedules">
        ${renderSubscriptionDetailsWidget()}
        ${renderCompanyFinancialsWidget()}
        ${renderGmpTrackerWidget()}
        ${renderIpoCalendarWidget()}
      </section>
    `;

    // Event Bindings
    document.getElementById("hero-view-open-btn")?.addEventListener("click", () => {
      state.activeFilter = "open";
      renderDashboardView();
      window.scrollTo({ top: 380, behavior: "smooth" });
    });

    document.getElementById("hero-stat-open")?.addEventListener("click", () => {
      state.activeFilter = "open";
      renderDashboardView();
    });
    document.getElementById("hero-stat-closed")?.addEventListener("click", () => {
      state.activeFilter = "closed";
      renderDashboardView();
    });
    document.getElementById("hero-stat-upcoming")?.addEventListener("click", () => {
      state.activeFilter = "upcoming";
      renderDashboardView();
    });
    document.getElementById("hero-stat-listed")?.addEventListener("click", () => {
      state.activeFilter = "listed";
      renderDashboardView();
    });

    document.getElementById("hero-enable-alerts-btn")?.addEventListener("click", () => {
      state.alertsSubscribed = !state.alertsSubscribed;
      showToast(state.alertsSubscribed ? "🔔 Real-time alerts enabled for Open IPOs" : "Alerts muted", "success");
      renderDashboardView();
    });

    document.querySelectorAll("#status-filter-group .filter-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeFilter = btn.getAttribute("data-status");
        renderDashboardView();
      });
    });

    document.querySelectorAll("#board-filter-group .filter-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeBoard = btn.getAttribute("data-board");
        renderDashboardView();
      });
    });

    bindCalendarControls();
  }

  // ==========================================================================
  // IPO Card Item Renderer
  // ==========================================================================
  function renderIpoCardHtml(ipo) {
    let badgeClass = "open";
    let badgeLabel = "Open";

    if (ipo.status === "CLOSED") {
      badgeClass = "closed";
      badgeLabel = "Closed";
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
        ? `Opens: ${formatDate(ipo.openDate)}`
        : ipo.status === "CLOSED"
          ? `Closed: ${formatDate(ipo.closeDate)}`
          : `Closes: ${formatDate(ipo.closeDate)}`;

    const maxSub = 50;
    const subVal = ipo.subscriptionTotal || 0;
    const fillPercent = Math.min(100, Math.max(8, (subVal / maxSub) * 100));

    return `
      <article class="ipo-card" onclick="window.location.hash='#/ipo/${ipo.slug}'">
        <div class="ipo-card-header">
          <div class="card-company-left">
            <div class="company-avatar-box" style="background-color: ${ipo.logoColor || '#2563EB'}">
              ${getCompanyIcon(ipo.iconType)}
            </div>
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
              <span class="gmp-highlight-text">Listing Gain +${ipo.listingGain}%</span>
              <span class="date-highlight-text">${dateNote}</span>
            ` : `
              <span class="gmp-highlight-text ${ipo.gmp ? '' : 'neutral'}">
                ${ipo.gmp ? `GMP +${ipo.gmp} (${ipo.gmpPercentage}%)` : 'GMP TBA'}
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

          <div class="card-btn-action-row">
            ${ipo.allotmentUrl ? `
              <a href="${ipo.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="card-btn-action btn-allotment" onclick="event.stopPropagation()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                <span>Check Allotment Status</span>
              </a>
            ` : ipo.docUrl ? `
              <a href="${ipo.docUrl}" target="_blank" rel="noopener noreferrer" class="card-btn-action btn-doc" onclick="event.stopPropagation()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                <span>IPO Doc (DRHP)</span>
              </a>
            ` : ipo.status === "OPEN" ? `
              <button class="card-btn-action btn-apply" onclick="event.stopPropagation(); window.location.hash='#/ipo/${ipo.slug}'">
                <span>Apply on Broker</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            ` : `
              <button class="card-btn-action btn-view" onclick="event.stopPropagation(); window.location.hash='#/ipo/${ipo.slug}'">
                <span>View Details</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            `}
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
          <select id="sub-widget-company-select" style="background:var(--bg-input); border:1px solid var(--border-subtle); padding:4px 8px; border-radius:6px; font-size:12px; color:var(--text-primary); cursor:pointer;">
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
        </div>
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
              <div class="gmp-row-logo" style="background:${r.logoColor || '#2563EB'}">
                ${getCompanyIcon(r.iconType)}
              </div>
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

    const ipo = records.find(r => r.slug === slug) || records[0];
    const upperPrice = ipo.priceBandHigh || ipo.issuePrice || 150;
    const gmpVal = ipo.gmp || 15;
    const gmpPct = ipo.gmpPercentage || 10.5;

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
            <div class="detail-large-logo" style="background-color: ${ipo.logoColor || '#2563EB'}">
              ${getCompanyIcon(ipo.iconType)}
            </div>
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
            ${ipo.allotmentUrl ? `
              <a href="${ipo.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary-blue direct-allotment-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                <span>Check Allotment Status</span>
              </a>
            ` : ipo.docUrl ? `
              <a href="${ipo.docUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary-blue direct-doc-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                <span>View IPO Doc (DRHP)</span>
              </a>
            ` : `
              <button class="btn-apply-dropdown" id="detail-apply-btn">
                <span>Apply on Broker</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              ${state.applyDropdownOpen ? renderBrokerDropdown(ipo) : ""}
            `}
          </div>
        </header>

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
      </div>
    `;

    // Event Bindings
    document.getElementById("detail-apply-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      state.applyDropdownOpen = !state.applyDropdownOpen;
      renderDetailView(slug);
    });

    document.querySelectorAll(".detail-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.detailTab = btn.getAttribute("data-dtab");
        state.applyDropdownOpen = false;
        renderDetailView(slug);
      });
    });

    bindDetailInteractiveEvents(ipo);
  }

  function renderBrokerDropdown(ipo) {
    return `
      <div class="broker-dropdown-menu" id="broker-dropdown-menu" onclick="event.stopPropagation()">
        <a href="javascript:void(0)" class="broker-dropdown-item" onclick="window.IpoApp.openBrokerModal('Zerodha')">
          <span style="color:#3B82F6;">●</span> Zerodha Kite
        </a>
        <a href="javascript:void(0)" class="broker-dropdown-item" onclick="window.IpoApp.openBrokerModal('Groww')">
          <span style="color:#10B981;">●</span> Groww
        </a>
        <a href="javascript:void(0)" class="broker-dropdown-item" onclick="window.IpoApp.openBrokerModal('Angel One')">
          <span style="color:#F59E0B;">●</span> Angel One
        </a>
        <a href="javascript:void(0)" class="broker-dropdown-item" onclick="window.IpoApp.openBrokerModal('Upstox')">
          <span style="color:#8B5CF6;">●</span> Upstox Pro
        </a>
        <a href="javascript:void(0)" class="broker-dropdown-item" onclick="window.IpoApp.openBrokerModal('HDFC Sky')">
          <span style="color:#38BDF8;">●</span> HDFC Sky
        </a>
        <a href="javascript:void(0)" class="broker-dropdown-item" onclick="window.IpoApp.openBrokerModal('SBI NetBanking')">
          <span style="color:#60A5FA;">●</span> SBI ASBA Portal
        </a>
      </div>
    `;
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
  // Detail Subtab: Overview (Exact match to Reference Image)
  // ==========================================================================
  function renderDetailOverviewTab(ipo) {
    const priceBandText = ipo.priceBandLow && ipo.priceBandHigh 
      ? `₹${ipo.priceBandLow} – ${ipo.priceBandHigh}` 
      : `₹${ipo.issuePrice || '—'}`;

    return `
      <div class="tab-content-container">
        ${ipo.allotmentUrl ? `
          <div class="allotment-portal-callout">
            <div class="callout-text">
              <strong>Allotment Status Available</strong>
              <span>Official Registrar: ${ipo.registrar || 'Registrar Portal'}</span>
            </div>
            <a href="${ipo.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="btn-allotment-direct">
              <span>Open Allotment Portal</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        ` : ''}

        <!-- Top Row: Key Details & GMP Card -->
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

          <!-- GMP Card with Trend Graph -->
          <div class="detail-gmp-card">
            <div class="detail-gmp-head">
              <div class="gmp-head-left">
                <h3>GMP (Grey Market Premium)</h3>
                <div class="gmp-large-val">₹${ipo.gmp || 15} (${ipo.gmpPercentage || 10.5}%)</div>
              </div>
              <span class="gmp-updated-time">Last Updated: 27 Oct, 10:30 AM</span>
            </div>

            <!-- SVG Trend Chart -->
            <div class="gmp-trend-chart-box">
              <svg class="gmp-trend-chart-svg" viewBox="0 0 300 120" fill="none">
                <defs>
                  <linearGradient id="detailGmpArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>

                <!-- Grid lines -->
                <line x1="25" y1="20" x2="290" y2="20" stroke="#1E293B" stroke-dasharray="2,2"/>
                <text x="18" y="24" fill="#64748B" font-size="9" text-anchor="end">40</text>
                
                <line x1="25" y1="50" x2="290" y2="50" stroke="#1E293B" stroke-dasharray="2,2"/>
                <text x="18" y="54" fill="#64748B" font-size="9" text-anchor="end">30</text>
                
                <line x1="25" y1="80" x2="290" y2="80" stroke="#1E293B" stroke-dasharray="2,2"/>
                <text x="18" y="84" fill="#64748B" font-size="9" text-anchor="end">20</text>

                <line x1="25" y1="110" x2="290" y2="110" stroke="#334155"/>
                <text x="18" y="114" fill="#64748B" font-size="9" text-anchor="end">10</text>

                <!-- Area fill -->
                <path d="M 45 110 L 45 95 L 115 85 L 185 75 L 265 65 L 265 110 Z" fill="url(#detailGmpArea)"/>
                
                <!-- Line -->
                <path d="M 45 95 L 115 85 L 185 75 L 265 65" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round"/>
                
                <!-- Dots & Dates -->
                <circle cx="45" cy="95" r="3.5" fill="#3B82F6"/>
                <text x="45" y="119" fill="#94A3B8" font-size="8" text-anchor="middle">24 Oct</text>

                <circle cx="115" cy="85" r="3.5" fill="#3B82F6"/>
                <text x="115" y="119" fill="#94A3B8" font-size="8" text-anchor="middle">25 Oct</text>

                <circle cx="185" cy="75" r="3.5" fill="#3B82F6"/>
                <text x="185" y="119" fill="#94A3B8" font-size="8" text-anchor="middle">26 Oct</text>

                <circle cx="265" cy="65" r="4.5" fill="#60A5FA"/>
                <text x="265" y="119" fill="#60A5FA" font-size="8" font-weight="700" text-anchor="middle">27 Oct</text>
              </svg>
            </div>

            <div class="gmp-minibar-stats">
              <div class="gmp-stat-item">
                <span>Day High</span>
                <strong>₹${ipo.dayHighGmp || 18}</strong>
              </div>
              <div class="gmp-stat-item">
                <span>Day Low</span>
                <strong>₹${ipo.dayLowGmp || 12}</strong>
              </div>
              <div class="gmp-stat-item">
                <span>Trend</span>
                <strong class="trend-green">↑ Up</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Full-Width Bottom Row: IPO Timeline Stepper -->
        <div class="detail-timeline-card">
          <h3>IPO Timeline</h3>
          <div class="stepper-timeline-track">
            <div class="stepper-line-bg"></div>
            <div class="stepper-line-progress"></div>

            <div class="step-node-col">
              <div class="step-circle completed">✓</div>
              <span class="step-title">IPO Opens</span>
              <span class="step-date">${formatDate(ipo.openDate)}</span>
            </div>

            <div class="step-node-col">
              <div class="step-circle active">●</div>
              <span class="step-title">IPO Closes</span>
              <span class="step-date">${formatDate(ipo.closeDate)}</span>
            </div>

            <div class="step-node-col">
              <div class="step-circle">3</div>
              <span class="step-title">Allotment</span>
              <span class="step-date">${formatDate(ipo.allotDate)}</span>
            </div>

            <div class="step-node-col">
              <div class="step-circle">4</div>
              <span class="step-title">Refund</span>
              <span class="step-date">${formatDate(ipo.refundDate)}</span>
            </div>

            <div class="step-node-col">
              <div class="step-circle">5</div>
              <span class="step-title">Credit to Demat</span>
              <span class="step-date">${formatDate(ipo.dematDate)}</span>
            </div>

            <div class="step-node-col">
              <div class="step-circle">6</div>
              <span class="step-title">Listing</span>
              <span class="step-date">${formatDate(ipo.listingDate)}</span>
            </div>
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
    const gmpVal = ipo.gmp || 15;
    const lots = state.calcLots || 1;

    const totalShares = lots * lotSize;
    const totalInvestment = totalShares * upperPrice;
    const estListingPrice = upperPrice + gmpVal;
    const estProfit = totalShares * gmpVal;
    const estReturnPct = ((gmpVal / upperPrice) * 100).toFixed(1);

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
              <input type="text" class="calc-input-box" value="₹${gmpVal}" disabled style="opacity:0.7;">
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
              <strong style="color:var(--accent-cyan);">₹${estListingPrice} / share</strong>
            </div>
            <div class="calc-res-item" style="border-top:1px solid var(--border-subtle); padding-top:12px;">
              <span>Expected Listing Profit</span>
              <strong class="res-gain">+${formatMoney(estProfit)} (${estReturnPct}%)</strong>
            </div>
          </div>
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
              ${(ipo.gmpHistory || [
                { date: "24 Oct", value: 10 },
                { date: "25 Oct", value: 12 },
                { date: "26 Oct", value: 14 },
                { date: "27 Oct", value: 15 }
              ]).map((h, i, arr) => {
                const prev = i > 0 ? arr[i - 1].value : h.value;
                const diff = h.value - prev;
                return `
                  <tr>
                    <td>${h.date} 2026</td>
                    <td><strong>₹${h.value}</strong></td>
                    <td>₹${upperPrice + h.value}</td>
                    <td style="color:${diff >= 0 ? 'var(--status-open)' : 'var(--status-closing)'};">
                      ${diff > 0 ? `+₹${diff} ↑` : diff === 0 ? "—" : `-₹${Math.abs(diff)} ↓`}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
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
  // Dedicated Pages: GMP Tracker, Calendar, Listed
  // ==========================================================================
  function renderGmpPage() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
      <div class="detail-view-container">
        <div class="page-header-banner">
          <h2>Live Grey Market Premium (GMP) Tracker</h2>
          <p>Real-time unofficial premiums, estimated listing gains, and profit calculations across all active IPOs.</p>
        </div>

        <div class="data-table-card">
          <table class="full-data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Price Band</th>
                <th>Current GMP</th>
                <th>Estimated Listing</th>
                <th>Expected Gain %</th>
                <th>Status</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => {
                const upper = r.priceBandHigh || r.issuePrice || 100;
                const gmp = r.gmp || 0;
                const estPrice = upper + gmp;
                const pct = r.gmpPercentage || (upper ? ((gmp / upper) * 100).toFixed(1) : 0);

                return `
                  <tr onclick="window.location.hash='#/ipo/${r.slug}'">
                    <td>
                      <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:34px; height:34px; border-radius:8px; background:${r.logoColor || '#2563EB'}; display:grid; place-items:center; color:#fff;">
                          ${getCompanyIcon(r.iconType)}
                        </div>
                        <div>
                          <strong>${r.shortName}</strong>
                          <div style="font-size:11px; color:var(--text-muted);">${r.board} • ${r.exchange}</div>
                        </div>
                      </div>
                    </td>
                    <td>${r.priceBandLow && r.priceBandHigh ? `₹${r.priceBandLow} – ${r.priceBandHigh}` : `₹${r.issuePrice || '—'}`}</td>
                    <td><strong style="color:var(--status-open); font-size:15px;">${r.gmp ? `+₹${r.gmp}` : '—'}</strong></td>
                    <td><strong>₹${estPrice}</strong></td>
                    <td><span style="color:var(--status-open); font-weight:700;">${r.gmp ? `+${pct}%` : '—'}</span></td>
                    <td><span class="status-badge ${r.status === 'CLOSED' ? 'closed' : r.status === 'UPCOMING' ? 'upcoming' : r.status === 'LISTED' ? 'listed' : 'open'}">${r.status === 'CLOSED' ? 'Closed' : r.status === 'UPCOMING' ? 'Upcoming' : r.status === 'LISTED' ? 'Listed' : 'Open'}</span></td>
                    <td><span style="color:var(--status-open);">↑ Bullish</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
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
            <h3>Scheduled Upcoming Events</h3>
            <div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
              ${Object.entries(dataset.calendarEvents || {}).sort().map(([dateStr, items]) => `
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
      </div>
    `;
    bindCalendarControls();
  }

  function renderListedPage() {
    const app = document.getElementById("app");
    if (!app) return;

    // User directive: "here closed and listed is same"
    const listedRecords = records.filter(r => r.status === "LISTED" || r.status === "CLOSED" || r.listingGain);

    app.innerHTML = `
      <div class="detail-view-container">
        <div class="page-header-banner">
          <h2>Closed & Listed IPO Performance (${listedRecords.length} Issues)</h2>
          <p>Verified primary market issues with direct official registrar allotment status links.</p>
        </div>

        <div class="data-table-card">
          <table class="full-data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Board</th>
                <th>Registrar</th>
                <th>Issue Details</th>
                <th>Status</th>
                <th>Allotment Status</th>
              </tr>
            </thead>
            <tbody>
              ${listedRecords.map(r => `
                <tr onclick="window.location.hash='#/ipo/${r.slug}'">
                  <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                      <div style="width:34px; height:34px; border-radius:8px; background:${r.logoColor || '#2563EB'}; display:grid; place-items:center; color:#fff;">
                        ${getCompanyIcon(r.iconType)}
                      </div>
                      <div>
                        <strong>${r.shortName}</strong>
                        <div style="font-size:11px; color:var(--text-muted);">${r.sector}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="board-badge ${(r.board || 'MAINBOARD').toLowerCase()}">${r.board || 'MAINBOARD'}</span></td>
                  <td style="font-size:12px; color:var(--text-secondary);">${r.registrar || 'Registrar Portal'}</td>
                  <td>
                    <div style="font-size:12px; font-weight:600;">${r.priceBandLow && r.priceBandHigh ? `₹${r.priceBandLow}–${r.priceBandHigh}` : r.issuePrice ? `₹${r.issuePrice}` : 'TBA'}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${formatCrore(r.issueSizeCr)}</div>
                  </td>
                  <td><span class="status-badge ${(r.status || 'closed').toLowerCase()}">${r.status || 'Closed'}</span></td>
                  <td>
                    ${r.allotmentUrl ? `
                      <a href="${r.allotmentUrl}" target="_blank" rel="noopener noreferrer" class="btn-table-allotment" onclick="event.stopPropagation()">
                        <span>Check Allotment</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </a>
                    ` : `
                      <span style="color:var(--text-muted); font-size:12px;">—</span>
                    `}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Global Search Modal Dialog (Command+K)
  // ==========================================================================
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

    const q = query.trim().toLowerCase();
    const matches = records.filter(r => 
      !q ||
      (r.companyName || "").toLowerCase().includes(q) ||
      (r.shortName || "").toLowerCase().includes(q) ||
      (r.sector || "").toLowerCase().includes(q) ||
      (r.exchange || "").toLowerCase().includes(q) ||
      (r.registrar || "").toLowerCase().includes(q)
    ).slice(0, 50);

    if (matches.length === 0) {
      list.innerHTML = `<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13px;">No matching IPOs found for "${query}"</div>`;
      return;
    }

    list.innerHTML = matches.map(r => `
      <div class="search-result-row" onclick="window.location.hash='#/ipo/${r.slug}'; window.IpoApp.toggleSearchModal(false);">
        <div class="search-row-left">
          <div style="width:32px; height:32px; border-radius:8px; background:${r.logoColor || '#2563EB'}; display:grid; place-items:center; color:#fff;">
            ${getCompanyIcon(r.iconType)}
          </div>
          <div class="search-row-info">
            <h4>${r.shortName}</h4>
            <span>${r.sector} • ${r.board} • ${r.exchange}</span>
          </div>
        </div>
        <span class="status-badge ${r.status === 'CLOSED' ? 'closed' : r.status === 'UPCOMING' ? 'upcoming' : r.status === 'LISTED' ? 'listed' : 'open'}">
          ${r.status === 'CLOSED' ? 'Closed' : r.status === 'UPCOMING' ? 'Upcoming' : r.status === 'LISTED' ? 'Listed' : 'Open'}
        </span>
      </div>
    `).join("");
  }

  // ==========================================================================
  // Broker Modal Logic
  // ==========================================================================
  function openBrokerModal(brokerName) {
    state.applyDropdownOpen = false;
    renderHeader();
    const modal = document.getElementById("broker-modal-wrap");
    const grid = document.getElementById("broker-options-grid");
    const title = document.getElementById("broker-modal-title");
    if (!modal || !grid) return;

    title.innerText = `Apply via ${brokerName} (ASBA Gateway)`;
    grid.innerHTML = `
      <div class="broker-option-btn" onclick="window.IpoApp.selectBrokerDirect('${brokerName}', 'UPI ASBA')">
        <div class="broker-icon-sq" style="background:#2563EB;">UPI</div>
        <div class="broker-option-text">
          <h4>UPI NetBanking ASBA</h4>
          <span>Instant block with GPay, PhonePe, BHIM</span>
        </div>
      </div>
      <div class="broker-option-btn" onclick="window.IpoApp.selectBrokerDirect('${brokerName}', '3-in-1 Account')">
        <div class="broker-icon-sq" style="background:#10B981;">ASBA</div>
        <div class="broker-option-text">
          <h4>Direct Bank ASBA</h4>
          <span>Netbanking blocking without UPI mandate</span>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
  }

  // ==========================================================================
  // Router Controller
  // ==========================================================================
  function router() {
    state.route = parseRoute();
    state.applyDropdownOpen = false;
    state.notificationsOpen = false;
    renderHeader();

    if (state.route.view === "detail") {
      renderDetailView(state.route.slug);
    } else if (state.route.view === "gmp") {
      renderGmpPage();
    } else if (state.route.view === "calendar") {
      renderCalendarPage();
    } else if (state.route.view === "listed") {
      renderListedPage();
    } else {
      renderDashboardView();
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // Initialize Application
  function init() {
    // Current year in footer
    const yr = document.getElementById("current-year");
    if (yr) yr.innerText = new Date().getFullYear();

    // Search dialog events
    document.getElementById("close-search-btn")?.addEventListener("click", () => toggleSearchModal(false));
    document.getElementById("search-dialog-wrap")?.addEventListener("click", (e) => {
      if (e.target.id === "search-dialog-wrap") toggleSearchModal(false);
    });

    document.getElementById("global-search-input")?.addEventListener("input", (e) => {
      renderSearchResults(e.target.value);
    });

    // Broker modal close events
    document.getElementById("close-broker-modal")?.addEventListener("click", () => {
      document.getElementById("broker-modal-wrap")?.classList.add("hidden");
    });
    document.getElementById("broker-modal-wrap")?.addEventListener("click", (e) => {
      if (e.target.id === "broker-modal-wrap") {
        document.getElementById("broker-modal-wrap")?.classList.add("hidden");
      }
    });

    // Keyboard Shortcuts (⌘K, Escape)
    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSearchModal(!state.searchModalOpen);
      }
      if (e.key === "Escape") {
        toggleSearchModal(false);
        document.getElementById("broker-modal-wrap")?.classList.add("hidden");
        state.notificationsOpen = false;
        state.applyDropdownOpen = false;
        renderHeader();
      }
    });

    // Close flyouts on document click
    document.addEventListener("click", () => {
      if (state.notificationsOpen || state.applyDropdownOpen) {
        state.notificationsOpen = false;
        state.applyDropdownOpen = false;
        renderHeader();
      }
    });

    // Hash change routing
    window.addEventListener("hashchange", router);
    router();
  }

  // Global Bridge for Inline Handlers
  window.IpoApp = {
    setFilter: (filterName) => {
      state.activeFilter = filterName;
      if (state.route.view !== "home") {
        window.location.hash = "#/";
      } else {
        renderDashboardView();
      }
    },
    toggleSearchModal,
    openBrokerModal,
    selectBrokerDirect: (broker, mode) => {
      document.getElementById("broker-modal-wrap")?.classList.add("hidden");
      showToast(`Redirecting to ${broker} (${mode}). Application form initiated.`, "success");
    },
    handleDocClick: (title, url) => {
      if (url) {
        window.open(url, "_blank");
      } else {
        showToast(`Opening official offer document: ${title}`, "info");
      }
    },
    closeNotifications: () => {
      state.notificationsOpen = false;
      renderHeader();
    }
  };

  // Run on DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

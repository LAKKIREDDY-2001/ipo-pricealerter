"use strict";

(() => {
  const data = window.PricealerterData && typeof window.PricealerterData === "object" ? window.PricealerterData : {};
  const validStatuses = ["OPEN", "UPCOMING", "CLOSED", "LISTED"];
  const todayInIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const currentStatus = (ipo) => {
    let status = ipo.sourceStatus || ipo.status;
    if (status === "OPEN" && ipo.openDate && ipo.openDate > todayInIndia()) status = "UPCOMING";
    if (["OPEN", "UPCOMING"].includes(status) && ipo.closeDate && ipo.closeDate < todayInIndia()) status = "CLOSED";
    if (status === "UPCOMING" && ipo.openDate && ipo.openDate <= todayInIndia() && (!ipo.closeDate || ipo.closeDate >= todayInIndia())) status = "OPEN";
    if (status === "CLOSED" && ipo.listingDate && ipo.listingDate <= todayInIndia()) status = "LISTED";
    return status;
  };
  const records = Array.isArray(data.records)
    ? data.records.filter((ipo) => ipo && typeof ipo.slug === "string" && ipo.slug.trim() && typeof ipo.companyName === "string" && ipo.companyName.trim() && validStatuses.includes(ipo.status)).map((ipo) => ({ ...ipo, sourceStatus: ipo.status, status: currentStatus(ipo) }))
    : [];
  const bySlug = new Map(records.map((ipo) => [ipo.slug, ipo]));
  const state = {
    tab: "All IPOs",
    board: "All boards",
    exchange: "All exchanges",
    query: "",
    sort: "Recommended",
    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDay: null,
    gmpSort: "gmp",
    notificationOpen: false,
    permission: "checking",
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const num = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  const money = (value) => num(value) === null ? "Not available" : `₹${num(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const priceBand = (ipo) => num(ipo.priceBandLow) !== null && num(ipo.priceBandHigh) !== null ? `${money(ipo.priceBandLow)} – ${money(ipo.priceBandHigh)}` : num(ipo.priceBandHigh) !== null ? money(ipo.priceBandHigh) : "Not available";
  const crore = (value) => num(value) === null ? "Not available" : `₹${num(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  const dateObj = (value) => {
    if (!value) return null;
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const dateLabel = (value, options = { day: "numeric", month: "short", year: "numeric" }) => {
    const date = dateObj(value);
    return date ? new Intl.DateTimeFormat("en-IN", { ...options, timeZone: "Asia/Kolkata" }).format(date) : "Not available";
  };
  const timestampLabel = (value) => {
    const date = dateObj(value);
    return date ? `${dateLabel(value, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} IST` : "Not available";
  };
  const upperPrice = (ipo) => num(ipo.priceBandHigh);
  const minimumInvestment = (ipo) => num(ipo.minimumInvestment) ?? (upperPrice(ipo) > 0 && Number.isInteger(num(ipo.lotSize)) && num(ipo.lotSize) > 0 ? upperPrice(ipo) * num(ipo.lotSize) : null);
  const gmpPercent = (ipo) => num(ipo.gmp) !== null && upperPrice(ipo) > 0 ? num(ipo.gmp) / upperPrice(ipo) * 100 : null;
  const boardLabel = (ipo) => ipo.board === "MAINBOARD" ? "Mainboard" : ipo.board === "SME" ? "SME" : "Board unavailable";
  const exchangeLabel = (ipo) => ipo.exchange === "BOTH" ? "NSE, BSE" : ["NSE", "BSE"].includes(ipo.exchange) ? ipo.exchange : "Exchange unavailable";
  const statusLabel = (status) => ({ OPEN: "Open", UPCOMING: "Upcoming", CLOSED: "Closed", LISTED: "Listed" })[status] || "Not available";
  const safeColor = (value) => typeof value === "string" && /^#[\da-f]{6}$/i.test(value) ? value : "#edf4ff";
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };
  const icon = (name, size = 16) => {
    const paths = {
      trend: '<path d="m3 16 6-6 4 4 8-9"/><path d="M15 5h6v6"/>',
      search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
      arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      back: '<path d="m15 18-6-6 6-6M9 12h12"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      up: '<path d="M7 17 17 7M7 7h10v10"/>',
    };
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
  };

  const watchlist = () => {
    try { const value = JSON.parse(localStorage.getItem("pricealerter-watchlist") || "[]"); return Array.isArray(value) ? value.filter((slug) => typeof slug === "string") : []; }
    catch { return []; }
  };
  const getAlerts = () => {
    try { const value = JSON.parse(localStorage.getItem("pricealerter-alerts") || "[]"); return Array.isArray(value) ? value.filter((alert) => alert && typeof alert.id === "string" && typeof alert.slug === "string") : []; }
    catch { return []; }
  };
  const saveAlerts = (items) => localStorage.setItem("pricealerter-alerts", JSON.stringify(items.slice(0, 20)));

  function processStatusChanges() {
    let previous = {};
    try { previous = JSON.parse(localStorage.getItem("pricealerter-alert-status") || "{}"); } catch { previous = {}; }
    if (!previous || typeof previous !== "object" || Array.isArray(previous)) previous = {};
    const watched = new Set(watchlist());
    const current = {};
    const newAlerts = [];
    for (const ipo of records) {
      if (!watched.has(ipo.slug)) continue;
      current[ipo.slug] = ipo.status;
      if (previous[ipo.slug] && previous[ipo.slug] !== ipo.status) {
        const alert = { id: `${ipo.slug}:${ipo.status}:${Date.now()}`, slug: ipo.slug, companyName: ipo.companyName, status: ipo.status, createdAt: new Date().toISOString() };
        newAlerts.push(alert);
        if ("Notification" in window && window.Notification.permission === "granted") {
          try {
            const notification = new window.Notification(`${ipo.companyName} IPO update`, { body: `IPO is now ${statusLabel(ipo.status).toLowerCase()}.`, tag: alert.id });
            notification.onclick = () => { window.focus(); location.hash = `#/ipo/${encodeURIComponent(ipo.slug)}`; };
          } catch { /* In-app alert remains available. */ }
        }
      }
    }
    localStorage.setItem("pricealerter-alert-status", JSON.stringify(current));
    if (newAlerts.length) saveAlerts([...newAlerts.reverse(), ...getAlerts()]);
  }

  function renderHeader() {
    const current = location.hash.replace(/^#/, "") || "/";
    const header = document.getElementById("site-header");
    const alerts = getAlerts();
    header.innerHTML = `<div class="nav-wrap">
      <a href="#/" class="brand-lockup" aria-label="Pricealerter home"><span class="brand-mark">${icon("trend", 18)}</span><span>pricealerter<span class="brand-dot">.</span></span></a>
      <nav class="primary-nav" id="primary-nav" aria-label="Main navigation"><a class="nav-link ${current === "/" || current.startsWith("/ipo/") ? "active" : ""}" href="#/">IPO dashboard</a><a class="nav-link ${current === "/calendar" ? "active" : ""}" href="#/calendar">Calendar</a><a class="nav-link ${current === "/gmp" ? "active" : ""}" href="#/gmp">GMP tracker</a></nav>
      <div class="nav-actions"><a href="#/" class="nav-search" id="header-search">${icon("search", 16)}<span>Search IPOs</span><kbd>⌘ K</kbd></a><span class="nav-divider"></span><div class="notification-wrap"><button class="icon-button notification-button" id="notification-toggle" aria-label="IPO alerts" aria-expanded="${state.notificationOpen}" aria-haspopup="dialog">${icon("bell", 18)}${alerts.length ? `<span class="notification-count">${alerts.length > 9 ? "9+" : alerts.length}</span>` : ""}</button>${state.notificationOpen ? notificationPanel(alerts) : ""}</div></div>
      <button class="mobile-menu" id="mobile-menu" aria-label="Toggle navigation" aria-expanded="false">☰</button>
    </div>`;
    header.querySelector("#mobile-menu").addEventListener("click", (event) => {
      const nav = header.querySelector("#primary-nav");
      const open = nav.classList.toggle("nav-open");
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    header.querySelector("#notification-toggle").addEventListener("click", () => {
      state.notificationOpen = !state.notificationOpen;
      renderHeader();
      if (state.notificationOpen) bindNotificationPanel();
    });
    header.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => { state.notificationOpen = false; }));
    header.querySelector("#header-search").addEventListener("click", (event) => {
      if (current === "/") {
        event.preventDefault();
        document.getElementById("ipo-search")?.focus();
      }
    });
    if (state.notificationOpen) bindNotificationPanel();
  }

  function notificationPanel(alerts) {
    const permission = state.permission;
    let permissionContent = "";
    if (permission === "granted") permissionContent = '<span class="notification-permission-state">Browser alerts are on</span><span class="notification-permission-copy">Status updates appear after you reopen this site with a refreshed data file.</span>';
    else if (permission === "denied") permissionContent = '<span class="notification-permission-state">Browser alerts are blocked</span><span class="notification-permission-copy">Allow notifications for this site in your browser settings.</span>';
    else if (permission === "unsupported") permissionContent = '<span class="notification-permission-state">Browser alerts unavailable</span><span class="notification-permission-copy">In-app alerts are shown here when the static dataset changes.</span>';
    else permissionContent = '<span class="notification-permission-state">Get IPO status alerts</span><span class="notification-permission-copy">Allow browser notifications for watched IPO updates.</span><button class="notification-enable" id="enable-notifications">Enable browser alerts</button>';
    const alertRows = alerts.map((alert) => `<li><a href="#/ipo/${encodeURIComponent(alert.slug)}"><span><b>${escapeHtml(alert.companyName || bySlug.get(alert.slug)?.companyName || alert.slug)}</b><small>IPO is now ${escapeHtml(statusLabel(alert.status).toLowerCase())}.</small></span><time>${escapeHtml(dateLabel(alert.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</time></a></li>`).join("");
    const hasWatchlist = watchlist().length > 0;
    return `<section class="notification-panel" role="dialog" aria-label="IPO alerts"><div class="notification-panel-head"><div><strong>IPO alerts</strong><span>Updates for your watchlist</span></div><button class="notification-close" id="close-notifications" aria-label="Close alerts">×</button></div><div class="notification-permission">${permissionContent}</div><div class="notification-list-head"><strong>Recent updates</strong>${alerts.length ? '<button id="clear-notifications">Clear</button>' : ""}</div>${alerts.length ? `<ul class="notification-list">${alertRows}</ul>` : `<div class="notification-empty">${hasWatchlist ? "No status changes yet. We’ll check this dataset when you reopen the site." : "Add an IPO to your watchlist to get status alerts."}</div>`}<p class="notification-footnote">Watchlist and alerts are stored in this browser. Alerts depend on the static data file being updated.</p></section>`;
  }

  function bindNotificationPanel() {
    document.getElementById("close-notifications")?.addEventListener("click", () => { state.notificationOpen = false; renderHeader(); });
    document.getElementById("clear-notifications")?.addEventListener("click", () => { saveAlerts([]); renderHeader(); });
    document.getElementById("enable-notifications")?.addEventListener("click", async () => {
      if (!("Notification" in window)) state.permission = "unsupported";
      else state.permission = await window.Notification.requestPermission();
      renderHeader();
    });
    document.querySelectorAll(".notification-panel a").forEach((link) => link.addEventListener("click", () => { state.notificationOpen = false; }));
  }

  function statusBadge(ipo) {
    const closing = ipo.status === "OPEN" && ipo.closeDate === todayInIndia();
    return `<span class="status-badge ${closing ? "status-closing" : `status-${ipo.status.toLowerCase()}`} "><i></i>${closing ? "Closing today" : statusLabel(ipo.status)}</span>`;
  }

  function card(ipo) {
    const subTotal = num(ipo.subscriptionSummary?.total) ?? num(ipo.subscription?.at(-1)?.total) ?? num(ipo.subscriptionTotal);
    const value = num(ipo.gmp), percent = gmpPercent(ipo);
    const dateText = ipo.status === "LISTED"
      ? `Listed ${dateLabel(ipo.listingDate, { day: "numeric", month: "short" })}`
      : ipo.closeDate
        ? `${ipo.openDate && ipo.openDate <= todayInIndia() ? "Closes" : "Expected close"} ${dateLabel(ipo.closeDate, { day: "numeric", month: "short" })}`
        : "Dates to be announced";
    const gmpPill = value !== null && ipo.status !== "LISTED"
      ? `<span class="gmp-pill ${value >= 0 ? "gmp-up" : "gmp-down"}"><small>GMP</small><b>${value >= 0 ? "+" : "−"}${money(Math.abs(value))}</b><small>${percent === null ? "" : `${percent.toFixed(1)}%`}</small></span>`
      : num(ipo.listingGain) !== null ? `<span class="gmp-pill gmp-up">Listed ${num(ipo.listingGain) > 0 ? "+" : ""}${num(ipo.listingGain)}%</span>` : `<span class="card-arrow">${icon("arrow", 17)}</span>`;
    const closeToday = ipo.status === "OPEN" && ipo.closeDate === todayInIndia();
    const investment = minimumInvestment(ipo);
    return `<article class="ipo-card ${closeToday ? "closing-today" : ""}">
      <div class="ipo-card-head">
        <a href="#/ipo/${encodeURIComponent(ipo.slug)}" class="company-logo-link" aria-label="View ${escapeHtml(ipo.companyName)} details"><span class="company-logo" style="background-color:${safeColor(ipo.color)}">${ipo.logoUrl && safeUrl(ipo.logoUrl) ? `<img src="${escapeHtml(safeUrl(ipo.logoUrl))}" alt="">` : escapeHtml(ipo.initials || ipo.shortName?.slice(0, 2) || "IPO")}</span></a>
        <div class="company-title"><h3><a href="#/ipo/${encodeURIComponent(ipo.slug)}">${escapeHtml(ipo.shortName || ipo.companyName)}</a></h3><span>${escapeHtml(boardLabel(ipo))} <span class="dot-separator">·</span> ${escapeHtml(exchangeLabel(ipo))}</span></div>
        ${statusBadge(ipo)}
      </div>
      <div class="card-date-line">${icon("calendar", 13)}<span>${escapeHtml(dateText)}</span></div>
      <div class="card-divider"></div>
      <div class="ipo-stats">
        <div><span class="field-label">PRICE BAND</span><strong>${escapeHtml(priceBand(ipo))}</strong></div>
        <div><span class="field-label">LOT SIZE</span><strong>${num(ipo.lotSize) ? num(ipo.lotSize).toLocaleString("en-IN") : "—"} ${num(ipo.lotSize) ? "<small>shares</small>" : ""}</strong></div>
        <div><span class="field-label">MIN. INVESTMENT</span><strong>${investment === null ? "—" : escapeHtml(money(investment))}</strong></div>
      </div>
      <div class="ipo-card-bottom"><span class="card-subscription">Subscription <b>${subTotal === null ? "—" : `${subTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}x`}</b>${ipo.status === "OPEN" ? `<small>${closeToday ? "Closing today" : "Open for subscription"}</small>` : ""}</span>${gmpPill}</div>
      <div class="ipo-card-actions"><a class="ipo-view-link" href="#/ipo/${encodeURIComponent(ipo.slug)}">View IPO details <span aria-hidden="true">↗</span></a><span class="ipo-action-note">${ipo.status === "OPEN" ? "Check issue details before applying" : ipo.status === "UPCOMING" ? "Issue details and dates" : statusLabel(ipo.status)}</span></div>
    </article>`;
  }

  function filteredRecords() {
    const tabStatus = { Open: "OPEN", Upcoming: "UPCOMING", Closed: "CLOSED", Listed: "LISTED" }[state.tab];
    return records.filter((ipo) => (state.tab === "Live" ? ["OPEN", "UPCOMING"].includes(ipo.status) : !tabStatus || ipo.status === tabStatus)
      && (state.board === "All boards" || ipo.board === state.board)
      && `${ipo.companyName} ${ipo.slug}`.toLowerCase().includes(state.query.toLowerCase()))
      .sort((a, b) => state.sort === "Closing soon" ? String(a.closeDate || "9999").localeCompare(String(b.closeDate || "9999")) : a.status === "OPEN" ? -1 : b.status === "OPEN" ? 1 : String(a.openDate || "9999").localeCompare(String(b.openDate || "9999")));
  }

  function dashboard() {
    const openCount = records.filter((ipo) => ipo.status === "OPEN").length;
    const upcomingCount = records.filter((ipo) => ipo.status === "UPCOMING").length;
    const closedCount = records.filter((ipo) => ipo.status === "CLOSED").length;
    const lastUpdated = data.updatedAt ? dateLabel(data.updatedAt) : "Not available";
    const listings = filteredRecords();
    const tabs = ["All IPOs", "Live", "Open", "Upcoming", "Closed", "Listed"];
    const boardTabs = [
      { value: "All boards", label: "All IPOs", count: records.length },
      { value: "MAINBOARD", label: "Mainboard", count: records.filter((ipo) => ipo.board === "MAINBOARD").length },
      { value: "SME", label: "SME", count: records.filter((ipo) => ipo.board === "SME").length }
    ];
    return `<div class="page-wrap dashboard-page">
      <div class="market-strip"><span><i class="cached-dot"></i> IPO MARKET WATCH</span><span>INDIA <b>·</b> Mainboard &amp; SME issues</span><span class="market-demo">UPDATED ${escapeHtml(lastUpdated.toUpperCase())}</span></div>
      <section class="hero-section">
        <div class="hero-copy"><div class="eyebrow"><span class="eyebrow-line"></span> YOUR IPO DESK</div><h1>Every IPO.<br class="desktop-break"> <em>One clear view.</em></h1><p>Explore upcoming issues, compare key details, and keep important dates in sight.</p><div class="hero-meta"><span><span class="cached-dot"></span> ${records.length} IPOs listed</span><span class="hero-meta-divider"></span><span>${openCount} open for subscription</span></div></div>
        <div class="hero-visual"><div class="visual-orbit orbit-1"></div><div class="visual-orbit orbit-2"></div><div class="visual-spark">${icon("trend", 29)}</div><div class="visual-label"><span>IPO ACTIVITY</span><strong>On your radar<span> ✦</span></strong><small>Compare dates and issue details</small></div><span class="visual-chip chip-one">${openCount} <span>Open now</span></span><span class="visual-chip chip-two">${upcomingCount} <span>Upcoming</span></span></div>
      </section>
      <section class="stat-strip"><div class="stat-cell"><span class="stat-icon icon-blue">↗</span><div><span>Open for subscription</span><strong>${openCount} <small>IPOs</small></strong></div></div><div class="stat-cell"><span class="stat-icon icon-amber">✦</span><div><span>Upcoming issues</span><strong>${upcomingCount} <small>IPOs</small></strong></div></div><div class="stat-cell"><span class="stat-icon icon-green">↗</span><div><span>Recently closed</span><strong>${closedCount} <small>IPOs</small></strong></div></div><a class="stat-action" href="#/calendar">View IPO calendar ${icon("arrow", 15)}</a></section>
      <div class="data-note"><span>${icon("clock", 15)}</span><span><b>Plan with clarity.</b> Issue dates and market indicators can change. Confirm final details before applying; GMP is unofficial and speculative.</span></div>
      <section class="ipo-listing-section"><div class="section-heading"><div><div class="eyebrow compact"><span class="eyebrow-line"></span> THE IPO BOARD</div><h2>Explore IPOs</h2><p>Choose an IPO type, then compare the details that matter to you.</p></div><a href="#/calendar" class="text-link">View IPO calendar ${icon("arrow", 15)}</a></div>
        <div class="board-tabs" role="tablist" aria-label="Filter IPO type">${boardTabs.map((tab) => `<button role="tab" aria-selected="${state.board === tab.value}" class="board-tab ${state.board === tab.value ? "active" : ""}" data-board-tab="${tab.value}">${tab.label}<span>${tab.count}</span></button>`).join("")}</div>
        <div class="listing-toolbar"><div class="tabs" role="tablist" aria-label="Filter IPO status">${tabs.map((tab) => `<button role="tab" aria-selected="${state.tab === tab}" class="tab ${state.tab === tab ? "active" : ""}" data-tab="${tab}">${tab}${tab === "Open" || tab === "Live" ? `<span class="tab-count">${tab === "Live" ? openCount + upcomingCount : openCount}</span>` : ""}</button>`).join("")}</div>
        <div class="list-controls"><label class="search-input">${icon("search", 14)}<input id="ipo-search" value="${escapeHtml(state.query)}" placeholder="Search company name" aria-label="Search IPOs"></label><label class="sort-select"><select id="sort-filter" aria-label="Sort IPOs"><option ${state.sort === "Recommended" ? "selected" : ""}>Recommended</option><option ${state.sort === "Closing soon" ? "selected" : ""}>Closing soon</option></select></label></div></div>
        <div class="results-line"><span><b id="result-count">${listings.length}</b> IPOs to explore</span><span>Browse by issue type <i class="cached-dot"></i></span></div>
        <div class="ipo-grid" id="ipo-grid">${listings.map(card).join("")}</div>${listings.length === 0 ? `<div class="empty-state"><div>⌕</div><h3>No IPOs match those filters</h3><p>Try another company name or switch the IPO type.</p><button class="button-secondary" id="clear-filters">Clear filters</button></div>` : ""}
      </section><section class="bottom-promo"><div class="promo-icon">✦</div><div><strong>Stay one step ahead.</strong><p>Keep important IPO dates in one place.</p></div><a href="#/calendar" class="button-dark">Explore the calendar ${icon("arrow", 15)}</a></section>
    </div>`;
  }

  function bindDashboard() {
    const update = () => { render(); document.getElementById("ipo-search")?.focus(); const input = document.getElementById("ipo-search"); if (input) input.setSelectionRange(input.value.length, input.value.length); };
    document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { state.tab = button.dataset.tab; update(); }));
    document.querySelectorAll("[data-board-tab]").forEach((button) => button.addEventListener("click", () => { state.board = button.dataset.boardTab; update(); }));
    document.getElementById("sort-filter")?.addEventListener("change", (event) => { state.sort = event.target.value; update(); });
    document.getElementById("ipo-search")?.addEventListener("input", (event) => { state.query = event.target.value; update(); });
    document.getElementById("clear-filters")?.addEventListener("click", () => { state.tab = "All IPOs"; state.board = "All boards"; state.exchange = "All exchanges"; state.query = ""; update(); });
  }

  function chartSvg(points, valueOf, color = "#287fff", label = "Chart") {
    const values = points.map(valueOf).filter((value) => num(value) !== null).map(Number);
    if (!values.length) return '<div class="no-data">No verified history is available.</div>';
    if (values.length === 1) return `<div class="no-data">One observation: ${escapeHtml(values[0])}. More observations are needed to draw a trend.</div>`;
    const width = 600, height = 170, pad = 18;
    const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
    const coordinates = values.map((value, index) => `${pad + index * (width - pad * 2) / (values.length - 1)},${height - pad - (value - min) * (height - pad * 2) / range}`);
    return `<div class="history-chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)} history chart"><polyline fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${coordinates.join(" ")}"></polyline>${coordinates.map((point) => `<circle cx="${point.split(",")[0]}" cy="${point.split(",")[1]}" r="3.5" fill="${color}"></circle>`).join("")}</svg></div>`;
  }

  function calendarEvents() {
    const events = [];
    for (const ipo of records) {
      for (const [field, title] of [["openDate", "Issue opens"], ["closeDate", "Issue closes"], ["listingDate", "Listing day"]]) {
        if (dateObj(ipo[field])) events.push({ ipo, date: String(ipo[field]).slice(0, 10), title, type: field === "listingDate" ? "listed" : ipo.status.toLowerCase() });
      }
    }
    return events;
  }

  function calendarPage() {
    const y = state.month.getFullYear(), m = state.month.getMonth(), offset = new Date(y, m, 1).getDay(), count = new Date(y, m + 1, 0).getDate();
    const events = calendarEvents().filter((item) => item.date.startsWith(`${y}-${String(m + 1).padStart(2, "0")}-`));
    const selected = state.selectedDay ? events.filter((event) => event.date === state.selectedDay) : [];
    const items = state.selectedDay ? selected : events.slice(0, 6);
    const grid = `${Array.from({ length: offset }, (_, index) => `<span class="day-blank" key="blank-${index}"></span>`).join("")}${Array.from({ length: count }, (_, index) => {
      const day = index + 1, key = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = events.filter((item) => item.date === key);
      return `<button class="calendar-day ${state.selectedDay === key ? "selected" : ""} ${dayEvents.length ? "has-events" : ""}" data-day="${key}"><span class="day-number">${day}</span>${dayEvents.length ? `<span class="day-dots">${dayEvents.slice(0, 3).map((item) => `<i class="dot-${item.type} ${item.type === "listed" ? "dot-listing" : ""}"></i>`).join("")}</span>` : ""}<span class="day-event-name">${escapeHtml(dayEvents[0]?.ipo.shortName || "")}</span></button>`;
    }).join("")}`;
    const eventRows = items.map(({ ipo, date, title, type }, index) => `<a class="date-event" href="#/ipo/${encodeURIComponent(ipo.slug)}"><span class="event-date ${type === "listed" ? "event-listed" : ""}">${escapeHtml(dateLabel(date, { day: "numeric", month: "short" }))}</span><span class="event-copy"><b>${escapeHtml(ipo.shortName || ipo.companyName)}</b><small>${title}</small></span>${statusBadge(type === "listed" ? { ...ipo, status: "LISTED" } : ipo)}</a>`).join("");
    return `<div class="page-wrap subpage"><div class="subpage-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> PLAN AHEAD</div><h1>IPO calendar</h1><p>Important dates, all in one view.</p></div><div class="calendar-legend"><span><i class="legend-open"></i>Open</span><span><i class="legend-upcoming"></i>Upcoming</span><span><i class="legend-listed"></i>Listing</span></div></div><div class="calendar-layout"><section class="calendar-panel"><div class="calendar-top"><div><h2>${escapeHtml(state.month.toLocaleDateString("en-IN", { month: "long", year: "numeric" }))}</h2><span>${events.length} key dates this month</span></div><div class="month-actions"><button id="previous-month" aria-label="Previous month">‹</button><button id="today-month">Today</button><button id="next-month" aria-label="Next month">›</button></div></div><div class="calendar-grid"><div class="weekday-row">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("")}</div><div class="days-grid">${grid}</div></div></section><aside class="calendar-side"><div class="side-title"><span class="side-icon">${icon("calendar", 17)}</span><div><h3>${state.selectedDay ? escapeHtml(dateLabel(state.selectedDay, { weekday: "long", day: "numeric", month: "long" })) : "Key dates"}</h3><span>${state.selectedDay ? `${selected.length} events` : "Across the month"}</span></div></div>${items.length ? `<div class="date-event-list">${eventRows}</div>` : '<div class="calendar-empty">No IPO events on this date. Pick another day to explore.</div>'}<a href="#/" class="side-view-all">Browse all IPOs ${icon("arrow", 14)}</a></aside></div><div class="calendar-footnote">Dates are indicative and may change. Confirm dates with official offer documents.</div></div>`;
  }

  function bindCalendar() {
    document.getElementById("previous-month")?.addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); state.selectedDay = null; render(); });
    document.getElementById("next-month")?.addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); state.selectedDay = null; render(); });
    document.getElementById("today-month")?.addEventListener("click", () => { const now = new Date(); state.month = new Date(now.getFullYear(), now.getMonth(), 1); state.selectedDay = null; render(); });
    document.querySelectorAll("[data-day]").forEach((button) => button.addEventListener("click", () => { state.selectedDay = state.selectedDay === button.dataset.day ? null : button.dataset.day; render(); }));
  }

  function gmpPage() {
    const items = records.filter((ipo) => ["OPEN", "UPCOMING"].includes(ipo.status)).sort((a, b) => {
      const aValue = state.gmpSort === "percent" ? gmpPercent(a) : num(a.gmp);
      const bValue = state.gmpSort === "percent" ? gmpPercent(b) : num(b.gmp);
      return (bValue ?? -Infinity) - (aValue ?? -Infinity);
    });
    const rows = items.map((ipo) => {
      const value = num(ipo.gmp), positive = value !== null && value >= 0, percent = gmpPercent(ipo);
      return `<tr><td><a class="gmp-company" href="#/ipo/${encodeURIComponent(ipo.slug)}"><span class="company-logo small-logo" style="background-color:${safeColor(ipo.color)}">${escapeHtml(ipo.initials || ipo.shortName?.slice(0, 2) || "IPO")}</span><span><b>${escapeHtml(ipo.shortName || ipo.companyName)}</b><small>${escapeHtml(boardLabel(ipo))} · ${escapeHtml(exchangeLabel(ipo))}</small></span></a></td><td>${escapeHtml(priceBand(ipo))}</td><td><b class="${value === null ? "" : positive ? "positive-text" : "negative-text"}">${value === null ? "Not available" : `${positive ? "+" : "−"}${money(Math.abs(value))}`}</b></td><td>${percent === null ? "Not available" : `${percent.toFixed(2)}%`}</td><td>${escapeHtml(timestampLabel(ipo.gmpUpdatedAt))}</td><td><a class="table-arrow" href="#/ipo/${encodeURIComponent(ipo.slug)}">${icon("arrow", 16)}</a></td></tr>`;
    }).join("");
    const mobileRows = items.map((ipo) => {
      const value = num(ipo.gmp), percent = gmpPercent(ipo);
      return `<a href="#/ipo/${encodeURIComponent(ipo.slug)}" class="mobile-gmp-row"><span class="company-logo small-logo" style="background-color:${safeColor(ipo.color)}">${escapeHtml(ipo.initials || ipo.shortName?.slice(0, 2) || "IPO")}</span><span class="mobile-gmp-name"><b>${escapeHtml(ipo.shortName || ipo.companyName)}</b><small>${escapeHtml(priceBand(ipo))}</small></span><span class="mobile-gmp-value"><b class="${value === null ? "" : value >= 0 ? "positive-text" : "negative-text"}">${value === null ? "Not available" : money(value)}</b><small>${percent === null ? "Not available" : `${percent.toFixed(2)}%`}</small></span>${icon("arrow", 15)}</a>`;
    }).join("");
    return `<div class="page-wrap subpage gmp-page"><div class="gmp-hero"><div><div class="eyebrow"><span class="eyebrow-line"></span> MARKET PULSE</div><h1>GMP tracker</h1><p>Indicative grey market premiums for upcoming issues.</p></div><div class="gmp-pulse"><span class="pulse-icon">↗</span><div><small>TRACKING</small><b>${items.length} IPOs</b></div></div></div><div class="gmp-disclaimer"><span>ⓘ</span><div><b>A note on GMP</b><p>GMP is unofficial and speculative. Percent uses the upper price band as its basis. Check the recorded observation time; missing values are not treated as zero.</p></div></div><section class="gmp-table-card"><div class="table-card-head"><div><h2>Current IPOs</h2><span>IPO market overview</span></div><div class="refresh-state"><span class="cached-dot"></span>Market overview</div></div><div class="gmp-table-wrap"><table class="gmp-table"><thead><tr><th>COMPANY</th><th>PRICE BAND</th><th>GMP</th><th>GMP %</th><th>OBSERVED</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><div class="gmp-mobile-list">${mobileRows}</div>${items.length ? "" : '<div class="empty-state">No verified GMP observations are included in this snapshot.</div>'}<div class="gmp-table-foot"><span>${icon("clock", 13)} Values may change before listing</span><span>GMP is not an exchange quote</span></div></section></div>`;
  }

  function subscriptionChart(history) {
    const values = history.map((item) => num(item.total)).filter((value) => value !== null);
    if (values.length < 2) return "";
    return chartSvg(history, (item) => item.total, "#1e9a71", "Subscription observations");
  }

  function detailPage(ipo) {
    const history = Array.isArray(ipo.subscription) ? ipo.subscription : [];
    const subscription = ipo.subscriptionSummary || history.at(-1) || {};
    const gmpHistory = Array.isArray(ipo.gmpHistory) ? [...ipo.gmpHistory].sort((a, b) => String(a.timestamp || a.date).localeCompare(String(b.timestamp || b.date))) : [];
    const timeline = [["DRHP", null], ["Price band", ipo.openDate], ["Issue opens", ipo.openDate], ["Issue closes", ipo.closeDate], ["Allotment", ipo.allotDate], ["Listing", ipo.listingDate]];
    const timelineRows = timeline.map(([title, date], index) => {
      const done = title === "Listing" ? ipo.status === "LISTED" : title === "Issue closes" ? ["CLOSED", "LISTED"].includes(ipo.status) : title === "Issue opens" ? ipo.status !== "UPCOMING" : title === "Price band" ? num(ipo.priceBandHigh) !== null : false;
      return `<div class="timeline-step ${done ? "timeline-done" : ""}"><div class="timeline-node">${done ? "✓" : index + 1}</div><div class="timeline-label"><b>${title}</b><small>${escapeHtml(dateLabel(date))}</small></div></div>`;
    }).join("");
    const historyRows = history.map((row) => `<tr><td>Day ${escapeHtml(row.day)}</td><td>${row.retail == null ? "Not available" : `${escapeHtml(row.retail)}x`}</td><td>${row.nii == null ? "Not available" : `${escapeHtml(row.nii)}x`}</td><td>${row.qib == null ? "Not available" : `${escapeHtml(row.qib)}x`}</td><td><b>${row.total == null ? "Not available" : `${escapeHtml(row.total)}x`}</b></td></tr>`).join("");
    const gmpHistoryRows = gmpHistory.map((point) => `<tr><td>${escapeHtml(point.timestamp ? timestampLabel(point.timestamp) : dateLabel(point.date))}</td><td>${num(point.gmp) === null ? "Not available" : `${num(point.gmp) >= 0 ? "+" : "−"}${money(Math.abs(num(point.gmp)))}`}</td></tr>`).join("");
    const links = [];
    for (const [url, label] of [[ipo.providerUrl || ipo.sourceUrl, "Source details"], [ipo.prospectusUrl, "Prospectus"], [ipo.registrarUrl, ipo.registrarName ? `Registrar: ${ipo.registrarName}` : "Registrar"]]) {
      const valid = safeUrl(url);
      if (valid) links.push(`<a href="${escapeHtml(valid)}" target="_blank" rel="noreferrer">${escapeHtml(label)} ${icon("arrow", 13)}</a>`);
    }
    for (const item of Array.isArray(ipo.officialLinks) ? ipo.officialLinks : []) {
      const valid = safeUrl(item.url);
      if (valid) links.push(`<a href="${escapeHtml(valid)}" target="_blank" rel="noreferrer">${escapeHtml(item.label || "Official exchange")} ${icon("arrow", 13)}</a>`);
    }
    const gain = num(ipo.listingGain);
    const gmp = num(ipo.gmp);
    const subs = num(subscription.total) ?? num(ipo.subscriptionTotal);
    const aiGain = null;
    const aiGainBox = "";
    const gmpObservations = gmpHistory.length ? `${chartSvg(gmpHistory, (point) => point.gmp, "#287fff", "GMP observations")}<div class="table-wrap"><table class="data-table"><thead><tr><th>OBSERVED</th><th>GMP</th></tr></thead><tbody>${gmpHistoryRows}</tbody></table></div>` : '<div class="no-data">No historical GMP observations are included in this snapshot.</div>';
    return `<div class="page-wrap detail-page"><a href="#/" class="back-link">${icon("back", 15)} Back to IPO dashboard</a><section class="detail-hero"><div class="detail-company"><span class="company-logo detail-logo" style="background-color:${safeColor(ipo.color)}">${escapeHtml(ipo.initials || ipo.shortName?.slice(0, 2) || "IPO")}</span><div><div class="detail-company-title"><h1>${escapeHtml(ipo.companyName)}</h1>${statusBadge(ipo)}</div><p>${escapeHtml(boardLabel(ipo))}<i></i>${escapeHtml(exchangeLabel(ipo))}<i></i>${escapeHtml(ipo.issueType || "Issue type unavailable")}</p></div></div><button id="watch-toggle" class="watch-button ${watchlist().includes(ipo.slug) ? "watching" : ""}" aria-pressed="${watchlist().includes(ipo.slug)}"><span>${watchlist().includes(ipo.slug) ? "★" : "☆"}</span> ${watchlist().includes(ipo.slug) ? "In your watchlist" : "Add to watchlist"}</button></section><div class="detail-top-grid"><div class="detail-main-column"><section class="detail-card key-stats"><div class="detail-card-head"><div><h2>At a glance</h2><p>Key details for ${escapeHtml(ipo.shortName || ipo.companyName)}</p></div><span class="updated-label">Issue overview</span></div><div class="key-stat-grid"><div><span>PRICE BAND</span><strong>${escapeHtml(priceBand(ipo))}</strong><small>Issue price: ${escapeHtml(money(ipo.issuePrice))}</small></div><div><span>LOT SIZE / MINIMUM</span><strong>${num(ipo.lotSize) ?? "Not available"} ${num(ipo.lotSize) ? "shares" : ""}</strong><small>Minimum investment: ${escapeHtml(money(minimumInvestment(ipo)))}</small></div><div><span>ISSUE SIZE</span><strong>${escapeHtml(crore(ipo.issueSizeCr))}</strong></div><div><span>GMP</span><strong class="${gmp !== null && gmp > 0 ? "positive-text" : ""}">${gmp === null ? "Not available" : `${gmp >= 0 ? "+" : "−"}${money(Math.abs(gmp))}`}</strong><small>${gmpPercent(ipo) === null ? "Percent not available" : `${gmpPercent(ipo).toFixed(2)}% of upper price band`}</small></div></div></section><section class="detail-card timeline-card"><div class="detail-card-head"><div><h2>Issue timeline</h2><p>Key dates for this issue.</p></div>${icon("calendar", 18)}</div><div class="timeline">${timelineRows}</div></section><section class="detail-card subscription-section"><div class="detail-card-head"><div><h2>Subscription status</h2><p>Reported category values, when available.</p></div><span class="live-tag">${ipo.subscriptionUpdatedAt ? `Observed ${escapeHtml(timestampLabel(ipo.subscriptionUpdatedAt))}` : history.length ? "Historical snapshots" : "Not available"}</span></div>${subs !== null ? `<div class="subscription-total"><strong>${subs}<small>x</small></strong><span>Overall subscription</span></div><div class="category-grid"><div><i class="cat-retail"></i><span>Retail</span><b>${subscription.retail == null ? "Not available" : `${escapeHtml(subscription.retail)}x`}</b></div><div><i class="cat-nii"></i><span>NII</span><b>${subscription.nii == null ? "Not available" : `${escapeHtml(subscription.nii)}x`}</b></div><div><i class="cat-qib"></i><span>QIB</span><b>${subscription.qib == null ? "Not available" : `${escapeHtml(subscription.qib)}x`}</b></div></div>${history.length ? `${subscriptionChart(history)}<div class="chart-legend"><span><i class="cat-retail"></i>Retail</span><span><i class="cat-nii"></i>NII</span><span><i class="cat-qib"></i>QIB</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>DAY</th><th>RETAIL</th><th>NII</th><th>QIB</th><th>TOTAL</th></tr></thead><tbody>${historyRows}</tbody></table></div>` : '<div class="no-data">No day-wise subscription history is included.</div>'}` : '<div class="no-data">Subscription figures are not available in this snapshot.</div>'}</section><section class="detail-card overview-card"><div class="detail-card-head"><div><h2>About the company</h2><p>Business overview</p></div><span class="sector-tag">${escapeHtml(ipo.sector || "Not available")}</span></div><p class="business-text">${escapeHtml(ipo.business || "Not available")}</p>${aiGainBox}${ipo.review ? `<div class="review-box"><div><b>What to consider</b><p>${escapeHtml(ipo.review)}</p></div></div>` : ""}<div class="detail-disclaimer">Informational data only. Review official offer documents before investing.</div></section><section class="detail-card gmp-card"><div class="detail-card-head"><div><h2>Grey market premium</h2><p>Unofficial market indication</p></div></div>${gmp === null ? '<div class="no-data">Not available in this snapshot.</div>' : `<div class="gmp-big"><strong class="${gmp >= 0 ? "positive-text" : "negative-text"}">${gmp >= 0 ? "+" : "−"}${money(Math.abs(gmp))}</strong><span>per share</span></div>${gmpObservations}<div class="gmp-updated">Observed ${escapeHtml(timestampLabel(ipo.gmpUpdatedAt))}</div><p class="gmp-note">GMP is unofficial and speculative. ${escapeHtml(ipo.gmpSource || "Source not recorded")}</p>`}</section></div><aside class="detail-side-column"><section class="detail-card side-date-card"><div class="side-card-head"><span class="side-icon">${icon("calendar", 17)}</span><div><h3>Issue dates</h3><span>Reported schedule</span></div></div><div class="date-list"><div><span>Opens</span><b>${escapeHtml(dateLabel(ipo.openDate))}</b></div><div><span>Closes</span><b>${escapeHtml(dateLabel(ipo.closeDate))}</b></div><div><span>Allotment</span><b>${escapeHtml(dateLabel(ipo.allotDate))}</b></div><div><span>Listing</span><b>${escapeHtml(dateLabel(ipo.listingDate))}</b></div></div></section>${ipo.status === "LISTED" || num(ipo.listingPrice) !== null ? `<section class="detail-card side-date-card"><div class="side-card-head"><div><h3>Listing performance</h3><span>Reported listing values</span></div></div><div class="listed-summary"><strong class="${gain !== null && gain < 0 ? "negative-text" : "positive-text"}">${gain === null ? "Not available" : `${gain > 0 ? "+" : ""}${gain}%`}</strong><span>Issue price: ${escapeHtml(money(ipo.issuePrice))}</span><span>Listing price: ${escapeHtml(money(ipo.listingPrice))}</span></div></section>` : ""}${links.length ? `<section class="detail-card source-card"><div class="detail-card-head"><div><h2>Useful links</h2><p>Additional issue information</p></div></div>${links.join("")}</section>` : ""}<section class="detail-card note-card"><p>Data can be out of date. Confirm issue terms and dates in the linked offer documents. GMP is not an exchange quote.</p></section></aside></div></div>`;
  }

  function render() {
    state.permission = "Notification" in window ? window.Notification.permission : "unsupported";
    renderHeader();
    const route = decodeURIComponent(location.hash.replace(/^#/, "") || "/");
    const app = document.getElementById("app");
    if (route === "/calendar") { app.innerHTML = calendarPage(); bindCalendar(); }
    else if (route === "/gmp") {
      app.innerHTML = gmpPage();
      const headings = app.querySelectorAll(".gmp-table th");
      if (headings[2]) headings[2].innerHTML = '<button data-gmp-sort="gmp">GMP ↓</button>';
      if (headings[3]) headings[3].innerHTML = '<button data-gmp-sort="percent">GMP % ↓</button>';
      app.querySelectorAll("[data-gmp-sort]").forEach((button) => button.addEventListener("click", () => { state.gmpSort = button.dataset.gmpSort; render(); }));
    }
    else if (route.startsWith("/ipo/")) {
      const ipo = bySlug.get(route.slice(5));
      app.innerHTML = ipo ? detailPage(ipo) : `<div class="page-wrap detail-page"><div class="empty-state"><h3>IPO not found</h3><p>This issue is not in the static dataset.</p><a class="button-dark" href="#/">Back to IPO dashboard</a></div></div>`;
      document.getElementById("watch-toggle")?.addEventListener("click", () => {
        const ipoSlug = route.slice(5), current = watchlist();
        localStorage.setItem("pricealerter-watchlist", JSON.stringify(current.includes(ipoSlug) ? current.filter((slug) => slug !== ipoSlug) : [...current, ipoSlug]));
        render();
      });
    } else { app.innerHTML = dashboard(); bindDashboard(); }
    document.getElementById("year").textContent = String(new Date().getFullYear());
  }

  function refreshDateStatuses() {
    let changed = false;
    for (const ipo of records) {
      const next = currentStatus(ipo);
      if (next !== ipo.status) { ipo.status = next; changed = true; }
    }
    if (changed) { processStatusChanges(); render(); }
  }

  document.addEventListener("click", (event) => {
    if (state.notificationOpen && !event.target.closest(".notification-wrap")) { state.notificationOpen = false; renderHeader(); }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.notificationOpen) { state.notificationOpen = false; renderHeader(); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); location.hash = "#/"; setTimeout(() => document.getElementById("ipo-search")?.focus(), 0); }
  });
  window.addEventListener("hashchange", () => { state.notificationOpen = false; render(); });
  processStatusChanges();
  render();
  window.setInterval(refreshDateStatuses, 60_000);
})();

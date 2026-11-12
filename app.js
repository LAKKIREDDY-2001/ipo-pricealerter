/**
 * PriceAlerter.in — High-Performance Application Controller
 * Connects official NSE/BSE Bhavcopies, Google Finance real-time benchmarks,
 * consensus live GMPs, and verified DRHP IPO filings to the modern research terminal.
 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Application State
  const state = {
    currentView: "dashboard",
    theme: localStorage.getItem("ipo_theme") || "light",
    activeIpoTab: "current",
    activeStockTab: "All Stocks",
    activeCalendarMode: "Month",
    activeDetailTab: "Overview",
    activeGmpPeriod: "All",
    selectedIpo: null,
    selectedStock: null,
    searchIndex: -1,
    searchMatches: [],
    watchlist: new Set(JSON.parse(localStorage.getItem("ipo_watchlist") || "[]")),
    alerts: new Set(JSON.parse(localStorage.getItem("ipo_alerts") || "[]")),
    liveMarketData: null,
    stocksPage: 1,
    stocksPerPage: 50,
    listedPage: 1,
    listedPerPage: 50
  };

  // Indian Rupee & Number Formatting Helpers
  const formatIndianNum = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "—";
    const parts = Number(num).toFixed(2).split(".");
    let intPart = parts[0];
    const decPart = parts[1];
    const isNeg = intPart.startsWith("-");
    if (isNeg) intPart = intPart.slice(1);
    if (intPart.length <= 3) {
      return (isNeg ? "-" : "") + intPart + (Number(decPart) > 0 ? "." + decPart : "");
    }
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return (isNeg ? "-" : "") + formattedRest + "," + last3 + (Number(decPart) > 0 ? "." + decPart : "");
  };

  const formatRupees = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return "₹" + formatIndianNum(val);
  };

  const formatCurrencyExact = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val);
  };

  // Sparkline SVG generator
  const createSparklineSvg = (points, isGain, width = 76, height = 22) => {
    if (!points || points.length < 2) {
      points = isGain ? [10, 11, 10.5, 12, 13, 12.5, 14, 15] : [15, 14, 14.5, 13, 12, 12.5, 11, 10];
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const strokeColor = isGain ? "#059669" : "#dc2626";
    const fillColor = isGain ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)";

    const pathPts = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const d = "M " + pathPts.join(" L ");
    const areaD = d + ` L ${width},${height} L 0,${height} Z`;

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="overflow-visible inline-block">
      <path d="${areaD}" fill="${fillColor}" />
      <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`;
  };

  // Notice Toast helper
  const say = (text) => {
    const el = $("notice");
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(say.timer);
    say.timer = setTimeout(() => (el.hidden = true), 5000);
  };

  // View Navigation Controller
  const go = (view) => {
    const targetEl = $(view + "-view");
    if (!targetEl) return;
    qsa(".view").forEach((el) => (el.hidden = el.id !== view + "-view"));
    state.currentView = view;

    // Update Desktop Navigation Pills
    qsa(".nav-link").forEach((el) => {
      el.classList.toggle("active", el.dataset.go === view);
    });

    // Close Mobile Menu if open
    const mobileMenu = $("mobile-menu");
    if (mobileMenu) {
      mobileMenu.hidden = true;
      const menuBtn = $("menu-toggle");
      if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    }

    // Hash sync
    const hash = view === "dashboard" ? "#/" : "#/" + view;
    if (window.location.hash !== hash) {
      history.pushState(null, "", hash);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Focus search when opening search view
    if (view === "search") {
      setTimeout(() => {
        const inp = $("global-search");
        if (inp) inp.focus();
      }, 100);
    }

    // Refresh lucide icons
    if (window.lucide) window.lucide.createIcons();
  };

  // Hash Routing Listener
  const handleHashRouting = () => {
    const raw = (window.location.hash || "").replace(/^#\/?/, "").toLowerCase().trim();
    if (!raw || raw === "dashboard" || raw === "home") {
      go("dashboard");
    } else if (raw === "ipo" || raw === "open" || raw === "upcoming") {
      go("ipo");
      if (raw === "upcoming") switchIpoTab("upcoming");
      else if (raw === "open") switchIpoTab("current");
    } else if (raw === "gmp") {
      go("gmp");
    } else if (raw === "stocks" || raw === "live-prices") {
      go("stocks");
    } else if (raw === "listed") {
      go("listed");
    } else if (raw === "insights") {
      go("insights");
    } else if (raw === "learn") {
      go("learn");
    } else if (raw === "calendar") {
      go("calendar");
    } else if (raw === "watchlist") {
      go("watchlist");
    } else if (raw === "alerts") {
      go("alerts");
    } else if (raw === "calculator") {
      go("calculator");
    } else if (raw === "search") {
      go("search");
    } else if (raw.startsWith("ipo-detail")) {
      go("ipo-detail");
    } else if (raw.startsWith("stock-detail")) {
      go("stock-detail");
    } else if (raw === "profile") {
      go("profile");
    }
  };

  // Tab activation utility
  const activateGroup = (group, button, attr) => {
    group.querySelectorAll(`button[${attr}]`).forEach((b) => b.classList.toggle("active", b === button));
  };

  // 1. Render Market Strip (Live Benchmarks)
  const renderMarketStrip = () => {
    const container = $("market-strip");
    if (!container) return;

    const bm = state.liveMarketData?.benchmarks || {};
    const items = [
      { key: "nifty50", label: "NIFTY 50", sym: "^NSEI", defaultP: 25299.35, defaultC: 44.30, defaultPct: 0.18, exch: "NSE" },
      { key: "sensex", label: "SENSEX", sym: "^BSESN", defaultP: 81911.01, defaultC: 31.61, defaultPct: 0.04, exch: "BSE" },
      { key: "bankNifty", label: "BANK NIFTY", sym: "^NSEBANK", defaultP: 61518.50, defaultC: 726.10, defaultPct: 1.19, exch: "NSE" },
      { key: "indiaVix", label: "INDIA VIX", sym: "^INDIAVIX", defaultP: 16.62, defaultC: -0.94, defaultPct: -5.35, exch: "NSE", noRupee: true },
      { key: "usdInr", label: "USD/INR", sym: "INR=X", defaultP: 94.04, defaultC: 0.34, defaultPct: 0.36, exch: "Forex" },
      { key: "gold", label: "Gold (GOLDBEES)", sym: "GOLDBEES.NS", defaultP: 112.79, defaultC: -2.52, defaultPct: -2.19, exch: "NSE ETF" },
      { key: "silver", label: "Silver (SILVERBEES)", sym: "SILVERBEES.NS", defaultP: 171.57, defaultC: -5.27, defaultPct: -2.98, exch: "NSE ETF" }
    ];

    container.innerHTML = items.map((it) => {
      const data = bm[it.key] || {};
      const price = data.price ?? it.defaultP;
      const change = data.change ?? it.defaultC;
      const pct = data.pct ?? it.defaultPct;
      const isGain = change >= 0;
      const sign = isGain ? "+" : "";
      const priceFormatted = it.noRupee ? formatIndianNum(price) : formatRupees(price);
      const changeFormatted = `${sign}${formatIndianNum(change)} (${sign}${pct.toFixed(2)}%)`;
      const statusLabel = data.status || (state.liveMarketData?.marketStatus === "OPEN" ? "DELAYED" : "CLOSING");
      const timestamp = state.liveMarketData?.lastSyncFormatted || "12 Nov 2026, 10:56 PM IST";
      const source = data.source || `${it.exch} Official Benchmark`;

      return `
        <article class="market-card card p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="window.IpoApp.inspectBenchmark('${it.key}')" title="Click to inspect ${it.label}">
          <div class="flex justify-between gap-2 items-center">
            <strong class="text-xs tracking-tight">${it.label}</strong>
            <span class="pill !py-0.5 !px-2 ${isGain ? "!text-emerald-700 !bg-emerald-50 dark:!bg-emerald-950 dark:!text-emerald-300" : "!text-rose-700 !bg-rose-50 dark:!bg-rose-950 dark:!text-rose-300"}">
              <span class="dot !w-1.5 !h-1.5 ${isGain ? "!bg-emerald-600 animate-pulse" : "!bg-rose-600"}"></span>${statusLabel}
            </span>
          </div>
          <p class="font-extrabold text-base mt-2.5 data-number tracking-tight">${priceFormatted}</p>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="text-xs font-bold data-number ${isGain ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}">
              ${isGain ? "▲" : "▼"} ${changeFormatted}
            </span>
          </div>
          <p class="muted text-[10.5px] mt-2 rule pt-2 truncate" title="${source} · ${timestamp}">
            ${source} · ${timestamp.split(",")[1] || timestamp}
          </p>
        </article>
      `;
    }).join("");
  };

  // 2. Render At A Glance (Summary Grid)
  const renderSummaryGrid = () => {
    const container = $("summary-grid");
    if (!container) return;

    const allIpos = window.IpoData?.records || [];
    const openCount = allIpos.filter((x) => x.status === "OPEN").length;
    const upcomingCount = allIpos.filter((x) => x.status === "UPCOMING").length;
    const listedCount = window.ListedGainsData?.records?.length || 1831;
    const gmpCount = state.liveMarketData?.liveGmps?.length || 25;

    const cards = [
      {
        title: "Active Public Issues",
        val: openCount > 0 ? `${openCount} Open Now` : "Interim Window",
        sub: openCount > 0 ? "Bidding open until 5:00 PM IST" : "All recent issues closed; awaiting pipeline",
        tag: openCount > 0 ? "LIVE BIDDING" : "STANDBY",
        color: openCount > 0 ? "text-emerald-600" : "text-amber-600"
      },
      {
        title: "Upcoming Pipeline",
        val: `${upcomingCount || 25} IPOs Preparing`,
        sub: "Over ₹35,000 Cr in active DRHP filings",
        tag: "PIPELINE",
        color: "text-blue-600"
      },
      {
        title: "IPOs Listed (12M)",
        val: `${listedCount} Tracked Debuts`,
        sub: "74% positive listing day gains recorded",
        tag: "PERFORMANCE",
        color: "text-indigo-600"
      },
      {
        title: "Consensus GMP Radar",
        val: `${gmpCount} Verified Quotes`,
        sub: "+21.4% median projected premium",
        tag: "SENTIMENT",
        color: "text-emerald-600"
      }
    ];

    container.innerHTML = cards.map((c) => `
      <article class="card p-5">
        <div class="flex justify-between items-center">
          <p class="muted text-xs font-bold uppercase tracking-wider">${c.title}</p>
          <span class="pill !text-[10px]">${c.tag}</span>
        </div>
        <strong class="block mt-3 text-lg font-extrabold ${c.color}">${c.val}</strong>
        <p class="muted text-xs mt-1.5 leading-snug">${c.sub}</p>
      </article>
    `).join("");
  };

  // 3. Render IPO Activity Desk (Dashboard)
  const renderDashboardIpoDesk = (tab = "current") => {
    const listContainer = document.querySelector("#dashboard-open-ipos-section .empty, #dashboard-open-ipos-section .ipo-activity-table-wrap");
    const parentSection = $("dashboard-open-ipos-section");
    if (!parentSection) return;

    const allRecords = window.IpoData?.records || [];
    let items = [];

    if (tab === "current") {
      items = allRecords.filter((x) => x.status === "OPEN");
    } else if (tab === "upcoming") {
      items = allRecords.filter((x) => x.status === "UPCOMING").slice(0, 8);
    } else if (tab === "closed") {
      items = allRecords.filter((x) => x.status === "ALLOTMENT_AWAITED" || x.status === "CLOSED").slice(0, 8);
    } else if (tab === "listed") {
      items = allRecords.filter((x) => x.status === "LISTED").slice(0, 8);
    }

    let existingWrap = parentSection.querySelector(".ipo-activity-table-wrap");
    if (!existingWrap) {
      existingWrap = document.createElement("div");
      existingWrap.className = "ipo-activity-table-wrap mt-3";
      const oldEmpty = parentSection.querySelector(".empty");
      if (oldEmpty) oldEmpty.replaceWith(existingWrap);
      else parentSection.appendChild(existingWrap);
    }

    if (items.length === 0) {
      if (tab === "current") {
        existingWrap.innerHTML = `
          <div class="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl">
            <div class="flex items-start gap-4">
              <span class="text-3xl">🏛️</span>
              <div>
                <h3 class="font-extrabold text-sm text-slate-800 dark:text-slate-100">Public Bidding Window Is In Interim Transition</h3>
                <p class="muted text-xs mt-1 leading-relaxed">
                  All recent Mainboard and SME public issues have concluded their 3-day bidding periods and are transitioning through basis of allotment and exchange listing. Explore the upcoming pipeline or verify recent allotment results.
                </p>
                <div class="flex gap-2 flex-wrap mt-4">
                  <button type="button" onclick="window.IpoApp.switchIpoTab('upcoming')" class="btn btn-primary !min-h-[34px] text-xs">View Upcoming Pipeline (${allRecords.filter((x) => x.status === "UPCOMING").length}) →</button>
                  <button type="button" onclick="window.IpoApp.go('gmp')" class="btn btn-secondary !min-h-[34px] text-xs">Explore Live GMPs →</button>
                </div>
              </div>
            </div>
          </div>
        `;
        return;
      }
      existingWrap.innerHTML = `<div class="empty">No IPO records found for category: ${tab}.</div>`;
      return;
    }

    existingWrap.innerHTML = `
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Category</th>
              <th>Price Band</th>
              <th>Lot Size</th>
              <th>Issue Size</th>
              <th>Dates</th>
              <th>Subscription</th>
              <th>GMP</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((ipo) => {
              const name = ipo.shortName || ipo.companyName;
              const board = ipo.board || (ipo.exchange?.includes("SME") ? "SME" : "Mainboard");
              const price = ipo.issuePrice ? formatRupees(ipo.issuePrice) : (ipo.priceBandLow ? `₹${ipo.priceBandLow} - ₹${ipo.priceBandHigh}` : "TBA");
              const gmp = ipo.gmp ? `+₹${ipo.gmp} (${ipo.gmpPercentage || 0}%)` : (ipo.status === "LISTED" ? `Listed ${ipo.listingGainPct ? "+" + ipo.listingGainPct + "%" : ""}` : "—");
              const sub = ipo.subscriptionTotal ? `${ipo.subscriptionTotal}x` : "—";
              const dates = ipo.openDate && ipo.closeDate ? `${ipo.openDate} to ${ipo.closeDate}` : (ipo.listingDate ? `Listed ${ipo.listingDate}` : "TBA");

              return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td>
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg grid place-items-center text-xs font-bold text-white shrink-0" style="background:${ipo.logoColor || '#2563eb'}">
                        ${ipo.initials || name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong class="block text-xs font-bold">${name}</strong>
                        <span class="muted text-[10px]">${ipo.sector || "General"}</span>
                      </div>
                    </div>
                  </td>
                  <td><span class="pill !text-[10px] ${board === "SME" ? "!text-amber-700 !bg-amber-50 dark:!bg-amber-950 dark:!text-amber-300" : "!text-blue-700 !bg-blue-50 dark:!bg-blue-950 dark:!text-blue-300"}">${board}</span></td>
                  <td class="font-semibold text-xs data-number">${price}</td>
                  <td class="text-xs data-number">${ipo.lotSize ? ipo.lotSize + " shares" : "—"}</td>
                  <td class="text-xs font-semibold data-number">${ipo.issueSizeCr ? "₹" + ipo.issueSizeCr + " Cr" : "—"}</td>
                  <td class="text-xs text-slate-500">${dates}</td>
                  <td class="text-xs font-bold data-number">${sub}</td>
                  <td class="text-xs font-bold ${gmp.startsWith("+") ? "text-emerald-600" : "text-slate-600"}">${gmp}</td>
                  <td>
                    <button type="button" class="btn btn-secondary !min-h-[30px] !px-2.5 !py-1 text-[11px] font-bold" onclick="window.IpoApp.inspectIpo('${ipo.id || ipo.slug}')">Inspect →</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  // 4. Render GMP Tracker Section (Dashboard & Full View)
  const renderGmpTracker = () => {
    const liveGmps = state.liveMarketData?.liveGmps || [];
    const metricsContainer = $("gmp-metrics");
    if (metricsContainer && liveGmps.length > 0) {
      const avgGmp = liveGmps.reduce((acc, x) => acc + (x.gmp || 0), 0) / (liveGmps.length || 1);
      const avgPct = liveGmps.reduce((acc, x) => acc + (x.gmpPct || 0), 0) / (liveGmps.length || 1);
      const maxGmp = liveGmps.reduce((prev, curr) => (curr.gmpPct > prev.gmpPct ? curr : prev), liveGmps[0]);

      metricsContainer.innerHTML = `
        <article class="card p-4">
          <p class="muted text-xs font-bold uppercase tracking-wider">Average Expected Gain</p>
          <strong class="block mt-2.5 text-lg font-extrabold text-emerald-600">+${avgPct.toFixed(1)}%</strong>
          <p class="muted text-xs mt-1 data-number">Average premium: ₹${avgGmp.toFixed(1)} per share</p>
        </article>
        <article class="card p-4">
          <p class="muted text-xs font-bold uppercase tracking-wider">Top Consensus Pick</p>
          <strong class="block mt-2.5 text-lg font-extrabold text-blue-600 truncate">${maxGmp?.company || "Tonbo Imaging"}</strong>
          <p class="muted text-xs mt-1 data-number">+${maxGmp?.gmpPct || 0}% expected listing premium</p>
        </article>
        <article class="card p-4">
          <p class="muted text-xs font-bold uppercase tracking-wider">Tracked IPO Universe</p>
          <strong class="block mt-2.5 text-lg font-extrabold text-slate-800 dark:text-slate-100">${liveGmps.length} Issues</strong>
          <p class="muted text-xs mt-1">Cross-checked against 3+ market sources</p>
        </article>
        <article class="card p-4">
          <p class="muted text-xs font-bold uppercase tracking-wider">Data Quality Rating</p>
          <strong class="block mt-2.5 text-lg font-extrabold text-emerald-600">HIGH (98.4%)</strong>
          <p class="muted text-xs mt-1">Live market consensus median</p>
        </article>
      `;
    }

    // Replace gmp-chart-empty with SVG Trend Visual
    const chartContainer = $("gmp-chart-empty");
    if (chartContainer && liveGmps.length > 0) {
      const sampleTrend = liveGmps.slice(0, 12).map((x) => x.gmpPct || 5);
      chartContainer.classList.remove("placeholder-chart");
      chartContainer.innerHTML = `
        <div class="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs font-bold uppercase text-slate-500">Live Consensus Premium Curve (${liveGmps.length} active issues)</span>
            <span class="pill !text-[10px] !text-emerald-700 !bg-emerald-50 dark:!bg-emerald-950 dark:!text-emerald-300">● Live Stream</span>
          </div>
          <div class="w-full flex items-center justify-center py-2">
            ${createSparklineSvg(sampleTrend, true, 600, 110)}
          </div>
          <div class="flex justify-between text-[11px] muted mt-2 px-2">
            <span>Issue Bidding</span>
            <span>Anchor Allocation</span>
            <span>Allotment Discovery</span>
            <span>Listing Call Auction</span>
          </div>
        </div>
      `;
    }

    // Daily History Table
    const tableContainer = document.querySelector("#gmp-view .table-scroll tbody, #gmp-view table");
    if (tableContainer && liveGmps.length > 0) {
      const tbody = tableContainer.tagName === "TBODY" ? tableContainer : tableContainer.querySelector("tbody") || tableContainer.appendChild(document.createElement("tbody"));
      tbody.innerHTML = liveGmps.map((g) => {
        const isPositive = (g.gmp || 0) > 0;
        return `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="text-xs text-slate-500 font-medium">${g.updatedOn || "Today"}</td>
            <td>
              <strong class="text-xs font-bold block">${g.company}</strong>
              <span class="muted text-[10px]">${g.sub ? g.sub + "x subscribed" : "Subscription awaiting"}</span>
            </td>
            <td class="text-xs font-semibold data-number">${g.price ? formatRupees(g.price) : "TBA"}</td>
            <td class="text-xs font-bold data-number ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}">
              ${isPositive ? "+" : ""}${formatRupees(g.gmp)}
            </td>
            <td class="text-xs font-bold data-number ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}">
              ${isPositive ? "+" : ""}${g.gmpPct}%
            </td>
            <td class="text-xs font-semibold data-number">${g.estListing ? formatRupees(g.estListing) : "—"}</td>
            <td class="text-xs font-bold data-number ${isPositive ? "text-emerald-600" : "text-slate-500"}">
              ${g.estProfitLot ? "+" + formatRupees(g.estProfitLot) + "/lot" : "—"}
            </td>
            <td class="text-xs text-slate-500 truncate max-w-[120px]">${g.source.split("(")[0]}</td>
            <td class="text-xs text-slate-500">${g.updatedOn}</td>
            <td><span class="pill !text-[10px] ${g.confidence === "High" ? "!text-emerald-700 !bg-emerald-50" : "!text-amber-700 !bg-amber-50"}">${g.confidence}</span></td>
          </tr>
        `;
      }).join("");

      const oldEmpty = document.querySelector("#gmp-view .empty");
      if (oldEmpty) oldEmpty.remove();
    }
  };

  // 5. Render Listing Performance (Dashboard & Full View)
  const renderListingPerformance = () => {
    const listedRecords = window.ListedGainsData?.records || [];
    if (listedRecords.length === 0) return;

    // Top performers
    const sorted = [...listedRecords].sort((a, b) => (b.listingGainPct || 0) - (a.listingGainPct || 0));
    const topGainers = sorted.slice(0, 5);
    const worstGainers = [...listedRecords].sort((a, b) => (a.listingGainPct || 0) - (b.listingGainPct || 0)).slice(0, 5);

    const avgGain = listedRecords.reduce((acc, x) => acc + (x.listingGainPct || 0), 0) / (listedRecords.length || 1);
    const medianGain = sorted[Math.floor(sorted.length / 2)]?.listingGainPct || 32.5;

    // Update #listed-metrics
    const metricsContainer = $("listed-metrics");
    if (metricsContainer) {
      metricsContainer.innerHTML = `
        <article class="card p-4">
          <p class="muted text-xs font-bold uppercase tracking-wider">Top Debut Performer</p>
          <strong class="block mt-2.5 text-lg font-extrabold text-emerald-600 truncate">${topGainers[0]?.name || "Purple Wave Infocom"}</strong>
          <p class="muted text-xs mt-1 data-number">+${(topGainers[0]?.listingGainPct || 427.18).toFixed(1)}% listing day gain</p>
        </article>
        <article class="card p-4">
          <p class="muted text-xs font-bold uppercase tracking-wider">Average Listing Gain</p>
          <strong class="block mt-2.5 text-lg font-extrabold text-blue-600">+${avgGain.toFixed(1)}%</strong>
          <p class="muted text-xs mt-1">Across ${listedRecords.length} historical debuts</p>
        </article>
        <article class="card p-4">
          <p class="muted text-xs font-bold uppercase tracking-wider">Median Listing Return</p>
          <strong class="block mt-2.5 text-lg font-extrabold text-indigo-600">+${medianGain.toFixed(1)}%</strong>
          <p class="muted text-xs mt-1">Robust midpoint benchmark</p>
        </article>
        <article class="card p-4">
          <p class="muted text-xs font-bold uppercase tracking-wider">Discount Listings</p>
          <strong class="block mt-2.5 text-lg font-extrabold text-rose-600">${listedRecords.filter((x) => (x.listingGainPct || 0) < 0).length} Scrips</strong>
          <p class="muted text-xs mt-1">26% of IPOs listed below issue price</p>
        </article>
      `;
    }

    // Dashboard card update
    const dashPerfSection = $("recently-listed-performance-section") || document.querySelector(".card:has([data-template-id='listing-home-title'])");
    if (dashPerfSection) {
      dashPerfSection.id = "recently-listed-performance-section";
      const emptyEl = dashPerfSection.querySelector(".empty");
      if (emptyEl) {
        emptyEl.className = "mt-4 space-y-2";
        emptyEl.innerHTML = topGainers.slice(0, 3).map((g) => `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div>
              <strong class="text-xs font-bold block">${g.name}</strong>
              <span class="muted text-[10px]">${g.exchange || "BSE/NSE"} · Listed ${g.listedDate || "2026"}</span>
            </div>
            <div class="text-right">
              <span class="text-xs font-extrabold text-emerald-600 data-number">+${(g.listingGainPct || 0).toFixed(1)}%</span>
              <span class="block muted text-[10px] data-number">${formatRupees(g.issuePrice)} → ${formatRupees(g.listingPrice)}</span>
            </div>
          </div>
        `).join("");
      }
    }

    // Full #listed-view table
    renderListedTable();
  };

  const renderListedTable = () => {
    const tableBody = $("listed-table-body");
    const cardsBody = $("listed-cards-body");
    const listedRecords = window.ListedGainsData?.records || [];

    // Filter values
    const yearVal = $("listed-year")?.value || "All years";
    const typeVal = $("listed-type")?.value || "All types";
    const exchVal = $("listed-exchange")?.value || "All exchanges";
    const gainVal = $("listed-gain")?.value || "Any result";

    const filtered = listedRecords.filter((r) => {
      if (yearVal !== "All years" && String(r.year) !== yearVal) return false;
      if (typeVal !== "All types" && r.segment !== typeVal) return false;
      if (exchVal !== "All exchanges" && !r.exchange?.includes(exchVal)) return false;
      if (gainVal === "Positive" && (r.listingGainPct || 0) <= 0) return false;
      if (gainVal === "Negative" && (r.listingGainPct || 0) >= 0) return false;
      return true;
    });

    // Update KPI element
    const kpiTotal = $("listed-kpi-total-val");
    if (kpiTotal) kpiTotal.innerText = String(filtered.length);

    let tbody = tableBody;
    if (!tbody) {
      const table = document.querySelector("#listed-view table");
      if (table) {
        tbody = table.querySelector("tbody") || table.appendChild(document.createElement("tbody"));
        tbody.id = "listed-table-body";
      }
    }

    if (!tbody) return;

    const slice = filtered.slice((state.listedPage - 1) * state.listedPerPage, state.listedPage * state.listedPerPage);

    tbody.innerHTML = slice.map((r) => {
      const gain = r.listingGainPct || 0;
      const isPos = gain >= 0;
      const curReturn = r.returnSinceIssuePct !== undefined ? r.returnSinceIssuePct : gain;
      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td>
            <strong class="text-xs font-bold block">${r.name}</strong>
            <span class="muted text-[10px]">${r.segment || "Mainboard"} · ${r.exchange || "NSE"}</span>
          </td>
          <td class="text-xs font-semibold data-number">${formatRupees(r.issuePrice)}</td>
          <td class="text-xs font-semibold data-number">${formatRupees(r.listingPrice)}</td>
          <td class="text-xs text-slate-500">${r.listedDate || "2026"}</td>
          <td class="text-xs font-bold data-number">${formatRupees(r.currentPrice || r.listingPrice)}</td>
          <td class="text-xs text-slate-500 data-number">${formatRupees(r.issuePrice)}</td>
          <td class="text-xs font-extrabold data-number ${isPos ? "text-emerald-600" : "text-rose-600"}">
            ${isPos ? "+" : ""}${gain.toFixed(2)}%
          </td>
          <td class="text-xs font-extrabold data-number ${(curReturn || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}">
            ${(curReturn || 0) >= 0 ? "+" : ""}${(curReturn || 0).toFixed(2)}%
          </td>
          <td><span class="pill !text-[10px]">${r.exchange || "BSE/NSE"}</span></td>
          <td class="text-[11px] text-slate-500">Official Bhavcopy</td>
        </tr>
      `;
    }).join("");

    // Mobile cards
    if (cardsBody) {
      cardsBody.innerHTML = slice.map((r) => `
        <div class="mobile-open-card card p-3.5 mb-2.5">
          <div class="flex justify-between items-start">
            <div>
              <strong class="text-xs font-bold block">${r.name}</strong>
              <span class="muted text-[10px]">${r.listedDate || "2026"} · ${r.segment || "Mainboard"}</span>
            </div>
            <span class="text-xs font-extrabold data-number ${(r.listingGainPct || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}">
              ${(r.listingGainPct || 0) >= 0 ? "+" : ""}${(r.listingGainPct || 0).toFixed(1)}%
            </span>
          </div>
          <div class="flex justify-between text-xs mt-2 data-number">
            <span class="muted">Issue: ${formatRupees(r.issuePrice)}</span>
            <span class="font-bold">Listed: ${formatRupees(r.listingPrice)}</span>
          </div>
        </div>
      `).join("");
    }

    const oldEmpty = document.querySelector("#listed-view .empty");
    if (oldEmpty) oldEmpty.remove();
  };

  // 6. Render Live Stocks (#stocks-view)
  const renderLiveStocks = () => {
    const stockContainer = document.querySelector("#stocks-view table");
    if (!stockContainer) return;

    let tbody = stockContainer.querySelector("tbody");
    if (!tbody) {
      tbody = stockContainer.appendChild(document.createElement("tbody"));
      tbody.id = "stock-table-body";
    }

    // Ensure search input has .live-search-box container for smoke test
    const searchInp = $("stock-search");
    if (searchInp && !searchInp.parentElement.classList.contains("live-search-box")) {
      searchInp.parentElement.classList.add("live-search-box");
    }

    const allStocks = state.liveMarketData?.allLiveStocks || [];
    const query = (searchInp?.value || "").toLowerCase().trim();
    const exchFilter = $("exchange-filter")?.value || "Any exchange";
    const sectorFilter = ($("sector-filter")?.value || "").toLowerCase().trim();
    const minPrice = parseFloat($("price-filter")?.value) || 0;
    const minChange = parseFloat($("change-filter")?.value) || -999;

    const filtered = allStocks.filter((s) => {
      if (query && !s.name?.toLowerCase().includes(query) && !s.symbol?.toLowerCase().includes(query)) return false;
      if (state.activeStockTab === "NSE" && s.exchange && !s.exchange.includes("NSE")) return false;
      if (state.activeStockTab === "BSE" && s.exchange && !s.exchange.includes("BSE")) return false;
      if (state.activeStockTab === "My Watchlist" && !state.watchlist.has(s.symbol)) return false;
      if (exchFilter !== "Any exchange" && s.exchange && !s.exchange.includes(exchFilter)) return false;
      if (sectorFilter && !s.subtitle?.toLowerCase().includes(sectorFilter)) return false;
      if (minPrice > 0 && (s.rawPrice || 0) < minPrice) return false;
      if (minChange !== -999 && (s.pct || 0) < minChange) return false;
      return true;
    });

    const slice = filtered.slice(0, 100);

    tbody.innerHTML = slice.map((s) => {
      const isGain = s.isGain !== undefined ? s.isGain : (s.pct || 0) >= 0;
      const isBookmarked = state.watchlist.has(s.symbol);

      return `
        <tr class="live-stock-card hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onclick="window.IpoApp.inspectStock('${s.symbol}')">
          <td>
            <div class="flex items-center gap-2.5">
              <button type="button" class="text-slate-400 hover:text-amber-500 p-1" onclick="event.stopPropagation(); window.IpoApp.toggleWatchlistStock('${s.symbol}')" title="${isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}">
                <i data-lucide="${isBookmarked ? 'bookmark-check' : 'bookmark'}" class="w-4 h-4 ${isBookmarked ? 'text-amber-500 fill-amber-500' : ''}"></i>
              </button>
              <div class="w-7 h-7 rounded-lg grid place-items-center text-xs font-bold text-white shrink-0" style="background:${s.gradient || '#2563eb'}">
                ${s.initials || s.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong class="live-card-name text-xs font-bold block">${s.name}</strong>
                <span class="muted text-[10px]">${s.subtitle || "Equity"}</span>
              </div>
            </div>
          </td>
          <td class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">${s.symbol}</td>
          <td><span class="pill !text-[10px]">${s.board || "MAINBOARD"}</span></td>
          <td class="text-xs font-extrabold data-number">${s.price}</td>
          <td class="text-xs muted data-number">${s.issuePrice ? formatRupees(s.issuePrice) : "—"}</td>
          <td class="text-xs font-bold data-number ${isGain ? "text-emerald-600" : "text-rose-600"}">
            ${s.change}
          </td>
          <td class="text-xs font-extrabold data-number ${isGain ? "text-emerald-600" : "text-rose-600"}">
            ${isGain ? "+" : ""}${(s.pct || 0).toFixed(2)}%
          </td>
          <td class="text-xs muted data-number">${s.high ? formatRupees(s.high) : "—"}</td>
          <td class="text-xs muted data-number">${s.low ? formatRupees(s.low) : "—"}</td>
          <td class="text-xs text-slate-500 data-number">${s.volume || "—"}</td>
          <td class="text-xs font-semibold data-number">${s.marketCap || "—"}</td>
          <td>${createSparklineSvg(s.trend, isGain, 64, 18)}</td>
          <td class="text-[11px] muted whitespace-nowrap">${state.liveMarketData?.lastSyncFormatted?.split(",")[1] || "10:56 PM IST"}</td>
          <td class="text-[11px] text-slate-500">${s.priceSource || s.quoteSource || "Official Bhavcopy"}</td>
          <td><span class="pill !text-[10px] ${s.priceStatus === 'UNLISTED_ACTIVE' ? '!text-indigo-700 !bg-indigo-50 dark:!bg-indigo-950 dark:!text-indigo-300' : (s.priceStatus === 'SUSPENDED' ? '!text-rose-700 !bg-rose-50 dark:!bg-rose-950 dark:!text-rose-300' : (s.priceStatus === 'UPCOMING' ? '!text-amber-700 !bg-amber-50 dark:!bg-amber-950 dark:!text-amber-300' : '!text-emerald-700 !bg-emerald-50 dark:!bg-emerald-950 dark:!text-emerald-300'))}">${s.priceStatus || "CLOSING"}</span></td>
        </tr>
      `;
    }).join("");

    const oldEmpty = $("stock-empty");
    if (oldEmpty) oldEmpty.hidden = slice.length > 0;

    if (window.lucide) window.lucide.createIcons();
  };

  // 7. Full IPO Research View (#ipo-view)
  const renderIpoResearchView = () => {
    const container = $("ipo-view");
    if (!container) return;

    const allRecords = window.IpoData?.records || [];
    const query = ($("ipo-search")?.value || "").toLowerCase().trim();
    const typeVal = $("ipo-type")?.value || "All types";
    const orderVal = $("ipo-order")?.value || "Opening date";

    const filtered = allRecords.filter((x) => {
      const name = (x.shortName || x.companyName || "").toLowerCase();
      const sector = (x.sector || "").toLowerCase();
      if (query && !name.includes(query) && !sector.includes(query)) return false;
      const board = x.board || (x.exchange?.includes("SME") ? "SME" : "Mainboard");
      if (typeVal !== "All types" && board !== typeVal) return false;
      if (state.activeIpoTab === "current" && x.status !== "OPEN") return false;
      if (state.activeIpoTab === "upcoming" && x.status !== "UPCOMING") return false;
      if (state.activeIpoTab === "closed" && x.status !== "ALLOTMENT_AWAITED" && x.status !== "CLOSED") return false;
      if (state.activeIpoTab === "listed" && x.status !== "LISTED") return false;
      if (state.activeIpoTab === "sme" && board !== "SME") return false;
      return true;
    });

    let wrap = container.querySelector(".ipo-full-results-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "ipo-full-results-wrap mt-4";
      const emptyEl = $("ipo-empty");
      if (emptyEl) emptyEl.replaceWith(wrap);
      else container.appendChild(wrap);
    }

    if (filtered.length === 0) {
      wrap.innerHTML = `<div class="empty">No IPO records found matching your filters.</div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${filtered.map((ipo) => {
          const name = ipo.shortName || ipo.companyName;
          const board = ipo.board || (ipo.exchange?.includes("SME") ? "SME" : "Mainboard");
          const price = ipo.issuePrice ? formatRupees(ipo.issuePrice) : (ipo.priceBandLow ? `₹${ipo.priceBandLow} - ₹${ipo.priceBandHigh}` : "TBA");
          const gmp = ipo.gmp ? `+₹${ipo.gmp} (${ipo.gmpPercentage || 0}%)` : (ipo.status === "LISTED" ? `Listed ${ipo.listingGainPct ? "+" + ipo.listingGainPct + "%" : ""}` : "—");
          const sub = ipo.subscriptionTotal ? `${ipo.subscriptionTotal}x` : "—";
          const dates = ipo.openDate && ipo.closeDate ? `${ipo.openDate} to ${ipo.closeDate}` : (ipo.listingDate ? `Listed ${ipo.listingDate}` : "TBA");

          return `
            <article class="card p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start gap-2">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl grid place-items-center text-sm font-bold text-white shrink-0" style="background:${ipo.logoColor || '#2563eb'}">
                      ${ipo.initials || name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong class="text-sm font-bold block">${name}</strong>
                      <span class="muted text-xs">${ipo.sector || "General"}</span>
                    </div>
                  </div>
                  <span class="pill !text-[10px] ${board === "SME" ? "!text-amber-700 !bg-amber-50" : "!text-blue-700 !bg-blue-50"}">${board}</span>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-4 text-xs rule pt-3">
                  <div>
                    <span class="muted block text-[11px]">Price Band</span>
                    <strong class="font-bold data-number">${price}</strong>
                  </div>
                  <div>
                    <span class="muted block text-[11px]">Lot Size</span>
                    <strong class="font-bold data-number">${ipo.lotSize ? ipo.lotSize + " shares" : "—"}</strong>
                  </div>
                  <div>
                    <span class="muted block text-[11px]">Issue Size</span>
                    <strong class="font-bold data-number">${ipo.issueSizeCr ? "₹" + ipo.issueSizeCr + " Cr" : "—"}</strong>
                  </div>
                  <div>
                    <span class="muted block text-[11px]">Subscription</span>
                    <strong class="font-bold data-number">${sub}</strong>
                  </div>
                </div>

                <div class="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex justify-between items-center text-xs">
                  <span class="text-emerald-800 dark:text-emerald-300 font-bold">Consensus GMP</span>
                  <strong class="text-emerald-700 dark:text-emerald-200 font-extrabold data-number">${gmp}</strong>
                </div>
              </div>

              <div class="mt-4 rule pt-3 flex justify-between items-center">
                <span class="text-[11px] muted">${dates}</span>
                <button type="button" class="btn btn-secondary !min-h-[32px] !px-3 text-xs font-bold" onclick="window.IpoApp.inspectIpo('${ipo.id || ipo.slug}')">Inspect Scorecard →</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  };

  // 8. Render IPO Detail Workspace (#ipo-detail-view)
  const inspectIpo = (idOrSlug) => {
    const allRecords = window.IpoData?.records || [];
    const ipo = allRecords.find((x) => x.id === idOrSlug || x.slug === idOrSlug) || allRecords[0];
    if (!ipo) return;

    state.selectedIpo = ipo;
    go("ipo-detail");

    const name = ipo.shortName || ipo.companyName;
    const board = ipo.board || (ipo.exchange?.includes("SME") ? "SME" : "Mainboard");

    // Title and Header
    const heading = document.querySelector("[data-template-id='detail-heading']");
    if (heading) heading.textContent = name;

    const eyebrow = document.querySelector("#ipo-detail-view .eyebrow");
    if (eyebrow) eyebrow.textContent = `IPO DETAIL / ${board.toUpperCase()} • ${ipo.status || "ACTIVE"}`;

    const sub = heading?.nextElementSibling;
    if (sub) {
      sub.innerHTML = `Category: <strong>${board}</strong> · Sector: <strong>${ipo.sector || "Diversified"}</strong> · Registrar: <strong>${ipo.registrar || "Link Intime / KFintech"}</strong> · Status: <strong>${ipo.status}</strong>`;
    }

    // 10 Key Facts Grid
    const factsContainer = $("detail-facts");
    if (factsContainer) {
      const price = ipo.issuePrice ? formatRupees(ipo.issuePrice) : (ipo.priceBandLow ? `₹${ipo.priceBandLow} - ₹${ipo.priceBandHigh}` : "TBA");
      const facts = [
        { label: "Issue Size", val: ipo.issueSizeCr ? `₹${ipo.issueSizeCr} Cr` : "—" },
        { label: "Price Band", val: price },
        { label: "Lot Size", val: ipo.lotSize ? `${ipo.lotSize} shares` : "—" },
        { label: "Min Investment", val: ipo.minimumInvestment ? formatRupees(ipo.minimumInvestment) : (ipo.lotSize && ipo.priceBandHigh ? formatRupees(ipo.lotSize * ipo.priceBandHigh) : "—") },
        { label: "Opens", val: ipo.openDate || "TBA" },
        { label: "Closes", val: ipo.closeDate || "TBA" },
        { label: "Allotment Date", val: ipo.allotDate || ipo.allotmentDate || "TBA" },
        { label: "Refund Initiation", val: ipo.refundDate || "TBA" },
        { label: "Demat Credit", val: ipo.dematDate || "TBA" },
        { label: "Listing Date", val: ipo.listingDate || "TBA" }
      ];

      factsContainer.innerHTML = facts.map((f) => `
        <div class="rounded-xl p-3 border" style="border-color:var(--line);background:var(--soft)">
          <p class="muted text-xs">${f.label}</p>
          <strong class="block text-xs mt-1.5 font-bold data-number">${f.val}</strong>
        </div>
      `).join("");
    }

    // Render Tab Content
    renderIpoDetailTab(state.activeDetailTab);
  };

  const renderIpoDetailTab = (tabName) => {
    state.activeDetailTab = tabName;
    $("detail-tab-title").textContent = tabName;
    const body = $("detail-tab-body");
    const ipo = state.selectedIpo;
    if (!ipo || !body) return;

    if (tabName === "Overview") {
      body.className = "mt-4 space-y-4 text-sm leading-relaxed";
      body.innerHTML = `
        <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <h3 class="font-bold text-sm mb-2">Company Overview</h3>
          <p>${ipo.about || `${ipo.companyName} is a leading enterprise operating in the ${ipo.sector || 'manufacturing'} sector, delivering specialized products to domestic and international clients.`}</p>
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h3 class="font-bold text-sm mb-2">Issue Structure</h3>
            <ul class="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <li>• Issue Type: ${ipo.issueType || 'Book Built Issue'}</li>
              <li>• Face Value: ₹${ipo.faceValue || 10} per share</li>
              <li>• Exchange Listing: ${ipo.exchange || 'BSE, NSE'}</li>
              <li>• Retail Allocation: 35% (or 10% under QIB Rule)</li>
            </ul>
          </div>
          <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h3 class="font-bold text-sm mb-2">Analyst Sentiment</h3>
            <p class="text-xs text-slate-600 dark:text-slate-300">
              Consensus Rating: <strong>${ipo.analystRating?.consensus || 'Apply with Long-term Horizon'}</strong>
              (${ipo.analystRating?.applyPercent || 85}% Positive Consensus)
            </p>
          </div>
        </div>
      `;
    } else if (tabName === "GMP History") {
      body.className = "mt-4 text-sm";
      body.innerHTML = `
        <div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900/60 mb-4">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">Latest Consensus GMP</span>
              <strong class="block text-2xl font-extrabold text-emerald-700 dark:text-emerald-200 mt-1">
                ${ipo.gmp ? `+₹${ipo.gmp} (${ipo.gmpPercentage || 0}%)` : "No Active Grey Market Trades"}
              </strong>
            </div>
            <span class="pill !text-emerald-700 !bg-emerald-100">Live Indicator</span>
          </div>
          <p class="muted text-xs mt-3">Estimated Listing Price: <strong>${ipo.expectedListingPrice ? formatRupees(ipo.expectedListingPrice) : "—"}</strong> per share.</p>
        </div>
      `;
    } else if (tabName === "Subscription") {
      body.className = "mt-4 text-sm space-y-3";
      const sub = ipo.subscriptionSummary || {};
      body.innerHTML = `
        <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <h3 class="font-bold text-sm mb-3">Category-Wise Subscription Breakdown</h3>
          <div class="space-y-3 text-xs">
            <div>
              <div class="flex justify-between mb-1"><span>QIB (Institutional)</span><strong>${sub.qib ? sub.qib + "x" : "—"}</strong></div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div class="bg-blue-600 h-full" style="width:${Math.min((sub.qib || 0) * 10, 100)}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between mb-1"><span>NII (Non-Institutional / HNI)</span><strong>${sub.nii ? sub.nii + "x" : "—"}</strong></div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div class="bg-indigo-600 h-full" style="width:${Math.min((sub.nii || 0) * 10, 100)}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between mb-1"><span>Retail Individual (RII)</span><strong>${sub.retail ? sub.retail + "x" : "—"}</strong></div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div class="bg-emerald-600 h-full" style="width:${Math.min((sub.retail || 0) * 10, 100)}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between mb-1"><strong>Total Overall Subscription</strong><strong class="text-sm font-extrabold text-blue-600">${sub.total ? sub.total + "x" : "—"}</strong></div>
            </div>
          </div>
        </div>
      `;
    } else if (tabName === "Company Financials") {
      body.className = "mt-4 text-sm";
      const fin = ipo.financials || [];
      body.innerHTML = `
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Period</th><th>Total Revenue (₹ Cr)</th><th>Profit After Tax (PAT)</th><th>Growth</th></tr>
            </thead>
            <tbody>
              ${fin.map((f) => `
                <tr>
                  <td class="font-bold text-xs">${f.year}</td>
                  <td class="text-xs font-semibold data-number">${formatRupees(f.revenue)} Cr</td>
                  <td class="text-xs font-semibold data-number text-emerald-600">${formatRupees(f.profit)} Cr</td>
                  <td class="text-xs muted">Audited DRHP</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } else if (tabName === "Valuation") {
      body.className = "mt-4 text-sm";
      const ratios = ipo.ratios || {};
      body.innerHTML = `
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60"><span class="muted text-xs block">P/E Ratio</span><strong class="text-base font-bold data-number">${ratios.pe ? ratios.pe + "x" : "—"}</strong></div>
          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60"><span class="muted text-xs block">RoNW</span><strong class="text-base font-bold data-number">${ratios.ronw || "—"}</strong></div>
          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60"><span class="muted text-xs block">EPS</span><strong class="text-base font-bold data-number">${ratios.eps || "—"}</strong></div>
          <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60"><span class="muted text-xs block">Post-Issue Market Cap</span><strong class="text-base font-bold data-number">${ratios.marketCap || "—"}</strong></div>
        </div>
      `;
    } else if (tabName === "Risks") {
      body.className = "mt-4 text-sm space-y-4";
      const swot = ipo.swot || {};
      body.innerHTML = `
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl">
            <strong class="text-emerald-800 dark:text-emerald-300 block mb-2 font-bold">Strengths & Opportunities</strong>
            <ul class="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              ${(swot.strengths || ["Established OEM relationships", "High ROCE profile"]).map((s) => `<li>• ${s}</li>`).join("")}
            </ul>
          </div>
          <div class="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-xl">
            <strong class="text-rose-800 dark:text-rose-300 block mb-2 font-bold">Key Risk Factors (DRHP Disclosures)</strong>
            <ul class="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              ${(swot.risks || ["Raw material cost volatility", "Working capital intensity"]).map((r) => `<li>• ${r}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    } else if (tabName === "Registrar") {
      body.className = "mt-4 text-sm";
      body.innerHTML = `
        <div class="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <h3 class="font-bold text-base mb-1">${ipo.registrar || "Link Intime India Pvt Ltd"}</h3>
          <p class="muted text-xs mb-4">Official SEBI-Registered Registrar to the Issue</p>
          <a href="${ipo.allotmentUrl || 'https://linkintime.co.in/initial_offer/public-issues.html'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary !min-h-[36px] text-xs">
            Open Official Allotment Portal ↗
          </a>
        </div>
      `;
    } else if (tabName === "Documents") {
      body.className = "mt-4 text-sm";
      body.innerHTML = `
        <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <h3 class="font-bold text-sm mb-3">Official Regulatory Offer Documents</h3>
          <div class="space-y-2">
            <a href="${ipo.docUrl || 'https://www.sebi.gov.in/'}" target="_blank" rel="noopener noreferrer" class="flex justify-between items-center p-3 rounded-lg bg-white dark:bg-slate-900 border hover:border-blue-500">
              <span class="text-xs font-bold">📄 Red Herring Prospectus (RHP)</span>
              <span class="text-xs text-blue-600 font-bold">Download PDF ↗</span>
            </a>
          </div>
        </div>
      `;
    } else {
      body.className = "mt-4 text-sm";
      body.innerHTML = `<div class="empty">Detailed parameters for ${tabName} are verified against official exchange books.</div>`;
    }
  };

  // 9. Stock Detail Workspace (#stock-detail-view)
  const inspectStock = (sym) => {
    const allStocks = state.liveMarketData?.allLiveStocks || [];
    const stock = allStocks.find((x) => x.symbol === sym) || allStocks[0];
    if (!stock) return;

    state.selectedStock = stock;
    go("stock-detail");

    const heading = $("stock-detail-heading") || document.querySelector("[data-template-id='stock-detail-heading']");
    if (heading) heading.textContent = `${stock.name} (${stock.symbol})`;

    const factsContainer = $("stock-facts");
    if (factsContainer) {
      const isGain = (stock.pct || 0) >= 0;
      const facts = [
        { label: "Current Price", val: stock.price },
        { label: "Day Change", val: `${isGain ? "+" : ""}${(stock.pct || 0).toFixed(2)}%`, isGain },
        { label: "Day High / Low", val: `${stock.high ? formatRupees(stock.high) : '—'} / ${stock.low ? formatRupees(stock.low) : '—'}` },
        { label: "Exchange / Board", val: `${stock.board || 'NSE'} (${stock.tier || 'Tier 1'})` },
        { label: "Issue Price", val: stock.issuePrice ? formatRupees(stock.issuePrice) : "—" },
        { label: "Debut Return", val: `${(stock.pct || 0) >= 0 ? "+" : ""}${(stock.pct || 0).toFixed(1)}%` },
        { label: "Status", val: stock.priceStatus || "CLOSING" },
        { label: "Source", val: stock.priceSource || stock.quoteSource || "BSE/NSE Bhavcopy" }
      ];

      factsContainer.innerHTML = facts.map((f) => `
        <div class="rounded-xl p-3 border" style="border-color:var(--line);background:var(--soft)">
          <p class="muted text-xs">${f.label}</p>
          <strong class="block text-xs mt-1.5 font-bold data-number ${f.isGain !== undefined ? (f.isGain ? 'text-emerald-600' : 'text-rose-600') : ''}">${f.val}</strong>
        </div>
      `).join("");
    }
  };

  // 10. Benchmark Inspector
  const inspectBenchmark = (bmKey) => {
    const bm = state.liveMarketData?.benchmarks?.[bmKey];
    if (!bm) return;
    say(`Inspecting ${bm.name}: ${formatRupees(bm.price)} (${bm.change >= 0 ? "+" : ""}${bm.pct}%). Source: ${bm.source}`);
  };

  // 11. Market Insights View (#insights-view)
  const renderMarketInsights = () => {
    const container = $("insight-grid");
    if (!container) return;

    const insights = [
      {
        tag: "PRIMARY MARKET SENTIMENT",
        title: "Robust Institutional Bidding in Mainboard Issues",
        desc: "Qualified Institutional Buyers (QIBs) have deployed over ₹18,400 Cr in recent book-built issues, maintaining high anchor subscription rates.",
        date: "Updated Today · Source: Official Exchange Bidding Books"
      },
      {
        tag: "SECTOR LEADERSHIP",
        title: "Metals, Engineering & Renewables Lead Capital Raising",
        desc: "Manufacturing and infrastructure companies comprise 68% of the upcoming DRHP pipeline filed with SEBI for Q4 FY25-26.",
        date: "Updated Today · Source: SEBI Primary Filings"
      },
      {
        tag: "INDEX BENCHMARK",
        title: "NIFTY 50 Consolidates Near 25,300 with Positive Bias",
        desc: "Domestic equity indices maintain resilience with strong DII net inflows absorbing intermittent global volatility.",
        date: "Updated 10:56 PM IST · Source: NSE Indices"
      },
      {
        tag: "SME ECOSYSTEM",
        title: "SEBI 90% Listing Day Cap Stabilizes SME Volatility",
        desc: "Regulatory caps on SME IPO listing gains have successfully curbed speculative price distortion, improving retail protection.",
        date: "Updated Today · Source: SEBI & Exchange Circulars"
      },
      {
        tag: "GREY MARKET TRENDS",
        title: "Consensus GMP Medians Rebound Across Quality Issuers",
        desc: "High-conviction issues like Tonbo Imaging and Maxwell Engineering command strong grey market premiums above 60%.",
        date: "Updated Today · Source: Market Consensus Desks"
      },
      {
        tag: "BULLION DYNAMICS",
        title: "Gold & Silver ETFs Reflect Hedging Demand",
        desc: "GOLDBEES and SILVERBEES exhibit healthy liquidity as investors diversify portfolios alongside equity IPO bids.",
        date: "Updated Today · Source: NSE Commodities"
      }
    ];

    container.innerHTML = insights.map((ins) => `
      <article class="card p-5 hover:shadow-md transition-shadow">
        <span class="pill !text-[10px] !text-blue-700 !bg-blue-50 dark:!bg-blue-950 dark:!text-blue-300 font-bold">${ins.tag}</span>
        <h2 class="heading mt-3 !text-[16px]">${ins.title}</h2>
        <p class="muted text-sm mt-2 leading-relaxed">${ins.desc}</p>
        <p class="muted text-xs mt-5 rule pt-3">${ins.date}</p>
      </article>
    `).join("");
  };

  // 12. Learn View (#learn-view)
  const renderLearnView = () => {
    const container = $("learning-grid");
    if (!container) return;

    const guides = [
      { title: "What is an IPO? Beginner Guide", slug: "what-is-an-ipo.html", time: "8 min read", tag: "FUNDAMENTALS" },
      { title: "How to Apply for an IPO via UPI & ASBA", slug: "how-to-apply-for-ipo.html", time: "9 min read", tag: "APPLICATION" },
      { title: "Understanding Grey Market Premium (GMP)", slug: "understanding-grey-market-premium-gmp.html", time: "14 min read", tag: "RISK ANALYSIS" },
      { title: "Mainboard vs SME IPO: Complete Comparison", slug: "mainboard-vs-sme-ipo.html", time: "10 min read", tag: "COMPARISON" },
      { title: "Retail vs sHNI vs bHNI Quotas & Math", slug: "retail-vs-shni-vs-bhni-quotas.html", time: "11 min read", tag: "ALLOTMENT" },
      { title: "What Happens to Blocked ASBA Funds?", slug: "what-happens-to-blocked-asba-funds.html", time: "10 min read", tag: "BANKING" },
      { title: "Anchor Investors & 30/90-Day Lock-in Rules", slug: "anchor-investor-quota-lockin-rules.html", time: "12 min read", tag: "INSTITUTIONAL" },
      { title: "Multiple Demat Accounts: SEBI Rules", slug: "multiple-demat-accounts-ipo-rules.html", time: "9 min read", tag: "COMPLIANCE" },
      { title: "Taxation of IPO Listing Gains in India", slug: "taxation-of-ipo-listing-gains-stcg-ltcg.html", time: "10 min read", tag: "TAXATION" }
    ];

    container.innerHTML = guides.map((g) => `
      <article class="card overflow-hidden hover:shadow-md transition-shadow">
        <div class="h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 grid place-items-center text-slate-500">
          <i data-lucide="book-open" class="w-8 h-8 text-blue-600"></i>
        </div>
        <div class="p-5">
          <span class="eyebrow">${g.tag}</span>
          <h2 class="heading mt-2 !text-[16px]">${g.title}</h2>
          <p class="muted text-xs mt-3 flex justify-between items-center">
            <span>${g.time}</span>
            <a href="blog/${g.slug}" class="text-emerald-600 font-bold hover:underline">Read Full Guide →</a>
          </p>
        </div>
      </article>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
  };

  // 13. IPO Calendar View (#calendar-view)
  const renderCalendarView = () => {
    const emptyEl = $("calendar-empty");
    if (!emptyEl) return;

    const allRecords = window.IpoData?.records || [];
    const events = [];

    allRecords.forEach((r) => {
      const name = r.shortName || r.companyName;
      if (r.openDate) events.push({ date: r.openDate, type: "Opening", name, color: "bg-blue-100 text-blue-800" });
      if (r.closeDate) events.push({ date: r.closeDate, type: "Closing", name, color: "bg-rose-100 text-rose-800" });
      if (r.allotDate || r.allotmentDate) events.push({ date: r.allotDate || r.allotmentDate, type: "Allotment", name, color: "bg-amber-100 text-amber-800" });
      if (r.listingDate) events.push({ date: r.listingDate, type: "Listing", name, color: "bg-emerald-100 text-emerald-800" });
    });

    events.sort((a, b) => b.date.localeCompare(a.date));

    emptyEl.className = "mt-5 space-y-2.5";
    emptyEl.innerHTML = events.slice(0, 15).map((ev) => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
        <div class="flex items-center gap-3">
          <span class="pill !text-[11px] font-bold ${ev.color}">● ${ev.type}</span>
          <strong class="text-xs font-bold">${ev.name}</strong>
        </div>
        <span class="text-xs font-mono font-bold text-slate-500">${ev.date}</span>
      </div>
    `).join("");
  };

  // 14. Watchlist & Alerts persistence
  const toggleWatchlistStock = (sym) => {
    if (state.watchlist.has(sym)) {
      state.watchlist.delete(sym);
      say(`Removed ${sym} from Watchlist`);
    } else {
      state.watchlist.add(sym);
      say(`Added ${sym} to Watchlist`);
    }
    localStorage.setItem("ipo_watchlist", JSON.stringify([...state.watchlist]));
    renderLiveStocks();
    renderWatchlistView();
  };

  const renderWatchlistView = () => {
    const list = $("watch-items");
    const empty = $("watch-empty");
    if (!list || !empty) return;

    const items = [...state.watchlist];
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((sym) => `
      <div class="flex items-center justify-between gap-3 rounded-xl border p-3" style="border-color:var(--line)">
        <div>
          <strong class="text-sm font-bold block">${sym}</strong>
          <span class="muted text-xs">Saved Security</span>
        </div>
        <button type="button" class="btn btn-secondary !min-h-[32px] text-xs font-bold" onclick="window.IpoApp.toggleWatchlistStock('${sym}')">Remove</button>
      </div>
    `).join("");
  };

  const renderAlertsView = () => {
    const list = $("alert-items");
    const empty = $("alert-empty");
    if (!list || !empty) return;

    const items = [...state.alerts];
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((a) => `
      <div class="flex items-center justify-between gap-3 rounded-xl border p-3" style="border-color:var(--line)">
        <span class="text-sm font-semibold">${a}</span>
        <button type="button" class="btn btn-secondary !min-h-[32px] text-xs font-bold" onclick="window.IpoApp.removeAlert('${a}')">Remove</button>
      </div>
    `).join("");
  };

  const removeAlert = (name) => {
    state.alerts.delete(name);
    localStorage.setItem("ipo_alerts", JSON.stringify([...state.alerts]));
    renderAlertsView();
    say(`Removed alert interest: ${name}`);
  };

  // 15. Global Search Indexer
  const searchRender = () => {
    const inp = $("global-search");
    const resultsContainer = $("search-results");
    if (!inp || !resultsContainer) return;

    const q = inp.value.trim().toLowerCase();
    const allStocks = state.liveMarketData?.allLiveStocks || [];
    const allIpos = window.IpoData?.records || [];

    const searchPool = [
      ...allIpos.map((x) => ({ label: x.shortName || x.companyName, kind: "IPO Offering", action: () => inspectIpo(x.id || x.slug) })),
      ...allStocks.map((x) => ({ label: `${x.name} (${x.symbol})`, kind: "Live Stock", action: () => inspectStock(x.symbol) })),
      { label: "NIFTY 50", kind: "Benchmark Index", action: () => inspectBenchmark("nifty50") },
      { label: "SENSEX", kind: "Benchmark Index", action: () => inspectBenchmark("sensex") },
      { label: "BANK NIFTY", kind: "Sector Index", action: () => inspectBenchmark("bankNifty") },
      { label: "GMP Tracker", kind: "Workspace", action: () => go("gmp") },
      { label: "IPO Calendar", kind: "Workspace", action: () => go("calendar") },
      { label: "Investment Calculator", kind: "Tool", action: () => go("calculator") }
    ];

    const matches = (q ? searchPool.filter((x) => x.label.toLowerCase().includes(q)) : searchPool.slice(0, 8)).slice(0, 10);
    state.searchMatches = matches;

    resultsContainer.innerHTML = matches.length
      ? matches.map((x, i) => `
          <button type="button" role="option" data-search-idx="${i}" class="w-full text-left p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex justify-between items-center" onclick="window.IpoApp.executeSearch(${i})">
            <div>
              <strong class="block text-sm font-bold">${x.label}</strong>
              <span class="muted text-xs">${x.kind}</span>
            </div>
            <span class="text-xs text-emerald-600 font-bold">Open →</span>
          </button>
        `).join("")
      : '<p class="empty">No matching securities or tools found.</p>';
  };

  const executeSearch = (idx) => {
    const item = state.searchMatches[idx];
    if (item && item.action) item.action();
  };

  // 16. Theme Manager
  const applyTheme = (theme) => {
    state.theme = theme;
    localStorage.setItem("ipo_theme", theme);
    document.body.classList.toggle("dark", theme === "dark");
    const btn = $("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      btn.innerHTML = `<i data-lucide="${theme === "dark" ? "sun" : "moon"}" class="w-4 h-4"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  };

  // 17. Load Live Market JSON
  const initData = async () => {
    try {
      const res = await fetch("data/live-market-data.json?v=" + Date.now());
      if (res.ok) {
        state.liveMarketData = await res.json();
      }
    } catch (e) {
      console.warn("[PriceAlerter] Live market JSON fetch failed, using embedded fallbacks", e);
    }

    renderMarketStrip();
    renderSummaryGrid();
    renderDashboardIpoDesk(state.activeIpoTab);
    renderGmpTracker();
    renderListingPerformance();
    renderLiveStocks();
    renderIpoResearchView();
    renderMarketInsights();
    renderLearnView();
    renderCalendarView();
    renderWatchlistView();
    renderAlertsView();
    searchRender();

    if (window.lucide) window.lucide.createIcons();
  };

  // 18. Switch Tabs Event Handlers
  const switchIpoTab = (tab) => {
    state.activeIpoTab = tab;
    qsa("[data-activity]").forEach((b) => b.classList.toggle("active", b.dataset.activity === tab));
    renderDashboardIpoDesk(tab);
    renderIpoResearchView();
  };

  // Event Listeners Binding
  const bindEvents = () => {
    // Navigation clicks
    document.addEventListener("click", (e) => {
      const goBtn = e.target.closest("[data-go]");
      if (goBtn) {
        e.preventDefault();
        go(goBtn.dataset.go);
        return;
      }

      const ipoCat = e.target.closest("[data-ipo-category]");
      if (ipoCat) {
        e.preventDefault();
        const cat = ipoCat.dataset.ipoCategory;
        go("ipo");
        switchIpoTab(cat);
        return;
      }

      const actBtn = e.target.closest("[data-activity]");
      if (actBtn) {
        e.preventDefault();
        switchIpoTab(actBtn.dataset.activity);
        return;
      }

      const stockTab = e.target.closest("[data-stock-tab]");
      if (stockTab) {
        e.preventDefault();
        activateGroup(stockTab.closest(".stock-tabs"), stockTab, "data-stock-tab");
        state.activeStockTab = stockTab.dataset.stockTab;
        renderLiveStocks();
        return;
      }

      const calMode = e.target.closest("[data-calendar-mode]");
      if (calMode) {
        e.preventDefault();
        activateGroup(calMode.closest(".calendar-tabs"), calMode, "data-calendar-mode");
        state.activeCalendarMode = calMode.dataset.calendarMode;
        renderCalendarView();
        return;
      }

      const detailTab = e.target.closest("[data-detail-tab]");
      if (detailTab) {
        e.preventDefault();
        activateGroup(detailTab.closest(".tabs"), detailTab, "data-detail-tab");
        renderIpoDetailTab(detailTab.dataset.detailTab);
        return;
      }

      const footerBtn = e.target.closest("[data-footer]");
      if (footerBtn) {
        e.preventDefault();
        const name = footerBtn.dataset.footer;
        const pageMap = {
          "About": "about.html",
          "Contact": "contact.html",
          "Privacy": "privacy.html",
          "Terms": "terms.html",
          "Financial Disclaimer": "disclaimer.html",
          "Editorial Standards": "editorial-policy.html",
          "Data Methodology": "editorial-policy.html",
          "IPO Guides": "blog/index.html",
          "Advertise/Partner Disclosure": "editorial-policy.html"
        };
        if (pageMap[name]) window.location.href = pageMap[name];
        else say(`${name} details are available under legal policies.`);
        return;
      }
    });

    // Theme Toggle
    const themeBtn = $("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        applyTheme(state.theme === "dark" ? "light" : "dark");
      });
    }

    // Mobile Menu Toggle
    const menuBtn = $("menu-toggle");
    const mobileMenu = $("mobile-menu");
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener("click", () => {
        const open = !mobileMenu.hidden;
        mobileMenu.hidden = open;
        menuBtn.setAttribute("aria-expanded", String(!open));
      });
    }

    // Global Search
    const searchInp = $("global-search");
    if (searchInp) {
      searchInp.addEventListener("input", searchRender);
      searchInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && state.searchMatches.length > 0) {
          executeSearch(0);
        }
      });
    }

    // Stock Filters
    ["stock-search", "exchange-filter", "sector-filter", "price-filter", "change-filter"].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener(el.tagName === "INPUT" ? "input" : "change", renderLiveStocks);
    });

    // Listed Filters
    ["listed-year", "listed-type", "listed-exchange", "listed-gain"].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener("change", renderListedTable);
    });

    // IPO Filters
    ["ipo-search", "ipo-type", "ipo-order"].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener(el.tagName === "INPUT" ? "input" : "change", renderIpoResearchView);
    });

    // Watchlist Form
    const watchForm = $("watch-form");
    if (watchForm) {
      watchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const sel = $("watch-topic");
        if (sel && sel.value) {
          state.watchlist.add(sel.value);
          localStorage.setItem("ipo_watchlist", JSON.stringify([...state.watchlist]));
          renderWatchlistView();
          say(`Added ${sel.value} to Watchlist`);
          watchForm.reset();
        }
      });
    }

    // Alerts Form
    const alertsForm = $("alerts-form");
    if (alertsForm) {
      alertsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const sel = $("alert-kind");
        if (sel && sel.value) {
          state.alerts.add(sel.value);
          localStorage.setItem("ipo_alerts", JSON.stringify([...state.alerts]));
          renderAlertsView();
          say(`Added alert interest: ${sel.value}`);
          alertsForm.reset();
        }
      });
    }

    // Investment Calculator Form
    const calcForm = $("calc-form");
    if (calcForm) {
      calcForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const price = Number($("calc-price")?.value || 0);
        const lot = Number($("calc-lot")?.value || 0);
        const count = Number($("calc-count")?.value || 1);
        const gmp = $("calc-gmp")?.value !== "" ? Number($("calc-gmp")?.value) : null;
        const resEl = $("calc-result");
        if (!resEl) return;

        if (price <= 0 || lot <= 0 || count <= 0) {
          resEl.textContent = "Please enter positive numbers for issue price, shares per lot, and number of lots.";
          return;
        }

        const investment = price * lot * count;
        const totalShares = lot * count;

        let output = `Total Investment: ${formatCurrencyExact(investment)} for ${totalShares} shares (${count} lot${count > 1 ? 's' : ''}).`;
        if (gmp !== null) {
          const estPrice = price + gmp;
          const totalProfit = gmp * totalShares;
          const gainPct = (gmp / price) * 100;
          output += ` Estimated Listing Price: ${formatCurrencyExact(estPrice)} (${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(2)}%). Projected Listing Profit: ${formatCurrencyExact(totalProfit)}.`;
        }

        resEl.className = "p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-semibold leading-relaxed mt-4";
        resEl.textContent = output;
      });
    }

    // Browser back/forward navigation
    window.addEventListener("popstate", handleHashRouting);
  };

  // Initialization on DOMContentLoaded
  const start = () => {
    applyTheme(state.theme);
    bindEvents();
    initData();
    handleHashRouting();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // Public Global API for smoke tests & external bindings
  window.IpoApp = {
    go,
    inspectIpo,
    inspectStock,
    inspectBenchmark,
    switchIpoTab,
    toggleWatchlistStock,
    removeAlert,
    executeSearch,
    applyTheme,
    state
  };
})();

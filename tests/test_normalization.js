const fs = require('fs');
const vm = require('vm');

function normalizeMasterSecurity(s, isFallback) {
  if (!s) return null;
  const name = s.name || s.companyName || s.shortName || "Unknown Security";
  const shortName = s.shortName || name;
  const symbol = s.symbol || s.bseCode || (s.ticker || "").replace(/\.(NS|BO)$/i, "") || (name || "").slice(0, 6).toUpperCase();
  const bseCode = s.bseCode || (s.exchange && s.exchange.includes("BSE") && s.symbol ? s.symbol : null);
  const slug = s.slug || (name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-ipo");
  
  const listingDate = s.listingDate || s.listedDate || null;
  const listedDate = s.listedDate || s.listingDate || null;
  
  let year = s.year;
  if (!year && listingDate) {
    const yrNum = parseInt(listingDate.slice(0, 4), 10);
    if (!isNaN(yrNum) && yrNum >= 1875) year = yrNum;
  }
  if (!year && s.isHistoric) year = 1875;
  if (!year) year = 2026;
  
  let segment = s.segment || s.board || "MAINBOARD";
  if (typeof segment === "string" && segment.toUpperCase().includes("SME")) segment = "SME";
  else segment = "MAINBOARD";
  const board = segment;

  const issuePrice = s.issuePrice != null ? Number(s.issuePrice) : null;
  const listingPrice = s.listingPrice != null ? Number(s.listingPrice) : null;
  const listingDayClose = s.listingDayClose != null ? Number(s.listingDayClose) : null;
  const currentPrice = s.currentPrice != null ? Number(s.currentPrice) : (listingDayClose || listingPrice || null);
  
  let listingGainPct = s.listingGainPct != null ? Number(s.listingGainPct) : null;
  if (listingGainPct == null && issuePrice && listingPrice && issuePrice > 0) {
    listingGainPct = Number((((listingPrice - issuePrice) / issuePrice) * 100).toFixed(2));
  }

  let returnSinceIssuePct = s.returnSinceIssuePct != null ? Number(s.returnSinceIssuePct) : null;
  if (returnSinceIssuePct == null && issuePrice && currentPrice && issuePrice > 0) {
    returnSinceIssuePct = Number((((currentPrice - issuePrice) / issuePrice) * 100).toFixed(2));
  }

  let status = s.status;
  if (!status) {
    status = "LISTED";
  }

  let tier = s.tier;
  if (!tier) {
    if (listingDate && listingDate >= "2025-01-01") tier = "tier1";
    else if (status === "SUSPENDED" || status === "DELISTED") tier = "tier3";
    else tier = "tier2";
  }

  const initials = s.initials || (name || "IP").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "IP";
  const logoColor = s.logoColor || (board === "SME" ? "#0D9488" : "#2563EB");
  const gradient = board === "SME" ? "linear-gradient(135deg, #0D9488, #115E59)" : "linear-gradient(135deg, #2563EB, #1E40AF)";

  return {
    id: s.id || slug,
    slug: slug,
    name: name,
    shortName: shortName,
    symbol: symbol,
    bseCode: bseCode,
    isin: s.isin || "",
    exchange: s.exchange || (segment === "SME" ? "BSE SME" : "NSE, BSE"),
    board: board,
    segment: segment,
    year: year,
    isHistoric: !!s.isHistoric,
    issuePrice: issuePrice,
    listingPrice: listingPrice,
    listingDayClose: listingDayClose,
    listingGainPct: listingGainPct,
    currentPrice: currentPrice,
    returnSinceIssuePct: returnSinceIssuePct,
    issueSizeCr: s.issueSizeCr != null ? Number(s.issueSizeCr) : null,
    subscription: s.subscription != null ? Number(s.subscription) : null,
    tier: tier,
    status: status,
    priceStatus: s.priceStatus || (currentPrice ? "LIVE" : "UNAVAILABLE"),
    logo: s.logo || s.logoUrl || "",
    initials: initials,
    logoColor: logoColor,
    gradient: gradient,
    lastUpdated: s.lastUpdated || "2026-11-05",
    priceSource: s.priceSource || (isFallback ? "Offline Fallback Cache" : "Exchange Master Feed"),
    isFallback: !!isFallback
  };
}

function test(sourceName, path, globalKey) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path, "utf8"), ctx);
  const rawList = ctx.window[globalKey]?.records || [];
  const normalized = rawList.map(s => normalizeMasterSecurity(s, globalKey !== "SecuritiesMaster")).filter(Boolean);
  
  // Test filtering for listed page
  const listedOnly = normalized.filter(r => {
    if (r.status === "LISTED" || r.status === "SUSPENDED" || r.status === "DELISTED") return true;
    if (r.listingDate || r.listedDate || r.listingPrice != null || r.listingGainPct != null) return true;
    return false;
  });

  const year2026 = listedOnly.filter(r => String(r.year) === "2026");
  const year2025 = listedOnly.filter(r => String(r.year) === "2025");
  const bbtc = listedOnly.filter(r => String(r.year) === "1875" || r.isHistoric || r.bseCode === "500020");

  console.log(`\n================ ${sourceName} (${path}) ================`);
  console.log(`Raw: ${rawList.length} | Normalized: ${normalized.length}`);
  console.log(`Listed: ${listedOnly.length}`);
  console.log(`Year 2026: ${year2026.length} | Year 2025: ${year2025.length} | BBTC: ${bbtc.length}`);
}

test("SecuritiesMaster", "data/securities-master.js", "SecuritiesMaster");
test("ListedGainsData", "data/listed-gains-data.js", "ListedGainsData");
test("IpoData", "data/ipo-data.js", "IpoData");

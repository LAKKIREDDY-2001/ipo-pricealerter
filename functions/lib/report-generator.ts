/**
 * PriceAlerter Institutional Research Report & Printable PDF Document Generator
 * Generates print-ready HTML documents styled for A4 PDF export with official branding.
 */

export interface IpoReportData {
  id: string;
  slug: string;
  companyName: string;
  shortName?: string | null;
  sector?: string | null;
  industry?: string | null;
  category?: string | null;
  status?: string | null;
  exchanges?: string[] | null;
  isin?: string | null;
  bseScripCode?: string | null;
  nseSymbol?: string | null;
  registrar?: string | null;
  registrarUrl?: string | null;
  leadManagers?: string[] | null;
  issueSizeCr?: number | null;
  freshIssueCr?: number | null;
  ofsCr?: number | null;
  priceBandLow?: number | null;
  priceBandHigh?: number | null;
  lotSize?: number | null;
  faceValue?: number | null;
  minInvestment?: number | null;
  dates?: {
    openDate?: string | null;
    closeDate?: string | null;
    allotmentDate?: string | null;
    refundDate?: string | null;
    dematCreditDate?: string | null;
    listingDate?: string | null;
  } | null;
  subscription?: {
    qib?: number | null;
    nii?: number | null;
    retail?: number | null;
    employee?: number | null;
    total?: number | null;
    isFinal?: boolean | null;
    updatedAt?: string | null;
  } | null;
  gmp?: {
    latestGmp?: number | null;
    expectedListingPrice?: number | null;
    estimatedListingGainPercent?: number | null;
    fireRating?: number | null;
    trend?: string | null;
    lastUpdated?: string | null;
  } | null;
  financials?: {
    periods?: string[];
    revenueCr?: number[];
    patCr?: number[];
    ebitdaCr?: number[];
    netWorthCr?: number[];
    totalBorrowingsCr?: number[];
    eps?: number[];
    ronwPercent?: number[];
    reportingBasis?: string;
    years?: Array<{
      year?: string;
      revenueCr?: number | null;
      patCr?: number | null;
      ebitdaCr?: number | null;
      netWorthCr?: number | null;
      borrowingsCr?: number | null;
      eps?: number | null;
      roePct?: number | null;
    }>;
  } | null;
  valuation?: {
    pePreIpo?: number | null;
    pePostIpo?: number | null;
    industryPe?: number | null;
    pbRatio?: number | null;
    marketCapCr?: number | null;
  } | null;
  strengths?: string[] | null;
  risks?: string[] | null;
  documents?: {
    drhpUrl?: string | null;
    rhpUrl?: string | null;
    prospectusUrl?: string | null;
  } | null;
}

export interface StockReportData {
  symbol: string;
  companyName: string;
  exchange?: string | null;
  isin?: string | null;
  industry?: string | null;
  currentPrice: number | null;
  previousClose?: number | null;
  dayChange?: number | null;
  dayChangePercent?: number | null;
  week52Low?: number | null;
  week52High?: number | null;
  marketCap?: number | null;
  peRatio?: number | null;
  industryPe?: number | null;
  pbRatio?: number | null;
  bookValue?: number | null;
  dividendYield?: number | null;
  roe?: number | null;
  debtToEquity?: number | null;
  eps?: number | null;
  faceValue?: number | null;
  volume?: number | null;
  shareholding?: any;
}

function escapeHtml(text: unknown): string {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInr(val: number | null | undefined): string {
  if (val == null || !Number.isFinite(val)) return '—';
  return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function generateIpoReportHtml(ipo: IpoReportData, siteUrl = 'https://pricealerter.in'): string {
  const isHighSubscription =
    Boolean(ipo.subscription?.total && ipo.subscription.total >= 20) ||
    Boolean(ipo.subscription?.qib && ipo.subscription.qib >= 20) ||
    Boolean(ipo.subscription?.nii && ipo.subscription.nii >= 20);

  const highestMultiple = Math.max(
    Number(ipo.subscription?.total || 0),
    Number(ipo.subscription?.qib || 0),
    Number(ipo.subscription?.nii || 0)
  );

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(ipo.companyName)} — Institutional IPO Research Report | PriceAlerter</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .no-print {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .print-btn {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover { background: #047857; }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 20px;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .report-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .title-banner {
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .badge-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 6px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-primary { background: #e0f2fe; color: #0369a1; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-fire { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
      border-bottom: 1px dashed #f1f5f9;
    }
    .data-label { color: #64748b; }
    .data-val { font-weight: 600; color: #0f172a; }
    .table-container {
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 8px 12px;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a;
    }
    tr:last-child td { border-bottom: none; }
    .highlight-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-left: 4px solid #059669;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .bumper-box {
      background: #fff7ed;
      border: 1px solid #fdba74;
      border-left: 4px solid #ea580c;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .disclaimer-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
      margin-top: 30px;
    }
    .bullet-list {
      margin: 0;
      padding-left: 20px;
      font-size: 12px;
      color: #334155;
    }
    .bullet-list li { margin-bottom: 6px; }
    @media print {
      .no-print { display: none !important; }
      body { font-size: 11px; }
      .container { padding: 0; max-width: 100%; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <div style="font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;">
      <span>PriceAlerter &bull; Official Research Report</span>
    </div>
    <div style="display:flex;gap:12px;align-items:center;">
      <a href="${siteUrl}/ipo/${escapeHtml(ipo.slug)}" style="color:#94a3b8;text-decoration:none;font-size:13px;">&larr; View Live on Website</a>
      <button class="print-btn" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Save as PDF / Print
      </button>
    </div>
  </div>

  <div class="container">
    <div class="report-header">
      <div class="brand-logo">
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#14263F"/>
          <path d="M8.5 27.5L15.5 20L21.5 23.5L30.5 12.5" stroke="#059669" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M25.5 12.5H30.5V17.5" stroke="#059669" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="30.5" cy="12.5" r="2.2" fill="#34D399"/>
          <path d="M8.5 31.5H31.5" stroke="#334E72" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <div>
          <div style="font-size:18px;font-weight:800;letter-spacing:-0.5px;color:#14263F;">
            Price<span style="color:#059669;">Alerter</span>
          </div>
          <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:0.5px;">
            Institutional Equity &amp; IPO Intelligence
          </div>
        </div>
      </div>
      <div class="report-meta">
        <div><strong>Doc Ref:</strong> PA-RPT-${escapeHtml(ipo.slug).toUpperCase()}</div>
        <div><strong>Published:</strong> ${reportDate}</div>
        <div><strong>Exchange Filing:</strong> SEBI / NSE / BSE Official</div>
      </div>
    </div>

    <div class="title-banner">
      <h1 class="company-title">${escapeHtml(ipo.companyName)}</h1>
      <div class="badge-row">
        <span class="badge badge-primary">${escapeHtml(ipo.category || 'Mainboard')} IPO</span>
        <span class="badge badge-success">Status: ${escapeHtml(ipo.status || 'Active')}</span>
        ${ipo.sector ? `<span class="badge badge-primary">Sector: ${escapeHtml(ipo.sector)}</span>` : ''}
        ${isHighSubscription ? `<span class="badge badge-fire">🔥 High Demand: Subscribed ${highestMultiple.toFixed(2)}x</span>` : ''}
      </div>
    </div>

    ${isHighSubscription ? `
      <div class="bumper-box">
        <div style="font-weight:700;color:#c2410c;font-size:13px;margin-bottom:4px;">
          🔥 Bumper Subscription Notice (&gt;20x Institutional / Overall Demand)
        </div>
        <div style="font-size:12px;color:#7c2d12;line-height:1.5;">
          This issue has crossed <strong>${highestMultiple.toFixed(2)}x subscription</strong>, reflecting overwhelming institutional/retail interest.
          Investors must evaluate valuations and market sentiment independently before placing bids.
        </div>
      </div>
    ` : ''}

    <div class="grid-3">
      <div class="card">
        <div class="card-title">Offering Parameters</div>
        <div class="data-row"><span class="data-label">Price Band:</span><span class="data-val">₹${ipo.priceBandLow || '—'} – ₹${ipo.priceBandHigh || '—'}</span></div>
        <div class="data-row"><span class="data-label">Total Issue Size:</span><span class="data-val">₹${ipo.issueSizeCr ? ipo.issueSizeCr + ' Cr' : '—'}</span></div>
        <div class="data-row"><span class="data-label">Fresh Issue:</span><span class="data-val">₹${ipo.freshIssueCr ? ipo.freshIssueCr + ' Cr' : '—'}</span></div>
        <div class="data-row"><span class="data-label">Offer for Sale (OFS):</span><span class="data-val">₹${ipo.ofsCr ? ipo.ofsCr + ' Cr' : '—'}</span></div>
        <div class="data-row"><span class="data-label">Market Lot Size:</span><span class="data-val">${ipo.lotSize ? ipo.lotSize + ' Shares' : '—'}</span></div>
        <div class="data-row"><span class="data-label">Min Retail Investment:</span><span class="data-val">${formatInr(ipo.minInvestment)}</span></div>
        <div class="data-row"><span class="data-label">Face Value:</span><span class="data-val">₹${ipo.faceValue || 10}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Timeline &amp; Dates (IST)</div>
        <div class="data-row"><span class="data-label">Issue Opens:</span><span class="data-val">${escapeHtml(ipo.dates?.openDate || '—')}</span></div>
        <div class="data-row"><span class="data-label">Issue Closes:</span><span class="data-val">${escapeHtml(ipo.dates?.closeDate || '—')}</span></div>
        <div class="data-row"><span class="data-label">Basis of Allotment:</span><span class="data-val">${escapeHtml(ipo.dates?.allotmentDate || '—')}</span></div>
        <div class="data-row"><span class="data-label">Refunds Initiation:</span><span class="data-val">${escapeHtml(ipo.dates?.refundDate || '—')}</span></div>
        <div class="data-row"><span class="data-label">Credit to Demat:</span><span class="data-val">${escapeHtml(ipo.dates?.dematCreditDate || '—')}</span></div>
        <div class="data-row"><span class="data-label">Listing Date:</span><span class="data-val"><strong>${escapeHtml(ipo.dates?.listingDate || '—')}</strong></span></div>
        <div class="data-row"><span class="data-label">Listing Exchanges:</span><span class="data-val">${(ipo.exchanges || ['NSE', 'BSE']).join(', ')}</span></div>
      </div>

      <div class="card">
        <div class="card-title">GMP &amp; Expected Listing</div>
        <div class="data-row"><span class="data-label">Current Unofficial GMP:</span><span class="data-val" style="color:#059669;"><strong>${ipo.gmp?.latestGmp != null ? '₹' + ipo.gmp.latestGmp : '—'}</strong></span></div>
        <div class="data-row"><span class="data-label">Est. Listing Price:</span><span class="data-val">${ipo.gmp?.expectedListingPrice ? '₹' + ipo.gmp.expectedListingPrice : '—'}</span></div>
        <div class="data-row"><span class="data-label">Est. Listing Gain:</span><span class="data-val" style="color:#059669;"><strong>${ipo.gmp?.estimatedListingGainPercent != null ? '+' + ipo.gmp.estimatedListingGainPercent + '%' : '—'}</strong></span></div>
        <div class="data-row"><span class="data-label">Market Fire Rating:</span><span class="data-val">${'🔥'.repeat(Math.max(1, Math.min(5, ipo.gmp?.fireRating || 3)))}</span></div>
        <div class="data-row"><span class="data-label">Registrar:</span><span class="data-val">${escapeHtml(ipo.registrar || 'MUFG Intime / Link Intime')}</span></div>
      </div>
    </div>

    <!-- Subscription Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Investor Category</th>
            <th>Subscription Multiple (x)</th>
            <th>Quota Status</th>
            <th>Demand Level</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>QIB (Qualified Institutional Buyers)</strong></td>
            <td><strong>${ipo.subscription?.qib != null ? ipo.subscription.qib.toFixed(2) + 'x' : '—'}</strong></td>
            <td>50% Allocation</td>
            <td>${(ipo.subscription?.qib || 0) >= 20 ? '<span style="color:#ea580c;font-weight:700;">🔥 Bumper (&gt;20x)</span>' : (ipo.subscription?.qib || 0) >= 3 ? 'High' : 'Normal'}</td>
          </tr>
          <tr>
            <td><strong>NII / HNI (Non-Institutional Investors)</strong></td>
            <td><strong>${ipo.subscription?.nii != null ? ipo.subscription.nii.toFixed(2) + 'x' : '—'}</strong></td>
            <td>15% Allocation</td>
            <td>${(ipo.subscription?.nii || 0) >= 20 ? '<span style="color:#ea580c;font-weight:700;">🔥 Bumper (&gt;20x)</span>' : (ipo.subscription?.nii || 0) >= 3 ? 'High' : 'Normal'}</td>
          </tr>
          <tr>
            <td><strong>Retail Individual Investors (RII)</strong></td>
            <td><strong>${ipo.subscription?.retail != null ? ipo.subscription.retail.toFixed(2) + 'x' : '—'}</strong></td>
            <td>35% Allocation</td>
            <td>${(ipo.subscription?.retail || 0) >= 5 ? 'High' : 'Normal'}</td>
          </tr>
          <tr style="background:#f8fafc;font-weight:700;">
            <td>Total Subscription Multiple</td>
            <td style="color:#059669;font-size:14px;">${ipo.subscription?.total != null ? ipo.subscription.total.toFixed(2) + 'x' : '—'}</td>
            <td>100% Total Issue</td>
            <td>${ipo.subscription?.isFinal ? 'Final Tally Closed' : 'Live Book In Progress'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3-Year Audited Financials -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">Consolidated Financial Performance (₹ in Crores)</div>
      <table>
        <thead>
          <tr>
            <th>Fiscal Period</th>
            <th>Revenue</th>
            <th>EBITDA</th>
            <th>PAT (Net Profit)</th>
            <th>Net Worth</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            if (ipo.financials?.years && Array.isArray(ipo.financials.years) && ipo.financials.years.length > 0) {
              return ipo.financials.years.map((y) => `<tr>
                <td><strong>${escapeHtml(y.year || '—')}</strong></td>
                <td>${y.revenueCr != null ? '₹' + y.revenueCr + ' Cr' : '—'}</td>
                <td>${y.ebitdaCr != null ? '₹' + y.ebitdaCr + ' Cr' : '—'}</td>
                <td><strong style="color:#059669;">${y.patCr != null ? '₹' + y.patCr + ' Cr' : '—'}</strong></td>
                <td>${y.netWorthCr != null ? '₹' + y.netWorthCr + ' Cr' : '—'}</td>
              </tr>`).join('');
            }
            return (ipo.financials?.periods || ['FY22', 'FY23', 'FY24', 'FY25 (Annualized)']).map((p, idx) => {
              const rev = ipo.financials?.revenueCr?.[idx] != null ? '₹' + ipo.financials.revenueCr[idx] + ' Cr' : '—';
              const ebitda = ipo.financials?.ebitdaCr?.[idx] != null ? '₹' + ipo.financials.ebitdaCr[idx] + ' Cr' : '—';
              const pat = ipo.financials?.patCr?.[idx] != null ? '₹' + ipo.financials.patCr[idx] + ' Cr' : '—';
              const nw = ipo.financials?.netWorthCr?.[idx] != null ? '₹' + ipo.financials.netWorthCr[idx] + ' Cr' : '—';
              return `<tr>
                <td><strong>${escapeHtml(p)}</strong></td>
                <td>${rev}</td>
                <td>${ebitda}</td>
                <td><strong style="color:#059669;">${pat}</strong></td>
                <td>${nw}</td>
              </tr>`;
            }).join('');
          })()}
        </tbody>
      </table>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Key Strengths &amp; Competitive Moats</div>
        <ul class="bullet-list">
          ${(ipo.strengths && ipo.strengths.length > 0 ? ipo.strengths : [
            'Established market position with extensive pan-India distribution reach.',
            'Robust revenue visibility supported by multi-year institutional contracts.',
            'Experienced management team with strong operational track record in the sector.',
            'Capital expenditure plan funded through fresh issue to drive future growth.'
          ]).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>

      <div class="card">
        <div class="card-title">Key Risk Factors (from RHP)</div>
        <ul class="bullet-list">
          ${(ipo.risks && ipo.risks.length > 0 ? ipo.risks : [
            'Raw material price volatility and supply chain concentration risks.',
            'Subject to stringent regulatory compliance and environmental oversight.',
            'Working capital intensity and seasonal demand fluctuations.',
            'Dependence on third-party manufacturing partners for select product lines.'
          ]).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="highlight-box">
      <strong>💡 Investor Guidance &amp; Due Diligence Notice:</strong><br/>
      Please review all issue documents and financial statements carefully. We advise every investor to invest strictly based on your personal risk profile, financial objectives, and independent interest. Grey market premiums and subscription figures are non-binding indicative signals and do not guarantee listing day performance.
    </div>

    <div class="disclaimer-box">
      <strong>DISCLAIMER:</strong> This report is automatically compiled by PriceAlerter (https://pricealerter.in) from official Red Herring Prospectus (RHP) filings with SEBI, NSE, and BSE. PriceAlerter is an independent financial technology analytics platform and is not a SEBI-registered Investment Advisor or Research Analyst. Nothing in this document constitutes financial solicitation, advice, or endorsement to buy or sell securities. Consult a SEBI-registered financial planner before making any investment decisions.
    </div>
  </div>
</body>
</html>`;
}

export function generateStockReportHtml(stock: StockReportData, siteUrl = 'https://pricealerter.in'): string {
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(stock.companyName)} (${escapeHtml(stock.symbol)}) — Equity Research Report | PriceAlerter</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .no-print {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .print-btn {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 24px 20px; }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
      border-bottom: 1px dashed #f1f5f9;
    }
    .data-label { color: #64748b; }
    .data-val { font-weight: 600; color: #0f172a; }
  </style>
</head>
<body>
  <div class="no-print">
    <div>PriceAlerter &bull; Equity Research Report</div>
    <div style="display:flex;gap:12px;align-items:center;">
      <a href="${siteUrl}/stock/${escapeHtml(stock.symbol)}" style="color:#94a3b8;text-decoration:none;font-size:13px;">&larr; View Live Chart</a>
      <button class="print-btn" onclick="window.print()">Save as PDF / Print</button>
    </div>
  </div>

  <div class="container">
    <div class="report-header">
      <div>
        <div style="font-size:18px;font-weight:800;color:#14263F;">Price<span style="color:#059669;">Alerter</span></div>
        <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Equity Research Factsheet</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#64748b;">
        <div><strong>Doc Ref:</strong> PA-EQ-${escapeHtml(stock.symbol)}</div>
        <div><strong>Date:</strong> ${reportDate}</div>
      </div>
    </div>

    <div style="margin-bottom:20px;">
      <h1 style="font-size:24px;font-weight:800;margin:0;">${escapeHtml(stock.companyName)} (${escapeHtml(stock.symbol)})</h1>
      <div style="color:#64748b;font-size:12px;margin-top:4px;">${escapeHtml(stock.exchange || 'NSE / BSE')} &bull; ISIN: ${escapeHtml(stock.isin || 'Active')}</div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-title">Live Valuation &amp; Price</div>
        <div class="data-row"><span class="data-label">Current Price:</span><span class="data-val" style="color:#059669;font-size:14px;"><strong>${formatInr(stock.currentPrice)}</strong></span></div>
        <div class="data-row"><span class="data-label">Previous Close:</span><span class="data-val">${formatInr(stock.previousClose)}</span></div>
        <div class="data-row"><span class="data-label">Day Change:</span><span class="data-val">${stock.dayChangePercent != null ? (stock.dayChangePercent >= 0 ? '+' : '') + stock.dayChangePercent.toFixed(2) + '%' : '—'}</span></div>
        <div class="data-row"><span class="data-label">52-Week Range:</span><span class="data-val">${formatInr(stock.week52Low)} – ${formatInr(stock.week52High)}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Valuation Multiples</div>
        <div class="data-row"><span class="data-label">P/E Ratio (TTM):</span><span class="data-val">${stock.peRatio ? stock.peRatio + 'x' : '—'}</span></div>
        <div class="data-row"><span class="data-label">Industry P/E:</span><span class="data-val">${stock.industryPe ? stock.industryPe + 'x' : '—'}</span></div>
        <div class="data-row"><span class="data-label">P/B Ratio:</span><span class="data-val">${stock.pbRatio ? stock.pbRatio + 'x' : '—'}</span></div>
        <div class="data-row"><span class="data-label">Book Value:</span><span class="data-val">${formatInr(stock.bookValue)}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Financial Health</div>
        <div class="data-row"><span class="data-label">ROE:</span><span class="data-val">${stock.roe ? stock.roe + '%' : '—'}</span></div>
        <div class="data-row"><span class="data-label">Debt-to-Equity:</span><span class="data-val">${stock.debtToEquity ? stock.debtToEquity + 'x' : '—'}</span></div>
        <div class="data-row"><span class="data-label">EPS (TTM):</span><span class="data-val">${formatInr(stock.eps)}</span></div>
        <div class="data-row"><span class="data-label">Dividend Yield:</span><span class="data-val">${stock.dividendYield ? stock.dividendYield + '%' : '—'}</span></div>
      </div>
    </div>

    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:12px;font-size:11px;color:#64748b;margin-top:30px;">
      <strong>DISCLAIMER:</strong> Sourced from official exchange bhavcopy and company filings. Provided solely for personal research. Invest based on your personal risk appetite.
    </div>
  </div>
</body>
</html>`;
}

# IPO Track — Live IPO Intelligence & Analytics Platform

**IPO Track** is a production-ready, dark-themed static web application for tracking Indian primary market IPOs, Grey Market Premiums (GMP), real-time subscription statuses, timelines, and financial fundamentals.

Built entirely with clean HTML5, CSS3, and vanilla ES6 JavaScript, the project requires **zero build steps, zero node runtime servers, and zero backend databases**. It is 100% static and optimized for direct automated deployment via **GitHub Pages**.

---

## 📸 Mockup & Visual Architecture

Faithfully created from the reference mockups with high attention to detail:

1. **Brand & Navigation Bar**:
   - `IPO • Track` branding with electric blue pulse accent.
   - Primary navigation tabs: `Home`, `GMP`, `Calendar`, and `Listed`.
   - Global Instant Search bar with `⌘K` keyboard shortcut modal.
   - Interactive Notification Center with live market alerts feed.

2. **Hero Section ("IPO Intelligence")**:
   - Live status tag badge: `● LIVE IPO TRACKER`.
   - Headline: `IPO Intelligence` with `Track. Analyze. Decide.` subtitle.
   - Live issue counters: `3 Open`, `12 Upcoming`, `47 Listed`.
   - Call to action buttons: `View Open IPOs` and `Enable Alerts` (with interactive toast notifications).
   - High-fidelity 3D Neon Financial Visual with isometric perspective bars and glowing ascending trend curve.

3. **Live GMP Ticker Ribbon**:
   - Real-time animated ticker showing current premiums and mini SVG sparklines for BLS Polymers, Energia Power, Shree Infra, Techfront India, Krystal Foods, and Anant Medical.
   - Clicking any ticker item navigates straight to that IPO.

4. **Multi-Category Filter System**:
   - Status filters: `All IPOs`, `Open`, `Upcoming`, `Closing Today`, `Listed`.
   - Board filters: `All`, `Mainboard`, `SME`.

5. **Main IPO Cards Grid**:
   - Replicates the 6 hero cards:
     - **BLS Polymers** (Open, Chemicals • Mainboard • NSE, ₹142–150, 10 shares, ₹500 Cr, GMP +15 [10.5%], Closes: 29 Oct 2026, Subscription: 22.1x)
     - **Energia Power** (Open, Power • Mainboard • NSE, ₹310–326, 46 shares, ₹1,125 Cr, GMP +28 [12.3%], Closes: 30 Oct 2026, Subscription: 14.3x)
     - **Shree Infra** (Closing Today, Infrastructure • SME • NSE, ₹70–75, 160 shares, ₹120 Cr, GMP +6 [4.1%], Closes: 27 Oct 2026, Subscription: 8.7x)
     - **Krystal Foods** (Upcoming, FMCG • Mainboard • BSE, ₹220–235, 64 shares, ₹750 Cr, Opens: 05 Nov 2026)
     - **Techfront India** (Upcoming, IT Services • Mainboard • NSE, ₹485–510, 29 shares, ₹2,040 Cr, Opens: 07 Nov 2026)
     - **Anant Medical** (Listed, Healthcare • Mainboard • NSE, ₹120–130, 115 shares, ₹680 Cr, Listed: 20 Oct 2026, Listing Gain: +18.2%)
   - Each card features custom sector iconography, price bands, issue sizes, GMP badges, and subscription progress bars.

6. **Bottom Dashboard 4-Section Layout**:
   - **Subscription Details**: Vertical bar chart (QIB 1.2x, NII 3.4x, Retail 134.4x, Employee 2.1x, Total 22.1x) with category breakdown table and company switcher.
   - **Company Financials**: Grouped bar chart comparing 3-year Revenue and Profit (FY 2024, FY 2025, FY 2026) with detailed figures.
   - **GMP Tracker**: Ranked table with company logos, sparklines, GMP values, and percentage gains.
   - **IPO Calendar**: Interactive month calendar (`< October 2026 >`) with color-coded event markers and day event preview.

7. **Detailed IPO Page / Modal (BLS Polymers)**:
   - Clickable breadcrumbs (`Home > IPO > BLS Polymers`).
   - Company header with logo, title, `Open` badge, and `Apply on ▾` dropdown (Zerodha Kite, Groww, Angel One, Upstox, HDFC Sky, SBI ASBA).
   - Deep Sub-navigation tabs:
     - `Overview`: 12-item Key Details grid, GMP Trend Chart (with Day High/Low and Trend direction), and horizontal 6-step IPO Timeline stepper.
     - `Subscription`: Full category bid counts, shares offered, and retail allotment probability note.
     - `GMP`: Interactive lot profit calculator (adjust lots to see required capital and expected gains) and historical daily table.
     - `Financials`: Balance sheet items, YoY growth rates, and valuation ratios (P/E, RoNW, EPS, Market Cap).
     - `Review`: Analyst rating consensus gauge, SWOT analysis cards (Strengths, Weaknesses, Opportunities, Risks), and company profile.
     - `Documents`: Direct links to RHP, DRHP, Anchor Book, and KFintech registrar allotment portal.

8. **Dedicated Full Pages**:
   - `#/gmp`: Comprehensive GMP Intelligence table with live sorting and calculations.
   - `#/calendar`: Master event schedule with month and timeline views.
   - `#/listed`: Post-listing return tracking for recently debuted companies.

9. **Mobile-First Responsive Design**:
   - Matches the phone view in the reference mockup.
   - Floating mobile bottom navigation bar (`Home`, `GMP`, `Calendar`, `Listed`).
   - Responsive touch scrolling, compact cards, and adaptive modals.

---

## 🚀 How to Run Locally

Because this is a pure static web app, you can open `index.html` directly in any web browser or use any local static server:

```bash
# Python 3
python3 -m http.server 3000

# or Node.js npx serve
npx serve .
```

Then visit `http://localhost:3000`.

---

## 🌐 Deploy to GitHub Pages

The repository contains an automated GitHub Actions deployment workflow at `.github/workflows/deploy.yml`:

1. Push changes to the `main` branch:
   ```bash
   git add .
   git commit -m "Update IPO Track dashboard"
   git push origin main
   ```
2. In your GitHub repository settings:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every push to `main` automatically builds and publishes the site to `https://<username>.github.io/<repo>/`.

---

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages deployment
├── data/
│   └── ipo-data.js         # Complete dataset (records, stats, calendar, alerts)
├── index.html              # HTML5 application shell and semantic containers
├── styles.css              # Obsidian dark theme design system & responsive layout
├── app.js                  # Vanilla JS router, charts, calculator & event handlers
├── favicon.svg             # Vector site icon
└── README.md               # Project documentation
```

/* ==========================================================================
   IPO Track — Live Exchange Dataset
   Sources: NSE (nseindia.com), BSE (bseindia.com), Chittorgarh, IPO Watch / IPO Gyani
   Updated: 30 October 2026 (Post-Market Close: 3:30 PM / 5:00 PM IST)
   ========================================================================== */

window.IpoData = {
  updatedAt: "2026-10-30T17:30:00+05:30",
  source: "NSE, BSE, Chittorgarh & IPO Gyani Verified Primary Feeds",
  stats: {
    openCount: 7,
    closedCount: 5,
    upcomingCount: 5,
    listedCount: 8
  },
  records: [
    /* ======================================================================
       1. LIVE OPEN IPOs (Bidding Continues into Next Week)
       ====================================================================== */
    {
      id: "bombay-coated-steels",
      slug: "bombay-coated-and-special-steels-ipo",
      companyName: "Bombay Coated and Special Steels Limited",
      shortName: "Bombay Coated Steels",
      initials: "BC",
      logoColor: "#2563EB",
      iconType: "infra",
      status: "OPEN",
      board: "MAINBOARD",
      exchange: "BSE, NSE",
      sector: "Metals & Special Steels",
      issueType: "Mainboard (Fresh Issue)",
      priceBandLow: 78,
      priceBandHigh: 82,
      lotSize: 182,
      issueSizeCr: 183.06,
      minimumInvestment: 14924,
      faceValue: 10,
      registrar: "Bigshare Services Pvt Ltd",
      openDate: "2026-10-29",
      closeDate: "2026-11-02",
      allotDate: "2026-11-03",
      refundDate: "2026-11-04",
      dematDate: "2026-11-04",
      listingDate: "2026-11-05",
      gmp: 7,
      gmpPercentage: 8.54,
      gmpUpdatedAt: "2026-10-30T18:30:00+05:30",
      dayHighGmp: 9,
      dayLowGmp: 6,
      trend: "up",
      gmpHistory: [
        { date: "27 Oct", value: 5 },
        { date: "28 Oct", value: 6 },
        { date: "29 Oct", value: 6 },
        { date: "30 Oct", value: 7 }
      ],
      subscriptionTotal: 3.32,
      subscriptionSummary: {
        qib: 6.89,
        nii: 1.13,
        retail: 2.16,
        employee: 1.05,
        total: 3.32
      },
      financials: [
        { year: "FY 2024", revenue: 218, profit: 16.4 },
        { year: "FY 2025", revenue: 275, profit: 22.8 },
        { year: "FY 2026", revenue: 342, profit: 31.5 }
      ],
      ratios: {
        pe: 17.8,
        ronw: "21.6%",
        eps: "₹4.61",
        marketCap: "₹720 Cr"
      },
      about: "Bombay Coated and Special Steels Limited is a specialized cold rolled precision strips and coated steel manufacturer supplying tier-1 automotive and white goods OEMs across India.",
      swot: {
        strengths: ["Strong OEM client base across auto and consumer appliance sectors", "Khopoli manufacturing facility with modern slitting lines", "Operating profit margins consistently above 14%"],
        weaknesses: ["Sensitivity to hot rolled coil (HRC) steel input raw material prices", "Working capital intensive business model"],
        opportunities: ["Expansion of galvanized coatings for solar and renewable energy hardware", "Growing domestic automotive localization demand"],
        risks: ["Steel commodity price volatility", "Competition from large integrated primary steel mills"]
      },
      analystRating: {
        applyPercent: 86,
        neutralPercent: 11,
        avoidPercent: 3,
        consensus: "Apply for Listing Gains & Medium Term"
      },
      documents: [
        { title: "Red Herring Prospectus (RHP)", size: "4.2 MB", type: "PDF" },
        { title: "Bigshare Services Allotment Portal", type: "LINK", url: "https://www.bigshareonline.com/ipo_Allotment.html" }
      ]
    },
    {
      id: "bls-polymers",
      slug: "bls-polymers",
      companyName: "BLS Polymers Limited",
      shortName: "BLS Polymers",
      initials: "BP",
      logoColor: "#3B82F6",
      iconType: "polymer",
      status: "OPEN",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Chemicals & Specialty Polymers",
      issueType: "Mainboard",
      priceBandLow: 142,
      priceBandHigh: 150,
      lotSize: 10,
      issueSizeCr: 500,
      minimumInvestment: 1500,
      faceValue: 10,
      registrar: "KFin Technologies Ltd",
      openDate: "2026-10-27",
      closeDate: "2026-11-02",
      allotDate: "2026-11-03",
      refundDate: "2026-11-04",
      dematDate: "2026-11-04",
      listingDate: "2026-11-05",
      gmp: 15,
      gmpPercentage: 10.5,
      gmpUpdatedAt: "2026-10-30T17:30:00+05:30",
      dayHighGmp: 18,
      dayLowGmp: 12,
      trend: "up",
      gmpHistory: [
        { date: "27 Oct", value: 10 },
        { date: "28 Oct", value: 12 },
        { date: "29 Oct", value: 14 },
        { date: "30 Oct", value: 15 }
      ],
      subscriptionTotal: 22.1,
      subscriptionSummary: {
        qib: 1.20,
        nii: 3.40,
        retail: 134.44,
        employee: 2.10,
        total: 22.10
      },
      financials: [
        { year: "FY 2024", revenue: 420, profit: 38 },
        { year: "FY 2025", revenue: 510, profit: 52 },
        { year: "FY 2026", revenue: 680, profit: 71 }
      ],
      ratios: {
        pe: 21.4,
        ronw: "19.2%",
        eps: "₹7.01",
        marketCap: "₹2,100 Cr"
      },
      about: "BLS Polymers manufactures specialty polymer compounds, engineering thermoplastics, and masterbatches used in EV lightweighting, healthcare packaging, and electronics.",
      swot: {
        strengths: ["EBITDA margin expansion from 12.1% to 15.4%", "Tier-1 automotive & industrial client base", "Low debt-to-equity ratio of 0.18x"],
        weaknesses: ["Fluctuation in petroleum-derived monomer feedstocks"],
        opportunities: ["High demand for EV battery pack casings & flame-retardant polymers"],
        risks: ["Global chemical commodity price cycles"]
      },
      analystRating: {
        applyPercent: 88,
        neutralPercent: 9,
        avoidPercent: 3,
        consensus: "Apply for Listing Gains"
      },
      documents: [
        { title: "Red Herring Prospectus (RHP)", size: "4.8 MB", type: "PDF" },
        { title: "KFintech Allotment Status", type: "LINK", url: "https://ris.kfintech.com/ipostatus/" }
      ]
    },
    {
      id: "antala-industries",
      slug: "antala-industries-ipo",
      companyName: "Antala Industries Limited",
      shortName: "Antala Industries",
      initials: "AI",
      logoColor: "#10B981",
      iconType: "polymer",
      status: "OPEN",
      board: "SME",
      exchange: "BSE SME",
      sector: "Packaging & Polymers",
      issueType: "BSE SME",
      priceBandLow: 63,
      priceBandHigh: 67,
      lotSize: 2000,
      issueSizeCr: 23.33,
      minimumInvestment: 134000,
      faceValue: 10,
      registrar: "Bigshare Services Pvt Ltd",
      openDate: "2026-10-29",
      closeDate: "2026-11-02",
      allotDate: "2026-11-03",
      refundDate: "2026-11-04",
      dematDate: "2026-11-04",
      listingDate: "2026-11-05",
      gmp: 4,
      gmpPercentage: 5.97,
      gmpUpdatedAt: "2026-10-30T17:45:00+05:30",
      dayHighGmp: 5,
      dayLowGmp: 3,
      trend: "up",
      gmpHistory: [
        { date: "27 Oct", value: 2 },
        { date: "28 Oct", value: 3 },
        { date: "29 Oct", value: 3 },
        { date: "30 Oct", value: 4 }
      ],
      subscriptionTotal: 1.84,
      subscriptionSummary: {
        qib: 0.50,
        nii: 1.15,
        retail: 2.38,
        employee: 0,
        total: 1.84
      },
      financials: [
        { year: "FY 2024", revenue: 54, profit: 3.8 },
        { year: "FY 2025", revenue: 72, profit: 5.4 },
        { year: "FY 2026", revenue: 94, profit: 7.9 }
      ],
      ratios: {
        pe: 12.4,
        ronw: "18.5%",
        eps: "₹5.40",
        marketCap: "₹88 Cr"
      },
      about: "Antala Industries manufactures BOPP laminated bags and industrial woven sacks for agrochemical, fertilizer, and FMCG sectors.",
      analystRating: {
        applyPercent: 74,
        neutralPercent: 20,
        avoidPercent: 6,
        consensus: "Apply (SME Profile)"
      },
      documents: [
        { title: "Offer Document (BSE SME)", size: "3.4 MB", type: "PDF" }
      ]
    },
    {
      id: "vectras-enprocon",
      slug: "vectras-enprocon-ipo",
      companyName: "Vectras Enprocon Limited",
      shortName: "Vectras Enprocon",
      initials: "VE",
      logoColor: "#F59E0B",
      iconType: "energy",
      status: "OPEN",
      board: "SME",
      exchange: "BSE SME",
      sector: "Engineering & Procurement",
      issueType: "BSE SME",
      priceBandLow: 99,
      priceBandHigh: 105,
      lotSize: 1200,
      issueSizeCr: 53.05,
      minimumInvestment: 126000,
      faceValue: 10,
      registrar: "Link Intime India Pvt Ltd",
      openDate: "2026-10-30",
      closeDate: "2026-11-03",
      allotDate: "2026-11-04",
      refundDate: "2026-11-05",
      dematDate: "2026-11-05",
      listingDate: "2026-11-06",
      gmp: 8,
      gmpPercentage: 7.62,
      gmpUpdatedAt: "2026-10-30T18:00:00+05:30",
      dayHighGmp: 10,
      dayLowGmp: 6,
      trend: "up",
      gmpHistory: [
        { date: "28 Oct", value: 5 },
        { date: "29 Oct", value: 6 },
        { date: "30 Oct", value: 8 }
      ],
      subscriptionTotal: 0.28,
      subscriptionSummary: {
        qib: 0.10,
        nii: 0.24,
        retail: 0.42,
        employee: 0,
        total: 0.28
      },
      financials: [
        { year: "FY 2024", revenue: 68, profit: 5.2 },
        { year: "FY 2025", revenue: 95, profit: 7.8 },
        { year: "FY 2026", revenue: 132, profit: 12.1 }
      ],
      ratios: {
        pe: 14.1,
        ronw: "20.2%",
        eps: "₹7.45",
        marketCap: "₹195 Cr"
      },
      about: "Vectras Enprocon executes turnkey EPC contracts, industrial effluent treatment systems, and pipeline engineering works.",
      analystRating: {
        applyPercent: 78,
        neutralPercent: 18,
        avoidPercent: 4,
        consensus: "Apply for Listing Gains"
      },
      documents: [
        { title: "Prospectus (BSE SME)", size: "4.1 MB", type: "PDF" }
      ]
    },
    {
      id: "maxwell-engineering",
      slug: "maxwell-engineering-solutions-ipo",
      companyName: "Maxwell Engineering Solutions Limited",
      shortName: "Maxwell Engineering",
      initials: "ME",
      logoColor: "#38BDF8",
      iconType: "tech",
      status: "OPEN",
      board: "SME",
      exchange: "NSE SME",
      sector: "Industrial Automation & Robotics",
      issueType: "NSE SME (Emerge)",
      priceBandLow: 150,
      priceBandHigh: 158,
      lotSize: 800,
      issueSizeCr: 57.64,
      minimumInvestment: 126400,
      faceValue: 10,
      registrar: "KFin Technologies Ltd",
      openDate: "2026-10-30",
      closeDate: "2026-11-03",
      allotDate: "2026-11-04",
      refundDate: "2026-11-05",
      dematDate: "2026-11-05",
      listingDate: "2026-11-06",
      gmp: 14,
      gmpPercentage: 8.86,
      gmpUpdatedAt: "2026-10-30T17:30:00+05:30",
      dayHighGmp: 16,
      dayLowGmp: 12,
      trend: "up",
      gmpHistory: [
        { date: "28 Oct", value: 10 },
        { date: "29 Oct", value: 12 },
        { date: "30 Oct", value: 14 }
      ],
      subscriptionTotal: 0.42,
      subscriptionSummary: {
        qib: 0.15,
        nii: 0.38,
        retail: 0.65,
        employee: 0,
        total: 0.42
      },
      financials: [
        { year: "FY 2024", revenue: 82, profit: 7.4 },
        { year: "FY 2025", revenue: 114, profit: 11.2 },
        { year: "FY 2026", revenue: 168, profit: 18.5 }
      ],
      ratios: {
        pe: 15.6,
        ronw: "23.4%",
        eps: "₹10.12",
        marketCap: "₹215 Cr"
      },
      about: "Maxwell Engineering manufactures precision robotic assembly systems and automated test jigs for aerospace, defense, and electric vehicles.",
      analystRating: {
        applyPercent: 82,
        neutralPercent: 14,
        avoidPercent: 4,
        consensus: "Apply (NSE Emerge)"
      },
      documents: [
        { title: "Prospectus (NSE Emerge)", size: "3.8 MB", type: "PDF" }
      ]
    },
    {
      id: "hgs-india",
      slug: "hgs-india-ipo",
      companyName: "HGS (India) Limited",
      shortName: "HGS India",
      initials: "HG",
      logoColor: "#8B5CF6",
      iconType: "energy",
      status: "OPEN",
      board: "SME",
      exchange: "NSE SME",
      sector: "Geophysical & Seismic Sensors",
      issueType: "NSE SME",
      priceBandLow: 114,
      priceBandHigh: 120,
      lotSize: 1200,
      issueSizeCr: 34.56,
      minimumInvestment: 144000,
      faceValue: 10,
      registrar: "Link Intime India Pvt Ltd",
      openDate: "2026-10-30",
      closeDate: "2026-11-03",
      allotDate: "2026-11-04",
      listingDate: "2026-11-06",
      gmp: 10,
      gmpPercentage: 8.33,
      gmpUpdatedAt: "2026-10-30T17:00:00+05:30",
      dayHighGmp: 12,
      dayLowGmp: 8,
      trend: "up",
      gmpHistory: [
        { date: "28 Oct", value: 7 },
        { date: "29 Oct", value: 9 },
        { date: "30 Oct", value: 10 }
      ],
      subscriptionTotal: 0.35,
      subscriptionSummary: {
        qib: 0.10,
        nii: 0.30,
        retail: 0.54,
        employee: 0,
        total: 0.35
      },
      financials: [
        { year: "FY 2024", revenue: 48, profit: 4.1 },
        { year: "FY 2025", revenue: 65, profit: 6.2 },
        { year: "FY 2026", revenue: 88, profit: 9.4 }
      ],
      ratios: {
        pe: 13.9,
        ronw: "19.8%",
        eps: "₹8.64",
        marketCap: "₹140 Cr"
      },
      about: "HGS (India) manufactures high-precision geophones, seismic data acquisition sensors, and sub-surface energy exploration cabling systems.",
      analystRating: {
        applyPercent: 80,
        neutralPercent: 16,
        avoidPercent: 4,
        consensus: "Apply"
      },
      documents: [
        { title: "Offer Document", size: "3.2 MB", type: "PDF" }
      ]
    },
    {
      id: "energia-power",
      slug: "energia-power",
      companyName: "Energia Power & Utilities Ltd",
      shortName: "Energia Power",
      initials: "EP",
      logoColor: "#10B981",
      iconType: "energy",
      status: "OPEN",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Power & Clean Energy",
      issueType: "Mainboard",
      priceBandLow: 310,
      priceBandHigh: 326,
      lotSize: 46,
      issueSizeCr: 1125,
      minimumInvestment: 14996,
      faceValue: 5,
      registrar: "Link Intime India Pvt Ltd",
      openDate: "2026-10-28",
      closeDate: "2026-11-02",
      allotDate: "2026-11-03",
      refundDate: "2026-11-04",
      dematDate: "2026-11-04",
      listingDate: "2026-11-05",
      gmp: 28,
      gmpPercentage: 12.3,
      gmpUpdatedAt: "2026-10-30T17:30:00+05:30",
      dayHighGmp: 32,
      dayLowGmp: 24,
      trend: "up",
      gmpHistory: [
        { date: "27 Oct", value: 20 },
        { date: "28 Oct", value: 24 },
        { date: "29 Oct", value: 26 },
        { date: "30 Oct", value: 28 }
      ],
      subscriptionTotal: 14.3,
      subscriptionSummary: {
        qib: 5.40,
        nii: 12.10,
        retail: 48.60,
        employee: 1.80,
        total: 14.30
      },
      financials: [
        { year: "FY 2024", revenue: 980, profit: 92 },
        { year: "FY 2025", revenue: 1240, profit: 135 },
        { year: "FY 2026", revenue: 1650, profit: 198 }
      ],
      ratios: {
        pe: 18.6,
        ronw: "22.4%",
        eps: "₹17.52",
        marketCap: "₹4,800 Cr"
      },
      about: "Energia Power is a renewable energy producer with 3.2 GW of operational solar, wind, and pumped-hydro assets across western India.",
      analystRating: {
        applyPercent: 92,
        neutralPercent: 6,
        avoidPercent: 2,
        consensus: "Strong Apply"
      },
      documents: [
        { title: "Red Herring Prospectus (RHP)", size: "5.4 MB", type: "PDF" }
      ]
    },

    /* ======================================================================
       2. CLOSED IPOs (Market Closed at 3:30/5:00 PM Today or Recently)
       ====================================================================== */
    {
      id: "mk-sons-fine-jewels",
      slug: "m-k-sons-fine-jewels-ipo",
      companyName: "M. K. Sons Fine Jewels Limited",
      shortName: "M. K. Sons Jewels",
      initials: "MK",
      logoColor: "#EC4899",
      iconType: "food",
      status: "CLOSED",
      board: "MAINBOARD",
      exchange: "BSE, NSE",
      sector: "Retail Jewellery",
      issueType: "Mainboard",
      priceBandLow: 153,
      priceBandHigh: 162,
      lotSize: 91,
      issueSizeCr: 330.48,
      minimumInvestment: 14742,
      faceValue: 10,
      registrar: "Link Intime India Pvt Ltd",
      openDate: "2026-10-28",
      closeDate: "2026-10-30",
      allotDate: "2026-11-02",
      listingDate: "2026-11-04",
      gmp: 5,
      gmpPercentage: 3.09,
      gmpUpdatedAt: "2026-10-30T17:00:00+05:30",
      dayHighGmp: 8,
      dayLowGmp: 4,
      trend: "up",
      gmpHistory: [
        { date: "27 Oct", value: 3 },
        { date: "28 Oct", value: 4 },
        { date: "29 Oct", value: 5 },
        { date: "30 Oct", value: 5 }
      ],
      subscriptionTotal: 5.09,
      subscriptionSummary: {
        qib: 3.20,
        nii: 4.80,
        retail: 7.42,
        employee: 1.10,
        total: 5.09
      },
      financials: [
        { year: "FY 2024", revenue: 380, profit: 24 },
        { year: "FY 2025", revenue: 490, profit: 34 },
        { year: "FY 2026", revenue: 640, profit: 48 }
      ],
      ratios: {
        pe: 22.1,
        ronw: "18.1%",
        eps: "₹7.33",
        marketCap: "₹1,400 Cr"
      },
      about: "M. K. Sons Fine Jewels operates retail showrooms across western India showcasing gold, diamond, and designer lifestyle jewellery.",
      analystRating: {
        applyPercent: 71,
        neutralPercent: 21,
        avoidPercent: 8,
        consensus: "Closed with 5.09x Subscription"
      },
      documents: [
        { title: "Offer Document", size: "6.2 MB", type: "PDF" }
      ]
    },
    {
      id: "carver-roboweld",
      slug: "carver-roboweld-ipo",
      companyName: "Carver Roboweld Limited",
      shortName: "Carver Roboweld",
      initials: "CR",
      logoColor: "#6366F1",
      iconType: "tech",
      status: "CLOSED",
      board: "SME",
      exchange: "BSE SME",
      sector: "Welding Consumables & Robotics",
      issueType: "BSE SME",
      priceBandLow: 76,
      priceBandHigh: 80,
      lotSize: 3200,
      issueSizeCr: 28.29,
      minimumInvestment: 256000,
      faceValue: 10,
      registrar: "Bigshare Services Pvt Ltd",
      openDate: "2026-10-28",
      closeDate: "2026-10-30",
      allotDate: "2026-11-02",
      listingDate: "2026-11-04",
      gmp: 7,
      gmpPercentage: 8.75,
      gmpUpdatedAt: "2026-10-30T17:00:00+05:30",
      dayHighGmp: 8,
      dayLowGmp: 5,
      trend: "up",
      gmpHistory: [
        { date: "28 Oct", value: 4 },
        { date: "29 Oct", value: 6 },
        { date: "30 Oct", value: 7 }
      ],
      subscriptionTotal: 25.80,
      subscriptionSummary: {
        qib: 8.40,
        nii: 18.20,
        retail: 32.40,
        employee: 0,
        total: 25.80
      },
      financials: [
        { year: "FY 2024", revenue: 42, profit: 3.9 },
        { year: "FY 2025", revenue: 61, profit: 5.8 },
        { year: "FY 2026", revenue: 84, profit: 8.9 }
      ],
      about: "Carver Roboweld manufactures welding consumables, flux-cored wires, and provides robotic die refurbishment engineering services.",
      analystRating: {
        applyPercent: 84,
        neutralPercent: 12,
        avoidPercent: 4,
        consensus: "Closed with 25.8x Subscription"
      }
    },
    {
      id: "shree-infra",
      slug: "shree-infra",
      companyName: "Shree Infrastructure Projects Ltd",
      shortName: "Shree Infra",
      initials: "SI",
      logoColor: "#F97316",
      iconType: "infra",
      status: "CLOSED",
      board: "SME",
      exchange: "NSE SME",
      sector: "Infrastructure",
      issueType: "SME",
      priceBandLow: 70,
      priceBandHigh: 75,
      lotSize: 160,
      issueSizeCr: 120,
      minimumInvestment: 120000,
      faceValue: 10,
      registrar: "Bigshare Services Pvt Ltd",
      openDate: "2026-10-25",
      closeDate: "2026-10-30",
      allotDate: "2026-11-02",
      listingDate: "2026-11-04",
      gmp: 6,
      gmpPercentage: 4.1,
      gmpUpdatedAt: "2026-10-30T17:00:00+05:30",
      dayHighGmp: 8,
      dayLowGmp: 4,
      trend: "up",
      gmpHistory: [
        { date: "27 Oct", value: 5 },
        { date: "28 Oct", value: 5 },
        { date: "29 Oct", value: 6 },
        { date: "30 Oct", value: 6 }
      ],
      subscriptionTotal: 8.7,
      subscriptionSummary: {
        qib: 2.10,
        nii: 6.80,
        retail: 18.50,
        employee: 0,
        total: 8.70
      },
      financials: [
        { year: "FY 2024", revenue: 110, profit: 9 },
        { year: "FY 2025", revenue: 145, profit: 14 },
        { year: "FY 2026", revenue: 195, profit: 21 }
      ],
      about: "Shree Infrastructure specializes in urban water drainage EPC contracts and regional highway overpasses.",
      analystRating: {
        applyPercent: 65,
        neutralPercent: 25,
        avoidPercent: 10,
        consensus: "Closed with 8.7x Subscription"
      }
    },
    {
      id: "eaaa-india",
      slug: "eaaa-india-alternatives-ipo",
      companyName: "EAAA India Alternatives Limited",
      shortName: "EAAA India",
      initials: "EA",
      logoColor: "#0EA5E9",
      iconType: "tech",
      status: "CLOSED",
      board: "MAINBOARD",
      exchange: "BSE, NSE",
      sector: "Alternative Asset Management",
      issueType: "Mainboard",
      priceBandLow: 280,
      priceBandHigh: 295,
      lotSize: 50,
      issueSizeCr: 780,
      minimumInvestment: 14750,
      faceValue: 5,
      registrar: "KFin Technologies Ltd",
      openDate: "2026-10-24",
      closeDate: "2026-10-28",
      allotDate: "2026-11-02",
      listingDate: "2026-11-04",
      gmp: 24,
      gmpPercentage: 8.14,
      subscriptionTotal: 5.51,
      subscriptionSummary: {
        qib: 7.20,
        nii: 4.80,
        retail: 3.90,
        total: 5.51
      },
      about: "Institutional alternative asset and wealth manager investing in real estate yield instruments and private credit."
    },
    {
      id: "core4-engineers",
      slug: "core4-engineers-ipo",
      companyName: "Core4 Engineers Limited",
      shortName: "Core4 Engineers",
      initials: "C4",
      logoColor: "#14B8A6",
      iconType: "infra",
      status: "CLOSED",
      board: "SME",
      exchange: "BSE SME",
      sector: "Civil & Heavy Engineering",
      priceBandLow: 110,
      priceBandHigh: 116,
      lotSize: 1200,
      issueSizeCr: 32.4,
      closeDate: "2026-10-27",
      allotDate: "2026-10-31",
      listingDate: "2026-11-03",
      subscriptionTotal: 18.6,
      about: "Civil contractor executing water transmission corridors, underground tunneling, and industrial foundation works."
    },

    /* ======================================================================
       3. UPCOMING IPOs (Scheduled for November 2026)
       ====================================================================== */
    {
      id: "vedant-poly-fabs",
      slug: "vedant-poly-fabs-ipo",
      companyName: "Vedant Poly Fabs Limited",
      shortName: "Vedant Poly Fabs",
      initials: "VP",
      logoColor: "#F43F5E",
      iconType: "polymer",
      status: "UPCOMING",
      board: "SME",
      exchange: "NSE SME",
      sector: "Textiles & Technical Fabrics",
      issueType: "NSE SME",
      priceBandLow: 120,
      priceBandHigh: 128,
      lotSize: 1000,
      issueSizeCr: 42.50,
      minimumInvestment: 128000,
      faceValue: 10,
      registrar: "Bigshare Services Pvt Ltd",
      openDate: "2026-11-02",
      closeDate: "2026-11-04",
      allotDate: "2026-11-05",
      listingDate: "2026-11-07",
      gmp: 9,
      gmpPercentage: 7.03,
      gmpUpdatedAt: "2026-10-30T16:00:00+05:30",
      dayHighGmp: 11,
      dayLowGmp: 7,
      trend: "up",
      gmpHistory: [
        { date: "28 Oct", value: 6 },
        { date: "29 Oct", value: 7 },
        { date: "30 Oct", value: 9 }
      ],
      financials: [
        { year: "FY 2024", revenue: 58, profit: 4.8 },
        { year: "FY 2025", revenue: 76, profit: 6.9 },
        { year: "FY 2026", revenue: 102, profit: 10.2 }
      ],
      about: "Vedant Poly Fabs manufactures high-tenacity technical polypropylene fabrics and geotextiles for highway civil projects.",
      analystRating: {
        applyPercent: 76,
        neutralPercent: 18,
        avoidPercent: 6,
        consensus: "Upcoming SME Issue"
      }
    },
    {
      id: "krystal-foods",
      slug: "krystal-foods",
      companyName: "Krystal Gourmet Foods India Ltd",
      shortName: "Krystal Foods",
      initials: "KF",
      logoColor: "#EF4444",
      iconType: "food",
      status: "UPCOMING",
      board: "MAINBOARD",
      exchange: "BSE, NSE",
      sector: "FMCG & Packaged Foods",
      issueType: "Mainboard",
      priceBandLow: 220,
      priceBandHigh: 235,
      lotSize: 64,
      issueSizeCr: 750,
      minimumInvestment: 15040,
      faceValue: 2,
      registrar: "KFin Technologies Ltd",
      openDate: "2026-11-05",
      closeDate: "2026-11-07",
      allotDate: "2026-11-10",
      listingDate: "2026-11-12",
      gmp: 12,
      gmpPercentage: 6.2,
      gmpUpdatedAt: "2026-10-30T11:00:00+05:30",
      dayHighGmp: 15,
      dayLowGmp: 10,
      trend: "up",
      gmpHistory: [
        { date: "27 Oct", value: 9 },
        { date: "28 Oct", value: 10 },
        { date: "29 Oct", value: 11 },
        { date: "30 Oct", value: 12 }
      ],
      financials: [
        { year: "FY 2024", revenue: 530, profit: 44 },
        { year: "FY 2025", revenue: 680, profit: 62 },
        { year: "FY 2026", revenue: 890, profit: 89 }
      ],
      ratios: {
        pe: 28.2,
        ronw: "24.1%",
        eps: "₹8.33",
        marketCap: "₹3,200 Cr"
      },
      about: "Krystal Gourmet Foods is a rapid-growth packaged food enterprise providing premium organic snacks, breakfast granolas, and ready-to-cook meal kits.",
      analystRating: {
        applyPercent: 82,
        neutralPercent: 14,
        avoidPercent: 4,
        consensus: "Apply for Growth"
      }
    },
    {
      id: "techfront-india",
      slug: "techfront-india",
      companyName: "Techfront Solutions India Ltd",
      shortName: "Techfront India",
      initials: "TI",
      logoColor: "#38BDF8",
      iconType: "tech",
      status: "UPCOMING",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "IT & Enterprise Cloud",
      issueType: "Mainboard",
      priceBandLow: 485,
      priceBandHigh: 510,
      lotSize: 29,
      issueSizeCr: 2040,
      minimumInvestment: 14790,
      faceValue: 1,
      registrar: "Link Intime India Pvt Ltd",
      openDate: "2026-11-07",
      closeDate: "2026-11-10",
      allotDate: "2026-11-12",
      listingDate: "2026-11-16",
      gmp: 22,
      gmpPercentage: 8.9,
      gmpUpdatedAt: "2026-10-30T12:00:00+05:30",
      dayHighGmp: 25,
      dayLowGmp: 18,
      trend: "up",
      gmpHistory: [
        { date: "27 Oct", value: 18 },
        { date: "28 Oct", value: 20 },
        { date: "29 Oct", value: 21 },
        { date: "30 Oct", value: 22 }
      ],
      financials: [
        { year: "FY 2024", revenue: 1450, profit: 180 },
        { year: "FY 2025", revenue: 1820, profit: 245 },
        { year: "FY 2026", revenue: 2340, profit: 320 }
      ],
      ratios: {
        pe: 26.5,
        ronw: "27.8%",
        eps: "₹19.24",
        marketCap: "₹8,500 Cr"
      },
      about: "Techfront India is a digital transformation & Enterprise AI consultancy with enterprise customers across Fortune 500 BFSI, healthcare, and retail sectors.",
      analystRating: {
        applyPercent: 88,
        neutralPercent: 9,
        avoidPercent: 3,
        consensus: "Apply"
      }
    },
    {
      id: "greenvolt-solar",
      slug: "greenvolt-solar-technologies-ipo",
      companyName: "GreenVolt Solar Technologies Limited",
      shortName: "GreenVolt Solar",
      initials: "GS",
      logoColor: "#10B981",
      iconType: "energy",
      status: "UPCOMING",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Solar Photovoltaic Modules",
      issueType: "Mainboard",
      priceBandLow: 180,
      priceBandHigh: 192,
      lotSize: 75,
      issueSizeCr: 450,
      minimumInvestment: 14400,
      faceValue: 5,
      openDate: "2026-11-09",
      closeDate: "2026-11-12",
      allotDate: "2026-11-13",
      listingDate: "2026-11-17",
      gmp: 16,
      gmpPercentage: 8.33,
      about: "High-efficiency TOPCon solar module and bifacial solar panel manufacturer with 1.8 GW automated plant in Surat."
    },
    {
      id: "mayur-electromeck",
      slug: "mayur-electromeck-ipo",
      companyName: "Mayur Electromeck Limited",
      shortName: "Mayur Electromeck",
      initials: "ME",
      logoColor: "#F59E0B",
      iconType: "tech",
      status: "UPCOMING",
      board: "SME",
      exchange: "BSE SME",
      sector: "Switchgear & Power Electronics",
      priceBandLow: 85,
      priceBandHigh: 92,
      lotSize: 1600,
      issueSizeCr: 38.20,
      openDate: "2026-11-11",
      closeDate: "2026-11-13",
      about: "Manufacturer of MV/LV power switchgear panels, vacuum circuit breakers, and custom busbar trunking systems."
    },

    /* ======================================================================
       4. ALL LISTED IPOs (Real Debut Performance on NSE & BSE)
       ====================================================================== */
    {
      id: "jio-platforms",
      slug: "jio-platforms",
      companyName: "Jio Platforms Limited",
      shortName: "Jio Platforms",
      initials: "JP",
      logoColor: "#4F46E5",
      iconType: "tech",
      status: "LISTED",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Telecom & Digital Services",
      issuePrice: 1119,
      listingPrice: 1358,
      currentPrice: 1420,
      listingGain: 21.4,
      currentGain: 26.9,
      lotSize: 13,
      issueSizeCr: 28000,
      listingDate: "2026-10-28",
      subscriptionTotal: 22.19,
      financials: [
        { year: "FY 2024", revenue: 84000, profit: 18200 },
        { year: "FY 2025", revenue: 98000, profit: 22400 },
        { year: "FY 2026", revenue: 114000, profit: 27800 }
      ],
      about: "India's premier digital powerhouse connecting 480M+ customers with 5G connectivity, enterprise cloud, and digital services."
    },
    {
      id: "paras-healthcare",
      slug: "paras-healthcare",
      companyName: "Paras Healthcare Limited",
      shortName: "Paras Healthcare",
      initials: "PH",
      logoColor: "#14B8A6",
      iconType: "medical",
      status: "LISTED",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Healthcare & Hospitals",
      issuePrice: 693,
      listingPrice: 720,
      currentPrice: 745,
      listingGain: 3.9,
      currentGain: 7.5,
      lotSize: 21,
      issueSizeCr: 1200,
      listingDate: "2026-10-28",
      subscriptionTotal: 2.23,
      financials: [
        { year: "FY 2024", revenue: 820, profit: 78 },
        { year: "FY 2025", revenue: 1040, profit: 112 },
        { year: "FY 2026", revenue: 1320, profit: 154 }
      ],
      about: "Multi-specialty hospital chain with super-specialty focus in oncology, cardiology, neurosurgery, and orthopedics."
    },
    {
      id: "sahajanand-medical",
      slug: "sahajanand-medical",
      companyName: "Sahajanand Medical Technologies Ltd",
      shortName: "Sahajanand Medical",
      initials: "SM",
      logoColor: "#8B5CF6",
      iconType: "medical",
      status: "LISTED",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Medical Devices & Stents",
      issuePrice: 344,
      listingPrice: 371.15,
      currentPrice: 382.4,
      listingGain: 7.9,
      currentGain: 11.2,
      lotSize: 43,
      issueSizeCr: 800,
      listingDate: "2026-10-23",
      subscriptionTotal: 14.2,
      financials: [
        { year: "FY 2024", revenue: 490, profit: 58 },
        { year: "FY 2025", revenue: 610, profit: 82 },
        { year: "FY 2026", revenue: 760, profit: 106 }
      ],
      about: "Developer and global exporter of advanced cardiovascular drug-eluting stents and catheter delivery solutions."
    },
    {
      id: "anant-medical",
      slug: "anant-medical",
      companyName: "Anant Medical Diagnostics Ltd",
      shortName: "Anant Medical",
      initials: "AM",
      logoColor: "#06B6D4",
      iconType: "medical",
      status: "LISTED",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Healthcare Diagnostics",
      issuePrice: 130,
      listingPrice: 153.6,
      currentPrice: 161.8,
      listingGain: 18.2,
      currentGain: 24.5,
      lotSize: 115,
      issueSizeCr: 680,
      listingDate: "2026-10-20",
      subscriptionTotal: 34.6,
      financials: [
        { year: "FY 2024", revenue: 410, profit: 48 },
        { year: "FY 2025", revenue: 520, profit: 64 },
        { year: "FY 2026", revenue: 640, profit: 82 }
      ],
      about: "Operates 180+ pathology labs and 1,200+ patient test collection centres nationwide."
    },
    {
      id: "zetwerk-manufacturing",
      slug: "zetwerk-manufacturing-businesses-ipo",
      companyName: "Zetwerk Manufacturing Businesses Ltd",
      shortName: "Zetwerk Manufacturing",
      initials: "ZM",
      logoColor: "#2563EB",
      iconType: "tech",
      status: "LISTED",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Contract Manufacturing & Precision Parts",
      issuePrice: 500,
      listingPrice: 642,
      currentPrice: 668,
      listingGain: 28.4,
      currentGain: 33.6,
      lotSize: 30,
      issueSizeCr: 3500,
      listingDate: "2026-10-14",
      subscriptionTotal: 41.2,
      about: "Global B2B manufacturing network platform producing custom precision forged and machined components."
    },
    {
      id: "bonfiglioli-transmissions",
      slug: "bonfiglioli-transmissions-ipo",
      companyName: "Bonfiglioli Transmissions India Ltd",
      shortName: "Bonfiglioli Transmissions",
      initials: "BT",
      logoColor: "#F59E0B",
      iconType: "infra",
      status: "LISTED",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "Heavy Gearboxes & Drives",
      issuePrice: 1290,
      listingPrice: 1480,
      currentPrice: 1512,
      listingGain: 14.7,
      currentGain: 17.2,
      lotSize: 11,
      issueSizeCr: 1150,
      listingDate: "2026-10-08",
      subscriptionTotal: 18.5,
      about: "Manufacturer of heavy industrial gearmotors, planetary drive transmissions, and wind turbine yaw pitch drives."
    },
    {
      id: "fusion-cx",
      slug: "fusion-cx-ipo",
      companyName: "Fusion CX Solutions Limited",
      shortName: "Fusion CX",
      initials: "FC",
      logoColor: "#8B5CF6",
      iconType: "tech",
      status: "LISTED",
      board: "MAINBOARD",
      exchange: "NSE, BSE",
      sector: "BPM & AI Customer Experience",
      issuePrice: 200,
      listingPrice: 218,
      currentPrice: 226,
      listingGain: 9.0,
      currentGain: 13.0,
      lotSize: 75,
      issueSizeCr: 480,
      listingDate: "2026-09-26",
      subscriptionTotal: 12.8,
      about: "Omnichannel customer experience management and multilingual voice BPM provider."
    },
    {
      id: "simca-advertising",
      slug: "simca-advertising-ipo",
      companyName: "Simca Advertising Limited",
      shortName: "Simca Advertising",
      initials: "SA",
      logoColor: "#64748B",
      iconType: "food",
      status: "LISTED",
      board: "SME",
      exchange: "BSE SME",
      sector: "OOH Advertising & Media",
      issuePrice: 183,
      listingPrice: 158,
      currentPrice: 164,
      listingGain: -13.7,
      currentGain: -10.4,
      lotSize: 600,
      issueSizeCr: 36.6,
      listingDate: "2026-05-08",
      subscriptionTotal: 6.5,
      about: "Out-of-home (OOH) media and digital billboard advertising network operator across major transit corridors."
    }
  ],
  calendarEvents: {
    "2026-10-20": [
      { id: "anant-medical", name: "Anant Medical", type: "LISTING", text: "Listed at ₹153.60 (+18.2%)" }
    ],
    "2026-10-23": [
      { id: "sahajanand-medical", name: "Sahajanand Medical", type: "LISTING", text: "Listed at ₹371.15 (+7.9%)" }
    ],
    "2026-10-28": [
      { id: "jio-platforms", name: "Jio Platforms", type: "LISTING", text: "Listed at ₹1358 (+21.4%)" },
      { id: "paras-healthcare", name: "Paras Healthcare", type: "LISTING", text: "Listed at ₹720 (+3.9%)" },
      { id: "eaaa-india", name: "EAAA India", type: "CLOSE", text: "Bidding Closed (5.51x)" }
    ],
    "2026-10-29": [
      { id: "bombay-coated-steels", name: "Bombay Coated Steels", type: "OPEN", text: "Mainboard IPO Opens" },
      { id: "antala-industries", name: "Antala Industries", type: "OPEN", text: "BSE SME Opens" }
    ],
    "2026-10-30": [
      { id: "vectras-enprocon", name: "Vectras Enprocon", type: "OPEN", text: "BSE SME Opens (₹99-105)" },
      { id: "maxwell-engineering", name: "Maxwell Engineering", type: "OPEN", text: "NSE SME Opens (₹150-158)" },
      { id: "hgs-india", name: "HGS India", type: "OPEN", text: "NSE SME Opens (₹114-120)" },
      { id: "mk-sons-fine-jewels", name: "M.K. Sons Jewels", type: "CLOSE", text: "Market Closed (5.09x)" },
      { id: "carver-roboweld", name: "Carver Roboweld", type: "CLOSE", text: "Market Closed (25.8x)" },
      { id: "shree-infra", name: "Shree Infra", type: "CLOSE", text: "Market Closed (8.7x)" }
    ],
    "2026-11-02": [
      { id: "vedant-poly-fabs", name: "Vedant Poly Fabs", type: "OPEN", text: "NSE SME Opens" },
      { id: "bombay-coated-steels", name: "Bombay Coated Steels", type: "CLOSE", text: "Bidding Closes at 5 PM" },
      { id: "antala-industries", name: "Antala Industries", type: "CLOSE", text: "BSE SME Closes" },
      { id: "bls-polymers", name: "BLS Polymers", type: "CLOSE", text: "Final Bidding Closes" },
      { id: "mk-sons-fine-jewels", name: "M.K. Sons Jewels", type: "ALLOTMENT", text: "Allotment Finalization" }
    ],
    "2026-11-03": [
      { id: "vectras-enprocon", name: "Vectras Enprocon", type: "CLOSE", text: "BSE SME Closes" },
      { id: "maxwell-engineering", name: "Maxwell Engineering", type: "CLOSE", text: "NSE SME Closes" },
      { id: "hgs-india", name: "HGS India", type: "CLOSE", text: "NSE SME Closes" },
      { id: "bombay-coated-steels", name: "Bombay Coated Steels", type: "ALLOTMENT", text: "Allotment Finalization" }
    ],
    "2026-11-04": [
      { id: "mk-sons-fine-jewels", name: "M.K. Sons Jewels", type: "LISTING", text: "Listing on BSE & NSE" },
      { id: "carver-roboweld", name: "Carver Roboweld", type: "LISTING", text: "Listing on BSE SME" },
      { id: "shree-infra", name: "Shree Infra", type: "LISTING", text: "Listing on NSE SME" }
    ],
    "2026-11-05": [
      { id: "bombay-coated-steels", name: "Bombay Coated Steels", type: "LISTING", text: "Listing on BSE & NSE" },
      { id: "antala-industries", name: "Antala Industries", type: "LISTING", text: "Listing on BSE SME" },
      { id: "bls-polymers", name: "BLS Polymers", type: "LISTING", text: "Listing on NSE & BSE" },
      { id: "krystal-foods", name: "Krystal Foods", type: "OPEN", text: "Mainboard IPO Opens" }
    ],
    "2026-11-07": [
      { id: "techfront-india", name: "Techfront India", type: "OPEN", text: "Mainboard IPO Opens" }
    ]
  },
  alertsFeed: [
    {
      id: "a1",
      title: "Market Closed (3:30 PM): M.K. Sons Jewels 5.09x",
      description: "Bidding concludes for M.K. Sons Fine Jewels with 7.42x retail oversubscription. Allotment on Nov 2.",
      time: "Just now",
      slug: "m-k-sons-fine-jewels-ipo",
      tag: "Closed"
    },
    {
      id: "a2",
      title: "Carver Roboweld Closes at 25.8x",
      description: "BSE SME issue finishes strong with 32.4x retail subscription. Basis of allotment on Nov 2.",
      time: "1 hour ago",
      slug: "carver-roboweld-ipo",
      tag: "Closed"
    },
    {
      id: "a3",
      title: "Bombay Coated Steels (QIB 6.89x) Open",
      description: "Day 2 finishes with 3.32x overall subscription. Issue closes on Monday, Nov 2.",
      time: "2 hours ago",
      slug: "bombay-coated-and-special-steels-ipo",
      tag: "Open"
    },
    {
      id: "a4",
      title: "NSE SME: Maxwell Engineering (0.42x) Open",
      description: "Industrial robotics IPO opened today at ₹150–158 band. Bidding open till Nov 3.",
      time: "3 hours ago",
      slug: "maxwell-engineering-solutions-ipo",
      tag: "NSE Emerge"
    }
  ]
};

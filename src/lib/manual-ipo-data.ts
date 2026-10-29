import type { Ipo } from "@/lib/data";

/**
 * Manually supplied starter records (India, IST).
 * Values were provided in the project setup conversation and have not been
 * independently live-verified. Update from fresh notes before treating as current.
 * GMP is unofficial. No historical chart points are fabricated.
 */
export const manualIpos: Ipo[] = [
  {
    id: "manual-mk-sons-fine-jewels", slug: "m-k-sons-fine-jewels-ipo",
    companyName: "M.K. Sons Fine Jewels", shortName: "M.K. Sons Fine Jewels", initials: "MK", color: "#F3E8D8",
    status: "OPEN", issueType: "UNKNOWN", board: "MAINBOARD", exchange: "BOTH",
    priceBandLow: 153, priceBandHigh: 162, issueSizeCr: 330.48, lotSize: 91, minimumInvestment: 14742,
    openDate: "2026-10-28", closeDate: "2026-10-30", allotDate: "2026-11-02", listingDate: "2026-11-04",
    gmp: 11.5, gmpPercentage: 7.1, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 1.18,
    subscriptionSummary: { total: 1.18, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30",
    review: "Supplied AI gain estimate: +6.7% / +₹11 per share. This is an unverified estimate, not investment advice."
  },
  {
    id: "manual-bombay-coated-special-steels", slug: "bombay-coated-and-special-steels-ipo",
    companyName: "Bombay Coated and Special Steels", shortName: "Bombay Coated and Special Steels", initials: "BC", color: "#E3ECF6",
    status: "OPEN", issueType: "FRESH", board: "MAINBOARD", exchange: "BOTH",
    priceBandLow: 78, priceBandHigh: 82, issueSizeCr: 183.06, lotSize: 182, minimumInvestment: 14924,
    openDate: "2026-10-29", closeDate: "2026-11-02", allotDate: "2026-11-03", listingDate: "2026-11-05",
    gmp: 9, gmpPercentage: 11, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 2.673,
    subscriptionSummary: { retail: 1.242, nii: 0.722, qib: 6.555, total: 2.673, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30",
    review: "Supplied AI gain estimate: +6.8% (range +2.8% to +10.8%, moderate confidence 54%). Unverified estimate, not investment advice."
  },
  {
    id: "manual-eaaa-india-alternatives", slug: "eaaa-india-alternatives-ipo",
    companyName: "EAAA India Alternatives", shortName: "EAAA India Alternatives", initials: "EA", color: "#E9E6F7",
    status: "CLOSED", issueType: "OFS", board: "MAINBOARD", exchange: "BOTH",
    priceBandLow: 1585, priceBandHigh: 1665, issueSizeCr: 1200, lotSize: 9, minimumInvestment: 14985,
    openDate: "2026-10-26", closeDate: "2026-10-28", allotDate: "2026-10-29", listingDate: "2026-11-02",
    gmp: 38, gmpPercentage: 2.3, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 5.25,
    subscriptionSummary: { retail: 1.03, nii: 4.58, qib: 13.14, total: 5.25, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30",
    review: "Supplied AI gain estimate: +1.9% / +₹32 per share. This is an unverified estimate, not investment advice."
  },
  {
    id: "manual-sfc-environmental-technologies", slug: "sfc-environmental-technologies-ipo",
    companyName: "SFC Environmental Technologies", shortName: "SFC Environmental Technologies", initials: "SFC", color: "#DDF0E7",
    status: "CLOSED", issueType: "FRESH_AND_OFS", board: "MAINBOARD", exchange: "BOTH",
    priceBandLow: 313, priceBandHigh: 330, issueSizeCr: 667.53, lotSize: 45, minimumInvestment: 14850,
    openDate: "2026-10-27", closeDate: "2026-10-29", allotDate: "2026-10-30", listingDate: "2026-11-03",
    gmp: 19, gmpPercentage: 5.8, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 9.47,
    subscriptionSummary: { retail: 2.71, nii: 12.81, qib: 18.81, total: 9.47, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30",
    review: "Supplied AI gain estimate: +7.3% / +₹24 per share. This is an unverified estimate, not investment advice."
  },
  {
    id: "manual-bls-polymers", slug: "bls-polymers-ipo",
    companyName: "BLS Polymers", shortName: "BLS Polymers", initials: "BLS", color: "#F5E8D8",
    status: "CLOSED", issueType: "FRESH", board: "MAINBOARD", exchange: "BOTH",
    priceBandLow: 142, priceBandHigh: 150, issueSizeCr: 255, lotSize: 100, minimumInvestment: 15000,
    openDate: "2026-10-27", closeDate: "2026-10-29", allotDate: "2026-10-30", listingDate: "2026-11-03",
    gmp: 61.33, gmpPercentage: 40.9, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 241.22,
    subscriptionSummary: { retail: 128.36, nii: 559.2, qib: 200.25, total: 241.22, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30",
    review: "Supplied AI gain estimate: +27.6% / +₹41 per share. This is an unverified estimate, not investment advice."
  },
  {
    id: "manual-ajwa-projects", slug: "ajwa-projects-ipo",
    companyName: "Ajwa Projects Limited", shortName: "Ajwa Projects", initials: "AP", color: "#DDEDEA",
    status: "OPEN", issueType: "UNKNOWN", board: "SME", exchange: "BSE",
    priceBandLow: 203, priceBandHigh: 203, issueSizeCr: 38.05, lotSize: 1200, minimumInvestment: 243600,
    openDate: "2026-10-28", closeDate: "2026-10-30", allotDate: "2026-11-02", listingDate: "2026-11-04",
    gmp: 5, gmpPercentage: 2.5, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 0.87,
    subscriptionSummary: { retail: 1.57, nii: 0.18, total: 0.87, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30"
  },
  {
    id: "manual-carver-roboweld", slug: "carver-roboweld-ipo",
    companyName: "Carver Roboweld", shortName: "Carver Roboweld", initials: "CR", color: "#E9E8FA",
    status: "OPEN", issueType: "FRESH", board: "SME", exchange: "BSE",
    priceBandLow: 76, priceBandHigh: 80, issueSizeCr: 28.29, lotSize: 3200, minimumInvestment: 256000,
    openDate: "2026-10-28", closeDate: "2026-10-30", allotDate: "2026-11-02", listingDate: "2026-11-04",
    gmp: 0, gmpPercentage: 0, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 0.83,
    subscriptionSummary: { retail: 0.65, nii: 2.31, qib: 0, total: 0.83, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30"
  },
  {
    id: "manual-core4-engineers", slug: "core4-engineers-ipo",
    companyName: "Core4 Engineers Ltd.", shortName: "Core4 Engineers", initials: "C4", color: "#E3EAF7",
    status: "CLOSED", issueType: "FRESH", board: "SME", exchange: "BSE",
    priceBandLow: 88, priceBandHigh: 93, issueSizeCr: 54.82, lotSize: 2400, minimumInvestment: 223200,
    openDate: "2026-10-23", closeDate: "2026-10-27", allotDate: "2026-10-28", listingDate: "2026-10-30",
    gmp: 0, gmpPercentage: 0, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 5.41,
    subscriptionSummary: { retail: 2.68, nii: 12.25, qib: 5.06, total: 5.41, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30"
  },
  {
    id: "manual-wiscon-industries", slug: "wiscon-industries-ipo",
    companyName: "Wiscon Industries", shortName: "Wiscon Industries", initials: "WI", color: "#F0E6D7",
    status: "CLOSED", issueType: "FRESH_AND_OFS", board: "SME", exchange: "BSE",
    priceBandLow: 194, priceBandHigh: 204, issueSizeCr: 110, lotSize: 1200, minimumInvestment: 244800,
    openDate: "2026-10-27", closeDate: "2026-10-29", allotDate: "2026-10-30", listingDate: "2026-11-03",
    gmp: 0, gmpPercentage: 0, gmpPercentBasis: "priceBandHigh", gmpUpdatedAt: "2026-10-29T21:00:00+05:30",
    gmpSource: "Manually supplied; unofficial GMP", subscriptionTotal: 1.17,
    subscriptionSummary: { retail: 0.66, nii: 0.62, qib: 2.24, total: 1.17, updatedAt: "2026-10-29T21:00:00+05:30" },
    subscriptionSource: "Manually supplied", source: "Manually supplied", sourceFreshness: "manual", lastUpdated: "2026-10-29T21:00:00+05:30"
  }
];

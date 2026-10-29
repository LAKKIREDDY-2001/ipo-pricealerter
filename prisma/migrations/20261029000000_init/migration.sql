CREATE TYPE "IpoStatus" AS ENUM ('UPCOMING', 'OPEN', 'CLOSED', 'LISTED');
CREATE TYPE "IpoType" AS ENUM ('FRESH', 'OFS', 'FRESH_AND_OFS');
CREATE TYPE "Board" AS ENUM ('MAINBOARD', 'SME');
CREATE TYPE "Exchange" AS ENUM ('NSE', 'BSE', 'BOTH');

CREATE TABLE "Ipo" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "status" "IpoStatus" NOT NULL DEFAULT 'UPCOMING',
    "issueType" "IpoType" NOT NULL,
    "board" "Board" NOT NULL,
    "exchange" "Exchange" NOT NULL,
    "priceBandLow" DECIMAL(10,2),
    "priceBandHigh" DECIMAL(10,2),
    "lotSize" INTEGER,
    "issueSizeCr" DECIMAL(12,2),
    "freshIssueCr" DECIMAL(12,2),
    "ofsCr" DECIMAL(12,2),
    "openDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "allotDate" TIMESTAMP(3),
    "listingDate" TIMESTAMP(3),
    "gmp" DECIMAL(10,2),
    "review" TEXT,
    "peers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "listingGain" DECIMAL(10,2),
    "currentPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ipo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GmpRecord" (
    "id" TEXT NOT NULL,
    "ipoId" TEXT NOT NULL,
    "gmp" DECIMAL(10,2) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GmpRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "ipoId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "retail" DECIMAL(10,4),
    "nii" DECIMAL(10,4),
    "qib" DECIMAL(10,4),
    "total" DECIMAL(10,4),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Financials" (
    "id" TEXT NOT NULL,
    "ipoId" TEXT NOT NULL,
    "revenue" DECIMAL(12,2),
    "profit" DECIMAL(12,2),
    "ebitda" DECIMAL(12,2),
    "netWorth" DECIMAL(12,2),
    "eps" DECIMAL(10,2),
    "peRatio" DECIMAL(10,2),
    "sector" TEXT NOT NULL,
    "business" TEXT NOT NULL,
    CONSTRAINT "Financials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Promoter" (
    "id" TEXT NOT NULL,
    "ipoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "holding" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Promoter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ipo_slug_key" ON "Ipo"("slug");
CREATE INDEX "GmpRecord_ipoId_timestamp_idx" ON "GmpRecord"("ipoId", "timestamp");
CREATE UNIQUE INDEX "Subscription_ipoId_day_key" ON "Subscription"("ipoId", "day");
CREATE UNIQUE INDEX "Financials_ipoId_key" ON "Financials"("ipoId");

ALTER TABLE "GmpRecord" ADD CONSTRAINT "GmpRecord_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "Ipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "Ipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Financials" ADD CONSTRAINT "Financials_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "Ipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Promoter" ADD CONSTRAINT "Promoter_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "Ipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

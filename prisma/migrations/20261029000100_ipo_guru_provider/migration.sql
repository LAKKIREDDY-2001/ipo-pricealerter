ALTER TYPE "IpoType" ADD VALUE IF NOT EXISTS 'UNKNOWN';
ALTER TYPE "Board" ADD VALUE IF NOT EXISTS 'UNKNOWN';
ALTER TYPE "Exchange" ADD VALUE IF NOT EXISTS 'UNKNOWN';

ALTER TABLE "Ipo" ALTER COLUMN "issueType" DROP NOT NULL;
ALTER TABLE "Ipo" ALTER COLUMN "exchange" DROP NOT NULL;
ALTER TABLE "Ipo" ADD COLUMN "issuePrice" DECIMAL(10,2);
ALTER TABLE "Ipo" ADD COLUMN "listingPrice" DECIMAL(10,2);
ALTER TABLE "Ipo" ADD COLUMN "minimumInvestment" DECIMAL(12,2);
ALTER TABLE "Ipo" ADD COLUMN "providerSlug" TEXT;
ALTER TABLE "Ipo" ADD COLUMN "providerUrl" TEXT;
ALTER TABLE "Ipo" ADD COLUMN "registrarName" TEXT;
ALTER TABLE "Ipo" ADD COLUMN "registrarUrl" TEXT;
ALTER TABLE "Ipo" ADD COLUMN "prospectusUrl" TEXT;
ALTER TABLE "Ipo" ADD COLUMN "officialLinks" JSONB;
ALTER TABLE "Ipo" ADD COLUMN "sourceUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Ipo" ADD COLUMN "dataSource" TEXT;
ALTER TABLE "Ipo" ADD COLUMN "gmpUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Ipo" ADD COLUMN "gmpSource" TEXT;
ALTER TABLE "Ipo" ADD COLUMN "subscriptionUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Ipo" ADD COLUMN "subscriptionSource" TEXT;

CREATE TABLE "ProviderCache" (
    "key" TEXT NOT NULL,
    "payload" JSONB,
    "fetchedAt" TIMESTAMP(3),
    "nextRefreshAt" TIMESTAMP(3),
    "retryAt" TIMESTAMP(3),
    "plan" TEXT,
    "dailyLimit" INTEGER,
    "requestsPerMinute" INTEGER,
    "remaining" INTEGER,
    "errorCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderCache_pkey" PRIMARY KEY ("key")
);

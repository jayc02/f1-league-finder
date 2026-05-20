-- CreateEnum
CREATE TYPE "DuelEntryMode" AS ENUM ('OPEN', 'BIDDED', 'PRIVATE');
CREATE TYPE "DuelTokenPotStatus" AS ENUM ('NONE', 'HOLDING', 'AWARDED', 'REFUNDED', 'DISPUTED');
CREATE TYPE "RaceTokenLedgerType" AS ENUM ('DEMO_GRANT', 'ADMIN_GRANT', 'ADMIN_DEBIT', 'BID_HOLD', 'BID_RELEASE', 'BID_TO_POT', 'POT_AWARD', 'POT_REFUND', 'DUEL_CANCEL_REFUND');
CREATE TYPE "DuelBidStatus" AS ENUM ('ACTIVE', 'OUTBID', 'WON_SEAT', 'RELEASED', 'MOVED_TO_POT', 'REFUNDED', 'CANCELLED');

ALTER TABLE "Duel"
ADD COLUMN "entryMode" "DuelEntryMode" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "bidClosesAt" TIMESTAMP(3),
ADD COLUMN "biddingLockedAt" TIMESTAMP(3),
ADD COLUMN "startingBidTokens" INTEGER,
ADD COLUMN "maxBidTokens" INTEGER,
ADD COLUMN "winningBidId" TEXT,
ADD COLUMN "tokenPot" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tokenPotAwardedAt" TIMESTAMP(3),
ADD COLUMN "tokenPotWinnerUserId" TEXT,
ADD COLUMN "tokenPotStatus" "DuelTokenPotStatus" NOT NULL DEFAULT 'NONE';

CREATE TABLE "RaceTokenBalance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "available" INTEGER NOT NULL DEFAULT 0,
  "held" INTEGER NOT NULL DEFAULT 0,
  "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
  "lifetimeSpent" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RaceTokenBalance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RaceTokenBalance_userId_key" ON "RaceTokenBalance"("userId");
CREATE INDEX "RaceTokenBalance_userId_idx" ON "RaceTokenBalance"("userId");
ALTER TABLE "RaceTokenBalance" ADD CONSTRAINT "RaceTokenBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RaceTokenLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "type" "RaceTokenLedgerType" NOT NULL,
  "reason" TEXT NOT NULL,
  "duelId" TEXT,
  "bidId" TEXT,
  "relatedUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RaceTokenLedger_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RaceTokenLedger_userId_createdAt_idx" ON "RaceTokenLedger"("userId", "createdAt");
CREATE INDEX "RaceTokenLedger_duelId_idx" ON "RaceTokenLedger"("duelId");
CREATE INDEX "RaceTokenLedger_bidId_idx" ON "RaceTokenLedger"("bidId");
CREATE INDEX "RaceTokenLedger_type_idx" ON "RaceTokenLedger"("type");
ALTER TABLE "RaceTokenLedger" ADD CONSTRAINT "RaceTokenLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DuelBid" (
  "id" TEXT NOT NULL,
  "duelId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amountTokens" INTEGER NOT NULL,
  "status" "DuelBidStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DuelBid_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DuelBid_duelId_createdAt_idx" ON "DuelBid"("duelId", "createdAt");
CREATE INDEX "DuelBid_userId_createdAt_idx" ON "DuelBid"("userId", "createdAt");
CREATE INDEX "DuelBid_duelId_amountTokens_idx" ON "DuelBid"("duelId", "amountTokens");
CREATE INDEX "DuelBid_status_idx" ON "DuelBid"("status");
ALTER TABLE "DuelBid" ADD CONSTRAINT "DuelBid_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DuelBid" ADD CONSTRAINT "DuelBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

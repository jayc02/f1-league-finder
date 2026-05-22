-- remove token/bidding
ALTER TABLE "Duel" DROP COLUMN IF EXISTS "bidClosesAt", DROP COLUMN IF EXISTS "biddingLockedAt", DROP COLUMN IF EXISTS "startingBidTokens", DROP COLUMN IF EXISTS "maxBidTokens", DROP COLUMN IF EXISTS "winningBidId", DROP COLUMN IF EXISTS "tokenPot", DROP COLUMN IF EXISTS "tokenPotAwardedAt", DROP COLUMN IF EXISTS "tokenPotWinnerUserId", DROP COLUMN IF EXISTS "tokenPotStatus";
DROP TABLE IF EXISTS "DuelBid";
DROP TABLE IF EXISTS "RaceTokenLedger";
DROP TABLE IF EXISTS "RaceTokenBalance";

-- add community rating tables
CREATE TABLE "CommunityDriverRating" (
  "id" TEXT PRIMARY KEY,
  "organiserProfileId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "skillRating" INTEGER NOT NULL DEFAULT 1000,
  "honourScore" INTEGER NOT NULL DEFAULT 100,
  "starts" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "podiums" INTEGER NOT NULL DEFAULT 0,
  "cleanRaces" INTEGER NOT NULL DEFAULT 0,
  "incidents" INTEGER NOT NULL DEFAULT 0,
  "disputesOpened" INTEGER NOT NULL DEFAULT 0,
  "disputesLost" INTEGER NOT NULL DEFAULT 0,
  "lastRaceAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "CommunityDriverRating_organiserProfileId_userId_key" ON "CommunityDriverRating"("organiserProfileId","userId");
CREATE INDEX "CommunityDriverRating_organiserProfileId_skillRating_idx" ON "CommunityDriverRating"("organiserProfileId","skillRating");
CREATE INDEX "CommunityDriverRating_organiserProfileId_honourScore_idx" ON "CommunityDriverRating"("organiserProfileId","honourScore");
CREATE INDEX "CommunityDriverRating_userId_idx" ON "CommunityDriverRating"("userId");
ALTER TABLE "CommunityDriverRating" ADD CONSTRAINT "CommunityDriverRating_organiserProfileId_fkey" FOREIGN KEY ("organiserProfileId") REFERENCES "OrganiserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityDriverRating" ADD CONSTRAINT "CommunityDriverRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CommunityRatingEvent" (
  "id" TEXT PRIMARY KEY,
  "organiserProfileId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "raceSlotId" TEXT,
  "duelId" TEXT,
  "raceResultId" TEXT,
  "appliedById" TEXT,
  "skillDelta" INTEGER NOT NULL DEFAULT 0,
  "honourDelta" INTEGER NOT NULL DEFAULT 0,
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CommunityRatingEvent_organiserProfileId_createdAt_idx" ON "CommunityRatingEvent"("organiserProfileId","createdAt");
CREATE INDEX "CommunityRatingEvent_userId_createdAt_idx" ON "CommunityRatingEvent"("userId","createdAt");
CREATE INDEX "CommunityRatingEvent_raceSlotId_idx" ON "CommunityRatingEvent"("raceSlotId");
CREATE INDEX "CommunityRatingEvent_duelId_idx" ON "CommunityRatingEvent"("duelId");
ALTER TABLE "CommunityRatingEvent" ADD CONSTRAINT "CommunityRatingEvent_organiserProfileId_fkey" FOREIGN KEY ("organiserProfileId") REFERENCES "OrganiserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityRatingEvent" ADD CONSTRAINT "CommunityRatingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

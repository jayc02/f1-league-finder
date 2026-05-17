-- CreateEnum
CREATE TYPE "DuelStatus" AS ENUM ('OPEN', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DuelVisibility" AS ENUM ('PUBLIC', 'COMMUNITY_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DuelCoinSide" AS ENUM ('HEADS', 'TAILS');

-- CreateTable
CREATE TABLE "Duel" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "opponentId" TEXT,
    "communityId" TEXT,
    "status" "DuelStatus" NOT NULL DEFAULT 'OPEN',
    "visibility" "DuelVisibility" NOT NULL DEFAULT 'PUBLIC',
    "ranked" BOOLEAN NOT NULL DEFAULT true,
    "game" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "carClass" TEXT,
    "platform" "PreferredPlatform",
    "crossplay" BOOLEAN NOT NULL DEFAULT true,
    "assists" TEXT NOT NULL DEFAULT 'ASSISTS_ALLOWED',
    "damageLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "raceLength" TEXT NOT NULL DEFAULT '25%',
    "weather" TEXT NOT NULL DEFAULT 'Dynamic',
    "rulesSummary" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "playerAChoice" "DuelCoinSide" NOT NULL DEFAULT 'HEADS',
    "playerBChoice" "DuelCoinSide" NOT NULL DEFAULT 'TAILS',
    "coinFlipValue" INTEGER,
    "coinFlipWinnerUserId" TEXT,
    "leg1AdvantageUserId" TEXT,
    "leg2AdvantageUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Duel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuelLeg" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "legNumber" INTEGER NOT NULL,
    "advantageUserId" TEXT,
    "winnerUserId" TEXT,
    "playerAScore" INTEGER,
    "playerBScore" INTEGER,
    "playerATimeMs" INTEGER,
    "playerBTimeMs" INTEGER,
    "notes" TEXT,
    "evidenceUrl" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuelLeg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuelConfirmation" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "confirmedWinnerId" TEXT,
    "leg1WinnerId" TEXT,
    "leg2WinnerId" TEXT,
    "playerATotalTimeMs" INTEGER,
    "playerBTotalTimeMs" INTEGER,
    "evidenceUrl" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DuelConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Duel_status_visibility_scheduledAt_idx" ON "Duel"("status", "visibility", "scheduledAt");

-- CreateIndex
CREATE INDEX "Duel_visibility_status_createdAt_idx" ON "Duel"("visibility", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Duel_createdById_status_idx" ON "Duel"("createdById", "status");

-- CreateIndex
CREATE INDEX "Duel_opponentId_status_idx" ON "Duel"("opponentId", "status");

-- CreateIndex
CREATE INDEX "Duel_communityId_status_idx" ON "Duel"("communityId", "status");

-- CreateIndex
CREATE INDEX "Duel_status_ranked_idx" ON "Duel"("status", "ranked");

-- CreateIndex
CREATE INDEX "DuelLeg_winnerUserId_idx" ON "DuelLeg"("winnerUserId");

-- CreateIndex
CREATE INDEX "DuelLeg_advantageUserId_idx" ON "DuelLeg"("advantageUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DuelLeg_duelId_legNumber_key" ON "DuelLeg"("duelId", "legNumber");

-- CreateIndex
CREATE INDEX "DuelConfirmation_userId_idx" ON "DuelConfirmation"("userId");

-- CreateIndex
CREATE INDEX "DuelConfirmation_confirmedWinnerId_idx" ON "DuelConfirmation"("confirmedWinnerId");

-- CreateIndex
CREATE UNIQUE INDEX "DuelConfirmation_duelId_userId_key" ON "DuelConfirmation"("duelId", "userId");

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "OrganiserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelLeg" ADD CONSTRAINT "DuelLeg_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelConfirmation" ADD CONSTRAINT "DuelConfirmation_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelConfirmation" ADD CONSTRAINT "DuelConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

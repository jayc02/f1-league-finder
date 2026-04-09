-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'ORGANISER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL');

-- CreateEnum
CREATE TYPE "PreferredPlatform" AS ENUM ('PC', 'PLAYSTATION', 'XBOX');

-- CreateEnum
CREATE TYPE "RaceSlotStatus" AS ENUM ('DRAFT', 'OPEN', 'FULL', 'LOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HonourEventType" AS ENUM ('CLEAN_RACE', 'COMPLAINT_FLAG', 'ORGANISER_PENALTY', 'ADMIN_ADJUSTMENT', 'WARNING');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARNING', 'HONOUR_ADJUSTMENT', 'SUSPENSION_NOTE', 'RESULT_AMENDMENT', 'DISPUTE_RESOLUTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "eaIdTag" TEXT,
    "discordTag" TEXT,
    "psnTag" TEXT,
    "xboxTag" TEXT,
    "preferredPlatform" "PreferredPlatform",
    "region" "Region" NOT NULL DEFAULT 'GLOBAL',
    "bio" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "honourScore" INTEGER NOT NULL DEFAULT 100,
    "skillRating" INTEGER NOT NULL DEFAULT 1200,
    "suspensionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganiserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "brandingColor" TEXT,
    "websiteUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganiserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brandingPrimary" TEXT,
    "brandingSecondary" TEXT,
    "region" "Region" NOT NULL DEFAULT 'GLOBAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT NOT NULL,
    "organiserProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceSlot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "organiserId" TEXT NOT NULL,
    "organiserProfileId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "region" "Region" NOT NULL DEFAULT 'GLOBAL',
    "game" TEXT NOT NULL DEFAULT 'F1',
    "platform" "PreferredPlatform",
    "crossplay" BOOLEAN NOT NULL DEFAULT false,
    "formatDetails" TEXT NOT NULL,
    "lobbySettings" JSONB,
    "maxPlayers" INTEGER NOT NULL,
    "status" "RaceSlotStatus" NOT NULL DEFAULT 'DRAFT',
    "registrationCutoffAt" TIMESTAMP(3) NOT NULL,
    "rulesSummary" TEXT NOT NULL,
    "stakeTierMetadata" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaceSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceRegistration" (
    "id" TEXT NOT NULL,
    "raceSlotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceResult" (
    "id" TEXT NOT NULL,
    "raceSlotId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "notes" TEXT,
    "evidenceUrl" TEXT,
    "confirmationState" TEXT NOT NULL DEFAULT 'submitted',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "amendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceResultEntry" (
    "id" TEXT NOT NULL,
    "raceResultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "finishingPosition" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "ratingDelta" INTEGER NOT NULL DEFAULT 0,
    "honourDelta" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceResultEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HonourEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "raceSlotId" TEXT,
    "raceResultId" TEXT,
    "type" "HonourEventType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "warningIssued" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "appliedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HonourEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "raceSlotId" TEXT NOT NULL,
    "raceResultId" TEXT,
    "openedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "adminNotes" TEXT,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "actionType" "ModerationActionType" NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "disputeId" TEXT,
    "raceSlotId" TEXT,
    "notes" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganiserProfile_userId_key" ON "OrganiserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "League_slug_key" ON "League"("slug");

-- CreateIndex
CREATE INDEX "RaceSlot_leagueId_scheduledAt_idx" ON "RaceSlot"("leagueId", "scheduledAt");

-- CreateIndex
CREATE INDEX "RaceSlot_status_scheduledAt_idx" ON "RaceSlot"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "RaceRegistration_userId_createdAt_idx" ON "RaceRegistration"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RaceRegistration_raceSlotId_userId_key" ON "RaceRegistration"("raceSlotId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceResult_raceSlotId_key" ON "RaceResult"("raceSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceResultEntry_raceResultId_userId_key" ON "RaceResultEntry"("raceResultId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceResultEntry_raceResultId_finishingPosition_key" ON "RaceResultEntry"("raceResultId", "finishingPosition");

-- CreateIndex
CREATE INDEX "HonourEvent_userId_createdAt_idx" ON "HonourEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Dispute_status_createdAt_idx" ON "Dispute"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_targetUserId_createdAt_idx" ON "ModerationAction"("targetUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganiserProfile" ADD CONSTRAINT "OrganiserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_organiserProfileId_fkey" FOREIGN KEY ("organiserProfileId") REFERENCES "OrganiserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceSlot" ADD CONSTRAINT "RaceSlot_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceSlot" ADD CONSTRAINT "RaceSlot_organiserId_fkey" FOREIGN KEY ("organiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceSlot" ADD CONSTRAINT "RaceSlot_organiserProfileId_fkey" FOREIGN KEY ("organiserProfileId") REFERENCES "OrganiserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceRegistration" ADD CONSTRAINT "RaceRegistration_raceSlotId_fkey" FOREIGN KEY ("raceSlotId") REFERENCES "RaceSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceRegistration" ADD CONSTRAINT "RaceRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_raceSlotId_fkey" FOREIGN KEY ("raceSlotId") REFERENCES "RaceSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResultEntry" ADD CONSTRAINT "RaceResultEntry_raceResultId_fkey" FOREIGN KEY ("raceResultId") REFERENCES "RaceResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResultEntry" ADD CONSTRAINT "RaceResultEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HonourEvent" ADD CONSTRAINT "HonourEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HonourEvent" ADD CONSTRAINT "HonourEvent_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HonourEvent" ADD CONSTRAINT "HonourEvent_raceSlotId_fkey" FOREIGN KEY ("raceSlotId") REFERENCES "RaceSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HonourEvent" ADD CONSTRAINT "HonourEvent_raceResultId_fkey" FOREIGN KEY ("raceResultId") REFERENCES "RaceResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raceSlotId_fkey" FOREIGN KEY ("raceSlotId") REFERENCES "RaceSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raceResultId_fkey" FOREIGN KEY ("raceResultId") REFERENCES "RaceResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

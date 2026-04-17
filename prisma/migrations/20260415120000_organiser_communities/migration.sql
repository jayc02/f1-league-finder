-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- AlterTable
ALTER TABLE "OrganiserProfile"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "bannerUrl" TEXT,
  ADD COLUMN "discordUrl" TEXT,
  ADD COLUMN "redditUrl" TEXT,
  ADD COLUMN "socials" JSONB,
  ADD COLUMN "gameFocus" TEXT,
  ADD COLUMN "platformFocus" "PreferredPlatform",
  ADD COLUMN "region" "Region" NOT NULL DEFAULT 'GLOBAL',
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "displayedMemberCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "memberCountSource" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "memberCountLastSyncedAt" TIMESTAMP(3),
  ADD COLUMN "credibilityNotes" TEXT;

UPDATE "OrganiserProfile"
SET "slug" = lower(regexp_replace("displayName", '[^a-zA-Z0-9]+', '-', 'g'));

ALTER TABLE "OrganiserProfile"
  ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "RaceSlot"
  ADD COLUMN "track" TEXT,
  ADD COLUMN "eventNotes" TEXT,
  ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE UNIQUE INDEX "OrganiserProfile_slug_key" ON "OrganiserProfile"("slug");
CREATE INDEX "OrganiserProfile_isPublic_featured_idx" ON "OrganiserProfile"("isPublic", "featured");
CREATE INDEX "OrganiserProfile_region_idx" ON "OrganiserProfile"("region");
CREATE INDEX "RaceSlot_visibility_scheduledAt_idx" ON "RaceSlot"("visibility", "scheduledAt");

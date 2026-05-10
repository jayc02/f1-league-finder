-- Extend RaceHub organiser profiles with scoped community membership/staff roles.
CREATE TYPE "OrganiserProfileMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');
CREATE TYPE "OrganiserProfileMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'BANNED');

ALTER TYPE "EventVisibility" ADD VALUE IF NOT EXISTS 'COMMUNITY_ONLY';

CREATE TABLE "OrganiserProfileMember" (
  "id" TEXT NOT NULL,
  "organiserProfileId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrganiserProfileMemberRole" NOT NULL DEFAULT 'MEMBER',
  "status" "OrganiserProfileMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrganiserProfileMember_pkey" PRIMARY KEY ("id")
);

INSERT INTO "OrganiserProfileMember" ("id", "organiserProfileId", "userId", "role", "status", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "userId", 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "OrganiserProfile"
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX "OrganiserProfileMember_organiserProfileId_userId_key" ON "OrganiserProfileMember"("organiserProfileId", "userId");
CREATE INDEX "OrganiserProfileMember_userId_idx" ON "OrganiserProfileMember"("userId");
CREATE INDEX "OrganiserProfileMember_organiserProfileId_idx" ON "OrganiserProfileMember"("organiserProfileId");
CREATE INDEX "OrganiserProfileMember_role_idx" ON "OrganiserProfileMember"("role");
CREATE INDEX "RaceSlot_organiserProfileId_scheduledAt_idx" ON "RaceSlot"("organiserProfileId", "scheduledAt");
CREATE INDEX "RaceSlot_organiserProfileId_visibility_status_scheduledAt_idx" ON "RaceSlot"("organiserProfileId", "visibility", "status", "scheduledAt");

ALTER TABLE "OrganiserProfileMember" ADD CONSTRAINT "OrganiserProfileMember_organiserProfileId_fkey" FOREIGN KEY ("organiserProfileId") REFERENCES "OrganiserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganiserProfileMember" ADD CONSTRAINT "OrganiserProfileMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

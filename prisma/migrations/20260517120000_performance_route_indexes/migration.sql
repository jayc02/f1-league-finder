-- Performance indexes for fast private dashboards, admin pagination, community discovery, and leaderboard/profile lookups.
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

CREATE INDEX "OrganiserProfile_isPublic_featured_updatedAt_idx" ON "OrganiserProfile"("isPublic", "featured", "updatedAt");
CREATE INDEX "OrganiserProfile_updatedAt_idx" ON "OrganiserProfile"("updatedAt");

CREATE INDEX "OrganiserProfileMember_status_idx" ON "OrganiserProfileMember"("status");
CREATE INDEX "OrganiserProfileMember_organiserProfileId_status_idx" ON "OrganiserProfileMember"("organiserProfileId", "status");
CREATE INDEX "OrganiserProfileMember_organiserProfileId_role_idx" ON "OrganiserProfileMember"("organiserProfileId", "role");

CREATE INDEX "RaceSlot_visibility_status_scheduledAt_idx" ON "RaceSlot"("visibility", "status", "scheduledAt");
CREATE INDEX "RaceSlot_organiserId_scheduledAt_idx" ON "RaceSlot"("organiserId", "scheduledAt");

CREATE INDEX "RaceResult_submittedById_idx" ON "RaceResult"("submittedById");

CREATE INDEX "RaceResultEntry_raceResultId_idx" ON "RaceResultEntry"("raceResultId");
CREATE INDEX "RaceResultEntry_pointsAwarded_idx" ON "RaceResultEntry"("pointsAwarded");
CREATE INDEX "RaceResultEntry_finishingPosition_idx" ON "RaceResultEntry"("finishingPosition");

CREATE INDEX "Dispute_openedById_createdAt_idx" ON "Dispute"("openedById", "createdAt");

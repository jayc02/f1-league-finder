CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_region_idx" ON "User"("region");

CREATE INDEX IF NOT EXISTS "RaceResult_submittedAt_idx" ON "RaceResult"("submittedAt");

CREATE INDEX IF NOT EXISTS "RaceResultEntry_userId_idx" ON "RaceResultEntry"("userId");
CREATE INDEX IF NOT EXISTS "RaceResultEntry_userId_pointsAwarded_idx" ON "RaceResultEntry"("userId", "pointsAwarded");

CREATE INDEX IF NOT EXISTS "HonourEvent_userId_type_idx" ON "HonourEvent"("userId", "type");
CREATE INDEX IF NOT EXISTS "HonourEvent_userId_type_delta_idx" ON "HonourEvent"("userId", "type", "delta");

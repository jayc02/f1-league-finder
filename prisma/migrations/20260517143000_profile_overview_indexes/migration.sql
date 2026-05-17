-- Narrow indexes used by the private profile overview API.
CREATE INDEX IF NOT EXISTS "User_skillRating_honourScore_idx" ON "User"("skillRating", "honourScore");
CREATE INDEX IF NOT EXISTS "User_region_skillRating_honourScore_idx" ON "User"("region", "skillRating", "honourScore");

CREATE INDEX IF NOT EXISTS "RaceRegistration_userId_raceSlotId_idx" ON "RaceRegistration"("userId", "raceSlotId");

CREATE INDEX IF NOT EXISTS "RaceResultEntry_userId_raceResultId_idx" ON "RaceResultEntry"("userId", "raceResultId");

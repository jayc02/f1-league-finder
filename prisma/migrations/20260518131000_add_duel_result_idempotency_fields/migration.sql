-- Add durable duel result fields used to make confirmation and admin resolution idempotent.
ALTER TABLE "Duel"
ADD COLUMN IF NOT EXISTS "winnerUserId" TEXT;

ALTER TABLE "Duel"
ADD COLUMN IF NOT EXISTS "resultAppliedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Duel_winnerUserId_idx" ON "Duel"("winnerUserId");
CREATE INDEX IF NOT EXISTS "Duel_resultAppliedAt_idx" ON "Duel"("resultAppliedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Duel_winnerUserId_fkey'
  ) THEN
    ALTER TABLE "Duel"
    ADD CONSTRAINT "Duel_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

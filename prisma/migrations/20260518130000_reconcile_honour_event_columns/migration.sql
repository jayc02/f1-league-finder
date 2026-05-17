-- Reconcile schema drift observed in live databases without touching existing data.
ALTER TABLE "HonourEvent"
ADD COLUMN IF NOT EXISTS "warningIssued" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "HonourEvent"
ADD COLUMN IF NOT EXISTS "metadata" JSONB;

ALTER TABLE "RaceResult"
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "RaceResultEntry"
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

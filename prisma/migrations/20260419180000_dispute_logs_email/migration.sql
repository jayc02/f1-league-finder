-- Ensure dispute lifecycle columns exist before constraints/indexes
ALTER TABLE "Dispute"
  ADD COLUMN IF NOT EXISTS "resolutionNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resolvedById" TEXT;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Dispute_status_createdAt_idx" ON "Dispute"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Dispute_resolvedById_resolvedAt_idx" ON "Dispute"("resolvedById", "resolvedAt");

-- CreateTable
CREATE TABLE "DisputeStatusLog" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "fromStatus" "DisputeStatus",
    "toStatus" "DisputeStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeEmailLog" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyPreview" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisputeStatusLog_disputeId_createdAt_idx" ON "DisputeStatusLog"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "DisputeEmailLog_disputeId_createdAt_idx" ON "DisputeEmailLog"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "DisputeEmailLog_recipientId_createdAt_idx" ON "DisputeEmailLog"("recipientId", "createdAt");

-- AddForeignKey
ALTER TABLE "DisputeStatusLog" ADD CONSTRAINT "DisputeStatusLog_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeStatusLog" ADD CONSTRAINT "DisputeStatusLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEmailLog" ADD CONSTRAINT "DisputeEmailLog_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEmailLog" ADD CONSTRAINT "DisputeEmailLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEmailLog" ADD CONSTRAINT "DisputeEmailLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

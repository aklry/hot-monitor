-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "batchId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_batchId_idx" ON "Notification"("batchId");

-- CreateTable
CREATE TABLE "TrendSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trendTopicId" TEXT NOT NULL,
    "hotScore" REAL NOT NULL,
    "growthScore" REAL NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrendSnapshot_trendTopicId_fkey" FOREIGN KEY ("trendTopicId") REFERENCES "TrendTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrendTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "hotScore" REAL NOT NULL,
    "growthScore" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_TrendTopic" ("createdAt", "evidenceCount", "firstSeenAt", "growthScore", "hotScore", "id", "lastSeenAt", "scope", "summary", "title") SELECT "createdAt", "evidenceCount", "firstSeenAt", "growthScore", "hotScore", "id", "lastSeenAt", "scope", "summary", "title" FROM "TrendTopic";
DROP TABLE "TrendTopic";
ALTER TABLE "new_TrendTopic" RENAME TO "TrendTopic";
CREATE INDEX "TrendTopic_scope_idx" ON "TrendTopic"("scope");
CREATE INDEX "TrendTopic_status_idx" ON "TrendTopic"("status");
CREATE INDEX "TrendTopic_hotScore_idx" ON "TrendTopic"("hotScore");
CREATE INDEX "TrendTopic_lastSeenAt_idx" ON "TrendTopic"("lastSeenAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TrendSnapshot_trendTopicId_idx" ON "TrendSnapshot"("trendTopicId");

-- CreateIndex
CREATE INDEX "TrendSnapshot_capturedAt_idx" ON "TrendSnapshot"("capturedAt");

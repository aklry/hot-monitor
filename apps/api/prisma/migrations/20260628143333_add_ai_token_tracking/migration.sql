-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "keywordId" TEXT,
    "taskType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "isRelevant" BOOLEAN NOT NULL DEFAULT false,
    "isImpersonation" BOOLEAN NOT NULL DEFAULT false,
    "confidence" REAL NOT NULL DEFAULT 0,
    "hotScore" REAL,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "topic" TEXT,
    "reason" TEXT NOT NULL,
    "rawJson" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiAnalysis_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectedItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiAnalysis_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "MonitorKeyword" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AiAnalysis" ("confidence", "createdAt", "hotScore", "id", "isImpersonation", "isRelevant", "itemId", "keywordId", "model", "rawJson", "reason", "riskLevel", "taskType", "topic") SELECT "confidence", "createdAt", "hotScore", "id", "isImpersonation", "isRelevant", "itemId", "keywordId", "model", "rawJson", "reason", "riskLevel", "taskType", "topic" FROM "AiAnalysis";
DROP TABLE "AiAnalysis";
ALTER TABLE "new_AiAnalysis" RENAME TO "AiAnalysis";
CREATE INDEX "AiAnalysis_taskType_idx" ON "AiAnalysis"("taskType");
CREATE INDEX "AiAnalysis_keywordId_idx" ON "AiAnalysis"("keywordId");
CREATE INDEX "AiAnalysis_itemId_idx" ON "AiAnalysis"("itemId");
CREATE INDEX "AiAnalysis_createdAt_idx" ON "AiAnalysis"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

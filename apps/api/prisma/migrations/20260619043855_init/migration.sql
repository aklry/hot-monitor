-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonitorKeyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "checkIntervalMinutes" INTEGER NOT NULL DEFAULT 10,
    "lastCheckedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 50,
    "lastFetchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CollectedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "author" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "publishedAt" DATETIME,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT NOT NULL,
    CONSTRAINT "CollectedItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiAnalysis" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiAnalysis_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectedItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiAnalysis_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "MonitorKeyword" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "hotScore" REAL NOT NULL,
    "growthScore" REAL NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TrendEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trendTopicId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sourceWeight" INTEGER NOT NULL,
    "aiReason" TEXT NOT NULL,
    CONSTRAINT "TrendEvidence_trendTopicId_fkey" FOREIGN KEY ("trendTopicId") REFERENCES "TrendTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrendEvidence_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectedItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "target" TEXT,
    "relatedItemId" TEXT,
    "relatedTrendId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "error" TEXT,
    CONSTRAINT "Notification_relatedItemId_fkey" FOREIGN KEY ("relatedItemId") REFERENCES "CollectedItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_relatedTrendId_fkey" FOREIGN KEY ("relatedTrendId") REFERENCES "TrendTopic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MonitorKeyword_enabled_idx" ON "MonitorKeyword"("enabled");

-- CreateIndex
CREATE INDEX "MonitorKeyword_scope_idx" ON "MonitorKeyword"("scope");

-- CreateIndex
CREATE INDEX "Source_enabled_idx" ON "Source"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Source_type_url_key" ON "Source"("type", "url");

-- CreateIndex
CREATE UNIQUE INDEX "CollectedItem_hash_key" ON "CollectedItem"("hash");

-- CreateIndex
CREATE INDEX "CollectedItem_url_idx" ON "CollectedItem"("url");

-- CreateIndex
CREATE INDEX "CollectedItem_publishedAt_idx" ON "CollectedItem"("publishedAt");

-- CreateIndex
CREATE INDEX "AiAnalysis_taskType_idx" ON "AiAnalysis"("taskType");

-- CreateIndex
CREATE INDEX "AiAnalysis_keywordId_idx" ON "AiAnalysis"("keywordId");

-- CreateIndex
CREATE INDEX "AiAnalysis_itemId_idx" ON "AiAnalysis"("itemId");

-- CreateIndex
CREATE INDEX "TrendTopic_scope_idx" ON "TrendTopic"("scope");

-- CreateIndex
CREATE INDEX "TrendTopic_hotScore_idx" ON "TrendTopic"("hotScore");

-- CreateIndex
CREATE INDEX "TrendTopic_lastSeenAt_idx" ON "TrendTopic"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrendEvidence_trendTopicId_itemId_key" ON "TrendEvidence"("trendTopicId", "itemId");

-- CreateIndex
CREATE INDEX "Notification_channel_idx" ON "Notification"("channel");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

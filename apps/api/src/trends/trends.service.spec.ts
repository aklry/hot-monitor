jest.mock("../database/prisma.service", () => ({
  PrismaService: class PrismaService {}
}))
jest.mock("../sources/sources.service", () => ({
  SourcesService: class SourcesService {}
}))
jest.mock("../ai/trend-analysis.service", () => ({
  TrendAnalysisService: class TrendAnalysisService {}
}))

import { TrendsService } from "./trends.service"

describe("TrendsService", () => {
  it("does not create a trend when all dated evidence is stale", async () => {
    const prisma = {
      collectedItem: { upsert: jest.fn() },
      trendTopic: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() }
    }
    const sources = {
      searchAll: jest.fn().mockResolvedValue([
        {
          sourceName: "Old RSS",
          sourceType: "rss",
          title: "Old AI topic",
          url: "https://example.com/old-topic",
          publishedAt: "2025-01-01T00:00:00.000Z"
        }
      ])
    }
    const trendAnalysis = { analyzeTrend: jest.fn() }
    const service = new TrendsService(prisma as never, sources as never, trendAnalysis as never)

    const result = await service.runNow("ai")

    expect(result).toEqual({ trend: null, candidates: 1, evidence: 0 })
    expect(trendAnalysis.analyzeTrend).not.toHaveBeenCalled()
    expect(prisma.trendTopic.create).not.toHaveBeenCalled()
    expect(prisma.collectedItem.upsert).not.toHaveBeenCalled()
  })
})
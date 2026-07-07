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
  const now = new Date("2026-06-24T12:00:00.000Z")

  it("does not create a trend when all dated evidence is stale", async () => {
    const prisma = {
      collectedItem: { upsert: jest.fn() },
      trendTopic: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      trendSnapshot: { create: jest.fn() },
      trendEvidence: { count: jest.fn(), upsert: jest.fn() }
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

    const result = await service.runNow("ai", now)

    expect(result).toEqual({ trend: null, candidates: 1, evidence: 0 })
    expect(trendAnalysis.analyzeTrend).not.toHaveBeenCalled()
    expect(prisma.trendTopic.create).not.toHaveBeenCalled()
    expect(prisma.collectedItem.upsert).not.toHaveBeenCalled()
  })

  it("updates a matching trend and records a lifecycle snapshot", async () => {
    const item = {
      id: "item-1",
      publishedAt: new Date("2026-06-24T10:00:00.000Z"),
      fetchedAt: new Date("2026-06-24T10:05:00.000Z"),
      url: "https://example.com/agent-tools"
    }
    const existingTrend = {
      id: "trend-1",
      scope: "ai programming",
      title: "AI agents reshape developer workflows",
      summary: "Developers are adopting agentic coding tools.",
      hotScore: 60,
      growthScore: 20,
      evidenceCount: 2,
      firstSeenAt: new Date("2026-06-22T08:00:00.000Z"),
      lastSeenAt: new Date("2026-06-23T08:00:00.000Z"),
      createdAt: new Date("2026-06-22T08:00:00.000Z")
    }
    const updatedTrend = {
      ...existingTrend,
      title: "AI agent tools reshape developer workflows",
      hotScore: 69,
      growthScore: 61,
      evidenceCount: 3,
      status: "surging",
      lastSeenAt: now
    }
    const prisma = {
      aiAnalysis: { create: jest.fn() },
      collectedItem: { upsert: jest.fn().mockResolvedValue(item) },
      trendTopic: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([existingTrend]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(updatedTrend)
      },
      trendSnapshot: { create: jest.fn() },
      trendEvidence: { count: jest.fn().mockResolvedValue(3), upsert: jest.fn() }
    }
    const sources = {
      searchAll: jest.fn().mockResolvedValue([
        {
          sourceName: "Example News",
          sourceType: "rss",
          title: "AI agent tools reshape developer workflows",
          url: "https://example.com/agent-tools",
          summary: "Agentic coding tools are moving into daily developer work.",
          publishedAt: "2026-06-24T10:00:00.000Z"
        }
      ])
    }
    const trendAnalysis = {
      analyzeTrend: jest.fn().mockResolvedValue({
        analysis: {
          title: "AI agent tools reshape developer workflows",
          summary: "Developers are adopting agentic coding tools across daily work.",
          hotScore: 95,
          growthScore: 61,
          whyNow: "Fresh coverage from developer tooling sources.",
          evidence: [
            {
              itemUrl: "https://example.com/agent-tools",
              reason: "New evidence confirms acceleration."
            }
          ]
        },
        usage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 }
      })
    }
    const service = new TrendsService(prisma as never, sources as never, trendAnalysis as never)

    const result = await service.runNow("ai programming", now)

    expect(result).toEqual({ trend: updatedTrend, candidates: 1, evidence: 1, merged: true })
    expect(prisma.trendTopic.create).not.toHaveBeenCalled()
    expect(prisma.trendTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: existingTrend.id },
        data: expect.objectContaining({
          title: "AI agent tools reshape developer workflows",
          status: "surging",
          hotScore: 69,
          growthScore: 61,
          evidenceCount: 3,
          lastSeenAt: now
        })
      })
    )
    expect(prisma.trendEvidence.count).toHaveBeenCalledWith({
      where: { trendTopicId: existingTrend.id }
    })
    expect(prisma.trendEvidence.upsert).toHaveBeenCalledWith({
      where: {
        trendTopicId_itemId: {
          trendTopicId: existingTrend.id,
          itemId: item.id
        }
      },
      update: {
        sourceWeight: 50,
        aiReason: "New evidence confirms acceleration."
      },
      create: {
        trendTopicId: existingTrend.id,
        itemId: item.id,
        sourceWeight: 50,
        aiReason: "New evidence confirms acceleration."
      }
    })
    expect(prisma.aiAnalysis.create).toHaveBeenCalledWith({
      data: {
        itemId: item.id,
        taskType: "trend_discovery",
        model: "deepseek",
        isRelevant: true,
        confidence: 1,
        hotScore: 95,
        riskLevel: "low",
        topic: "AI agent tools reshape developer workflows",
        reason: "Fresh coverage from developer tooling sources.",
        rawJson: JSON.stringify({
          title: "AI agent tools reshape developer workflows",
          summary: "Developers are adopting agentic coding tools across daily work.",
          hotScore: 95,
          growthScore: 61,
          whyNow: "Fresh coverage from developer tooling sources.",
          evidence: [
            {
              itemUrl: "https://example.com/agent-tools",
              reason: "New evidence confirms acceleration."
            }
          ]
        }),
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300
      }
    })
    expect(prisma.trendSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        trendTopicId: existingTrend.id,
        hotScore: 69,
        growthScore: 61,
        evidenceCount: 1,
        sourceCount: 1,
        status: "surging",
        capturedAt: now
      })
    })
  })

  it("records AI-selected evidence even when it is outside the first ten candidates", async () => {
    const xUrl = "https://x.com/i/web/status/123"
    const candidates = [
      ...Array.from({ length: 10 }, (_, index) => ({
        sourceName: "GitHub Trending",
        sourceType: "github_trending",
        externalId: `github-${index}`,
        title: `Repository ${index}`,
        url: `https://github.com/example/repo-${index}`,
        summary: "A repository related to agent skills.",
        publishedAt: "2026-06-24T10:00:00.000Z"
      })),
      {
        sourceName: "X",
        sourceType: "x",
        externalId: "x-item",
        title: "Developers are discussing agent skills on X",
        url: xUrl,
        summary: "A social post points to the same emerging trend.",
        publishedAt: "2026-06-24T10:30:00.000Z"
      }
    ]
    const existingTrend = {
      id: "trend-1",
      scope: "ai programming",
      title: "Agent skills reshape developer workflows",
      summary: "Developers are adopting reusable agent skills.",
      hotScore: 60,
      growthScore: 20,
      evidenceCount: 10,
      firstSeenAt: new Date("2026-06-22T08:00:00.000Z"),
      lastSeenAt: new Date("2026-06-23T08:00:00.000Z"),
      createdAt: new Date("2026-06-22T08:00:00.000Z")
    }
    const prisma = {
      aiAnalysis: { create: jest.fn() },
      collectedItem: {
        upsert: jest.fn(async ({ create }) => ({
          id: create.externalId,
          url: create.url,
          publishedAt: create.publishedAt,
          fetchedAt: create.publishedAt
        }))
      },
      trendTopic: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([existingTrend]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ ...existingTrend, evidenceCount: 11 })
      },
      trendSnapshot: { create: jest.fn() },
      trendEvidence: { count: jest.fn().mockResolvedValue(11), upsert: jest.fn() }
    }
    const sources = {
      searchAll: jest.fn().mockResolvedValue(candidates)
    }
    const trendAnalysis = {
      analyzeTrend: jest.fn().mockResolvedValue({
        analysis: {
          title: "Agent skills reshape developer workflows",
          summary: "Developers are adopting reusable agent skills.",
          hotScore: 95,
          growthScore: 61,
          whyNow: "Fresh coverage and social discussion point to the same trend.",
          evidence: [
            {
              itemUrl: xUrl,
              reason: "The X post confirms real-time social discussion."
            }
          ]
        },
        usage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 }
      })
    }
    const service = new TrendsService(prisma as never, sources as never, trendAnalysis as never)

    await service.runNow("ai programming", now)

    expect(prisma.trendEvidence.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          trendTopicId_itemId: {
            trendTopicId: existingTrend.id,
            itemId: "x-item"
          }
        },
        create: expect.objectContaining({
          trendTopicId: existingTrend.id,
          itemId: "x-item",
          aiReason: "The X post confirms real-time social discussion."
        })
      })
    )
  })

  it("keeps evidence from scanned sources that AI did not select explicitly", async () => {
    const xUrl = "https://x.com/i/web/status/456"
    const candidates = [
      ...Array.from({ length: 10 }, (_, index) => ({
        sourceName: "GitHub Trending",
        sourceType: "github_trending",
        externalId: `github-${index}`,
        title: `Repository ${index}`,
        url: `https://github.com/example/source-repo-${index}`,
        summary: "A repository related to agent skills.",
        publishedAt: "2026-06-24T10:00:00.000Z"
      })),
      {
        sourceName: "X",
        sourceType: "x",
        externalId: "x-item",
        title: "AI programming discussion on X",
        url: xUrl,
        summary: "A social post from X related to AI programming.",
        publishedAt: "2026-06-24T10:30:00.000Z"
      }
    ]
    const existingTrend = {
      id: "trend-1",
      scope: "ai programming",
      title: "Agent skills reshape developer workflows",
      summary: "Developers are adopting reusable agent skills.",
      hotScore: 60,
      growthScore: 20,
      evidenceCount: 10,
      firstSeenAt: new Date("2026-06-22T08:00:00.000Z"),
      lastSeenAt: new Date("2026-06-23T08:00:00.000Z"),
      createdAt: new Date("2026-06-22T08:00:00.000Z")
    }
    const prisma = {
      aiAnalysis: { create: jest.fn() },
      collectedItem: {
        upsert: jest.fn(async ({ create }) => ({
          id: create.externalId,
          url: create.url,
          publishedAt: create.publishedAt,
          fetchedAt: create.publishedAt
        }))
      },
      trendTopic: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([existingTrend]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ ...existingTrend, evidenceCount: 11 })
      },
      trendSnapshot: { create: jest.fn() },
      trendEvidence: { count: jest.fn().mockResolvedValue(11), upsert: jest.fn() }
    }
    const sources = {
      searchAll: jest.fn().mockResolvedValue(candidates)
    }
    const trendAnalysis = {
      analyzeTrend: jest.fn().mockResolvedValue({
        analysis: {
          title: "Agent skills reshape developer workflows",
          summary: "Developers are adopting reusable agent skills.",
          hotScore: 95,
          growthScore: 61,
          whyNow: "Fresh coverage and social discussion point to the same trend.",
          evidence: [
            {
              itemUrl: "https://github.com/example/source-repo-0",
              reason: "The GitHub repository is a strong direct signal."
            }
          ]
        },
        usage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 }
      })
    }
    const service = new TrendsService(prisma as never, sources as never, trendAnalysis as never)

    await service.runNow("ai programming", now)

    expect(prisma.trendEvidence.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          trendTopicId_itemId: {
            trendTopicId: existingTrend.id,
            itemId: "x-item"
          }
        },
        create: expect.objectContaining({
          trendTopicId: existingTrend.id,
          itemId: "x-item",
          aiReason: "Fresh coverage and social discussion point to the same trend."
        })
      })
    )
  })
})

import { Injectable, NotFoundException } from "@nestjs/common"
import { TrendAnalysisService } from "../ai/trend-analysis.service"
import { PrismaService } from "../database/prisma.service"
import { SourcesService } from "../sources/sources.service"
import { candidateHash } from "../sources/source-normalizer"
import { filterCurrentTrendCandidates } from "./trend-recency"
import { calculateTrendScore } from "./trend-score"

@Injectable()
export class TrendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesService,
    private readonly trendAnalysis: TrendAnalysisService
  ) {}

  list(scope?: string) {
    return this.prisma.trendTopic.findMany({
      where: scope ? { scope } : undefined,
      orderBy: [{ hotScore: "desc" }, { lastSeenAt: "desc" }],
      take: 50
    })
  }

  async get(id: string) {
    const trend = await this.prisma.trendTopic.findUnique({
      where: { id },
      include: {
        evidences: {
          include: { item: { include: { source: true } } }
        }
      }
    })
    if (!trend) {
      throw new NotFoundException("Trend not found")
    }
    return trend
  }

  async runNow(scope: string) {
    const candidates = await this.sources.searchAll(scope)
    const now = new Date()
    const current = filterCurrentTrendCandidates(candidates, now)
    const limited = current.candidates.slice(0, 30)

    if (current.recentDatedCount === 0 || limited.length === 0) {
      return { trend: null, candidates: candidates.length, evidence: 0 }
    }

    const analysis = await this.trendAnalysis.analyzeTrend(scope, limited, now)

    const items = []
    for (const candidate of limited) {
      const hash = candidateHash(candidate.title, candidate.url)
      const item = await this.prisma.collectedItem.upsert({
        where: { hash },
        update: {},
        create: {
          hash,
          source: {
            connectOrCreate: {
              where: {
                type_url: {
                  type: candidate.sourceType,
                  url: candidate.sourceName
                }
              },
              create: {
                name: candidate.sourceName,
                type: candidate.sourceType,
                url: candidate.sourceName
              }
            }
          },
          externalId: candidate.externalId,
          title: candidate.title,
          url: candidate.url,
          author: candidate.author,
          summary: candidate.summary,
          content: candidate.content,
          publishedAt: candidate.publishedAt ? new Date(candidate.publishedAt) : undefined
        }
      })
      items.push(item)
    }

    const newest = items.reduce<Date>((acc, item) => {
      const published = item.publishedAt ?? item.fetchedAt
      return published > acc ? published : acc
    }, new Date(0))
    const newestItemAgeHours = Math.max(0, (now.getTime() - newest.getTime()) / 36e5)
    const hotScore = calculateTrendScore({
      aiHotScore: analysis.hotScore,
      sourceCount: new Set(limited.map((item) => item.sourceName)).size,
      averageSourceWeight: 50,
      newestItemAgeHours
    })

    const trend = await this.prisma.trendTopic.create({
      data: {
        scope,
        title: analysis.title,
        summary: analysis.summary,
        hotScore,
        growthScore: analysis.growthScore,
        evidenceCount: items.length,
        firstSeenAt: newest,
        lastSeenAt: now,
        evidences: {
          create: items.slice(0, 10).map((item) => ({
            itemId: item.id,
            sourceWeight: 50,
            aiReason:
              analysis.evidence.find((evidence) => evidence.itemUrl === item.url)?.reason ??
              analysis.whyNow
          }))
        }
      },
      include: { evidences: true }
    })

    return { trend, candidates: candidates.length, evidence: items.length }
  }
}
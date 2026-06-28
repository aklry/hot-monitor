import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import { CreateMonitorSchema, UpdateMonitorSchema } from "@hots-monitor/shared"
import type { CreateMonitorInput, UpdateMonitorInput } from "@hots-monitor/shared"
import { ContentAnalysisService } from "../ai/content-analysis.service"
import { AiUsageService } from "../ai/ai-usage.service"
import { PrismaService } from "../database/prisma.service"
import { NotificationBatchService } from "../notifications/notification-batch.service"
import { NotificationsService } from "../notifications/notifications.service"
import { SourcesService } from "../sources/sources.service"
import { candidateHash } from "../sources/source-normalizer"
import { shouldNotifyKeywordHit, shouldNotifyRiskAlert } from "./monitor-thresholds"

@Injectable()
export class MonitorsService {
  private readonly logger = new Logger(MonitorsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesService,
    private readonly contentAnalysis: ContentAnalysisService,
    private readonly notifications: NotificationsService,
    private readonly batchService: NotificationBatchService,
    private readonly aiUsage: AiUsageService
  ) {}

  list() {
    return this.prisma.monitorKeyword.findMany({ orderBy: { createdAt: "desc" } })
  }

  create(input: CreateMonitorInput) {
    const data = CreateMonitorSchema.parse(input)
    return this.prisma.monitorKeyword.create({ data })
  }

  update(id: string, input: UpdateMonitorInput) {
    const data = UpdateMonitorSchema.parse(input)
    return this.prisma.monitorKeyword.update({ where: { id }, data })
  }

  delete(id: string) {
    return this.prisma.monitorKeyword.delete({ where: { id } })
  }

  async runNow(id: string) {
    const monitor = await this.prisma.monitorKeyword.findUnique({ where: { id } })
    if (!monitor) {
      throw new NotFoundException("Monitor not found")
    }

    const candidates = await this.sources.searchAll(`${monitor.keyword} ${monitor.scope}`)
    let analyzed = 0
    let skipped = 0
    let notifications = 0
    let totalTokens = 0

    for (const candidate of candidates.slice(0, 25)) {
      if (!matchesKeyword(candidate.title, candidate.summary, monitor.keyword)) {
        skipped += 1
        continue
      }

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

      const cached = await this.prisma.aiAnalysis.findFirst({
        where: {
          itemId: item.id,
          keywordId: monitor.id,
          taskType: "keyword_monitor"
        },
        orderBy: { createdAt: "desc" }
      })
      if (cached) {
        const analysis = JSON.parse(cached.rawJson)
        if (shouldNotifyRiskAlert(analysis)) {
          await this.createRiskNotifications(
            item.id,
            monitor.keyword,
            analysis.topic,
            analysis.reason
          )
          notifications += 1
        } else if (shouldNotifyKeywordHit(analysis)) {
          await this.batchService.bufferHit(
            monitor.id,
            monitor.keyword,
            item.id,
            analysis.topic,
            analysis.reason
          )
          notifications += 1
        }
        analyzed += 1
        continue
      }

      if (!(await this.aiUsage.isWithinBudget())) {
        this.logger.warn("AI daily token budget exhausted, skipping remaining candidates")
        break
      }

      const { analysis, usage } = await this.contentAnalysis.analyzeKeyword({
        keyword: monitor.keyword,
        scope: monitor.scope,
        title: candidate.title,
        url: candidate.url,
        summary: candidate.summary,
        content: candidate.content
      })
      analyzed += 1
      totalTokens += usage.totalTokens

      await this.prisma.aiAnalysis.create({
        data: {
          itemId: item.id,
          keywordId: monitor.id,
          taskType: "keyword_monitor",
          model: "deepseek",
          isRelevant: analysis.isRelevant,
          isImpersonation: analysis.isImpersonation,
          confidence: analysis.confidence,
          riskLevel: analysis.riskLevel,
          topic: analysis.topic,
          reason: analysis.reason,
          rawJson: JSON.stringify(analysis),
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens
        }
      })

      if (shouldNotifyRiskAlert(analysis)) {
        await this.createRiskNotifications(
          item.id,
          monitor.keyword,
          analysis.topic,
          analysis.reason
        )
        notifications += 1
      } else if (shouldNotifyKeywordHit(analysis)) {
        await this.batchService.bufferHit(
          monitor.id,
          monitor.keyword,
          item.id,
          analysis.topic,
          analysis.reason
        )
        notifications += 1
      }
    }

    await this.prisma.monitorKeyword.update({
      where: { id: monitor.id },
      data: { lastCheckedAt: new Date() }
    })

    return { candidates: candidates.length, analyzed, skipped, notifications, totalTokens }
  }

  private async createRiskNotifications(
    itemId: string,
    keyword: string,
    topic: string,
    reason: string
  ) {
    await Promise.all([
      this.notifications.create({
        type: "risk_alert",
        title: `Risk alert: ${keyword}`,
        message: `${topic}: ${reason}`,
        channel: "in_app",
        status: "sent",
        relatedItemId: itemId
      }),
      this.notifications.create({
        type: "risk_alert",
        title: `Risk alert: ${keyword}`,
        message: `${topic}: ${reason}`,
        channel: "browser",
        status: "pending",
        relatedItemId: itemId
      }),
      this.notifications.create({
        type: "risk_alert",
        title: `Risk alert: ${keyword}`,
        message: `${topic}: ${reason}`,
        channel: "email",
        status: "pending",
        relatedItemId: itemId
      })
    ])
  }
}

function matchesKeyword(title: string, summary: string | undefined, keyword: string): boolean {
  const lowerKeyword = keyword.toLowerCase()
  const lowerTitle = title.toLowerCase()
  const lowerSummary = (summary ?? "").toLowerCase()
  return lowerTitle.includes(lowerKeyword) || lowerSummary.includes(lowerKeyword)
}

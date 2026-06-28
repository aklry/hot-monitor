import { Injectable, Logger } from "@nestjs/common"
import { PrismaService } from "../database/prisma.service"
import { NotificationsService } from "./notifications.service"
import { SettingsService } from "../settings/settings.service"

const DEFAULT_WINDOW_MINUTES = 10

interface BufferedHit {
  id: string
  batchId: string | null
  relatedItemId: string | null
  message: string
}

@Injectable()
export class NotificationBatchService {
  private readonly logger = new Logger(NotificationBatchService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService
  ) {}

  async bufferHit(
    monitorId: string,
    keyword: string,
    itemId: string,
    topic: string,
    reason: string
  ) {
    const windowMinutes = await this.getWindowMinutes()
    const batchId = this.computeBatchId(monitorId, windowMinutes)

    const existing = await this.prisma.notification.findFirst({
      where: { batchId, relatedItemId: itemId, status: "buffered" }
    })
    if (existing) {
      return existing
    }

    const buffered = await this.prisma.notification.create({
      data: {
        type: "keyword_hit",
        title: `Keyword hit: ${keyword}`,
        message: `${topic}: ${reason}`,
        channel: "in_app",
        status: "buffered",
        relatedItemId: itemId,
        batchId
      }
    })

    this.notifications.emitBrowserNotification({
      type: "keyword_hit",
      title: `Keyword hit: ${keyword}`,
      message: `${topic}: ${reason}`,
      relatedItemId: itemId
    })

    return buffered
  }

  async flushDueBatches() {
    const windowMinutes = await this.getWindowMinutes()
    const cutoff = new Date(Date.now() - windowMinutes * 60_000)

    const buffered = await this.prisma.notification.findMany({
      where: { status: "buffered", createdAt: { lt: cutoff } },
      orderBy: { createdAt: "asc" }
    })

    if (buffered.length === 0) {
      return
    }

    const groups = new Map<string, BufferedHit[]>()
    for (const hit of buffered) {
      const key = hit.batchId ?? hit.id
      const list = groups.get(key) ?? []
      list.push(hit)
      groups.set(key, list)
    }

    for (const [batchId, hits] of groups) {
      try {
        await this.flushOneBatch(batchId, hits)
      } catch (error) {
        this.logger.error(`Flush batch ${batchId} failed: ${(error as Error).message}`)
      }
    }
  }

  private async flushOneBatch(batchId: string, hits: BufferedHit[]) {
    const firstHit = hits[0]
    const keyword = this.extractKeyword(firstHit.message)

    if (hits.length === 1) {
      await this.prisma.notification.update({
        where: { id: firstHit.id },
        data: { status: "sent" }
      })
      await this.notifications.create({
        type: "keyword_hit",
        title: `Keyword hit: ${keyword}`,
        message: firstHit.message,
        channel: "email",
        status: "pending",
        relatedItemId: firstHit.relatedItemId ?? undefined
      })
    } else {
      const summaryLines = hits.map((h, i) => `${i + 1}. ${h.message}`).join("\n")
      const title = `Keyword hits: ${keyword} (${hits.length} items)`

      await this.prisma.notification.update({
        where: { id: firstHit.id },
        data: { title, message: summaryLines, status: "sent" }
      })
      await this.prisma.notification.updateMany({
        where: { batchId, status: "buffered", id: { not: firstHit.id } },
        data: { status: "sent" }
      })
      await this.notifications.create({
        type: "keyword_hit",
        title,
        message: summaryLines,
        channel: "email",
        status: "pending",
        batchId
      })
    }
  }

  private computeBatchId(monitorId: string, windowMinutes: number): string {
    const windowMs = windowMinutes * 60_000
    const windowIndex = Math.floor(Date.now() / windowMs)
    return `${monitorId}-${windowIndex}`
  }

  private async getWindowMinutes(): Promise<number> {
    const raw = await this.settings.getRaw("NOTIFICATION_AGGREGATE_WINDOW_MINUTES")
    return Number(raw) || DEFAULT_WINDOW_MINUTES
  }

  private extractKeyword(message: string): string {
    const colonIndex = message.indexOf(":")
    return colonIndex > 0 ? message.slice(0, colonIndex).trim() : message
  }
}

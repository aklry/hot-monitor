import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaService } from "../database/prisma.service"
import { MonitorsService } from "../monitors/monitors.service"
import { NotificationBatchService } from "../notifications/notification-batch.service"
import { SettingsService } from "../settings/settings.service"
import { TrendsService } from "../trends/trends.service"

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name)
  private lastTrendRunAt: Date | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly monitors: MonitorsService,
    private readonly trends: TrendsService,
    private readonly settings: SettingsService,
    private readonly batchService: NotificationBatchService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    await this.runDueMonitors()
    await this.runDueTrendDiscovery()
    await this.flushDueBatches()
  }

  private async runDueMonitors() {
    const monitors = await this.prisma.monitorKeyword.findMany({ where: { enabled: true } })
    const now = new Date()

    for (const monitor of monitors) {
      const intervalMs = monitor.checkIntervalMinutes * 60_000
      const due =
        !monitor.lastCheckedAt || now.getTime() - monitor.lastCheckedAt.getTime() >= intervalMs

      if (!due) {
        continue
      }

      try {
        await this.monitors.runNow(monitor.id)
      } catch (error) {
        this.logger.error(`Monitor ${monitor.id} failed: ${(error as Error).message}`)
      }
    }
  }

  private async flushDueBatches() {
    try {
      await this.batchService.flushDueBatches()
    } catch (error) {
      this.logger.error(`Batch flush failed: ${(error as Error).message}`)
    }
  }

  private async runDueTrendDiscovery() {
    const interval = Number((await this.settings.getRaw("TRENDS_INTERVAL_MINUTES")) ?? 60)
    const scope = (await this.settings.getRaw("TRENDS_DEFAULT_SCOPE")) ?? "ai programming"
    const now = new Date()

    if (this.lastTrendRunAt && now.getTime() - this.lastTrendRunAt.getTime() < interval * 60_000) {
      return
    }

    try {
      await this.trends.runNow(scope)
      this.lastTrendRunAt = now
    } catch (error) {
      this.logger.error(`Trend discovery failed: ${(error as Error).message}`)
    }
  }
}

import { Injectable, Logger } from "@nestjs/common"
import { PrismaService } from "../database/prisma.service"
import { SettingsService } from "../settings/settings.service"

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService
  ) {}

  async getDailyUsage(now = new Date()) {
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const result = await this.prisma.aiAnalysis.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: true
    })

    return {
      totalTokens: result._sum.totalTokens ?? 0,
      promptTokens: result._sum.promptTokens ?? 0,
      completionTokens: result._sum.completionTokens ?? 0,
      requestCount: result._count
    }
  }

  async getDailyBudget(): Promise<number> {
    const raw = await this.settings.getRaw("AI_DAILY_TOKEN_BUDGET")
    return Number(raw) || 0
  }

  async isWithinBudget(): Promise<boolean> {
    const budget = await this.getDailyBudget()
    if (budget <= 0) {
      return true
    }
    const usage = await this.getDailyUsage()
    return usage.totalTokens < budget
  }

  async recordUsage(data: { promptTokens: number; completionTokens: number; totalTokens: number }) {
    this.logger.debug(
      `AI usage: ${data.totalTokens} tokens (${data.promptTokens} prompt + ${data.completionTokens} completion)`
    )
  }
}

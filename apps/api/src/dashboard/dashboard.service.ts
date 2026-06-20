import { Injectable } from "@nestjs/common"
import { PrismaService } from "../database/prisma.service"

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [activeMonitors, todayHits, riskAlerts, latestTrends, latestNotifications, sources] =
      await Promise.all([
        this.prisma.monitorKeyword.count({ where: { enabled: true } }),
        this.prisma.notification.count({
          where: { type: "keyword_hit", createdAt: { gte: startOfDay } }
        }),
        this.prisma.notification.count({
          where: { type: "risk_alert", status: { not: "read" } }
        }),
        this.prisma.trendTopic.findMany({
          orderBy: [{ hotScore: "desc" }, { lastSeenAt: "desc" }],
          take: 5
        }),
        this.prisma.notification.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            relatedItem: true
          }
        }),
        this.prisma.source.findMany({
          orderBy: { name: "asc" }
        })
      ])

    return {
      activeMonitors,
      todayHits,
      riskAlerts,
      latestTrends,
      latestNotifications,
      sources
    }
  }
}

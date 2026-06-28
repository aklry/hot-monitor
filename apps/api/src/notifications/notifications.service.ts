import { Injectable } from "@nestjs/common"
import { Subject } from "rxjs"
import { PrismaService } from "../database/prisma.service"
import { MailerService } from "./mailer.service"

export interface CreateNotificationInput {
  type: string
  title: string
  message: string
  channel: string
  status?: string
  target?: string
  relatedItemId?: string
  relatedTrendId?: string
  batchId?: string
}

@Injectable()
export class NotificationsService {
  private readonly stream = new Subject<MessageEvent>()

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        channel: input.channel,
        status: input.status ?? "pending",
        target: input.target,
        relatedItemId: input.relatedItemId,
        relatedTrendId: input.relatedTrendId,
        batchId: input.batchId
      },
      include: {
        relatedItem: true
      }
    })
    this.stream.next({ data: notification } as MessageEvent)
    return notification
  }

  list() {
    return this.prisma.notification.findMany({
      where: { status: { not: "buffered" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        relatedItem: true
      }
    })
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: "read" }
    })
  }

  streamEvents() {
    return this.stream.asObservable()
  }

  emitBrowserNotification(payload: {
    type: string
    title: string
    message: string
    relatedItemId?: string
  }) {
    this.stream.next({
      data: {
        id: `browser-${Date.now()}`,
        ...payload,
        channel: "browser",
        status: "pending"
      }
    } as MessageEvent)
  }

  async retry(id: string) {
    const notification = await this.prisma.notification.findUniqueOrThrow({ where: { id } })
    if (notification.channel !== "email") {
      return this.prisma.notification.update({
        where: { id },
        data: { status: "pending", error: null }
      })
    }

    try {
      await this.mailer.send({
        to: notification.target,
        subject: notification.title,
        text: notification.message
      })
      return this.prisma.notification.update({
        where: { id },
        data: { status: "sent", sentAt: new Date(), error: null }
      })
    } catch (error) {
      return this.prisma.notification.update({
        where: { id },
        data: { status: "failed", error: (error as Error).message }
      })
    }
  }
}

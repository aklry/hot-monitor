import { Injectable } from "@nestjs/common"
import { PrismaService } from "../database/prisma.service"

export interface CreateNotificationInput {
  type: string
  title: string
  message: string
  channel: string
  status?: string
  target?: string
  relatedItemId?: string
  relatedTrendId?: string
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        channel: input.channel,
        status: input.status ?? "pending",
        target: input.target,
        relatedItemId: input.relatedItemId,
        relatedTrendId: input.relatedTrendId
      }
    })
  }
}

jest.mock("../database/prisma.service", () => ({
  PrismaService: class PrismaService {}
}))
import { NotificationsService } from "./notifications.service"

describe("NotificationsService", () => {
  it("records email delivery failures on retry", async () => {
    const prisma = {
      notification: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "n1",
          channel: "email",
          title: "Title",
          message: "Message",
          target: "to@example.com"
        }),
        update: jest.fn()
      }
    }
    const mailer = {
      send: jest.fn().mockRejectedValue(new Error("SMTP failed"))
    }
    const service = new NotificationsService(prisma as never, mailer as never)

    await service.retry("n1")

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { status: "failed", error: "SMTP failed" }
    })
  })
  it("includes the related item when creating notifications", async () => {
    const created = {
      id: "n2",
      type: "keyword_hit",
      title: "Keyword hit",
      message: "Relevant article",
      channel: "browser",
      relatedItem: {
        id: "item-1",
        title: "Article title",
        url: "https://example.com/article"
      }
    }
    const prisma = {
      notification: {
        create: jest.fn().mockResolvedValue(created)
      }
    }
    const mailer = { send: jest.fn() }
    const service = new NotificationsService(prisma as never, mailer as never)

    await expect(
      service.create({
        type: "keyword_hit",
        title: "Keyword hit",
        message: "Relevant article",
        channel: "browser",
        relatedItemId: "item-1"
      })
    ).resolves.toBe(created)

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        type: "keyword_hit",
        title: "Keyword hit",
        message: "Relevant article",
        channel: "browser",
        status: "pending",
        target: undefined,
        relatedItemId: "item-1",
        relatedTrendId: undefined
      },
      include: {
        relatedItem: true
      }
    })
  })
})

jest.mock("../database/prisma.service", () => ({
  PrismaService: class PrismaService {}
}))
import { NotificationBatchService } from "./notification-batch.service"

function createMocks() {
  const prisma = {
    notification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    }
  }
  const notifications = {
    create: jest.fn().mockResolvedValue({}),
    emitBrowserNotification: jest.fn()
  }
  const settings = {
    getRaw: jest.fn().mockResolvedValue("10")
  }
  const service = new NotificationBatchService(
    prisma as never,
    notifications as never,
    settings as never
  )
  return { service, prisma, notifications, settings }
}

describe("NotificationBatchService", () => {
  describe("bufferHit", () => {
    it("creates a buffered notification with batchId and emits browser notification", async () => {
      const { service, prisma, notifications } = createMocks()
      prisma.notification.findFirst.mockResolvedValue(null)
      prisma.notification.create.mockResolvedValue({ id: "n1" })

      const result = await service.bufferHit("m1", "AI coding", "item-1", "Topic", "Reason text")

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "keyword_hit",
          title: "Keyword hit: AI coding",
          message: "Topic: Reason text",
          channel: "in_app",
          status: "buffered",
          relatedItemId: "item-1",
          batchId: expect.stringMatching(/^m1-/)
        })
      })
      expect(notifications.emitBrowserNotification).toHaveBeenCalledWith({
        type: "keyword_hit",
        title: "Keyword hit: AI coding",
        message: "Topic: Reason text",
        relatedItemId: "item-1"
      })
      expect(result).toEqual({ id: "n1" })
    })

    it("skips if item already buffered in same batch", async () => {
      const { service, prisma, notifications } = createMocks()
      const existing = { id: "n-existing", batchId: "m1-100" }
      prisma.notification.findFirst.mockResolvedValue(existing)

      const result = await service.bufferHit("m1", "AI coding", "item-1", "Topic", "Reason")

      expect(prisma.notification.create).not.toHaveBeenCalled()
      expect(notifications.emitBrowserNotification).not.toHaveBeenCalled()
      expect(result).toBe(existing)
    })
  })

  describe("flushDueBatches", () => {
    it("does nothing when no buffered notifications exist", async () => {
      const { service, prisma, notifications } = createMocks()
      prisma.notification.findMany.mockResolvedValue([])

      await service.flushDueBatches()

      expect(notifications.create).not.toHaveBeenCalled()
      expect(prisma.notification.update).not.toHaveBeenCalled()
    })

    it("updates buffered record to sent and creates email for single-item batch", async () => {
      const { service, prisma, notifications } = createMocks()
      prisma.notification.findMany.mockResolvedValue([
        { id: "n1", batchId: "m1-100", relatedItemId: "item-1", message: "Topic: Reason" }
      ])

      await service.flushDueBatches()

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { status: "sent" }
      })
      expect(notifications.create).toHaveBeenCalledTimes(1)
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: "email",
          status: "pending",
          relatedItemId: "item-1"
        })
      )
    })

    it("aggregates multi-item batch into first record and creates email", async () => {
      const { service, prisma, notifications } = createMocks()
      prisma.notification.findMany.mockResolvedValue([
        { id: "n1", batchId: "m1-100", relatedItemId: "item-1", message: "Topic A: Reason A" },
        { id: "n2", batchId: "m1-100", relatedItemId: "item-2", message: "Topic B: Reason B" }
      ])

      await service.flushDueBatches()

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: {
          title: "Keyword hits: Topic A (2 items)",
          message: "1. Topic A: Reason A\n2. Topic B: Reason B",
          status: "sent"
        }
      })
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { batchId: "m1-100", status: "buffered", id: { not: "n1" } },
        data: { status: "sent" }
      })
      expect(notifications.create).toHaveBeenCalledTimes(1)
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Keyword hits: Topic A (2 items)",
          channel: "email",
          status: "pending",
          batchId: "m1-100"
        })
      )
    })

    it("handles multiple independent batches", async () => {
      const { service, prisma, notifications } = createMocks()
      prisma.notification.findMany.mockResolvedValue([
        { id: "n1", batchId: "m1-100", relatedItemId: "item-1", message: "A: reason" },
        { id: "n2", batchId: "m2-100", relatedItemId: "item-2", message: "B: reason" }
      ])

      await service.flushDueBatches()

      expect(notifications.create).toHaveBeenCalledTimes(2)
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { status: "sent" }
      })
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n2" },
        data: { status: "sent" }
      })
    })
  })
})

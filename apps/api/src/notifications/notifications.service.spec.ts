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
})

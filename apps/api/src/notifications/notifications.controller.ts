import { Controller, Get, Param, Patch, Post, Sse } from "@nestjs/common"
import { Observable } from "rxjs"
import { NotificationsService } from "./notifications.service"

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list() {
    return this.notifications.list()
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string) {
    return this.notifications.markRead(id)
  }

  @Post(":id/retry")
  retry(@Param("id") id: string) {
    return this.notifications.retry(id)
  }

  @Sse("stream")
  stream(): Observable<MessageEvent> {
    return this.notifications.streamEvents()
  }
}

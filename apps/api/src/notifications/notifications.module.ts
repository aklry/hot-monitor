import { Module } from "@nestjs/common"
import { SettingsModule } from "../settings/settings.module"
import { NotificationBatchService } from "./notification-batch.service"
import { NotificationsController } from "./notifications.controller"
import { NotificationsService } from "./notifications.service"

@Module({
  imports: [SettingsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationBatchService],
  exports: [NotificationsService, NotificationBatchService]
})
export class NotificationsModule {}

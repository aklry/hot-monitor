import { Module } from "@nestjs/common"
import { AiModule } from "../ai/ai.module"
import { NotificationsModule } from "../notifications/notifications.module"
import { SourcesModule } from "../sources/sources.module"
import { MonitorsController } from "./monitors.controller"
import { MonitorsService } from "./monitors.service"

@Module({
  imports: [AiModule, SourcesModule, NotificationsModule],
  controllers: [MonitorsController],
  providers: [MonitorsService],
  exports: [MonitorsService]
})
export class MonitorsModule {}

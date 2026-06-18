import { Module } from "@nestjs/common"
import { MonitorsModule } from "../monitors/monitors.module"
import { SettingsModule } from "../settings/settings.module"
import { TrendsModule } from "../trends/trends.module"
import { JobsService } from "./jobs.service"

@Module({
  imports: [MonitorsModule, TrendsModule, SettingsModule],
  providers: [JobsService]
})
export class SchedulerModule {}

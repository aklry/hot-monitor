import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { AiModule } from "./ai/ai.module"
import { configuration } from "./config/configuration"
import { DashboardModule } from "./dashboard/dashboard.module"
import { DatabaseModule } from "./database/database.module"
import { HealthController } from "./health.controller"
import { MonitorsModule } from "./monitors/monitors.module"
import { NotificationsModule } from "./notifications/notifications.module"
import { SchedulerModule } from "./scheduler/scheduler.module"
import { SettingsModule } from "./settings/settings.module"
import { SourcesModule } from "./sources/sources.module"
import { TrendsModule } from "./trends/trends.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    AiModule,
    DashboardModule,
    DatabaseModule,
    MonitorsModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    SchedulerModule,
    SettingsModule,
    SourcesModule,
    TrendsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}

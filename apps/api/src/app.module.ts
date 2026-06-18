import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { AiModule } from "./ai/ai.module"
import { configuration } from "./config/configuration"
import { DatabaseModule } from "./database/database.module"
import { HealthController } from "./health.controller"
import { MonitorsModule } from "./monitors/monitors.module"
import { SourcesModule } from "./sources/sources.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    AiModule,
    DatabaseModule,
    MonitorsModule,
    ScheduleModule.forRoot(),
    SourcesModule
  ],
  controllers: [HealthController]
})
export class AppModule {}

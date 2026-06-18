import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { configuration } from "./config/configuration"
import { DatabaseModule } from "./database/database.module"
import { HealthController } from "./health.controller"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    ScheduleModule.forRoot()
  ],
  controllers: [HealthController]
})
export class AppModule {}

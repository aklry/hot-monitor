import { Module } from "@nestjs/common"
import { AiModule } from "../ai/ai.module"
import { MailerService } from "../notifications/mailer.service"
import { SettingsController } from "./settings.controller"
import { SettingsService } from "./settings.service"

@Module({
  imports: [AiModule],
  controllers: [SettingsController],
  providers: [SettingsService, MailerService],
  exports: [SettingsService, MailerService]
})
export class SettingsModule {}

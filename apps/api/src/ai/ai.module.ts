import { Module, forwardRef } from "@nestjs/common"
import { SettingsModule } from "../settings/settings.module"
import { AiUsageService } from "./ai-usage.service"
import { ContentAnalysisService } from "./content-analysis.service"
import { DeepSeekClient } from "./deepseek.client"
import { TrendAnalysisService } from "./trend-analysis.service"

@Module({
  imports: [forwardRef(() => SettingsModule)],
  providers: [DeepSeekClient, ContentAnalysisService, TrendAnalysisService, AiUsageService],
  exports: [ContentAnalysisService, TrendAnalysisService, AiUsageService]
})
export class AiModule {}

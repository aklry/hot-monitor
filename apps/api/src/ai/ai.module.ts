import { Module } from "@nestjs/common"
import { ContentAnalysisService } from "./content-analysis.service"
import { DeepSeekClient } from "./deepseek.client"
import { TrendAnalysisService } from "./trend-analysis.service"

@Module({
  providers: [DeepSeekClient, ContentAnalysisService, TrendAnalysisService],
  exports: [ContentAnalysisService, TrendAnalysisService]
})
export class AiModule {}

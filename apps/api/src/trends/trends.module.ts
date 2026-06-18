import { Module } from "@nestjs/common"
import { AiModule } from "../ai/ai.module"
import { SourcesModule } from "../sources/sources.module"
import { TrendsController } from "./trends.controller"
import { TrendsService } from "./trends.service"

@Module({
  imports: [AiModule, SourcesModule],
  controllers: [TrendsController],
  providers: [TrendsService],
  exports: [TrendsService]
})
export class TrendsModule {}

import { Module } from "@nestjs/common"
import { SourcesController } from "./sources.controller"
import { SourceSeedService } from "./source-seed.service"
import { SourcesService } from "./sources.service"

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, SourceSeedService],
  exports: [SourcesService]
})
export class SourcesModule {}

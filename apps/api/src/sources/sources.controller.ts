import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common"
import { SourcesService } from "./sources.service"

@Controller("sources")
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Get()
  listSources() {
    return this.sources.listSources()
  }

  @Post("rss")
  createRssSource(@Body() body: { name: string; url: string; weight?: number }) {
    return this.sources.createRssSource(body)
  }

  @Patch(":id")
  updateSource(@Param("id") id: string, @Body() body: { enabled?: boolean; weight?: number }) {
    return this.sources.updateSource(id, body)
  }

  @Post(":id/test")
  testSource(@Param("id") id: string, @Body() body: { query?: string }) {
    return this.sources.testSource(id, body.query)
  }
}

import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { TrendsService } from "./trends.service"

@Controller("trends")
export class TrendsController {
  constructor(private readonly trends: TrendsService) {}

  @Get()
  list(@Query("scope") scope?: string) {
    return this.trends.list(scope)
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.trends.get(id)
  }

  @Post("run-now")
  runNow(@Body() body: { scope: string }) {
    return this.trends.runNow(body.scope)
  }
}

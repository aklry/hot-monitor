import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common"
import type { CreateMonitorInput, UpdateMonitorInput } from "@hots-monitor/shared"
import { MonitorsService } from "./monitors.service"

@Controller("monitors")
export class MonitorsController {
  constructor(private readonly monitors: MonitorsService) {}

  @Get()
  list() {
    return this.monitors.list()
  }

  @Post()
  create(@Body() body: CreateMonitorInput) {
    return this.monitors.create(body)
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateMonitorInput) {
    return this.monitors.update(id, body)
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.monitors.delete(id)
  }

  @Post(":id/run-now")
  runNow(@Param("id") id: string) {
    return this.monitors.runNow(id)
  }
}

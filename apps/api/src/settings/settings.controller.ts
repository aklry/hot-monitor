import { Body, Controller, Get, Patch, Post } from "@nestjs/common"
import { AiUsageService } from "../ai/ai-usage.service"
import { ContentAnalysisService } from "../ai/content-analysis.service"
import { MailerService } from "../notifications/mailer.service"
import { SettingsService } from "./settings.service"

@Controller("settings")
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly ai: ContentAnalysisService,
    private readonly usage: AiUsageService,
    private readonly mailer: MailerService
  ) {}

  @Get()
  async list() {
    const [settings, dailyUsage, dailyBudget] = await Promise.all([
      this.settings.list(),
      this.usage.getDailyUsage(),
      this.usage.getDailyBudget()
    ])
    return { ...settings, _dailyUsage: dailyUsage, _dailyBudget: dailyBudget }
  }

  @Patch()
  update(@Body() body: Record<string, string | number | boolean | null>) {
    return this.settings.update(body)
  }

  @Post("test-ai")
  async testAi() {
    const { analysis, usage } = await this.ai.analyzeKeyword({
      keyword: "AI coding",
      scope: "developer tools",
      title: "AI coding agent launches",
      url: "https://example.com",
      summary: "A test item for AI connectivity."
    })
    return { ok: true, result: analysis, usage }
  }

  @Post("test-email")
  async testEmail(@Body() body: { to?: string }) {
    await this.mailer.send({
      to: body.to,
      subject: "Hots Monitor test email",
      text: "Your SMTP configuration can send email."
    })
    return { ok: true }
  }
}

import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import nodemailer from "nodemailer"
import { SettingsService } from "../settings/settings.service"

@Injectable()
export class MailerService {
  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService
  ) {}

  async send(input: { to?: string | null; subject: string; text: string }) {
    const smtp = await this.settings.getSmtpSettings()
    const host = smtp.SMTP_HOST ?? this.config.get<string>("SMTP_HOST")
    const port = Number(smtp.SMTP_PORT ?? this.config.get<string>("SMTP_PORT") ?? 587)
    const secure =
      String(smtp.SMTP_SECURE ?? this.config.get<string>("SMTP_SECURE") ?? "false") === "true"
    const user = smtp.SMTP_USER ?? this.config.get<string>("SMTP_USER")
    const pass = smtp.SMTP_PASS ?? this.config.get<string>("SMTP_PASS")
    const from = smtp.SMTP_FROM ?? this.config.get<string>("SMTP_FROM")
    const to = input.to ?? smtp.SMTP_TO ?? this.config.get<string>("SMTP_TO")

    if (!host || !from || !to) {
      throw new Error("SMTP host, from, and recipient are required")
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined
    })

    await transporter.sendMail({
      from,
      to,
      subject: input.subject,
      text: input.text
    })
  }
}

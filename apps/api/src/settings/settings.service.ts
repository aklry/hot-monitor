import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "../database/prisma.service"

const SECRET_KEYS = new Set(["DEEPSEEK_API_KEY", "SMTP_PASS"])

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async list() {
    const rows = await this.prisma.setting.findMany()
    return Object.fromEntries(
      rows.map((row) => [row.key, SECRET_KEYS.has(row.key) ? maskSecret(row.value) : row.value])
    )
  }

  async update(input: Record<string, string | number | boolean | null>) {
    for (const [key, value] of Object.entries(input)) {
      if (value === null || value === undefined) {
        continue
      }
      await this.prisma.setting.upsert({
        where: { key },
        update: { value: String(value), encrypted: SECRET_KEYS.has(key) },
        create: { key, value: String(value), encrypted: SECRET_KEYS.has(key) }
      })
    }
    return this.list()
  }

  async getRaw(key: string) {
    const row = await this.prisma.setting.findUnique({ where: { key } })
    return row?.value ?? this.config.get<string>(key)
  }

  async getSmtpSettings() {
    const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_TO"]
    const entries = await Promise.all(keys.map(async (key) => [key, await this.getRaw(key)] as const))
    return Object.fromEntries(entries) as Record<string, string | undefined>
  }
}

function maskSecret(value: string) {
  if (!value) {
    return ""
  }
  return `${value.slice(0, 3)}***${value.slice(-2)}`
}

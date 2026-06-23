import { z } from "zod"

const aiRiskLevel = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value
  }

  const normalized = value.trim().toLowerCase()
  return ["", "none", "no", "n/a", "na", "null"].includes(normalized) ? "low" : normalized
}, z.enum(["low", "medium", "high"]))

export const RiskLevelSchema = aiRiskLevel
export const UrgencySchema = z.enum(["low", "medium", "high"])
export const NotificationChannelSchema = z.enum(["in_app", "browser", "email"])
export const NotificationStatusSchema = z.enum(["pending", "sent", "failed", "read"])

const aiNumber = (schema: z.ZodNumber, fallback: number) =>
  z.preprocess((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback
    }

    if (typeof value !== "string") {
      return value
    }

    const normalized = value.trim().toLowerCase()
    if (["", "none", "no", "n/a", "na", "null", "nan", "unknown"].includes(normalized)) {
      return fallback
    }

    const percentage = normalized.match(/^(\d+(?:\.\d+)?)%$/)
    const parsed = percentage ? Number(percentage[1]) / 100 : Number(normalized)
    return Number.isFinite(parsed) ? parsed : fallback
  }, schema)

export const KeywordAnalysisSchema = z.object({
  isRelevant: z.boolean(),
  isImpersonation: z.boolean(),
  confidence: aiNumber(z.number().min(0).max(1), 0),
  riskLevel: RiskLevelSchema,
  urgency: UrgencySchema,
  topic: z.string().min(1),
  reason: z.string().min(1),
  matchedSignals: z.array(z.string()).default([])
})

export const TrendEvidenceSchema = z.object({
  itemUrl: z.string().url(),
  reason: z.string().min(1)
})

export const TrendAnalysisSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  hotScore: z.number().min(0).max(100),
  growthScore: z.number().min(0).max(100),
  evidence: z.array(TrendEvidenceSchema),
  whyNow: z.string().min(1)
})

export const CreateMonitorSchema = z.object({
  keyword: z.string().min(1),
  scope: z.string().min(1),
  checkIntervalMinutes: z.number().int().min(1).max(1440).default(10),
  enabled: z.boolean().default(true)
})

export const UpdateMonitorSchema = CreateMonitorSchema.partial()

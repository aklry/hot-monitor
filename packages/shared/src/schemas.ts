import { z } from "zod"

export const RiskLevelSchema = z.enum(["low", "medium", "high"])
export const UrgencySchema = z.enum(["low", "medium", "high"])
export const NotificationChannelSchema = z.enum(["in_app", "browser", "email"])
export const NotificationStatusSchema = z.enum(["pending", "sent", "failed", "read"])

const aiNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : value),
    schema
  )

export const KeywordAnalysisSchema = z.object({
  isRelevant: z.boolean(),
  isImpersonation: z.boolean(),
  confidence: aiNumber(z.number().min(0).max(1)),
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

import type { z } from "zod"
import type {
  CreateMonitorSchema,
  KeywordAnalysisSchema,
  TrendAnalysisSchema,
  UpdateMonitorSchema
} from "./schemas"

export type KeywordAnalysis = z.infer<typeof KeywordAnalysisSchema>
export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>
export type CreateMonitorInput = z.infer<typeof CreateMonitorSchema>
export type UpdateMonitorInput = z.infer<typeof UpdateMonitorSchema>

export interface CollectedCandidate {
  sourceName: string
  sourceType: string
  externalId?: string
  title: string
  url: string
  author?: string
  summary?: string
  content?: string
  publishedAt?: string
}

import type { KeywordAnalysis } from "@hots-monitor/shared"

export function shouldNotifyKeywordHit(analysis: KeywordAnalysis): boolean {
  return (
    analysis.isRelevant &&
    analysis.confidence >= 0.75 &&
    (!analysis.isImpersonation || analysis.riskLevel !== "high")
  )
}

export function shouldNotifyRiskAlert(analysis: KeywordAnalysis): boolean {
  return analysis.isImpersonation && analysis.confidence >= 0.8
}

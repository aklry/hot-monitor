import type { ParsedKeywordAnalysis } from "@hots-monitor/shared"

export function shouldNotifyKeywordHit(analysis: ParsedKeywordAnalysis): boolean {
  return (
    analysis.isRelevant &&
    analysis.confidence >= 0.75 &&
    (!analysis.isImpersonation || analysis.riskLevel !== "high")
  )
}

export function shouldNotifyRiskAlert(analysis: ParsedKeywordAnalysis): boolean {
  return analysis.isImpersonation && analysis.confidence >= 0.8
}

import type { ParsedKeywordAnalysis } from "@hots-monitor/shared"
import { shouldNotifyKeywordHit, shouldNotifyRiskAlert } from "./monitor-thresholds"

describe("monitor thresholds", () => {
  const base: ParsedKeywordAnalysis = {
    isRelevant: true,
    isImpersonation: false,
    confidence: 0.75,
    riskLevel: "low",
    urgency: "medium",
    topic: "AI coding",
    reason: "Relevant content",
    matchedSignals: []
  }

  it("notifies for high confidence relevant non-risk hits", () => {
    expect(shouldNotifyKeywordHit(base)).toBe(true)
  })

  it("does not notify normal hits for low confidence analysis", () => {
    expect(shouldNotifyKeywordHit({ ...base, confidence: 0.74 })).toBe(false)
  })

  it("does not treat high-risk impersonation as a normal hit", () => {
    expect(
      shouldNotifyKeywordHit({
        ...base,
        isImpersonation: true,
        riskLevel: "high",
        confidence: 0.95
      })
    ).toBe(false)
  })

  it("notifies risk alerts for high confidence impersonation", () => {
    expect(shouldNotifyRiskAlert({ ...base, isImpersonation: true, confidence: 0.8 })).toBe(true)
  })
})

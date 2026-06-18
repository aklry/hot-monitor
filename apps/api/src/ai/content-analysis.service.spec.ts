import type { KeywordAnalysis } from "@hots-monitor/shared"
import { ContentAnalysisService } from "./content-analysis.service"

describe("ContentAnalysisService", () => {
  it("asks the AI client for keyword relevance and parses the result", async () => {
    const expected: KeywordAnalysis = {
      isRelevant: true,
      isImpersonation: false,
      confidence: 0.9,
      riskLevel: "low",
      urgency: "high",
      topic: "AI coding tool",
      reason: "The item is directly about an AI coding tool.",
      matchedSignals: ["AI", "coding"]
    }
    const client = {
      completeJson: jest.fn().mockResolvedValue(JSON.stringify(expected))
    }
    const service = new ContentAnalysisService(client as never)

    const result = await service.analyzeKeyword({
      keyword: "AI coding",
      scope: "developer tools",
      title: "New AI coding tool launches",
      url: "https://example.com",
      summary: "A developer tool launch"
    })

    expect(result).toEqual(expected)
    expect(client.completeJson).toHaveBeenCalledWith(expect.stringContaining("AI coding"))
  })
})

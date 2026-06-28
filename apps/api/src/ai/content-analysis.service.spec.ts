import type { KeywordAnalysis } from "@hots-monitor/shared"
import { ContentAnalysisService } from "./content-analysis.service"

function mockClient(json: string) {
  return {
    completeJson: jest.fn().mockResolvedValue({
      content: json,
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150
    })
  }
}

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
    const client = mockClient(JSON.stringify(expected))
    const service = new ContentAnalysisService(client as never)

    const result = await service.analyzeKeyword({
      keyword: "AI coding",
      scope: "developer tools",
      title: "New AI coding tool launches",
      url: "https://example.com",
      summary: "A developer tool launch"
    })

    expect(result.analysis).toEqual(expected)
    expect(result.usage).toEqual({ promptTokens: 100, completionTokens: 50, totalTokens: 150 })
    expect(client.completeJson).toHaveBeenCalledWith(expect.stringContaining("AI coding"))
  })

  it("normalizes string confidence values returned by the AI", async () => {
    const client = mockClient(
      JSON.stringify({
        isRelevant: true,
        isImpersonation: false,
        confidence: "0.85",
        riskLevel: "low",
        urgency: "medium",
        topic: "AI coding tool",
        reason: "The item discusses the monitored keyword.",
        matchedSignals: ["AI"]
      })
    )
    const service = new ContentAnalysisService(client as never)

    const result = await service.analyzeKeyword({
      keyword: "AI coding",
      scope: "developer tools",
      title: "New AI coding tool launches",
      url: "https://example.com"
    })

    expect(result.analysis.confidence).toBe(0.85)
  })

  it("treats AI riskLevel none as low risk", async () => {
    const client = mockClient(
      JSON.stringify({
        isRelevant: true,
        isImpersonation: false,
        confidence: 0.74,
        riskLevel: "none",
        urgency: "low",
        topic: "World Cup Germany",
        reason: "The item mentions Germany in a World Cup context without a risk signal.",
        matchedSignals: ["Germany", "World Cup"]
      })
    )
    const service = new ContentAnalysisService(client as never)

    const result = await service.analyzeKeyword({
      keyword: "德国",
      scope: "世界杯",
      title: "Germany prepares for World Cup qualifier",
      url: "https://example.com/world-cup-germany"
    })

    expect(result.analysis.riskLevel).toBe("low")
  })

  it("treats unknown confidence values as zero", async () => {
    const client = mockClient(
      JSON.stringify({
        isRelevant: true,
        isImpersonation: false,
        confidence: "NaN",
        riskLevel: "low",
        urgency: "low",
        topic: "World Cup Germany",
        reason: "The model could not determine confidence.",
        matchedSignals: []
      })
    )
    const service = new ContentAnalysisService(client as never)

    const result = await service.analyzeKeyword({
      keyword: "德国",
      scope: "世界杯",
      title: "Germany prepares for World Cup qualifier",
      url: "https://example.com/world-cup-germany"
    })

    expect(result.analysis.confidence).toBe(0)
  })

  it("normalizes percentage confidence values returned by the AI", async () => {
    const client = mockClient(
      JSON.stringify({
        isRelevant: true,
        isImpersonation: false,
        confidence: "85%",
        riskLevel: "low",
        urgency: "medium",
        topic: "World Cup Germany",
        reason: "The item is likely related to the monitored topic.",
        matchedSignals: ["Germany"]
      })
    )
    const service = new ContentAnalysisService(client as never)

    const result = await service.analyzeKeyword({
      keyword: "德国",
      scope: "世界杯",
      title: "Germany prepares for World Cup qualifier",
      url: "https://example.com/world-cup-germany"
    })

    expect(result.analysis.confidence).toBe(0.85)
  })
})

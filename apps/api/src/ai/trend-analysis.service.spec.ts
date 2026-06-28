import { TrendAnalysisService } from "./trend-analysis.service"

describe("TrendAnalysisService", () => {
  it("normalizes string evidence from the AI response", async () => {
    const client = {
      completeJson: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          title: "AI coding agents",
          summary: "Multiple sources are discussing coding agents.",
          hotScore: 85,
          growthScore: 70,
          evidence: "Several items point to the same trend.",
          whyNow: "Several launches happened at once."
        }),
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300
      })
    }
    const service = new TrendAnalysisService(client as never)

    const result = await service.analyzeTrend("developer tools", [
      {
        sourceName: "Example",
        sourceType: "rss",
        title: "New coding agent launches",
        url: "https://example.com/agent",
        summary: "A coding agent launch"
      }
    ])

    expect(result.analysis.evidence).toEqual([
      {
        itemUrl: "https://example.com/agent",
        reason: "Several items point to the same trend."
      }
    ])
    expect(result.usage).toEqual({ promptTokens: 200, completionTokens: 100, totalTokens: 300 })
    expect(client.completeJson).toHaveBeenCalledWith(
      expect.stringContaining("evidence 字段必须是对象数组"),
      {
        strict: true }
    )
  })
})

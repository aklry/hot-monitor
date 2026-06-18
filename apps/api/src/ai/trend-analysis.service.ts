import { Injectable } from "@nestjs/common"
import { TrendAnalysisSchema, type CollectedCandidate, type TrendAnalysis } from "@hots-monitor/shared"
import { parseAiJson } from "./ai-json-parser"
import { DeepSeekClient } from "./deepseek.client"

@Injectable()
export class TrendAnalysisService {
  constructor(private readonly deepSeek: DeepSeekClient) {}

  async analyzeTrend(scope: string, items: CollectedCandidate[]): Promise<TrendAnalysis> {
    const evidence = items
      .slice(0, 20)
      .map((item, index) => `${index + 1}. ${item.title}\nURL: ${item.url}\nSummary: ${item.summary ?? ""}`)
      .join("\n\n")

    const prompt = [
      "Extract the strongest trend topic from these multi-source items.",
      "Return JSON with: title, summary, hotScore, growthScore, evidence, whyNow.",
      `Scope: ${scope}`,
      "",
      evidence
    ].join("\n")

    const raw = await this.deepSeek.completeJson(prompt)
    return parseAiJson(raw, TrendAnalysisSchema)
  }
}

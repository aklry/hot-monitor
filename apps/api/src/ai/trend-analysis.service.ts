import { Injectable } from "@nestjs/common"
import { TrendAnalysisSchema, type CollectedCandidate, type TrendAnalysis } from "@hots-monitor/shared"
import { z } from "zod"
import { parseAiJson } from "./ai-json-parser"
import { DeepSeekClient } from "./deepseek.client"

function createTrendAnalysisResponseSchema(items: CollectedCandidate[]) {
  const fallbackUrl = items[0]?.url ?? "https://example.com"
  const EvidenceObjectSchema = z.object({
    itemUrl: z.string().url(),
    reason: z.string().min(1)
  })

  return TrendAnalysisSchema.extend({
    evidence: z
      .union([z.array(z.union([EvidenceObjectSchema, z.string().min(1)])), z.string().min(1)])
      .transform((value) => {
        if (typeof value === "string") {
          return [{ itemUrl: fallbackUrl, reason: value }]
        }

        return value.map((entry, index) => {
          if (typeof entry === "string") {
            return {
              itemUrl: items[index]?.url ?? fallbackUrl,
              reason: entry
            }
          }

          return entry
        })
      })
  })
}

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
      'The evidence field must be an array of objects like {"itemUrl":"https://...","reason":"..."}.',
      `Scope: ${scope}`,
      "",
      evidence
    ].join("\n")

    const raw = await this.deepSeek.completeJson(prompt)
    return parseAiJson(raw, createTrendAnalysisResponseSchema(items))
  }
}
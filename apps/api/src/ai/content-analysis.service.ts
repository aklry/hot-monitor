import { Injectable } from "@nestjs/common"
import { KeywordAnalysisSchema, type KeywordAnalysis } from "@hots-monitor/shared"
import { parseAiJson } from "./ai-json-parser"
import { DeepSeekClient } from "./deepseek.client"

export interface KeywordAnalysisInput {
  keyword: string
  scope: string
  title: string
  url: string
  summary?: string
  content?: string
}

@Injectable()
export class ContentAnalysisService {
  constructor(private readonly deepSeek: DeepSeekClient) {}

  async analyzeKeyword(input: KeywordAnalysisInput): Promise<KeywordAnalysis> {
    const prompt = [
      "Analyze whether the item is truly related to the monitored keyword and scope.",
      "Detect impersonation, misleading naming, clickbait, or fake association.",
      "Return JSON with: isRelevant, isImpersonation, confidence, riskLevel, urgency, topic, reason, matchedSignals.",
      "",
      `Keyword: ${input.keyword}`,
      `Scope: ${input.scope}`,
      `Title: ${input.title}`,
      `URL: ${input.url}`,
      `Summary: ${input.summary ?? ""}`,
      `Content: ${input.content ?? ""}`
    ].join("\n")

    const raw = await this.deepSeek.completeJson(prompt)
    return parseAiJson(raw, KeywordAnalysisSchema)
  }
}

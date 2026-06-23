import { Injectable } from "@nestjs/common"
import { KeywordAnalysisSchema, type ParsedKeywordAnalysis } from "@hots-monitor/shared"
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

  async analyzeKeyword(input: KeywordAnalysisInput): Promise<ParsedKeywordAnalysis> {
    const prompt = [
      "Analyze whether the item is truly related to the monitored keyword and scope.",
      "Detect impersonation, misleading naming, clickbait, or fake association.",
      "Return JSON with: isRelevant, isImpersonation, confidence, riskLevel, urgency, topic, reason, matchedSignals.",
      "riskLevel and urgency must be one of: low, medium, high. Use low when there is no meaningful risk or urgency.",
      "confidence must be a number from 0 to 1. Use 0 when confidence cannot be determined.",
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

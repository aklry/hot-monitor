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
      "请分析该条目是否真正与监控关键词和范围相关。",
      "请识别是否存在冒充、误导性命名、标题党或虚假关联。",
      "返回 JSON，字段包括：isRelevant, isImpersonation, confidence, riskLevel, urgency, topic, reason, matchedSignals。",
      "riskLevel 和 urgency 必须是以下值之一：low, medium, high。没有明显风险或紧急性时使用 low。",
      "confidence 必须是 0 到 1 之间的数字。无法判断置信度时使用 0。",
      "",
      `关键词：${input.keyword}`,
      `范围：${input.scope}`,
      `标题：${input.title}`,
      `URL：${input.url}`,
      `摘要：${input.summary ?? ""}`,
      `正文：${input.content ?? ""}`
    ].join("\n")

    const raw = await this.deepSeek.completeJson(prompt)
    return parseAiJson(raw, KeywordAnalysisSchema)
  }
}

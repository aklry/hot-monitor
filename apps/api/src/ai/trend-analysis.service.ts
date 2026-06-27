import { Injectable } from "@nestjs/common"
import {
  TrendAnalysisSchema,
  type CollectedCandidate,
  type TrendAnalysis
} from "@hots-monitor/shared"
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

  async analyzeTrend(
    scope: string,
    items: CollectedCandidate[],
    now = new Date()
  ): Promise<TrendAnalysis> {
    const evidence = items
      .slice(0, 20)
      .map(
        (item, index) =>
          `${index + 1}. ${item.title}\nURL：${item.url}\n摘要：${item.summary ?? ""}`
      )
      .join("\n\n")

    const prompt = [
      "请从这些多来源条目中提取最强的趋势主题。",
      "返回 JSON，字段包括：title, summary, hotScore, growthScore, evidence, whyNow。",
      `当前日期：${now.toISOString().slice(0, 10)}。`,
      "只识别由最近 30 天候选条目支持的趋势。",
      "不要使用模型记忆或更早的背景知识作为证据。",
      'evidence 字段必须是对象数组，格式类似 {"itemUrl":"https://...","reason":"..."}。',
      `范围：${scope}`,
      "",
      evidence
    ].join("\n")

    const raw = await this.deepSeek.completeJson(prompt, { strict: true })
    return parseAiJson(raw, createTrendAnalysisResponseSchema(items))
  }
}

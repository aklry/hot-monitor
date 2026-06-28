import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import OpenAI from "openai"

export interface CompletionResult {
  content: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

@Injectable()
export class DeepSeekClient {
  private readonly client: OpenAI

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.get<string>("DEEPSEEK_API_KEY"),
      baseURL: this.config.get<string>("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com"
    })
  }

  async completeJson(prompt: string, options?: { strict?: boolean }): Promise<CompletionResult> {
    const model = options?.strict
      ? this.config.get<string>("DEEPSEEK_STRICT_MODEL")
      : this.config.get<string>("DEEPSEEK_MODEL")

    const completion = await this.client.chat.completions.create({
      model: model ?? "deepseek-v4-flash",
      messages: [
        {
          role: "system",
          content: "你是一个分析引擎。请只返回符合请求 schema 的合法 JSON。"
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })

    const usage = completion.usage
    return {
      content: completion.choices[0]?.message?.content ?? "{}",
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0
    }
  }
}

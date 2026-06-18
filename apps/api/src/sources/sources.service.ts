import { Injectable } from "@nestjs/common"
import type { CollectedCandidate } from "@hots-monitor/shared"
import { PrismaService } from "../database/prisma.service"
import { GithubTrendingAdapter } from "./github-trending.adapter"
import { HackerNewsAdapter } from "./hacker-news.adapter"
import { RssAdapter } from "./rss.adapter"
import type { SourceAdapter } from "./source-adapter"
import { dedupeCandidates } from "./source-normalizer"

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSources() {
    return this.prisma.source.findMany({ orderBy: { createdAt: "asc" } })
  }

  async createRssSource(input: { name: string; url: string; weight?: number }) {
    return this.prisma.source.create({
      data: {
        name: input.name,
        type: "rss",
        url: input.url,
        weight: input.weight ?? 50
      }
    })
  }

  async updateSource(id: string, input: { enabled?: boolean; weight?: number }) {
    return this.prisma.source.update({ where: { id }, data: input })
  }

  async testSource(id: string, query = "ai") {
    const source = await this.prisma.source.findUniqueOrThrow({ where: { id } })
    const adapter = this.adapterForSource(source)
    const items = await adapter.search(query)
    return { count: items.length, items: dedupeCandidates(items).slice(0, 10) }
  }

  async searchAll(query: string): Promise<CollectedCandidate[]> {
    const sources = await this.prisma.source.findMany({ where: { enabled: true } })
    const adapters = sources.map((source) => this.adapterForSource(source))
    const settled = await Promise.allSettled(adapters.map((adapter) => adapter.search(query)))
    const items = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    return dedupeCandidates(items)
  }

  private adapterForSource(source: { name: string; type: string; url: string | null }): SourceAdapter {
    if (source.type === "rss" && source.url) {
      return new RssAdapter(source.name, source.url)
    }
    if (source.type === "hacker_news") {
      return new HackerNewsAdapter()
    }
    if (source.type === "github_trending") {
      return new GithubTrendingAdapter()
    }
    throw new Error(`Unsupported source type: ${source.type}`)
  }
}

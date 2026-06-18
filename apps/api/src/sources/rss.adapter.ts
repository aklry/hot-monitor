import Parser from "rss-parser"
import type { CollectedCandidate } from "@hots-monitor/shared"
import type { SourceAdapter } from "./source-adapter"

export class RssAdapter implements SourceAdapter {
  readonly type = "rss"
  private readonly parser = new Parser()

  constructor(
    private readonly name: string,
    private readonly feedUrl: string
  ) {}

  async search(query: string): Promise<CollectedCandidate[]> {
    const feed = await this.parser.parseURL(this.feedUrl)
    const normalizedQuery = query.trim().toLowerCase()

    return feed.items
      .filter((item) => {
        const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`.toLowerCase()
        return text.includes(normalizedQuery)
      })
      .map((item) => ({
        sourceName: this.name,
        sourceType: this.type,
        externalId: item.guid ?? item.link,
        title: item.title ?? "Untitled RSS item",
        url: item.link ?? this.feedUrl,
        author: item.creator,
        summary: item.contentSnippet,
        content: item.content,
        publishedAt: item.isoDate
      }))
  }
}

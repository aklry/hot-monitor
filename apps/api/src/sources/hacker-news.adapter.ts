import type { CollectedCandidate } from "@hots-monitor/shared"
import type { SourceAdapter } from "./source-adapter"

interface HackerNewsHit {
  objectID: string
  title?: string
  story_title?: string
  url?: string
  story_url?: string
  author?: string
  created_at?: string
}

interface HackerNewsResponse {
  hits: HackerNewsHit[]
}

export class HackerNewsAdapter implements SourceAdapter {
  readonly type = "hacker_news"

  async search(query: string): Promise<CollectedCandidate[]> {
    const url = new URL("https://hn.algolia.com/api/v1/search")
    url.searchParams.set("query", query)
    url.searchParams.set("tags", "story")

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Hacker News search failed with ${response.status}`)
    }

    const payload = (await response.json()) as HackerNewsResponse
    return payload.hits
      .map((hit) => {
        const title = hit.title ?? hit.story_title
        const itemUrl = hit.url ?? hit.story_url
        if (!title || !itemUrl) {
          return null
        }

        return {
          sourceName: "Hacker News",
          sourceType: this.type,
          externalId: hit.objectID,
          title,
          url: itemUrl,
          author: hit.author,
          publishedAt: hit.created_at
        } satisfies CollectedCandidate
      })
      .filter((item): item is CollectedCandidate => item !== null)
  }
}

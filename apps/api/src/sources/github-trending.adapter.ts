import * as cheerio from "cheerio"
import type { CollectedCandidate } from "@hots-monitor/shared"
import type { SourceAdapter } from "./source-adapter"

export class GithubTrendingAdapter implements SourceAdapter {
  readonly type = "github_trending"

  async search(query: string): Promise<CollectedCandidate[]> {
    const url = new URL("https://github.com/trending")
    url.searchParams.set("q", query)

    const response = await fetch(url, {
      headers: {
        "user-agent": "hots-monitor/0.1"
      }
    })
    if (!response.ok) {
      throw new Error(`GitHub Trending failed with ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const items: CollectedCandidate[] = []

    $("article.Box-row").each((_, element) => {
      const repoPath = $(element).find("h2 a").attr("href")?.trim()
      if (!repoPath) {
        return
      }

      const title = repoPath.replace(/\s/g, "").replace(/^\//, "")
      const summary = $(element).find("p").first().text().trim()
      items.push({
        sourceName: "GitHub Trending",
        sourceType: this.type,
        externalId: title,
        title,
        url: `https://github.com/${title}`,
        summary
      })
    })

    return items
  }
}

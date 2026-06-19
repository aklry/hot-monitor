import type { CollectedCandidate } from "@hots-monitor/shared"
import type { SourceAdapter } from "./source-adapter"

interface XUser {
  id: string
  username?: string
  name?: string
}

interface XPost {
  id: string
  text: string
  author_id?: string
  created_at?: string
}

interface XSearchResponse {
  data?: XPost[]
  includes?: {
    users?: XUser[]
  }
}

export class XAdapter implements SourceAdapter {
  readonly type = "x"

  constructor(private readonly bearerToken: string) {}

  async search(query: string): Promise<CollectedCandidate[]> {
    if (!this.bearerToken) {
      throw new Error("X_BEARER_TOKEN is required for X Recent Search")
    }

    const url = new URL("https://api.x.com/2/tweets/search/recent")
    url.searchParams.set("query", query)
    url.searchParams.set("max_results", "20")
    url.searchParams.set("tweet.fields", "author_id,created_at")
    url.searchParams.set("expansions", "author_id")
    url.searchParams.set("user.fields", "username,name")

    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${this.bearerToken}`,
        "user-agent": "hots-monitor/0.1"
      }
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`X Recent Search failed with ${response.status}: ${body.slice(0, 240)}`)
    }

    const payload = (await response.json()) as XSearchResponse
    const usersById = new Map((payload.includes?.users ?? []).map((user) => [user.id, user]))

    return (payload.data ?? []).map((post) => {
      const author = post.author_id ? usersById.get(post.author_id) : undefined
      const authorHandle = author?.username ? `@${author.username}` : author?.name

      return {
        sourceName: "X",
        sourceType: this.type,
        externalId: post.id,
        title: post.text.length > 120 ? `${post.text.slice(0, 117)}...` : post.text,
        url: `https://x.com/i/web/status/${post.id}`,
        author: authorHandle,
        content: post.text,
        publishedAt: post.created_at
      }
    })
  }
}

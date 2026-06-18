import { candidateHash, dedupeCandidates, normalizeUrl } from "./source-normalizer"

describe("source-normalizer", () => {
  it("normalizes urls by removing tracking params and trailing slash", () => {
    const url = normalizeUrl("https://example.com/post/?utm_source=x&ref=abc&id=42")

    expect(url).toBe("https://example.com/post?id=42")
  })

  it("creates stable hashes for equivalent title and url pairs", () => {
    const first = candidateHash("  New AI Tool  ", "https://example.com/post/?utm_medium=email")
    const second = candidateHash("new ai tool", "https://example.com/post")

    expect(first).toBe(second)
  })

  it("deduplicates candidates by normalized url and content hash", () => {
    const items = dedupeCandidates([
      {
        sourceName: "A",
        sourceType: "rss",
        title: "New AI Tool",
        url: "https://example.com/post?utm_campaign=launch"
      },
      {
        sourceName: "B",
        sourceType: "hn",
        title: "new ai tool",
        url: "https://example.com/post"
      }
    ])

    expect(items).toHaveLength(1)
    expect(items[0].sourceName).toBe("A")
  })
})

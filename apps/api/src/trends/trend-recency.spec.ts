import { filterCurrentTrendCandidates, hasCurrentTrendEvidence } from "./trend-recency"

const now = new Date("2026-06-19T00:00:00.000Z")

describe("trend recency", () => {
  it("keeps recent and undated candidates but counts only recent dated evidence", () => {
    const result = filterCurrentTrendCandidates(
      [
        {
          sourceName: "Recent",
          sourceType: "rss",
          title: "Recent item",
          url: "https://example.com/recent",
          publishedAt: "2026-06-10T00:00:00.000Z"
        },
        {
          sourceName: "Old",
          sourceType: "rss",
          title: "Old item",
          url: "https://example.com/old",
          publishedAt: "2025-06-10T00:00:00.000Z"
        },
        {
          sourceName: "Undated",
          sourceType: "github_trending",
          title: "Undated item",
          url: "https://example.com/undated"
        }
      ],
      now
    )

    expect(result.recentDatedCount).toBe(1)
    expect(result.candidates.map((candidate) => candidate.title)).toEqual([
      "Recent item",
      "Undated item"
    ])
  })

  it("does not treat undated candidates alone as current evidence", () => {
    expect(
      hasCurrentTrendEvidence(
        [
          {
            sourceName: "Undated",
            sourceType: "github_trending",
            title: "Undated item",
            url: "https://example.com/undated"
          }
        ],
        now
      )
    ).toBe(false)
  })
})

import { calculateTrendScore } from "./trend-score"

describe("calculateTrendScore", () => {
  it("increases with source count, source weight, freshness, and ai score", () => {
    const weak = calculateTrendScore({
      aiHotScore: 40,
      sourceCount: 1,
      averageSourceWeight: 20,
      newestItemAgeHours: 48
    })
    const strong = calculateTrendScore({
      aiHotScore: 80,
      sourceCount: 4,
      averageSourceWeight: 80,
      newestItemAgeHours: 2
    })

    expect(strong).toBeGreaterThan(weak)
    expect(strong).toBeLessThanOrEqual(100)
  })
})

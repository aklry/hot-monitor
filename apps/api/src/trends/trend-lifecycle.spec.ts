import { findMatchingTrend, resolveTrendStatus } from "./trend-lifecycle"

describe("trend lifecycle helpers", () => {
  it("matches similar trend titles within the same scope", () => {
    const existing = [
      {
        id: "trend-1",
        scope: "ai programming",
        title: "AI agents reshape developer workflows"
      },
      {
        id: "trend-2",
        scope: "security",
        title: "Security teams adopt agentic review workflows"
      }
    ]

    expect(findMatchingTrend(existing, "AI agent tools reshape developer workflows")?.id).toBe("trend-1")
  })

  it("marks fast-growing trends as surging", () => {
    const status = resolveTrendStatus({
      previousHotScore: 58,
      hotScore: 83,
      growthScore: 61,
      firstSeenAt: new Date("2026-06-22T08:00:00.000Z"),
      lastSeenAt: new Date("2026-06-24T08:00:00.000Z"),
      now: new Date("2026-06-24T12:00:00.000Z")
    })

    expect(status).toBe("surging")
  })

  it("marks old declining trends as cooling", () => {
    const status = resolveTrendStatus({
      previousHotScore: 74,
      hotScore: 46,
      growthScore: 12,
      firstSeenAt: new Date("2026-06-18T08:00:00.000Z"),
      lastSeenAt: new Date("2026-06-24T08:00:00.000Z"),
      now: new Date("2026-06-24T12:00:00.000Z")
    })

    expect(status).toBe("cooling")
  })
})

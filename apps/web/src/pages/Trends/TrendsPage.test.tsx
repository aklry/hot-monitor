import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TrendsPage } from "$/pages/Trends/TrendsPage"
import { TrendDetailPage } from "$/pages/TrendDetail/TrendDetailPage"

const trend = {
  id: "trend-1",
  scope: "ai programming",
  title: "AI agents reshape developer workflows",
  summary: "Developers are adopting agentic coding tools across daily work.",
  hotScore: 87,
  growthScore: 42,
  status: "watching",
  evidenceCount: 2,
  firstSeenAt: "2026-06-22T08:00:00.000Z",
  snapshots: [{ id: "snapshot-1" }],
  lastSeenAt: "2026-06-23T08:00:00.000Z"
}

const searchedTrend = {
  id: "trend-2",
  scope: "security",
  title: "Security teams adopt agentic review workflows",
  summary: "Security review is being folded into agent-assisted development loops.",
  hotScore: 91,
  growthScore: 55,
  status: "surging",
  evidenceCount: 3,
  firstSeenAt: "2026-06-23T08:00:00.000Z",
  snapshots: [{ id: "snapshot-2" }, { id: "snapshot-3" }],
  lastSeenAt: "2026-06-24T08:00:00.000Z"
}

const detail = {
  ...trend,
  firstSeenAt: "2026-06-22T08:00:00.000Z",
  evidences: [
    {
      id: "evidence-1",
      aiReason: "Multiple developer tool launches point to the same shift.",
      sourceWeight: 50,
      item: {
        id: "item-1",
        title: "Agent tools move into IDEs",
        url: "https://example.com/agents-in-ides",
        summary: "A major IDE release adds persistent coding agents.",
        author: "Example Reporter",
        publishedAt: "2026-06-23T07:00:00.000Z",
        source: {
          id: "source-1",
          name: "Example News",
          type: "rss",
          url: "https://example.com/feed",
          enabled: true,
          weight: 50
        }
      }
    }
  ]
}

describe("Radar trends", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString()
        if (url.endsWith("/trends/run-now") && init?.method === "POST") {
          return jsonResponse({ candidates: 1, evidence: 1 })
        }
        if (url.endsWith("/trends?scope=ai%20programming")) {
          return jsonResponse([trend])
        }
        if (url.endsWith("/trends?scope=security")) {
          return jsonResponse([searchedTrend])
        }
        if (url.endsWith("/trends/trend-1")) {
          return jsonResponse(detail)
        }
        if (url.endsWith("/trends/trend-2")) {
          return jsonResponse({
            ...searchedTrend,
            firstSeenAt: "2026-06-23T08:00:00.000Z",
            evidences: []
          })
        }
        return jsonResponse({ message: "Not found" }, { status: 404 })
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.sessionStorage.clear()
  })

  it("opens the trend detail route from a Radar result", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/trends"]}>
        <Routes>
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/trends/:id" element={<TrendDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await user.click(await screen.findByRole("link", { name: /AI agents reshape developer workflows/i }))

    expect(await screen.findByRole("heading", { name: /AI agents reshape developer workflows/i })).toBeInTheDocument()
    expect(screen.getByText("观察中")).toBeInTheDocument()
    expect(screen.getByText(/Multiple developer tool launches/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Agent tools move into IDEs/i })).toHaveAttribute(
      "href",
      "https://example.com/agents-in-ides"
    )
  })

  it("restores the searched trends after returning from detail without changing the list route", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/trends"]}>
        <Routes>
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/trends/:id" element={<TrendDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const scopeInput = await screen.findByPlaceholderText("输入关键词…")
    await user.clear(scopeInput)
    await user.type(scopeInput, "security")
    await user.click(screen.getByRole("button", { name: "扫描趋势" }))

    expect(await screen.findByRole("link", { name: /Security teams adopt agentic review workflows/i })).toBeInTheDocument()
    expect(screen.getByText("快速上升")).toBeInTheDocument()
    expect(screen.getByText("2 次快照")).toBeInTheDocument()

    await user.click(screen.getByRole("link", { name: /Security teams adopt agentic review workflows/i }))
    await user.click(await screen.findByRole("link", { name: "返回趋势列表" }))

    expect(screen.getByDisplayValue("security")).toBeInTheDocument()
    expect(await screen.findByRole("link", { name: /Security teams adopt agentic review workflows/i })).toBeInTheDocument()
  })
})

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  })
}

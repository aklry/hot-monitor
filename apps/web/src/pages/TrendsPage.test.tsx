import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TrendsPage } from "./TrendsPage"
import { TrendDetailPage } from "./TrendDetailPage"

const trend = {
  id: "trend-1",
  scope: "ai programming",
  title: "AI agents reshape developer workflows",
  summary: "Developers are adopting agentic coding tools across daily work.",
  hotScore: 87,
  growthScore: 42,
  evidenceCount: 2,
  lastSeenAt: "2026-06-23T08:00:00.000Z"
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString()
        if (url.endsWith("/trends?scope=ai%20programming")) {
          return jsonResponse([trend])
        }
        if (url.endsWith("/trends/trend-1")) {
          return jsonResponse(detail)
        }
        return jsonResponse({ message: "Not found" }, { status: 404 })
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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
    expect(screen.getByText(/Multiple developer tool launches/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Agent tools move into IDEs/i })).toHaveAttribute(
      "href",
      "https://example.com/agents-in-ides"
    )
  })
})

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  })
}

import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"
import { MemoryRouter } from "react-router"
import { App } from "../src/App"

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (input.toString().endsWith("/trends/trend-1")) {
          return jsonResponse({
            id: "trend-1",
            scope: "ai programming",
            title: "AI agents reshape developer workflows",
            summary: "Developers are adopting agentic coding tools across daily work.",
            hotScore: 87,
            growthScore: 42,
            evidenceCount: 1,
            firstSeenAt: "2026-06-22T08:00:00.000Z",
            lastSeenAt: "2026-06-23T08:00:00.000Z",
            evidences: []
          })
        }
        return jsonResponse([])
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
  it("renders the signal console navigation", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText("Hots Monitor")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Signal" })).toBeInTheDocument()
    expect(screen.getByText("Monitors")).toBeInTheDocument()
  })

  it("renders the trend detail route from the current location", async () => {
    render(
      <MemoryRouter initialEntries={["/trends/trend-1"]}>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByRole("heading", { name: "AI agents reshape developer workflows" })).toBeInTheDocument()
  })

  it("renders a route from the current location", () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
  })
})

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  })
}
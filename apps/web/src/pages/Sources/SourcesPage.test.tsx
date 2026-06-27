import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SourcesPage } from "./SourcesPage"

const source = {
  id: "source-1",
  name: "Example Feed",
  type: "rss",
  url: "https://example.com/feed.xml",
  enabled: true,
  weight: 50
}

describe("SourcesPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString()
        if (url.endsWith("/sources") && init?.method === "DELETE") {
          return jsonResponse({ message: "Not found" }, { status: 404 })
        }
        if (url.endsWith("/sources/source-1") && init?.method === "DELETE") {
          return jsonResponse(source)
        }
        if (url.endsWith("/sources")) {
          return jsonResponse([source])
        }
        return jsonResponse({ message: "Not found" }, { status: 404 })
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("does not delete a source when confirmation is canceled", async () => {
    const user = userEvent.setup()

    render(<SourcesPage />)

    await user.click(await screen.findByRole("button", { name: /Delete/i }))
    expect(await screen.findByText(/Are you sure you want to delete/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Cancel/i }))

    expect(screen.queryByText(/Are you sure you want to delete/i)).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalledWith("http://localhost:4000/sources/source-1", {
      method: "DELETE"
    })
  })

  it("deletes a source after confirmation and reloads the list", async () => {
    const user = userEvent.setup()

    render(<SourcesPage />)

    await user.click(await screen.findByRole("button", { name: /Delete/i }))
    await screen.findByText(/Are you sure you want to delete/i)
    await user.click(screen.getAllByRole("button", { name: /Delete/i })[1])

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:4000/sources/source-1", {
        method: "DELETE"
      })
    })
    expect(await screen.findByText("Example Feed deleted")).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/sources")
  })
})

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  })
}

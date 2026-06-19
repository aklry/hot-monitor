import { XAdapter } from "./x.adapter"

describe("XAdapter", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it("requires a bearer token", async () => {
    await expect(new XAdapter("").search("ai")).rejects.toThrow(
      "X_BEARER_TOKEN is required for X Recent Search"
    )
  })

  it("maps recent search posts to collected candidates", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [
          {
            id: "123",
            text: "AI launch update",
            author_id: "u1",
            created_at: "2026-06-19T01:02:03.000Z"
          }
        ],
        includes: {
          users: [{ id: "u1", username: "openai", name: "OpenAI" }]
        }
      })
    })
    global.fetch = fetchMock as never

    const items = await new XAdapter("token").search("ai")

    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), {
      headers: {
        authorization: "Bearer token",
        "user-agent": "hots-monitor/0.1"
      }
    })
    expect(items).toEqual([
      {
        sourceName: "X",
        sourceType: "x",
        externalId: "123",
        title: "AI launch update",
        url: "https://x.com/i/web/status/123",
        author: "@openai",
        content: "AI launch update",
        publishedAt: "2026-06-19T01:02:03.000Z"
      }
    ])
  })
})

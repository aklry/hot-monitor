import { BadRequestException } from "@nestjs/common"

jest.mock("../database/prisma.service", () => ({
  PrismaService: class PrismaService {}
}))
jest.mock("./rss.adapter", () => ({
  RssAdapter: class RssAdapter {
    async search() {
      throw new Error("Invalid character in entity name")
    }
  }
}))

import { SourcesService } from "./sources.service"

function createService(source: { id: string; name: string; type: string; url: string | null }) {
  const prisma = {
    source: {
      findUniqueOrThrow: jest.fn().mockResolvedValue(source)
    }
  }
  const config = {
    get: jest.fn().mockReturnValue("")
  }

  return new SourcesService(prisma as never, config as never)
}

describe("SourcesService", () => {
  it("returns a clear error when an RSS source URL is not a valid feed", async () => {
    const service = createService({
      id: "source-1",
      name: "Weibo",
      type: "rss",
      url: "https://weibo.com/a/hot/realtime"
    })

    await expect(service.testSource("source-1", "ai")).rejects.toThrow(BadRequestException)
    await expect(service.testSource("source-1", "ai")).rejects.toThrow(
      "the URL did not return a valid RSS/Atom feed"
    )
  })

  it("returns a clear error when X search has no bearer token", async () => {
    const service = createService({
      id: "source-2",
      name: "X Recent Search",
      type: "x",
      url: "builtin:x-recent-search"
    })

    await expect(service.testSource("source-2", "ai")).rejects.toThrow(
      "X_BEARER_TOKEN is required for X Recent Search"
    )
  })
})

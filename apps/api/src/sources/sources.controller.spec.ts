jest.mock("../database/prisma.service", () => ({
  PrismaService: class PrismaService {}
}))

import { SourcesController } from "./sources.controller"

describe("SourcesController", () => {
  it("deletes a source by id", () => {
    const sources = {
      deleteSource: jest.fn().mockReturnValue({ id: "source-1" })
    }
    const controller = new SourcesController(sources as never)

    expect(controller.deleteSource("source-1")).toEqual({ id: "source-1" })
    expect(sources.deleteSource).toHaveBeenCalledWith("source-1")
  })
})

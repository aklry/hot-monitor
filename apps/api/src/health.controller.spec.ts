import { HealthController } from "./health.controller"

describe("HealthController", () => {
  it("returns an ok health payload", () => {
    const controller = new HealthController()

    expect(controller.health()).toEqual({ ok: true })
  })
})

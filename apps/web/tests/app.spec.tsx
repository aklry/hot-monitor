import { render, screen } from "@testing-library/react"
import { App } from "../src/App"

describe("App", () => {
  it("renders the signal console navigation", () => {
    render(<App />)

    expect(screen.getByText("Hots Monitor")).toBeInTheDocument()
    expect(screen.getByText("Signal")).toBeInTheDocument()
    expect(screen.getByText("Monitors")).toBeInTheDocument()
  })
})

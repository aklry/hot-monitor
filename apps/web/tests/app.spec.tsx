import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { App } from "../src/App"

describe("App", () => {
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

  it("renders a route from the current location", () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
  })
})

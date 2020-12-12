import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "./App"

const { location } = window

beforeAll(() => {
  delete window.location
})

afterAll(() => {
  window.location = location
})

beforeAll(() => {
  window.location = { hash: "" }
})

describe("logging in", () => {
  test("renders get started button and redirects to Spotify with correct scopes", () => {
    render(<App />)

    const linkElement = screen.getByText(/Get Started/i)

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    expect(window.location.href).toBe(
      "https://accounts.spotify.com/authorize?client_id=9950ac751e34487dbbe027c4fd7f8e99&redirect_uri=%2F%2F&scope=playlist-read-private%20playlist-read-collaborative%20user-library-read&response_type=token&show_dialog=false"
    )
  })


  describe("post-login state", () => {
    beforeAll(() => {
      window.location = { hash: "#access_token=TEST_ACCESS_TOKEN" }
    })

    test("renders playlist component on return from Spotify with auth token", () => {
      render(<App />)

      expect(screen.getByTestId('playlistTableSpinner')).toBeInTheDocument()
    })
  })
})

describe("logging out", () => {
  beforeAll(() => {
    window.location = { hash: "#access_token=TEST_ACCESS_TOKEN", href: "https://www.example.com/#access_token=TEST_ACCESS_TOKEN" }
  })

  test("redirects user to login screen which will force a permission request", async () => {
    const { rerender } = render(<App />)

    const changeUserElement = screen.getByTitle("Change user")

    expect(changeUserElement).toBeInTheDocument()

    userEvent.click(changeUserElement)

    expect(window.location.href).toBe("https://www.example.com/?change_user=true")

    // Simulate page reload. Would be nice to have better tools for mocking this.
    window.location.hash = ""
    window.location.search = "?change_user=true"
    rerender(<App />)

    const getStartedElement = screen.getByText(/Get Started/i)
    expect(getStartedElement).toBeInTheDocument()
    userEvent.click(getStartedElement)

    expect(window.location.href).toBe(
      "https://accounts.spotify.com/authorize?client_id=9950ac751e34487dbbe027c4fd7f8e99&redirect_uri=%2F%2F&scope=playlist-read-private%20playlist-read-collaborative%20user-library-read&response_type=token&show_dialog=true"
    )
  })
})

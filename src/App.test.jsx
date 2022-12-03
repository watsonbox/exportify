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
  window.location = { hash: "", href: "https://localhost" }
})

describe("logging in", () => {
  test("renders get started button and redirects to Spotify with correct scopes", async () => {
    render(<App />)

    const linkElement = screen.getByText(/Get Started/i)

    expect(linkElement).toBeInTheDocument()

    await userEvent.click(linkElement)

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
  test("redirects user to login screen with change_user param", async () => {
    window.location = { hash: "#access_token=TEST_ACCESS_TOKEN", href: "http://localhost/#access_token=TEST_ACCESS_TOKEN" }

    render(<App />)

    const changeUserElement = screen.getByTitle("Change user")

    expect(changeUserElement).toBeInTheDocument()

    await userEvent.click(changeUserElement)

    expect(window.location.href).toBe("http://localhost/?change_user=true")
  })

  test("presence of change_user forces a permission request", async () => {
    window.location = { hash: "", search: "?change_user=true" }

    render(<App />)

    const getStartedElement = screen.getByText(/Get Started/i)

    expect(getStartedElement).toBeInTheDocument()

    await userEvent.click(getStartedElement)

    expect(window.location.href).toBe(
      "https://accounts.spotify.com/authorize?client_id=9950ac751e34487dbbe027c4fd7f8e99&redirect_uri=%2F%2F&scope=playlist-read-private%20playlist-read-collaborative%20user-library-read&response_type=token&show_dialog=true"
    )
  })
})

import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import App from "./App"

const { location } = window

beforeAll(() => {
  delete window.location
})

afterAll(() => {
  window.location = location
})

describe("authentication request", () => {
  beforeAll(() => {
    window.location = { hash: "" }
  })

  test("renders get started button and redirects to Spotify with correct scopes", () => {
    render(<App />)

    const linkElement = screen.getByText(/Get Started/i)

    expect(linkElement).toBeInTheDocument()

    fireEvent.click(linkElement)

    expect(window.location.href).toBe(
      "https://accounts.spotify.com/authorize?client_id=9950ac751e34487dbbe027c4fd7f8e99&redirect_uri=%2F%2F&scope=playlist-read-private%20playlist-read-collaborative%20user-library-read&response_type=token"
    )
  })
})

describe("authentication return", () => {
  beforeAll(() => {
    window.location = { hash: "#access_token=TEST_ACCESS_TOKEN" }
  })

  test("renders playlist component on return from Spotify with auth token", () => {
    render(<App />)

    expect(screen.getByTestId('playlistTableSpinner')).toBeInTheDocument()
  })
})

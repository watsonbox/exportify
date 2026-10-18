import React from "react"
import { createHash } from "node:crypto"
import i18n from "i18n/config"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "./mocks/server"
import { redirectTo } from "./navigation"
import App from "./App"
import * as auth from "./auth"

const visit = (path: string) => window.history.replaceState(null, "", path)

// Records each token request body and answers with accessToken
function mockTokenEndpoint(accessToken = "TEST_ACCESS_TOKEN") {
  const requests: URLSearchParams[] = []

  server.use(
    http.post("https://accounts.spotify.com/api/token", async ({ request }) => {
      requests.push(new URLSearchParams(await request.text()))
      return HttpResponse.json({ access_token: accessToken, token_type: "Bearer", expires_in: 3600 })
    })
  )

  return requests
}

async function authorizeUrl() {
  await waitFor(() => expect(redirectTo).toHaveBeenCalled())
  return new URL(vi.mocked(redirectTo).mock.calls[0][0])
}

beforeEach(() => {
  i18n.changeLanguage("en")
  visit("/exportify")
})

describe("i18n", () => {
  test("language can be changed to French", async () => {
    render(<App />)

    const linkElement = screen.getByText(/Get Started/i)
    expect(linkElement).toHaveTextContent("Get Started")

    const changeLanguageButton = within(screen.getByTitle(/Change language/i)).getByRole("button")
    await userEvent.click(changeLanguageButton)

    const frenchLanguageElement = screen.getByText(/Français/i)
    expect(frenchLanguageElement).toBeInTheDocument()

    await userEvent.click(frenchLanguageElement)

    expect(screen.getByText(/Commencer/)).toBeInTheDocument()
    expect(linkElement).toHaveTextContent("Commencer")
  })

  test("ticks the base language for a regional variant", async () => {
    await i18n.changeLanguage("en-GB")
    render(<App />)

    await userEvent.click(within(screen.getByTitle(/Change language/i)).getByRole("button"))

    expect(screen.getByRole("button", { current: true })).toHaveTextContent("English")
  })
})

describe("PKCE", () => {
  test("derives the code challenge per RFC 7636 Appendix B", async () => {
    expect(await auth.generateCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))
      .toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
  })
})

describe("logging in", () => {
  test("redirects to Spotify with the read-only scopes and an S256 challenge for the stored verifier", async () => {
    render(<App />)

    await userEvent.click(screen.getByText(/Get Started/i))

    const url = await authorizeUrl()
    const verifier = localStorage.getItem("code_verifier")!

    expect(url.origin + url.pathname).toBe("https://accounts.spotify.com/authorize")
    expect(Object.fromEntries(url.searchParams)).toEqual({
      response_type: "code",
      client_id: "9950ac751e34487dbbe027c4fd7f8e99",
      scope: "playlist-read-private playlist-read-collaborative user-library-read",
      code_challenge_method: "S256",
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      redirect_uri: "https://exportify.app/exportify",
      show_dialog: "false",
    })
    expect(verifier).toMatch(/^[A-Za-z0-9]{64}$/)
  })

  test("uses the app_client_id override for both authorization and token exchange", async () => {
    const tokenRequests = mockTokenEndpoint()
    visit("/exportify?app_client_id=CUSTOM_CLIENT_ID")

    const { unmount } = render(<App />)
    await userEvent.click(screen.getByText(/Get Started/i))

    expect((await authorizeUrl()).searchParams.get("client_id")).toBe("CUSTOM_CLIENT_ID")
    unmount()

    visit("/exportify?code=TEST_AUTH_CODE")
    render(<App />)

    await waitFor(() => expect(tokenRequests).toHaveLength(1))
    expect(tokenRequests[0].get("client_id")).toBe("CUSTOM_CLIENT_ID")

    auth.clearAccessToken()
    expect(localStorage.getItem("client_id")).toBeNull()
  })

  test("exchanges the authorization code for an access token and loads playlists", async () => {
    const tokenRequests = mockTokenEndpoint()
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")
    visit("/exportify?code=TEST_AUTH_CODE")

    render(<App />)

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()
    expect(localStorage.getItem("access_token")).toBe("TEST_ACCESS_TOKEN")
    expect(Object.fromEntries(tokenRequests[0])).toEqual({
      client_id: "9950ac751e34487dbbe027c4fd7f8e99",
      grant_type: "authorization_code",
      code: "TEST_AUTH_CODE",
      redirect_uri: "https://exportify.app/exportify",
      code_verifier: "TEST_CODE_VERIFIER",
    })
    expect(window.location.search).toBe("")
  })

  // A failed exchange is an unhandled rejection today, leaving the spent code in the URL and no error shown
  test.todo("shows an error and clears the code when the token exchange fails")

  test("renders the playlist table when an access token is already stored", () => {
    localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")

    render(<App />)

    expect(screen.getByTestId("playlistTableSpinner")).toBeInTheDocument()
  })
})

describe("logging out", () => {
  test("clears the token and returns to login forcing a permission request", async () => {
    localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")

    render(<App />)

    await userEvent.click(screen.getByTitle("Change user"))

    expect(redirectTo).toHaveBeenCalledWith("/exportify?change_user=true")
    expect(localStorage.getItem("access_token")).toBeNull()
  })
})

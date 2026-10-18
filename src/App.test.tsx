import React from "react"
import { createHash } from "node:crypto"
import Bugsnag, { Event } from "@bugsnag/js"
import i18n from "i18n/config"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "./mocks/server"
import { redirectTo } from "./navigation"
import App from "./App"
import * as auth from "./auth"
import invalidGrant from "./test/fixtures/spotify/documented/token-invalid-grant.json"

const visit = (path: string) => window.history.replaceState(null, "", path)

const grantToken = () => HttpResponse.json({ access_token: "TEST_ACCESS_TOKEN", token_type: "Bearer", expires_in: 3600 })
const refuseCode = () => HttpResponse.json(invalidGrant.body, { status: invalidGrant.status })

// Records each token request body, and the query string at the time, and answers with respond
function mockTokenEndpoint(respond: () => Response = grantToken) {
  const requests: URLSearchParams[] = []
  const searchesAtRequest: string[] = []

  server.use(
    http.post("https://accounts.spotify.com/api/token", async ({ request }) => {
      searchesAtRequest.push(window.location.search)
      requests.push(new URLSearchParams(await request.text()))
      return respond()
    })
  )

  return Object.assign(requests, { searchesAtRequest })
}

// Stubs Bugsnag.notify and returns what each report would send after its onError callback
function captureBugsnagReports() {
  const reports: { error: unknown, groupingHash?: string, metadata: Record<string, unknown> }[] = []

  vi.spyOn(Bugsnag, "notify").mockImplementation((error, onError) => {
    const report = { error, groupingHash: undefined as string | undefined, metadata: {} as Record<string, unknown> }
    const event = {
      set groupingHash(hash: string) { report.groupingHash = hash },
      addMetadata: (section: string, values: unknown) => { report.metadata[section] = values },
    }
    if (typeof onError === "function") { onError(event as unknown as Event, () => {}) }
    reports.push(report)
  })

  return reports
}

async function authorizeUrl() {
  await waitFor(() => expect(redirectTo).toHaveBeenCalled())
  return new URL(vi.mocked(redirectTo).mock.calls[0][0])
}

const unhandledRejections: unknown[] = []
const recordUnhandledRejection = (reason: unknown) => { unhandledRejections.push(reason) }

beforeAll(() => { process.on("unhandledRejection", recordUnhandledRejection) })
afterAll(() => { process.off("unhandledRejection", recordUnhandledRejection) })

beforeEach(() => {
  i18n.changeLanguage("en")
  visit("/exportify")
})

afterEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  const rejections = unhandledRejections.splice(0)
  if (rejections.length) { throw new Error("Unhandled rejections", { cause: rejections }) }
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

  test("renders the playlist table when an access token is already stored", () => {
    localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")

    render(<App />)

    expect(screen.getByTestId("playlistTableSpinner")).toBeInTheDocument()
  })
})

describe("returning from Spotify", () => {
  test("shows an error and clears the code when the token exchange fails", async () => {
    mockTokenEndpoint(refuseCode)
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")
    visit("/exportify?code=BAD")

    render(<App />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't log in to Spotify. Please try again.")
    expect(alert).toHaveTextContent("Spotify: invalid_grant (Invalid authorization code)")
    expect(window.location.search).toBe("")
    expect(localStorage.getItem("access_token")).toBeNull()

    await userEvent.click(screen.getByText(/Get Started/i))

    expect((await authorizeUrl()).origin).toBe("https://accounts.spotify.com")
  })

  test("reports a refused code to Bugsnag with Spotify's reason and no credentials", async () => {
    const reports = captureBugsnagReports()
    mockTokenEndpoint(refuseCode)
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")
    visit("/exportify?code=BAD")

    render(<App />)

    await screen.findByRole("alert")
    expect(reports).toHaveLength(1)
    expect(reports[0].groupingHash).toBe("OAuth callback: Spotify: invalid_grant (Invalid authorization code)")
    expect(reports[0].metadata).toEqual({
      oauth: { status: 400, error: "invalid_grant", error_description: "Invalid authorization code" },
    })
  })

  test("doesn't report failures from Google's Read Aloud fetcher, which opens callback URLs with empty storage", async () => {
    const reports = captureBugsnagReports()
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 (compatible; Google-Read-Aloud; +https://support.google.com/webmasters/answer/1061943)"
    )
    visit("/exportify?code=TEST_AUTH_CODE")

    render(<App />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Start and finish the login in the same browser.")
    expect(reports).toEqual([])
  })

  test("still reports failures from the same Chrome version in a real browser", async () => {
    const reports = captureBugsnagReports()
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36"
    )
    visit("/exportify?code=TEST_AUTH_CODE")

    render(<App />)

    await screen.findByRole("alert")
    expect(reports).toHaveLength(1)
  })

  test("reports a missing code verifier to Bugsnag", async () => {
    const reports = captureBugsnagReports()
    visit("/exportify?code=TEST_AUTH_CODE")

    render(<App />)

    await screen.findByRole("alert")
    expect(reports).toHaveLength(1)
    expect(reports[0].groupingHash).toBe("OAuth callback: Code verifier not found in localStorage")
  })

  test("suggests finishing in the same browser, without calling Spotify, when the code verifier is missing", async () => {
    const tokenRequests = mockTokenEndpoint()
    visit("/exportify?code=TEST_AUTH_CODE")

    render(<App />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't log in to Spotify. Please try again.")
    expect(alert).toHaveTextContent("Start and finish the login in the same browser.")
    expect(alert).toHaveTextContent("Code verifier not found in localStorage")
    expect(tokenRequests).toHaveLength(0)
    expect(window.location.search).toBe("")
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument()
  })

  test("removes the code from the URL before exchanging it, so a reload can't reuse it", async () => {
    const tokenRequests = mockTokenEndpoint()
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")
    visit("/exportify?code=TEST_AUTH_CODE")

    render(<App />)

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()
    expect(tokenRequests.searchesAtRequest).toEqual([""])
  })

  test("exchanges the code once under StrictMode", async () => {
    const tokenRequests = mockTokenEndpoint()
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")
    visit("/exportify?code=TEST_AUTH_CODE")

    render(<React.StrictMode><App /></React.StrictMode>)

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()
    expect(tokenRequests).toHaveLength(1)
  })

  test("ignores a spent code when already logged in", async () => {
    const tokenRequests = mockTokenEndpoint(refuseCode)
    localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")
    visit("/exportify?code=SPENT_CODE")

    render(<App />)

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()
    expect(tokenRequests).toHaveLength(0)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(window.location.search).toBe("")
  })

  test("says so when the user cancels on Spotify's consent screen, without reporting it", async () => {
    const reports = captureBugsnagReports()
    const tokenRequests = mockTokenEndpoint()
    visit("/exportify?error=access_denied&ubi=TEST_UBI")

    render(<App />)

    expect(await screen.findByRole("alert")).toHaveTextContent(/^Spotify login was cancelled\.$/)
    expect(reports).toEqual([])
    expect(tokenRequests).toHaveLength(0)
    expect(window.location.search).toBe("")
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument()
  })

  test("shows and reports any other error from Spotify", async () => {
    const reports = captureBugsnagReports()
    visit("/exportify?error=server_error")

    render(<App />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't log in to Spotify. Please try again.")
    expect(alert).toHaveTextContent("Spotify: server_error")
    expect(window.location.search).toBe("")
    expect(reports).toHaveLength(1)
    expect(reports[0].groupingHash).toBe("OAuth callback: Spotify: server_error")
  })

  test("shows the error in the current language", async () => {
    await i18n.changeLanguage("fr")
    visit("/exportify?error=access_denied")

    render(<App />)

    expect(await screen.findByRole("alert")).toHaveTextContent("La connexion à Spotify a été annulée.")
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

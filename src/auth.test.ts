import { http, HttpResponse } from "msw"
import { server } from "./mocks/server"
import { redirectTo } from "./navigation"
import { captureBugsnagReports } from "./test/bugsnag"
import { currentAccessToken, exchangeCodeForToken, logout, refreshAccessToken, SessionExpiredError } from "./auth"
import grantedToken from "./test/fixtures/spotify/documented/token.json"
import refreshedToken from "./test/fixtures/spotify/documented/token-refresh.json"
import revokedRefreshToken from "./test/fixtures/spotify/documented/token-refresh-revoked.json"

const tokenUrl = "https://accounts.spotify.com/api/token"
const HOUR = 60 * 60 * 1000

// Records each token request body and answers with respond
function mockTokenEndpoint(respond: () => Response | Promise<Response>) {
  const requests: URLSearchParams[] = []
  server.use(http.post(tokenUrl, async ({ request }) => {
    requests.push(new URLSearchParams(await request.text()))
    return respond()
  }))
  return requests
}

const refresh = (body: object = refreshedToken.body) => () => HttpResponse.json(body)
const revoke = () => HttpResponse.json(revokedRefreshToken.body, { status: revokedRefreshToken.status })

function logIn({ expiresAt = Date.now() + HOUR, clientId }: { expiresAt?: number, clientId?: string } = {}) {
  localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")
  localStorage.setItem("refresh_token", "TEST_REFRESH_TOKEN")
  localStorage.setItem("token_expires_at", String(expiresAt))
  if (clientId) { localStorage.setItem("client_id", clientId) }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  window.history.replaceState(null, "", "/exportify")
})

afterEach(() => {
  vi.useRealTimers()
})

describe("exchangeCodeForToken", () => {
  test("stores the tokens and their expiry, and discards the single-use code verifier", async () => {
    server.use(http.post(tokenUrl, () => HttpResponse.json(grantedToken.body)))
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")
    const now = Date.now()

    await expect(exchangeCodeForToken("TEST_AUTH_CODE")).resolves.toBe("TEST_ACCESS_TOKEN")
    expect(localStorage.getItem("access_token")).toBe("TEST_ACCESS_TOKEN")
    expect(localStorage.getItem("refresh_token")).toBe("TEST_REFRESH_TOKEN")
    expect(localStorage.getItem("token_expires_at")).toBe(String(now + HOUR))
    expect(localStorage.getItem("code_verifier")).toBeNull()
  })

  test("rejects without storing a token when Spotify refuses the code", async () => {
    server.use(http.post("https://accounts.spotify.com/api/token", () =>
      HttpResponse.json({ error: "invalid_grant", error_description: "Invalid authorization code" }, { status: 400 })))
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")

    await expect(exchangeCodeForToken("EXPIRED_CODE")).rejects.toMatchObject({ response: { status: 400 } })
    expect(localStorage.getItem("access_token")).toBeNull()
  })

  test("rejects before calling Spotify when the code verifier is missing", async () => {
    await expect(exchangeCodeForToken("TEST_AUTH_CODE")).rejects.toThrow("Code verifier not found")
    expect(localStorage.getItem("access_token")).toBeNull()
  })
})

describe("refreshAccessToken", () => {
  test("exchanges the refresh token using the client ID that logged in", async () => {
    const requests = mockTokenEndpoint(refresh())
    logIn({ clientId: "CUSTOM_CLIENT_ID" })

    await expect(refreshAccessToken()).resolves.toBe("REFRESHED_ACCESS_TOKEN")
    expect(Object.fromEntries(requests[0])).toEqual({
      grant_type: "refresh_token",
      refresh_token: "TEST_REFRESH_TOKEN",
      client_id: "CUSTOM_CLIENT_ID",
    })
  })

  test("stores the new access token, its expiry and the rotated refresh token", async () => {
    mockTokenEndpoint(refresh())
    logIn({ expiresAt: Date.now() })
    const now = Date.now()

    await refreshAccessToken()

    expect(localStorage.getItem("access_token")).toBe("REFRESHED_ACCESS_TOKEN")
    expect(localStorage.getItem("token_expires_at")).toBe(String(now + HOUR))
    expect(localStorage.getItem("refresh_token")).toBe("ROTATED_REFRESH_TOKEN")
  })

  test("keeps the refresh token when Spotify doesn't rotate it", async () => {
    const { refresh_token: _, ...withoutRefreshToken } = refreshedToken.body
    mockTokenEndpoint(refresh(withoutRefreshToken))
    logIn()

    await refreshAccessToken()

    expect(localStorage.getItem("refresh_token")).toBe("TEST_REFRESH_TOKEN")
  })

  test("shares one request between overlapping refreshes", async () => {
    const requests = mockTokenEndpoint(refresh())
    logIn()

    const tokens = await Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()])

    expect(tokens).toEqual(["REFRESHED_ACCESS_TOKEN", "REFRESHED_ACCESS_TOKEN", "REFRESHED_ACCESS_TOKEN"])
    expect(requests).toHaveLength(1)
  })

  test("refreshes again once the previous refresh has finished", async () => {
    const requests = mockTokenEndpoint(refresh())
    logIn()

    await refreshAccessToken()
    await refreshAccessToken()

    expect(requests).toHaveLength(2)
    expect(requests[1].get("refresh_token")).toBe("ROTATED_REFRESH_TOKEN")
  })

  test("ends the session when Spotify refuses the refresh token, reporting why but not the token", async () => {
    const reports = captureBugsnagReports()
    mockTokenEndpoint(revoke)
    logIn()

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError)
    expect(reports).toHaveLength(1)
    expect(reports[0].groupingHash).toBe("Token refresh: Spotify: invalid_grant (Refresh token revoked)")
    expect(reports[0].metadata).toEqual({ oauth: { status: 400, error: "invalid_grant", error_description: "Refresh token revoked" } })
    expect(JSON.stringify(reports)).not.toContain("TEST_REFRESH_TOKEN")
  })

  test("ends the session without calling Spotify when no refresh token was stored", async () => {
    const reports = captureBugsnagReports()
    const requests = mockTokenEndpoint(refresh())
    localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError)
    expect(requests).toHaveLength(0)
    expect(reports).toEqual([])
  })

  test("passes on a network failure so the request can be retried", async () => {
    mockTokenEndpoint(() => HttpResponse.error())
    logIn()

    await expect(refreshAccessToken()).rejects.toMatchObject({ code: "ERR_NETWORK" })
    expect(localStorage.getItem("refresh_token")).toBe("TEST_REFRESH_TOKEN")
  })
})

describe("currentAccessToken", () => {
  test("is the stored token while it has time left", async () => {
    const requests = mockTokenEndpoint(refresh())
    logIn()
    vi.setSystemTime(Date.now() + HOUR - 2 * 60 * 1000)

    await expect(currentAccessToken()).resolves.toBe("TEST_ACCESS_TOKEN")
    expect(requests).toHaveLength(0)
  })

  test("is refreshed in the last minute before expiry", async () => {
    mockTokenEndpoint(refresh())
    logIn()
    vi.setSystemTime(Date.now() + HOUR - 30 * 1000)

    await expect(currentAccessToken()).resolves.toBe("REFRESHED_ACCESS_TOKEN")
  })

  test("is the stored token for a login from before refresh tokens were kept", async () => {
    const requests = mockTokenEndpoint(refresh())
    localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")

    await expect(currentAccessToken()).resolves.toBe("TEST_ACCESS_TOKEN")
    expect(requests).toHaveLength(0)
  })
})

describe("logout", () => {
  test("clears stored credentials and returns to the current page", () => {
    logIn({ clientId: "CUSTOM_CLIENT_ID" })
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")

    logout()

    expect(localStorage.length).toBe(0)
    expect(redirectTo).toHaveBeenCalledWith("/exportify")
  })

  test("asks for a fresh permission prompt when changing user", () => {
    logout(true)

    expect(redirectTo).toHaveBeenCalledWith("/exportify?change_user=true")
  })
})

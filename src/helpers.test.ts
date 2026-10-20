import { http, HttpResponse } from "msw"
import { server } from "./mocks/server"
import { apiCall, apiCallErrorHandler } from "./helpers"
import { redirectTo } from "./navigation"
import { captureBugsnagReports } from "./test/bugsnag"
import { errorResponse } from "./mocks/handlers"
import refreshedToken from "./test/fixtures/spotify/documented/token-refresh.json"
import revokedRefreshToken from "./test/fixtures/spotify/documented/token-refresh-revoked.json"

const url = "https://api.spotify.com/v1/me/tracks"

const networkError = () => HttpResponse.error()
const ok = () => HttpResponse.json({ items: [] })

const countryUnavailable = errorResponse(403, "Spotify is unavailable in this country")

// Answers successive requests with each response in turn, repeating the last, and records when each arrived
function respondWith(...responses: (() => Response)[]) {
  const attemptTimes: number[] = []

  server.use(
    http.get(url, () => {
      attemptTimes.push(Date.now())
      return responses[Math.min(attemptTimes.length, responses.length) - 1]()
    })
  )

  return Object.assign(attemptTimes, {
    delays: () => attemptTimes.slice(1).map((time, i) => time - attemptTimes[i]),
  })
}

// Runs a call to completion with fake timers, so backoff doesn't actually wait
async function settle<T>(promise: Promise<T>) {
  const result = promise.then(value => ({ value }), error => ({ error }))
  await vi.runAllTimersAsync()
  return result as Promise<{ value?: T, error?: any }>
}

// Bottleneck remembers when it last ran, so the clock never goes back between tests
let clock = Date.now()

beforeEach(() => {
  vi.useFakeTimers({ now: clock })
  localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")
  captureBugsnagReports()
})

afterEach(() => {
  clock = Date.now()
  vi.useRealTimers()
  window.dispatchEvent(new Event("pageshow"))
})

describe("a request that fails with no response", () => {
  test("is retried with exponential backoff until it succeeds", async () => {
    const attempts = respondWith(networkError, networkError, networkError, ok)

    const { value, error } = await settle(apiCall(url))

    expect(error).toBeUndefined()
    expect(value!.data).toEqual({ items: [] })
    expect(attempts.delays()).toEqual([1000, 2000, 4000])
  })

  test("gives up with the network error after six attempts", async () => {
    const attempts = respondWith(networkError)

    const { error } = await settle(apiCall(url))

    expect(error.code).toBe("ERR_NETWORK")
    expect(attempts.delays()).toEqual([1000, 2000, 4000, 8000, 16000])
  })

  test("stops the requests already queued behind it retrying once it gives up", async () => {
    const attempts = respondWith(networkError)

    const { value } = await settle(Promise.allSettled([1, 2, 3].map(() => apiCall(url))))

    expect(value!.map(result => result.status)).toEqual(["rejected", "rejected", "rejected"])
    expect(attempts).toHaveLength(6 + 2)
  })

  test("is retried in full when made after an earlier request gave up", async () => {
    const attempts = respondWith(networkError)

    await settle(apiCall(url))
    await settle(apiCall(url))

    expect(attempts).toHaveLength(6 + 6)
  })

  test("is not retried once the page is unloading", async () => {
    const attempts = respondWith(networkError, ok)
    window.dispatchEvent(new Event("pagehide"))

    const { error } = await settle(apiCall(url))

    expect(error.code).toBe("ERR_NETWORK")
    expect(attempts).toHaveLength(1)
  })

  test("leaves a breadcrumb rather than a report for each retry", async () => {
    const reports = captureBugsnagReports()
    respondWith(networkError, ok)

    await settle(apiCall(url))

    expect(reports).toEqual([])
  })
})

describe("a 429", () => {
  test("waits as long as Retry-After asks, plus a buffer, before retrying", async () => {
    const attempts = respondWith(errorResponse(429, undefined, { "retry-after": "3" }), ok)

    const { error } = await settle(apiCall(url))

    expect(error).toBeUndefined()
    expect(attempts.delays()).toEqual([4000])
  })

  test("gives up after three attempts", async () => {
    const attempts = respondWith(errorResponse(429, undefined, { "retry-after": "1" }))

    const { error } = await settle(apiCall(url))

    expect(error.response.status).toBe(429)
    expect(attempts).toHaveLength(3)
  })

  test("isn't retried when Spotify asks for a wait too long to hold an export open", async () => {
    const attempts = respondWith(errorResponse(429, undefined, { "retry-after": "3600" }), ok)

    const { error } = await settle(apiCall(url))

    expect(error.response.status).toBe(429)
    expect(attempts).toHaveLength(1)
  })
})

describe("a 5xx", () => {
  test("is retried until it succeeds", async () => {
    const attempts = respondWith(errorResponse(503), ok)

    const { error } = await settle(apiCall(url))

    expect(error).toBeUndefined()
    expect(attempts.delays()).toEqual([1000])
  })

  test("waits longer after a 502, which large playlists sometimes cause", async () => {
    const attempts = respondWith(errorResponse(502), ok)

    await settle(apiCall(url))

    expect(attempts.delays()).toEqual([3000])
  })

  test("gives up after three attempts", async () => {
    const attempts = respondWith(errorResponse(500))

    const { error } = await settle(apiCall(url))

    expect(error.response.status).toBe(500)
    expect(attempts).toHaveLength(3)
  })

  test("is reported to Bugsnag as a retried request", async () => {
    const reports = captureBugsnagReports()
    respondWith(errorResponse(503), ok)

    await settle(apiCall(url))

    expect(reports).toHaveLength(1)
    expect(reports[0].groupingHash).toBe("Retried Request")
  })
})

describe("a client error", () => {
  test.each([
    ["the country 403", countryUnavailable],
    ["a 404", errorResponse(404)],
  ])("fails fast on %s without reporting a retry", async (_, response) => {
    const reports = captureBugsnagReports()
    const attempts = respondWith(response, ok)

    const { error } = await settle(apiCall(url))

    expect(error.response.status).toBeGreaterThanOrEqual(400)
    expect(attempts).toHaveLength(1)
    expect(reports).toEqual([])
  })
})

describe("an expiring session", () => {
  const HOUR = 60 * 60 * 1000

  // Spotify accepts only the newest access token; returns the token each request was sent with
  function serveApiFor(validToken: () => string) {
    const sentTokens: string[] = []
    server.use(http.get(url, ({ request }) => {
      const token = request.headers.get("Authorization")!.replace("Bearer ", "")
      sentTokens.push(token)
      return token === validToken() ? ok() : errorResponse(401)()
    }))
    return sentTokens
  }

  function mockTokenEndpoint(respond: () => Response = () => HttpResponse.json(refreshedToken.body)) {
    const requests: URLSearchParams[] = []
    server.use(http.post("https://accounts.spotify.com/api/token", async ({ request }) => {
      requests.push(new URLSearchParams(await request.text()))
      return respond()
    }))
    return requests
  }

  const revoke = () => HttpResponse.json(revokedRefreshToken.body, { status: revokedRefreshToken.status })

  beforeEach(() => {
    localStorage.setItem("refresh_token", "TEST_REFRESH_TOKEN")
    localStorage.setItem("token_expires_at", String(Date.now() + HOUR))
  })

  test("is refreshed just before the token expires, without a failed request", async () => {
    const tokenRequests = mockTokenEndpoint()
    const sentTokens = serveApiFor(() => tokenRequests.length ? "REFRESHED_ACCESS_TOKEN" : "TEST_ACCESS_TOKEN")
    vi.setSystemTime(Date.now() + HOUR - 30 * 1000)

    const { error } = await settle(apiCall(url))

    expect(error).toBeUndefined()
    expect(tokenRequests).toHaveLength(1)
    expect(sentTokens).toEqual(["REFRESHED_ACCESS_TOKEN"])
  })

  test("is refreshed after a 401 and the request retried once with the new token", async () => {
    const tokenRequests = mockTokenEndpoint()
    const sentTokens = serveApiFor(() => "REFRESHED_ACCESS_TOKEN")

    const { error } = await settle(apiCall(url))

    expect(error).toBeUndefined()
    expect(tokenRequests).toHaveLength(1)
    expect(sentTokens).toEqual(["TEST_ACCESS_TOKEN", "REFRESHED_ACCESS_TOKEN"])
  })

  test("gives up with the 401 when the retry is refused too", async () => {
    const tokenRequests = mockTokenEndpoint()
    const sentTokens = serveApiFor(() => "NO_TOKEN_WILL_DO")

    const { error } = await settle(apiCall(url))

    expect(error.response.status).toBe(401)
    expect(tokenRequests).toHaveLength(1)
    expect(sentTokens).toHaveLength(2)
  })

  test("is refreshed only once for requests that all fail with the old token", async () => {
    const tokenRequests = mockTokenEndpoint()
    const sentTokens = serveApiFor(() => "REFRESHED_ACCESS_TOKEN")

    const { value } = await settle(Promise.all([1, 2, 3].map(() => apiCall(url))))

    expect(value).toHaveLength(3)
    expect(tokenRequests).toHaveLength(1)
    expect(sentTokens).toEqual(["TEST_ACCESS_TOKEN", "REFRESHED_ACCESS_TOKEN", "REFRESHED_ACCESS_TOKEN", "REFRESHED_ACCESS_TOKEN"])
  })

  test("retries with a token another tab refreshed while the request was in flight, without refreshing again", async () => {
    const tokenRequests = mockTokenEndpoint()
    const sentTokens = serveApiFor(() => "REFRESHED_ACCESS_TOKEN")
    server.use(http.get(url, ({ request }) => {
      sentTokens.push(request.headers.get("Authorization")!.replace("Bearer ", ""))
      if (sentTokens.length > 1) { return ok() }
      localStorage.setItem("access_token", "REFRESHED_ACCESS_TOKEN")
      return errorResponse(401)()
    }))

    const { error } = await settle(apiCall(url))

    expect(error).toBeUndefined()
    expect(tokenRequests).toHaveLength(0)
    expect(sentTokens).toEqual(["TEST_ACCESS_TOKEN", "REFRESHED_ACCESS_TOKEN"])
  })

  test("is retried when the refresh hits a network error", async () => {
    let tokenAttempts = 0
    const tokenRequests = mockTokenEndpoint(() => ++tokenAttempts === 1 ? HttpResponse.error() : HttpResponse.json(refreshedToken.body))
    serveApiFor(() => "REFRESHED_ACCESS_TOKEN")

    const { error } = await settle(apiCall(url))

    expect(error).toBeUndefined()
    expect(tokenRequests).toHaveLength(2)
  })

  test("sends the user to login when Spotify refuses the refresh", async () => {
    captureBugsnagReports()
    const tokenRequests = mockTokenEndpoint(revoke)
    serveApiFor(() => "REFRESHED_ACCESS_TOKEN")

    const { error } = await settle(apiCall(url))
    const apiError = apiCallErrorHandler(error)

    expect(tokenRequests).toHaveLength(1)
    expect(apiError).toBeUndefined()
    expect(redirectTo).toHaveBeenCalledWith(window.location.pathname)
    expect(localStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem("refresh_token")).toBeNull()
  })

  test("sends the user to login when a login from before refresh tokens gets a 401", async () => {
    const reports = captureBugsnagReports()
    const tokenRequests = mockTokenEndpoint()
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("token_expires_at")
    serveApiFor(() => "REFRESHED_ACCESS_TOKEN")

    const { error } = await settle(apiCall(url))
    apiCallErrorHandler(error)

    expect(tokenRequests).toHaveLength(0)
    expect(redirectTo).toHaveBeenCalledWith(window.location.pathname)
    expect(reports).toEqual([])
  })

  test("doesn't redirect an export that runs past the token's lifetime", async () => {
    const tokenRequests = mockTokenEndpoint()
    const expiresAt = Date.now() + HOUR
    // Each page takes 20 minutes, and Spotify starts refusing the old token on the hour
    const sentTokens: string[] = []
    server.use(http.get(url, ({ request }) => {
      const token = request.headers.get("Authorization")!.replace("Bearer ", "")
      sentTokens.push(token)
      const valid = token === (Date.now() < expiresAt ? "TEST_ACCESS_TOKEN" : "REFRESHED_ACCESS_TOKEN")
      vi.setSystemTime(Date.now() + 20 * 60 * 1000)
      return valid ? ok() : errorResponse(401)()
    }))

    const pages = []
    for (let page = 0; page < 6; page++) { pages.push((await settle(apiCall(url))).value) }

    expect(pages.every(page => page?.status === 200)).toBe(true)
    expect(tokenRequests).toHaveLength(1)
    expect(redirectTo).not.toHaveBeenCalled()
  })
})

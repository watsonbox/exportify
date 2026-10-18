import { http, HttpResponse } from "msw"
import { server } from "./mocks/server"
import { apiCall } from "./helpers"
import { captureBugsnagReports } from "./test/bugsnag"
import { errorResponse } from "./mocks/handlers"

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

beforeEach(() => {
  vi.useFakeTimers()
  captureBugsnagReports()
})

afterEach(() => {
  vi.useRealTimers()
  window.dispatchEvent(new Event("pageshow"))
})

describe("a request that fails with no response", () => {
  test("is retried with exponential backoff until it succeeds", async () => {
    const attempts = respondWith(networkError, networkError, networkError, ok)

    const { value, error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error).toBeUndefined()
    expect(value!.data).toEqual({ items: [] })
    expect(attempts.delays()).toEqual([1000, 2000, 4000])
  })

  test("gives up with the network error after six attempts", async () => {
    const attempts = respondWith(networkError)

    const { error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error.code).toBe("ERR_NETWORK")
    expect(attempts.delays()).toEqual([1000, 2000, 4000, 8000, 16000])
  })

  test("stops the requests already queued behind it retrying once it gives up", async () => {
    const attempts = respondWith(networkError)

    const { value } = await settle(Promise.allSettled([1, 2, 3].map(() => apiCall(url, "TEST_ACCESS_TOKEN"))))

    expect(value!.map(result => result.status)).toEqual(["rejected", "rejected", "rejected"])
    expect(attempts).toHaveLength(6 + 2)
  })

  test("is retried in full when made after an earlier request gave up", async () => {
    const attempts = respondWith(networkError)

    await settle(apiCall(url, "TEST_ACCESS_TOKEN"))
    await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(attempts).toHaveLength(6 + 6)
  })

  test("is not retried once the page is unloading", async () => {
    const attempts = respondWith(networkError, ok)
    window.dispatchEvent(new Event("pagehide"))

    const { error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error.code).toBe("ERR_NETWORK")
    expect(attempts).toHaveLength(1)
  })

  test("leaves a breadcrumb rather than a report for each retry", async () => {
    const reports = captureBugsnagReports()
    respondWith(networkError, ok)

    await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(reports).toEqual([])
  })
})

describe("a 429", () => {
  test("waits as long as Retry-After asks, plus a buffer, before retrying", async () => {
    const attempts = respondWith(errorResponse(429, undefined, { "retry-after": "3" }), ok)

    const { error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error).toBeUndefined()
    expect(attempts.delays()).toEqual([4000])
  })

  test("gives up after three attempts", async () => {
    const attempts = respondWith(errorResponse(429, undefined, { "retry-after": "1" }))

    const { error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error.response.status).toBe(429)
    expect(attempts).toHaveLength(3)
  })

  test("isn't retried when Spotify asks for a wait too long to hold an export open", async () => {
    const attempts = respondWith(errorResponse(429, undefined, { "retry-after": "3600" }), ok)

    const { error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error.response.status).toBe(429)
    expect(attempts).toHaveLength(1)
  })
})

describe("a 5xx", () => {
  test("is retried until it succeeds", async () => {
    const attempts = respondWith(errorResponse(503), ok)

    const { error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error).toBeUndefined()
    expect(attempts.delays()).toEqual([1000])
  })

  test("waits longer after a 502, which large playlists sometimes cause", async () => {
    const attempts = respondWith(errorResponse(502), ok)

    await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(attempts.delays()).toEqual([3000])
  })

  test("gives up after three attempts", async () => {
    const attempts = respondWith(errorResponse(500))

    const { error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error.response.status).toBe(500)
    expect(attempts).toHaveLength(3)
  })

  test("is reported to Bugsnag as a retried request", async () => {
    const reports = captureBugsnagReports()
    respondWith(errorResponse(503), ok)

    await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(reports).toHaveLength(1)
    expect(reports[0].groupingHash).toBe("Retried Request")
  })
})

describe("a client error", () => {
  test.each([
    ["the country 403", countryUnavailable],
    ["a 404", errorResponse(404)],
    ["a 401", errorResponse(401)],
  ])("fails fast on %s without reporting a retry", async (_, response) => {
    const reports = captureBugsnagReports()
    const attempts = respondWith(response, ok)

    const { error } = await settle(apiCall(url, "TEST_ACCESS_TOKEN"))

    expect(error.response.status).toBeGreaterThanOrEqual(400)
    expect(attempts).toHaveLength(1)
    expect(reports).toEqual([])
  })
})

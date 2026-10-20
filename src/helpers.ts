import Bugsnag, { Event } from "@bugsnag/js"
import axios from "axios"
import Bottleneck from "bottleneck"
import { clearAccessToken, currentAccessToken, loadAccessToken, refreshAccessToken, SessionExpiredError } from "./auth"
import { redirectTo } from "./navigation"

const REQUEST_RETRY_BUFFER = 1000
const MAX_RATE_LIMIT_RETRIES = 2 // 3 attempts in total
const MAX_RETRY_AFTER = 60       // Seconds; a longer wait isn't worth holding an export open for
const MAX_ERROR_RETRIES = 2      // 3 attempts in total
const MAX_NETWORK_RETRIES = 5    // 6 attempts over about 30 seconds
const NETWORK_RETRY_BASE = 1000  // Doubles on each retry
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 0
})

// Leaving the page aborts requests in flight, which is neither worth retrying nor reporting
let pageUnloading = false
window.addEventListener("pagehide", () => { pageUnloading = true })
window.addEventListener("pageshow", () => { pageUnloading = false })

// Requests queued before one gives up on a dropped connection fail with it, rather than each retrying in turn
let requestsQueued = 0
let queuedWhenConnectionLost = 0

limiter.on("failed", async (error, jobInfo) => {
  if (pageUnloading || error instanceof SessionExpiredError) { return }

  const status: number | undefined = error.response?.status

  if (status === undefined) {
    // Dropped connections, mostly during long exports on mobile
    const queuedAs: number = jobInfo.args[0]
    if (queuedAs <= queuedWhenConnectionLost) { return }

    if (jobInfo.retryCount < MAX_NETWORK_RETRIES) {
      Bugsnag.leaveBreadcrumb("Retrying request after network error", { url: error.config?.url, retryCount: jobInfo.retryCount })
      return NETWORK_RETRY_BASE * 2 ** jobInfo.retryCount
    }

    queuedWhenConnectionLost = requestsQueued
  } else if (status === 429) {
    // Retry according to the indication from the server with a small buffer
    const retryAfter = Number(error.response.headers["retry-after"] || 1)
    if (jobInfo.retryCount < MAX_RATE_LIMIT_RETRIES && retryAfter <= MAX_RETRY_AFTER) {
      return (retryAfter * 1000) + REQUEST_RETRY_BUFFER
    }
  } else if (status >= 500 && jobInfo.retryCount < MAX_ERROR_RETRIES) {
    // Log and retry server errors (e.g. 503/504 which sometimes occur)
    Bugsnag.notify(
      error,
      (event) => {
        event.addMetadata("response", error.response)
        event.addMetadata("request", error.config)
        event.groupingHash = "Retried Request"
      }
    )

    if (status === 502) {
      // Try waiting a little longer to reduce problems with large playlists
      // https://github.com/watsonbox/exportify/issues/142
      return REQUEST_RETRY_BUFFER * 3
    } else {
      return REQUEST_RETRY_BUFFER
    }
  }
})

function get(url: string, accessToken: string | null) {
  return axios.get(url, { headers: { 'Authorization': 'Bearer ' + accessToken } })
}

// A 401 gets one retry with a renewed token, which another request or tab may already have fetched
async function request(_queuedAs: number, url: string) {
  const accessToken = await currentAccessToken()

  try {
    return await get(url, accessToken)
  } catch (error: any) {
    if (error.response?.status !== 401) { throw error }

    const storedToken = loadAccessToken()
    return get(url, storedToken !== accessToken ? storedToken : await refreshAccessToken())
  }
}

export function apiCall(url: string) {
  return limiter.schedule(request, ++requestsQueued, url)
}

export type ApiError = {
  kind: "network" | "rate_limited" | "unavailable" | "refused" | "unexpected"
  status?: number
  detail?: string // Spotify's own reason, untranslated
}

function describeApiError(error: any): ApiError {
  const status: number | undefined = error.response?.status

  if (status === undefined) { return { kind: "network" } }
  if (status === 429) { return { kind: "rate_limited", status } }
  if (status >= 500) { return { kind: "unavailable", status } }

  return { kind: "refused", status, detail: error.response.data?.error?.message }
}

// Handles a request that has run out of retries, returning what to tell the user if anything
export function apiCallErrorHandler(error: any): ApiError | undefined {
  if (!error?.isAxiosError && !(error instanceof SessionExpiredError)) {
    Bugsnag.notify(error)
    return { kind: "unexpected" }
  }
  if (pageUnloading) { return }

  if (error instanceof SessionExpiredError || error.response?.status === 401) {
    // Clear tokens and return to login once the session can't be renewed
    clearAccessToken()
    redirectTo(window.location.pathname)
    return
  }

  const apiError = describeApiError(error)
  Bugsnag.notify(error, (event) => {
    event.addMetadata("request", { url: error.config?.url })
    if (error.response) { event.addMetadata("response", { status: error.response.status, data: error.response.data }) }
  })

  return apiError
}

export function prepareReport(event: Event) {
  event.request.url = "[REDACTED]" // Don't send access tokens

  if (event.originalError?.isAxiosError) {
    event.groupingHash = event.originalError.message
  }
}

import Bugsnag from "@bugsnag/js"
import axios from "axios"
import Bottleneck from "bottleneck"
import { clearAccessToken } from "./auth"

const REQUEST_RETRY_BUFFER = 1000
const MAX_RATE_LIMIT_RETRIES = 2 // 3 attempts in total
const MAX_ERROR_RETRIES = 2      // 3 attempts in total
const MAX_NETWORK_RETRIES = 5    // 6 attempts in total — throttle recovery on large playlists
const NETWORK_RETRY_BASE = 1000  // First backoff delay; doubles each subsequent retry
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 0
})

limiter.on("failed", async (error, jobInfo) => {
  // A rate-limited (429) response arrives without CORS headers, so the browser blocks it and
  // surfaces only an opaque network error (ERR_NETWORK) with no `error.response`. That means
  // we can't read the 429's `Retry-After` to honour Spotify's requested wait. As a fallback,
  // apply our own exponential backoff — Spotify's own guidance when rate limited is to slow
  // down and retry. If the errors persist through the whole backoff cycle we stop retrying and
  // let the error propagate (which aborts the export) rather than hanging indefinitely.
  if (error.response == null) {
    if (jobInfo.retryCount < MAX_NETWORK_RETRIES) {
      return NETWORK_RETRY_BASE * Math.pow(2, jobInfo.retryCount) // 1s, 2s, 4s, 8s, 16s
    }
    return undefined
  }

  if (error.response.status === 429 && jobInfo.retryCount < MAX_RATE_LIMIT_RETRIES) {
    // Retry according to the indication from the server with a small buffer
    return ((error.response.headers["retry-after"] || 1) * 1000) + REQUEST_RETRY_BUFFER
  } else if (error.response.status !== 401 && error.response.status !== 429 && jobInfo.retryCount < MAX_ERROR_RETRIES) {
    // Log and retry any other failure once (e.g. 503/504 which sometimes occur)
    Bugsnag.notify(
      error,
      (event) => {
        event.addMetadata("response", error.response)
        event.addMetadata("request", error.config)
        event.groupingHash = "Retried Request"
      }
    )

    if (error.response.status === 502) {
      // Try waiting a little longer to reduce problems with large playlists
      // https://github.com/watsonbox/exportify/issues/142
      return REQUEST_RETRY_BUFFER * 3
    } else {
      return REQUEST_RETRY_BUFFER
    }
  }
})

export const apiCall = limiter.wrap(function(url: string, accessToken: string) {
  return axios.get(url, { headers: { 'Authorization': 'Bearer ' + accessToken } })
})

export function apiCallErrorHandler(error: any) {
  if (error.isAxiosError) {
    if (error.request.status === 401) {
      // Clear token and return to home page after auth token expiry
      clearAccessToken()
      window.location.href = window.location.pathname
      return
    } else if (error.request.status >= 500 && error.request.status < 600) {
      // Show error page when we get a 5XX that fails retries
      window.location.href = `${window.location.pathname}?spotify_error=true`
      return
    }
  }

  throw error
}

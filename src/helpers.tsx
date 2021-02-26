import Bugsnag from "@bugsnag/js"
import axios from "axios"
import Bottleneck from "bottleneck"

// http://stackoverflow.com/a/901144/4167042
export function getQueryParam(name: string) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(window.location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const REQUEST_RETRY_BUFFER = 1000
const MAX_RATE_LIMIT_RETRIES = 2 // 3 attempts in total
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 0
})

limiter.on("failed", async (error, jobInfo) => {
  if (error.response.status === 429 && jobInfo.retryCount < MAX_RATE_LIMIT_RETRIES) {
    // Retry according to the indication from the server with a small buffer
    return ((error.response.headers["retry-after"] || 1) * 1000) + REQUEST_RETRY_BUFFER
  } else if (error.response.status !== 401 && error.response.status !== 429 && jobInfo.retryCount === 0) {
    // Log and retry any other failure once (e.g. 503/504 which sometimes occur)
    Bugsnag.notify(
      error,
      (event) => {
        event.addMetadata("response", error.response)
        event.addMetadata("request", error.config)
        event.groupingHash = "Retried Request"
      }
    )

    return REQUEST_RETRY_BUFFER
  }
})

export const apiCall = limiter.wrap(function(url: string, accessToken: string) {
  return axios.get(url, { headers: { 'Authorization': 'Bearer ' + accessToken } })
})

export function apiCallErrorHandler(error: any) {
  if (error.isAxiosError) {
    if (error.request.status === 401) {
      // Return to home page after auth token expiry
      window.location.href = window.location.href.split('#')[0]
      return
    } else if (error.request.status >= 500 && error.request.status < 600) {
      // Show error page when we get a 5XX that fails retries
      window.location.href = `${window.location.href.split('#')[0]}?spotify_error=true`
      return
    }
  }

  throw error
}

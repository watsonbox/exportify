import axios from "axios"
import Bottleneck from "bottleneck"

export function authorize() {
  var client_id = getQueryParam('app_client_id');

  // Use Exportify application client_id if none given
  if (client_id === '') {
    client_id = "9950ac751e34487dbbe027c4fd7f8e99"
  }

  window.location.href = "https://accounts.spotify.com/authorize" +
    "?client_id=" + client_id +
    "&redirect_uri=" + encodeURIComponent([window.location.protocol, '//', window.location.host, window.location.pathname].join('')) +
    "&scope=playlist-read-private%20playlist-read-collaborative%20user-library-read" +
    "&response_type=token";
}

// http://stackoverflow.com/a/901144/4167042
export function getQueryParam(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(window.location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 0
})

limiter.on("failed", async (error, jobInfo) => {
  if (error.response.status === 401) {
    // Return to home page after auth token expiry
    window.location.href = window.location.href.split('#')[0]
  } else if (error.response.status === 429 && jobInfo.retryCount === 0) {
    // Retry according to the indication from the server with a small buffer
    return ((error.response.headers["retry-after"] || 1) * 1000) + 1000
  } else {
    // TODO: Improve
    alert(error.responseText)
  }
})

export const apiCall = limiter.wrap(function(url, accessToken) {
  return axios.get(url, { headers: { 'Authorization': 'Bearer ' + accessToken } })
})

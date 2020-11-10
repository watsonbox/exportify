import $ from "jquery" // TODO: Remove jQuery dependency

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

export function apiCall(url, access_token) {
  return $.ajax({
    url: url,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  }).fail(function (jqXHR, textStatus) {
    if (jqXHR.status === 401) {
      // Return to home page after auth token expiry
      window.location.href = window.location.href.split('#')[0]
    } else if (jqXHR.status === 429) {
      // API Rate-limiting encountered
      window.location.href = window.location.href.split('#')[0] + '?rate_limit_message=true'
    } else {
      // Otherwise report the error so user can raise an issue
      alert(jqXHR.responseText);
    }
  })
}

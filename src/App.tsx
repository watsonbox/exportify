import './App.scss'
import "./icons"

import React, { useEffect, useState } from 'react'
import Bugsnag from "@bugsnag/js"
import { useTranslation, Translation } from "react-i18next"
import { Alert } from "react-bootstrap"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import Login from 'components/Login'
import PlaylistTable from "components/PlaylistTable"
import TopMenu from "components/TopMenu"
import { loadAccessToken, exchangeCodeForToken, MissingCodeVerifierError } from "auth"

const baseUrl = import.meta.env.BASE_URL

// detail is untranslated so what users quote in reports matches the Bugsnag grouping
type LoginError = { kind: "failed" | "cancelled" | "wrong_browser", detail?: string }

function loginErrorFrom(params: URLSearchParams): LoginError | null {
  const error = params.get("error")
  if (!error) { return null }

  return error === "access_denied" ? { kind: "cancelled" } : { kind: "failed", detail: `Spotify: ${error}` }
}

function describeExchangeFailure(error: any): string {
  const spotifyError = error.response?.data
  if (!spotifyError?.error) { return error.message }

  return spotifyError.error_description
    ? `Spotify: ${spotifyError.error} (${spotifyError.error_description})`
    : `Spotify: ${spotifyError.error}`
}

// Sends Spotify's reason but never the request, whose body holds the code and verifier
function reportLoginFailure(error: Error, detail: string, response?: any) {
  // Google's Read Aloud fetcher replays callback URLs with empty storage, so its failures are noise
  if (navigator.userAgent.includes("Google-Read-Aloud")) { return }

  Bugsnag.notify(error, (event) => {
    event.groupingHash = `OAuth callback: ${detail}`
    if (response) {
      event.addMetadata("oauth", {
        status: response.status,
        error: response.data?.error,
        error_description: response.data?.error_description,
      })
    }
  })
}

// The redirect URI has no query of its own, so a callback's whole query string came from Spotify
function removeCallbackParams() {
  const params = new URLSearchParams(window.location.search)
  if (!params.has("code") && !params.has("error")) { return }

  window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
}

function App() {
  const { t } = useTranslation()
  const [subtitle, setSubtitle] = useState(<Translation>{(t) => t("tagline")}</Translation>)
  const searchParams = new URLSearchParams(window.location.search)

  const [accessToken, setAccessToken] = useState<string | null>(loadAccessToken())
  const [loginError, setLoginError] = useState(() => loginErrorFrom(searchParams))

  let view

  const onSetSubtitle = (subtitle: any) => {
    setSubtitle(subtitle)
  }

  // The code is single-use, so it leaves the URL before the exchange and a reload or StrictMode rerun can't send it again
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const callbackError = loginErrorFrom(params)
    removeCallbackParams()

    if (callbackError?.detail) {
      reportLoginFailure(new Error(`Spotify authorization error: ${params.get("error")}`), callbackError.detail)
    } else if (code && !loadAccessToken()) {
      exchangeCodeForToken(code).then(setAccessToken, (error) => {
        const detail = describeExchangeFailure(error)
        reportLoginFailure(error, detail, error.response)
        setLoginError({ kind: error instanceof MissingCodeVerifierError ? "wrong_browser" : "failed", detail })
      })
    }
  }, [])

  if (searchParams.get('spotify_error')) {
    view = <div id="spotifyErrorMessage" className="lead">
      <p><FontAwesomeIcon icon={['fas', 'bolt']} style={{ fontSize: "50px", marginBottom: "20px" }} /></p>
      <p>Oops, Exportify has encountered an unexpected error (5XX) while using the Spotify API. This kind of error is due to a problem on Spotify&apos;s side, and although it&apos;s rare, unfortunately all we can do is retry later.</p>
      <p style={{ marginTop: "50px" }}>Keep an eye on the <a target="_blank" rel="noreferrer" href="https://status.spotify.dev/">Spotify Web API Status page</a> to see if there are any known problems right now, and then <a rel="noreferrer" href="?">retry</a>.</p>
    </div>
  } else if (accessToken) {
    view = <PlaylistTable accessToken={accessToken!} onSetSubtitle={onSetSubtitle} />
  } else {
    view = <>
      {loginError && (
        <Alert id="loginError" variant={loginError.kind === "cancelled" ? "secondary" : "danger"}>
          <p className="mb-0">{loginError.kind === "cancelled" ? t("login_error.cancelled") : t("login_error.failed")}</p>
          {loginError.kind === "wrong_browser" && <p className="mb-0">{t("login_error.same_browser")}</p>}
          {loginError.detail && <p className="mt-2 mb-0 small opacity-75">{loginError.detail}</p>}
        </Alert>
      )}
      <Login />
    </>
  }

  return (
    <div className="App container">
      <header className="App-header">
        <div className="d-sm-none d-block mb-5" />
        <TopMenu loggedIn={!!accessToken} />
        <h1>
          <FontAwesomeIcon icon={['fab', 'spotify']} color="#84BD00" size="sm" /> <a href={baseUrl}>Exportify</a>
        </h1>

        <p id="subtitle" className="lead text-secondary">{subtitle}</p>
      </header>

      {view}
    </div>
  );
}

export default App;

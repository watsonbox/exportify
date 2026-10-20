import './App.scss'
import "./icons"

import React, { useEffect, useState } from 'react'
import Bugsnag from "@bugsnag/js"
import { AxiosResponse, isAxiosError } from "axios"
import { useTranslation, Translation } from "react-i18next"
import { Alert } from "react-bootstrap"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import Login from 'components/Login'
import PlaylistTable from "components/PlaylistTable"
import TopMenu from "components/TopMenu"
import { loadAccessToken, exchangeCodeForToken, MissingCodeVerifierError, OAuthErrorResponse } from "auth"

const baseUrl = import.meta.env.BASE_URL

// detail is untranslated so what users quote in reports matches the Bugsnag grouping
type LoginError = { kind: "failed" | "cancelled" | "wrong_browser", detail?: string }

function loginErrorFrom(params: URLSearchParams): LoginError | null {
  const error = params.get("error")
  if (!error) { return null }

  return error === "access_denied" ? { kind: "cancelled" } : { kind: "failed", detail: `Spotify: ${error}` }
}

function oauthResponse(error: unknown) {
  return isAxiosError<Partial<OAuthErrorResponse>>(error) ? error.response : undefined
}

function describeExchangeFailure(error: Error): string {
  const spotifyError = oauthResponse(error)?.data
  if (!spotifyError?.error) { return error.message }

  return spotifyError.error_description
    ? `Spotify: ${spotifyError.error} (${spotifyError.error_description})`
    : `Spotify: ${spotifyError.error}`
}

// Sends Spotify's reason but never the request, whose body holds the code and verifier
function reportLoginFailure(error: Error, detail: string, response?: AxiosResponse<Partial<OAuthErrorResponse>>) {
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
  // Clicking the login button mid-exchange would navigate away and abort it
  const [exchangingCode, setExchangingCode] = useState(() => searchParams.has("code") && !accessToken)

  let view

  const onSetSubtitle = (subtitle: React.JSX.Element) => {
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
      exchangeCodeForToken(code).then(setAccessToken, (error: Error) => {
        const detail = describeExchangeFailure(error)
        reportLoginFailure(error, detail, oauthResponse(error))
        setLoginError({ kind: error instanceof MissingCodeVerifierError ? "wrong_browser" : "failed", detail })
      }).finally(() => setExchangingCode(false))
    }
  }, [])

  if (accessToken) {
    view = <PlaylistTable onSetSubtitle={onSetSubtitle} />
  } else {
    view = <>
      {loginError && (
        <Alert id="loginError" className="mb-4" variant={loginError.kind === "cancelled" ? "secondary" : "danger"}>
          <p className="mb-0">{loginError.kind === "cancelled" ? t("login_error.cancelled") : t("login_error.failed")}</p>
          {loginError.kind === "wrong_browser" && <p className="mb-0">{t("login_error.same_browser")}</p>}
          {loginError.detail && <p className="mt-2 mb-0 small opacity-75">{loginError.detail}</p>}
        </Alert>
      )}
      <Login loggingIn={exchangingCode} />
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

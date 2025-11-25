import './App.scss'
import "./icons"

import React, { useEffect, useState, useRef } from 'react'
import { useTranslation, Translation } from "react-i18next"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import "url-search-params-polyfill"

import Login from 'components/Login'
import PlaylistTable from "components/PlaylistTable"
import SavedAlbumRow from "components/SavedAlbumRow"
import TopMenu from "components/TopMenu"
import { loadAccessToken, exchangeCodeForToken } from "auth"

function App() {
  useTranslation()
  const [subtitle, setSubtitle] = useState(<Translation>{(t) => t("tagline")}</Translation>)
  const searchParams = new URLSearchParams(window.location.search)

  const [accessToken, setAccessToken] = useState<string | null>(loadAccessToken())
  const hasProcessedCode = useRef(false)

  let view

  const onSetSubtitle = (subtitle: any) => {
    setSubtitle(subtitle)
  }

  useEffect(() => {
    const code = searchParams.get("code")
    if (!code) { return }

    // Prevent multiple executions in StrictMode or re-renders
    if (hasProcessedCode.current) {
      return
    }
    hasProcessedCode.current = true

    exchangeCodeForToken(code).then((accessToken) => {
      setAccessToken(accessToken)

      // Remove code from query string
      window.history.replaceState({}, document.title, window.location.pathname)
    })
  })

  if (searchParams.get('spotify_error')) {
    view = <div id="spotifyErrorMessage" className="lead">
      <p><FontAwesomeIcon icon={['fas', 'bolt']} style={{ fontSize: "50px", marginBottom: "20px" }} /></p>
      <p>Oops, Exportify has encountered an unexpected error (5XX) while using the Spotify API. This kind of error is due to a problem on Spotify's side, and although it's rare, unfortunately all we can do is retry later.</p>
      <p style={{ marginTop: "50px" }}>Keep an eye on the <a target="_blank" rel="noreferrer" href="https://status.spotify.dev/">Spotify Web API Status page</a> to see if there are any known problems right now, and then <a rel="noreferrer" href="?">retry</a>.</p>
    </div>
  } else if (accessToken) {
    view = <>
      <PlaylistTable accessToken={accessToken!} onSetSubtitle={onSetSubtitle} />
      <SavedAlbumRow accessToken={accessToken!} />
    </>
  } else {
    view = <Login />
  }

  return (
    <div className="App container">
      <header className="App-header">
        <div className="d-sm-none d-block mb-5" />
        <TopMenu loggedIn={!!accessToken} />
        <h1>
          <FontAwesomeIcon icon={['fab', 'spotify']} color="#84BD00" size="sm" /> <a href={process.env.PUBLIC_URL}>Exportify</a>
        </h1>

        <p id="subtitle" className="lead text-secondary">{subtitle}</p>
      </header>

      {view}
    </div>
  );
}

export default App;

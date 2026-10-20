import React from "react"
import i18n from "i18n/config"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import FileSaver from "file-saver"
import JSZip from "jszip"

import PlaylistTable from "./PlaylistTable"

import "../icons"
import { server } from "../mocks/server"
import { redirectTo } from "../navigation"
import { csvRecords } from "../test/csv"
import { captureBugsnagReports } from "../test/bugsnag"
import { API } from "../test/fixtures/spotify/builders"
import { errorResponse, ghostpoetTracksUrl, handlerCalled, nullAlbumHandlers, nullTrackHandlers, localTrackHandlers, duplicateTrackHandlers, missingPlaylistsHandlers } from "../mocks/handlers"
import grantedToken from "../test/fixtures/spotify/documented/token.json"

vi.mock('@bugsnag/js')

const ghostpoetPlaylist = "Ghostpoet – Peanut Butter Blues and Melancholy Jam"
const ghostpoetFileName = "ghostpoet_–_peanut_butter_blues_and_melancholy_jam.csv"

const likedRequests = [
  'https://api.spotify.com/v1/me',
  'https://api.spotify.com/v1/me/playlists?offset=0&limit=20',
  'https://api.spotify.com/v1/me/tracks',
  'https://api.spotify.com/v1/me/tracks?offset=0&limit=50',
]

const crying = {
  "Track URI": "spotify:track:1GrLfs4TEvAZ86HVzXHchS",
  "Track Name": "Crying",
  "Artist URI(s)": "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz",
  "Artist Name(s)": "Six by Seven",
  "Album URI": "spotify:album:4iwv7b8gDPKztLkKCbWyhi",
  "Album Name": "Best of Six By Seven",
  "Album Artist URI(s)": "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz",
  "Album Artist Name(s)": "Six by Seven",
  "Album Release Date": "2017-02-17",
  "Album Image URL": "https://i.scdn.co/image/ab67616d0000b273f485821b346237acbbca07ea",
  "Disc Number": "1",
  "Track Number": "3",
  "Track Duration (ms)": "198093",
  "Track Preview URL": "https://p.scdn.co/mp3-preview/daf08df57a49c215c8c53dc5fe88dec5461f15c9?cid=9950ac751e34487dbbe027c4fd7f8e99",
  "Explicit": "false",
  "Popularity": "2",
  "ISRC": "UK4UP1300002",
  "Added By": "",
  "Added At": "2020-07-19T09:24:39Z",
}

const ghostpoetTrack = {
  "Artist URI(s)": "spotify:artist:69lEbRQRe29JdyLrewNAvD",
  "Artist Name(s)": "Ghostpoet",
  "Album URI": "spotify:album:6jiLkuSnhzDvzsHJlweoGh",
  "Album Name": "Peanut Butter Blues and Melancholy Jam",
  "Album Artist URI(s)": "spotify:artist:69lEbRQRe29JdyLrewNAvD",
  "Album Artist Name(s)": "Ghostpoet",
  "Album Release Date": "2011",
  "Album Image URL": "https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80",
  "Disc Number": "1",
  "Explicit": "false",
  "Added By": "spotify:user:watsonbox",
  "Added At": "2020-11-03T15:19:04Z",
}

const oneTwos = {
  ...ghostpoetTrack,
  "Track URI": "spotify:track:7ATyvp3TmYBmGW7YuC8DJ3",
  "Track Name": "One Twos / Run Run Run",
  "Track Number": "1",
  "Track Duration (ms)": "241346",
  "Track Preview URL": "https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99",
  "Popularity": "22",
  "ISRC": "GBMEF1100339",
}

const usAgainstWhatever = {
  ...ghostpoetTrack,
  "Track URI": "spotify:track:0FNanBLvmFEDyD75Whjj52",
  "Track Name": "Us Against Whatever Ever",
  "Track Number": "2",
  "Track Duration (ms)": "269346",
  "Track Preview URL": "https://p.scdn.co/mp3-preview/e5e39be10697be8755532d02c52319ffa6d58688?cid=9950ac751e34487dbbe027c4fd7f8e99",
  "Popularity": "36",
  "ISRC": "GBMEF1000270",
}

const localTrack = (name: string, artist: string, durationMs: number) => ({
  "Track URI": `spotify:local:${artist.replace(/ /g, '+')}:${name.replace(/ /g, '+')}:${name.replace(/ /g, '+')}:${durationMs / 1000}`,
  "Track Name": name,
  "Artist URI(s)": "",
  "Artist Name(s)": artist,
  "Album URI": "",
  "Album Name": name,
  "Album Artist URI(s)": "",
  "Album Artist Name(s)": "",
  "Album Release Date": "",
  "Album Image URL": "",
  "Disc Number": "0",
  "Track Number": "0",
  "Track Duration (ms)": String(durationMs),
  "Track Preview URL": "",
  "Explicit": "false",
  "Popularity": "0",
  "ISRC": "",
  "Added By": "spotify:user:u8ins5esg43wtxk4h66o5d1nb",
  "Added At": "2021-02-24T06:12:40Z",
})

const requestedUrls = () => handlerCalled.mock.calls.map(([url]) => url)

const renderTable = (config = {}) =>
  render(<PlaylistTable config={config} onSetSubtitle={vi.fn()} />)

async function savedFile() {
  const saveAs = vi.mocked(FileSaver.saveAs)
  await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1))
  return saveAs.mock.calls[0]
}

// Exports one playlist from its row and returns the saved CSV
async function exportPlaylist(playlistName: string, config = {}) {
  renderTable(config)

  const row = await screen.findByRole('row', { name: name => name.includes(playlistName) })
  const button = within(row).getByRole('button', { name: 'Export' })
  await userEvent.click(button)
  expect(button).toBeDisabled()

  const [blob, fileName, options] = await savedFile()
  await waitFor(() => expect(button).toBeEnabled())

  expect(options).toEqual({ autoBom: false })
  expect((blob as Blob).type).toBe('text/csv;charset=utf-8')

  return { fileName, records: csvRecords(await (blob as Blob).text()) }
}

// Clicks the zip export button and returns each CSV in the saved archive
async function exportZip(buttonName: RegExp) {
  await userEvent.click(await screen.findByRole('button', { name: buttonName }))

  const [blob, fileName] = await savedFile()
  expect(fileName).toBe('spotify_playlists.zip')

  const zip = await JSZip.loadAsync(blob as Blob)
  const files = await Promise.all(Object.values(zip.files).map(async file => [file.name, csvRecords(await file.async('string'))]))
  return Object.fromEntries(files)
}

beforeEach(() => {
  window.history.replaceState(null, '', '/exportify')
  localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")
  vi.spyOn(FileSaver, 'saveAs').mockImplementation(() => {})
})

// Use a snapshot test to ensure exact component rendering
test("playlist loading", async () => {
  const { asFragment } = renderTable()

  expect(await screen.findByText(/Export All/)).toBeInTheDocument()

  expect(asFragment()).toMatchSnapshot();
})

test("redirecting when access token is invalid", async () => {
  localStorage.setItem("access_token", "INVALID_ACCESS_TOKEN")
  render(<PlaylistTable onSetSubtitle={vi.fn()} />)

  await waitFor(() => {
    expect(redirectTo).toHaveBeenCalledWith("/exportify")
  })
})

describe("single playlist exporting", () => {
  test("standard case exports successfully", async () => {
    const { fileName, records } = await exportPlaylist("Liked")

    expect(fileName).toBe('liked.csv')
    expect(records).toEqual([crying])
    expect(requestedUrls()).toEqual(likedRequests) // Ensure API call order and no duplicates
  })

  test("including additional artist data", async () => {
    const { records } = await exportPlaylist("Liked", { includeArtistsData: true })

    expect(records).toEqual([{ ...crying, "Artist Genres": "nottingham indie" }])
    expect(requestedUrls()).toEqual([...likedRequests, 'https://api.spotify.com/v1/artists?ids=4TXdHyuAOl3rAOFmZ6MeKz'])
  })

  test("including additional audio features data", async () => {
    const { records } = await exportPlaylist("Liked", { includeAudioFeaturesData: true })

    expect(records).toEqual([{
      ...crying,
      "Danceability": "0.416",
      "Energy": "0.971",
      "Key": "0",
      "Loudness": "-5.55",
      "Mode": "1",
      "Speechiness": "0.0575",
      "Acousticness": "0.00104",
      "Instrumentalness": "0.0391",
      "Liveness": "0.44",
      "Valence": "0.19",
      "Tempo": "131.988",
      "Time Signature": "4",
    }])
    expect(requestedUrls()).toEqual([...likedRequests, 'https://api.spotify.com/v1/audio-features?ids=1GrLfs4TEvAZ86HVzXHchS'])
  })

  test("including additional album data", async () => {
    const { records } = await exportPlaylist("Liked", { includeAlbumData: true })

    expect(records).toEqual([{
      ...crying,
      "Album Genres": "something, something else",
      "Label": "Beggars Banquet",
      "Copyrights": "C 2016 Beggars Banquet Records Ltd., P 2016 Beggars Banquet Records Ltd.",
    }])
    expect(requestedUrls()).toEqual([...likedRequests, 'https://api.spotify.com/v1/albums?ids=4iwv7b8gDPKztLkKCbWyhi'])
  })

  test("tracks without album data omit it", async () => {
    server.use(...nullAlbumHandlers)

    const { records } = await exportPlaylist("Liked", { includeAlbumData: true })

    expect(records).toEqual([{ ...crying, "Album Genres": "", "Label": "", "Copyrights": "" }])
  })

  test("playlist with null track skips null track", async () => {
    server.use(...nullTrackHandlers)

    const { fileName, records } = await exportPlaylist(ghostpoetPlaylist)

    expect(fileName).toBe(ghostpoetFileName)
    expect(records).toEqual([])
  })

  test("playlist with local tracks includes them", async () => {
    server.use(...localTrackHandlers)

    const { records } = await exportPlaylist(ghostpoetPlaylist)

    expect(records).toEqual([
      localTrack("Heart of Stone", "The Waymores", 128000),
      localTrack("Heard It Through The Red Wine", "Charlie Marie", 227000),
    ])
  })

  test("playlist with duplicate tracks includes them", async () => {
    server.use(...duplicateTrackHandlers)

    const { records } = await exportPlaylist(ghostpoetPlaylist)

    expect(records).toEqual([oneTwos, { ...oneTwos, "Added At": "2020-11-20T15:19:04Z" }])
  })
})

describe("searching playlists", () => {
  test("simple successful search", async () => {
    renderTable()

    expect(await screen.findByRole('searchbox')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox'), 'Ghost{enter}')

    // Liked tracks is gone but Ghostpoet still matches
    await waitFor(() => {
      expect(screen.queryAllByRole('row')).toHaveLength(2)
    })
    expect(screen.queryByText("Liked")).not.toBeInTheDocument()
    expect(screen.getByText(ghostpoetPlaylist)).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox'), '{Escape}')

    // Both liked tracks and Ghostpoet are present
    await waitFor(() => {
      expect(screen.queryAllByRole('row')).toHaveLength(3)
    })
    expect(screen.getByText("Liked")).toBeInTheDocument()
    expect(screen.getByText(ghostpoetPlaylist)).toBeInTheDocument()
  })

  test("search with no results", async () => {
    renderTable()

    expect(await screen.findByRole('searchbox')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox'), 'test{enter}')

    // Both liked tracks and Ghostpoet are missing
    await waitFor(() => {
      expect(screen.queryAllByRole('row')).toHaveLength(1)
    })
    expect(screen.queryByText("Liked")).not.toBeInTheDocument()
    expect(screen.queryByText(ghostpoetPlaylist)).not.toBeInTheDocument()
  })
})

describe("missing playlists", () => {
  beforeEach(() => {
    server.use(...missingPlaylistsHandlers)
  })

  test("playlist loading", async () => {
    renderTable()

    expect(await screen.findByText(/This playlist is not supported/)).toBeInTheDocument() // FIXME
    expect(screen.getAllByRole('row')).toHaveLength(4)
  })

  test("exporting of all playlists", async () => {
    renderTable()

    expect(Object.keys(await exportZip(/Export All/))).toEqual(['liked.csv', ghostpoetFileName])
  })

  // FIXME: Repeated searches producing extra request
  test("searching", async () => {
    renderTable()

    expect(await screen.findByRole('searchbox')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox'), 'Ghost{enter}')

    await waitFor(() => {
      expect(screen.queryAllByRole('row')).toHaveLength(2)
    })
  })
})

test("exporting of all playlists", async () => {
  renderTable()

  expect(await exportZip(/Export All/)).toEqual({
    'liked.csv': [crying],
    [ghostpoetFileName]: [oneTwos, usAgainstWhatever],
  })
})

test("exporting of search results", async () => {
  renderTable()

  await userEvent.type(await screen.findByRole('searchbox'), 'Ghost{enter}')

  expect(await exportZip(/Export Results/)).toEqual({
    [ghostpoetFileName]: [oneTwos, usAgainstWhatever],
  })
})

describe("when Spotify can't be reached or refuses a request", () => {
  const failWith = (url: string, respond: () => Response) => server.use(http.get(url, respond))
  const networkError = () => HttpResponse.error()
  const serviceUnavailable = errorResponse(503)
  const countryUnavailable = errorResponse(403, "Spotify is unavailable in this country")

  // Lets retry backoff run without waiting for it
  const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const runRetries = () => act(() => vi.runAllTimersAsync())

  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }) })
  afterEach(() => {
    vi.useRealTimers()
    window.dispatchEvent(new Event("pageshow"))
  })

  test("a row's export shows a message and can be tried again once retries run out", async () => {
    const reports = captureBugsnagReports()
    renderTable()
    const row = await screen.findByRole('row', { name: name => name.includes(ghostpoetPlaylist) })
    failWith(ghostpoetTracksUrl, networkError)

    const button = within(row).getByRole('button', { name: 'Export' })
    await user().click(button)
    await runRetries()

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't reach Spotify. Check your connection, and that no browser extension is blocking Spotify, then try again.")
    expect(button).toBeEnabled()
    expect(reports).toHaveLength(1)
    expect(reports[0].error.message).toBe("Network Error")
  })

  test("Export All shows a message and can be tried again once 5xx retries run out", async () => {
    renderTable()
    const button = await screen.findByRole('button', { name: /Export All/ })
    failWith(ghostpoetTracksUrl, serviceUnavailable)

    await user().click(button)
    await runRetries()

    expect(await screen.findByRole('alert')).toHaveTextContent("Spotify isn't working properly right now (error 503). Please try again later.")
    expect(button).toBeEnabled()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(redirectTo).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Check the Spotify Web API status page for known problems' })).toHaveAttribute('href', 'https://status.spotify.dev/')
  })

  test("a refused request shows Spotify's reason straight away", async () => {
    failWith(`${API}/me`, countryUnavailable)

    renderTable()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("Spotify refused the request (error 403).")
    expect(alert).toHaveTextContent("Spotify is unavailable in this country")
    expect(screen.queryByTestId('playlistTableSpinner')).not.toBeInTheDocument()
  })

  test("the message can be dismissed", async () => {
    failWith(`${API}/me`, countryUnavailable)
    renderTable()
    await screen.findByRole('alert')

    await user().click(screen.getByRole('button', { name: 'Close alert' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test("the message falls back to English in other languages", async () => {
    await i18n.changeLanguage("fr")
    failWith(`${API}/me`, countryUnavailable)

    renderTable()

    expect(await screen.findByRole('alert')).toHaveTextContent("Spotify refused the request (error 403).")
    await i18n.changeLanguage("en")
  })

  test("nothing is shown or reported for requests aborted by leaving the page", async () => {
    const reports = captureBugsnagReports()
    failWith(`${API}/me`, networkError)
    window.dispatchEvent(new Event("pagehide"))

    renderTable()
    await runRetries()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(reports).toEqual([])
  })
})

describe("when the session expires", () => {
  const playlistsUrl = `${API}/me/playlists`
  const tokenRequests = vi.fn()
  const refreshTokenWith = (respond: () => Response) =>
    server.use(http.post("https://accounts.spotify.com/api/token", () => { tokenRequests(); return respond() }))

  // Leaves one playlist unloaded, so that searching has to request it
  async function openTableAwaitingSearch() {
    server.use(...missingPlaylistsHandlers)
    renderTable()
    return await screen.findByRole('searchbox')
  }

  test("an export that hits an expired token refreshes it and finishes", async () => {
    localStorage.setItem("refresh_token", "TEST_REFRESH_TOKEN")
    refreshTokenWith(() => HttpResponse.json(grantedToken.body))
    server.use(http.get(ghostpoetTracksUrl, errorResponse(401), { once: true }))

    const { records } = await exportPlaylist(ghostpoetPlaylist)

    expect(records).toEqual([oneTwos, usAgainstWhatever])
    expect(tokenRequests).toHaveBeenCalledTimes(1)
    expect(redirectTo).not.toHaveBeenCalled()
  })

  test("a search returns to login, without a message or report, once the session can't be renewed", async () => {
    const reports = captureBugsnagReports()
    const searchbox = await openTableAwaitingSearch()
    server.use(http.get(playlistsUrl, errorResponse(401)))

    await userEvent.type(searchbox, 'Ghost{enter}')

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith('/exportify'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(reports).toEqual([])
    expect(localStorage.getItem("access_token")).toBeNull()
  })

  test("a search shows the message when Spotify refuses it", async () => {
    const searchbox = await openTableAwaitingSearch()
    server.use(http.get(playlistsUrl, errorResponse(403, "Spotify is unavailable in this country")))

    await userEvent.type(searchbox, 'Ghost{enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent("Spotify refused the request (error 403).")
    expect(redirectTo).not.toHaveBeenCalled()
  })

  test("Export All returns to login once Spotify refuses to renew the session", async () => {
    const reports = captureBugsnagReports()
    localStorage.setItem("refresh_token", "TEST_REFRESH_TOKEN")
    refreshTokenWith(() => HttpResponse.json({ error: "invalid_grant", error_description: "Refresh token revoked" }, { status: 400 }))
    renderTable()
    const button = await screen.findByRole('button', { name: /Export All/ })
    server.use(http.get(ghostpoetTracksUrl, errorResponse(401)))

    await userEvent.click(button)

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith('/exportify'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(reports.map(report => report.groupingHash)).toEqual(["Token refresh: Spotify: invalid_grant (Refresh token revoked)"])
  })
})

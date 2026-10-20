import "i18n/config"
import { server } from "../mocks/server"
import { pagedGet, spotifyGet } from "../mocks/handlers"
import { csvHeaders, csvRecords } from "../test/csv"
import { API, buildArtist, buildPlaylist, buildPlaylistItem, buildTrack, buildUser } from "../test/fixtures/spotify/builders"
import PlaylistExporter from "./PlaylistExporter"

const baseHeaders = [
  "Track URI", "Track Name", "Artist URI(s)", "Artist Name(s)", "Album URI", "Album Name", "Album Artist URI(s)",
  "Album Artist Name(s)", "Album Release Date", "Album Image URL", "Disc Number", "Track Number", "Track Duration (ms)",
  "Track Preview URL", "Explicit", "Popularity", "ISRC", "Added By", "Added At",
]

const playlist = buildPlaylist({ id: 'p1', name: 'Mixtape', tracks: { total: 1 } })

const serveTracks = (...tracks: object[]) =>
  server.use(pagedGet(`${API}/playlists/p1/tracks`, tracks.map(track => buildPlaylistItem({ track, added_by: buildUser({ id: 'dj' }), added_at: '2024-01-02T03:04:05Z' }))))

beforeEach(() => {
  localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")
})

describe("PlaylistExporter", () => {
  test("puts base track columns before the item columns", async () => {
    serveTracks(buildTrack())

    const csv = await new PlaylistExporter(playlist, {}).csvData()

    expect(csvHeaders(csv)).toEqual(baseHeaders)
  })

  test("appends artist, audio feature and album columns in that order", async () => {
    serveTracks(buildTrack())
    server.use(
      spotifyGet(`${API}/artists`, () => ({ artists: [] })),
      spotifyGet(`${API}/audio-features`, () => ({ audio_features: [] })),
      spotifyGet(`${API}/albums`, () => ({ albums: [] })),
    )
    const config = { includeArtistsData: true, includeAudioFeaturesData: true, includeAlbumData: true }

    const csv = await new PlaylistExporter(playlist, config).csvData()

    expect(csvHeaders(csv).slice(baseHeaders.length)).toEqual([
      "Artist Genres",
      "Danceability", "Energy", "Key", "Loudness", "Mode", "Speechiness", "Acousticness", "Instrumentalness", "Liveness",
      "Valence", "Tempo", "Time Signature",
      "Album Genres", "Label", "Copyrights",
    ])
  })

  test("quotes every field so commas, quotes and newlines survive", async () => {
    serveTracks(buildTrack({ id: 't1', name: 'Say "Hi",\nthen leave', artists: [buildArtist({ name: 'A, B' })] }))

    const csv = await new PlaylistExporter(playlist, {}).csvData()

    expect(csvRecords(csv)).toEqual([expect.objectContaining({
      "Track URI": "spotify:track:t1",
      "Track Name": 'Say "Hi",\nthen leave',
      "Artist Name(s)": "A\\, B",
      "Added By": "spotify:user:dj",
      "Added At": "2024-01-02T03:04:05Z",
    })])
  })

  test.each([
    ['Mixtape', 'mixtape'],
    ['My: Playlist / 2024?', 'my_playlist_2024_'],
    ['tabs\tand "quotes"', 'tabs_and_quotes_'],
    ['Déjà Vu', 'déjà_vu'],
  ])("names the file for %j as %j", (name, fileName) => {
    const exporter = new PlaylistExporter({ ...playlist, name }, {})

    expect(exporter.fileName(false)).toBe(fileName)
    expect(exporter.fileName()).toBe(`${fileName}.csv`)
  })
})

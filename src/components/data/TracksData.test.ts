import "i18n/config"
import { server } from "../../mocks/server"
import { handlerCalled, pagedGet, spotifyGet } from "../../mocks/handlers"
import {
  API, buildAlbum, buildArtist, buildAudioFeatures, buildFullAlbum, buildFullArtist, buildLocalTrack, buildPlaylist,
  buildPlaylistItem, buildSavedTrack, buildTrack,
} from "../../test/fixtures/spotify/builders"
import TracksBaseData from "./TracksBaseData"
import TracksArtistsData from "./TracksArtistsData"
import TracksAudioFeaturesData from "./TracksAudioFeaturesData"
import TracksAlbumData from "./TracksAlbumData"

const requestedUrls = () => handlerCalled.mock.calls.map(([url]) => url)
const requestedIds = (request: Request) => new URL(request.url).searchParams.get('ids')!.split(',')
const range = (count: number) => Array.from({ length: count }, (_, i) => i)

beforeEach(() => {
  localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")
})

describe("TracksBaseData", () => {
  test("loads every page of a playlist 100 items at a time, skipping null tracks", async () => {
    const playlist = buildPlaylist({ id: 'p1', tracks: { total: 150 } })
    const items = range(150).map(i => buildPlaylistItem({ track: i === 7 ? null : buildTrack({ id: `t${i}` }) }))
    server.use(pagedGet(`${API}/playlists/p1/tracks`, items))

    const trackItems = await new TracksBaseData(playlist).trackItems()

    expect(trackItems.map(item => item.track.id)).toEqual(range(150).filter(i => i !== 7).map(i => `t${i}`))
    expect(requestedUrls()).toEqual([
      `${API}/playlists/p1/tracks?offset=0&limit=100`,
      `${API}/playlists/p1/tracks?offset=100&limit=100`,
    ])
  })

  test("loads liked tracks 50 at a time", async () => {
    const likedPlaylist = { id: 'liked', tracks: { href: `${API}/me/tracks`, limit: 20, total: 60 } }
    server.use(pagedGet(`${API}/me/tracks`, range(60).map(i => buildSavedTrack({ track: buildTrack({ id: `t${i}` }) }))))

    const trackItems = await new TracksBaseData(likedPlaylist).trackItems()

    expect(trackItems).toHaveLength(60)
    expect(requestedUrls()).toEqual([`${API}/me/tracks?offset=0&limit=50`, `${API}/me/tracks?offset=50&limit=50`])
  })

  test("only requests the playlist once across trackItems and data", async () => {
    server.use(pagedGet(`${API}/playlists/p1/tracks`, [buildPlaylistItem()]))
    const tracksData = new TracksBaseData(buildPlaylist({ id: 'p1', tracks: { total: 1 } }))

    await tracksData.trackItems()
    await tracksData.data()

    expect(requestedUrls()).toHaveLength(1)
  })

  test("escapes commas in artist names and blanks missing values", async () => {
    const track = buildTrack({
      id: 't1',
      name: 'September',
      artists: [buildArtist({ id: 'a1', name: 'Earth, Wind & Fire' }), buildArtist({ id: 'a2', name: 'Guest' })],
      album: buildAlbum({ id: 'al1', name: 'Hits', artists: [buildArtist({ id: 'a1', name: 'Earth, Wind & Fire' })], images: [], release_date: null }),
      disc_number: 1,
      track_number: 4,
      duration_ms: 215000,
      preview_url: null,
      explicit: true,
      popularity: 70,
      external_ids: {},
    })
    server.use(pagedGet(`${API}/playlists/p1/tracks`, [buildPlaylistItem({ track })]))

    const data = await new TracksBaseData(buildPlaylist({ id: 'p1', tracks: { total: 1 } })).data()

    expect(data.get('spotify:track:t1')).toEqual([
      'spotify:track:t1', 'September', 'spotify:artist:a1, spotify:artist:a2', 'Earth\\, Wind & Fire, Guest',
      'spotify:album:al1', 'Hits', 'spotify:artist:a1', 'Earth\\, Wind & Fire', '', '',
      1, 4, 215000, '', true, 70, '',
    ])
  })
})

describe("TracksArtistsData", () => {
  beforeEach(() => {
    server.use(spotifyGet(`${API}/artists`, request => ({
      artists: requestedIds(request).filter(id => id !== 'unknown').map(id => buildFullArtist({ id, genres: [`${id} rock`, `${id} pop`] })),
    })))
  })

  test("fetches each distinct artist once, 50 per request", async () => {
    const shared = buildArtist({ id: 'shared' })
    const tracks = range(60).map(i => buildTrack({ id: `t${i}`, artists: [shared, buildArtist({ id: `a${i}` })] }))

    await new TracksArtistsData(tracks).data()

    expect(requestedUrls().map(url => new URL(url).searchParams.get('ids')!.split(',').length)).toEqual([50, 11])
    expect(new Set(requestedUrls().flatMap(url => new URL(url).searchParams.get('ids')!.split(','))).size).toBe(61)
  })

  test("joins the genres of every artist on a track, skipping unknown and local artists", async () => {
    const tracks = [
      buildTrack({ id: 't1', artists: [buildArtist({ id: 'a1' }), buildArtist({ id: 'unknown' }), buildArtist({ id: 'a2' })] }),
      buildLocalTrack({ name: 'Demo', artist: 'Me', album: 'Tapes', duration_ms: 1000 }),
    ]

    const data = await new TracksArtistsData(tracks).data()

    expect(data.get('spotify:track:t1')).toEqual(['a1 rock,a1 pop,a2 rock,a2 pop'])
    expect(data.get(tracks[1].uri)).toEqual([''])
  })
})

describe("TracksAudioFeaturesData", () => {
  beforeEach(() => {
    server.use(spotifyGet(`${API}/audio-features`, request => ({
      audio_features: requestedIds(request).map(id => id === 'episode' ? null : buildAudioFeatures({ id, tempo: 120 })),
    })))
  })

  test("requests 100 tracks at a time", async () => {
    await new TracksAudioFeaturesData(range(101).map(i => buildTrack({ id: `t${i}` }))).data()

    expect(requestedUrls().map(url => new URL(url).searchParams.get('ids')!.split(',').length)).toEqual([100, 1])
  })

  test("fills empty fields for tracks without audio features", async () => {
    const tracks = [buildTrack({ id: 't1' }), buildTrack({ id: 'episode' })]

    const data = await new TracksAudioFeaturesData(tracks).data()

    expect(data.get('spotify:track:t1')).toHaveLength(12)
    expect(data.get('spotify:track:t1')![10]).toBe(120)
    expect(data.get('spotify:track:episode')).toEqual(Array(12).fill(''))
  })
})

describe("TracksAlbumData", () => {
  beforeEach(() => {
    server.use(spotifyGet(`${API}/albums`, request => ({
      albums: requestedIds(request).map(id => id === 'gone' ? null : buildFullAlbum({
        id,
        genres: ['indie', 'rock'],
        label: `${id} Records`,
        copyrights: [{ text: '2020 Label', type: 'C' }, { text: '2020 Label', type: 'P' }],
      })),
    })))
  })

  test("fetches each distinct album once, 20 per request", async () => {
    const tracks = range(25).flatMap(i => [buildTrack({ id: `t${i}`, album: buildAlbum({ id: `al${i}` }) }), buildTrack({ id: `u${i}`, album: buildAlbum({ id: `al${i}` }) })])

    await new TracksAlbumData(tracks).data()

    expect(requestedUrls().map(url => new URL(url).searchParams.get('ids')!.split(',').length)).toEqual([20, 5])
  })

  test("formats genres, label and copyrights, blanking missing and local albums", async () => {
    const local = buildLocalTrack({ name: 'Demo', artist: 'Me', album: 'Tapes', duration_ms: 1000 })
    const tracks = [buildTrack({ id: 't1', album: buildAlbum({ id: 'al1' }) }), buildTrack({ id: 't2', album: buildAlbum({ id: 'gone' }) }), local]

    const data = await new TracksAlbumData(tracks).data()

    expect(data.get('spotify:track:t1')).toEqual(['indie, rock', 'al1 Records', 'C 2020 Label, P 2020 Label'])
    expect(data.get('spotify:track:t2')).toEqual(['', '', ''])
    expect(data.get(local.uri)).toEqual(['', '', ''])
  })
})

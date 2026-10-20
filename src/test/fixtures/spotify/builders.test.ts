import fs from 'fs'
import path from 'path'
import {
  API, apiError, buildAlbum, buildArtist, buildAudioFeatures, buildFullAlbum, buildFullArtist, buildLocalTrack, buildMe,
  buildPage, buildPlaylist, buildPlaylistItem, buildSavedAlbum, buildSavedTrack, buildTrack, buildUser, pageAt, paginate,
} from './builders'
import me from './live/me.json'
import savedTracks from './live/me-tracks.json'
import savedAlbums from './live/me-albums-limit-50.json'
import playlists from './live/users-exportifytestuser-playlists-offset-0-limit-20.json'
import playlistTracks from './live/playlists-fakeplaylist0000000001-tracks-offset-0-limit-100.json'
import artists from './live/artists-1.json'
import albums from './live/albums-1.json'
import audioFeatures from './live/audio-features-1.json'
import { Paging } from '../../../spotify'
import page1 from './live/playlists-37i9dQZF1DWYBF1dYDPlHw-tracks-offset-0-limit-100.json'
import page2 from './live/playlists-37i9dQZF1DWYBF1dYDPlHw-tracks-offset-100-limit-100.json'
import page3 from './live/playlists-37i9dQZF1DWYBF1dYDPlHw-tracks-offset-200-limit-100.json'
import error401 from './documented/error-401.json'
import error429 from './documented/error-429.json'
import error503 from './documented/error-503.json'

const keys = (value: object) => Object.keys(value).sort()
const withoutLocale = (url: string | null) => url && url.replace(/&locale=[^&]*/, '')
const pageFields = ({ items, ...page }: Paging<unknown>) => ({
  ...page, href: withoutLocale(page.href), next: withoutLocale(page.next), previous: withoutLocale(page.previous),
})

describe('entity builders', () => {
  it('build the live /me response by default', () => {
    expect(buildMe()).toEqual(me.body)
  })

  it('derive links from the id', () => {
    expect(buildMe({ id: 'someone', display_name: 'Someone' })).toMatchObject({
      display_name: 'Someone',
      external_urls: { spotify: 'https://open.spotify.com/user/someone' },
      href: `${API}/users/someone`,
      uri: 'spotify:user:someone',
    })

    expect(buildTrack({ id: 'track1' })).toMatchObject({
      external_urls: { spotify: 'https://open.spotify.com/track/track1' },
      href: `${API}/tracks/track1`,
      id: 'track1',
      uri: 'spotify:track:track1',
    })
  })

  it('build users shaped like a live playlist owner', () => {
    expect(buildUser()).toEqual(playlists.body.items[2].owner)
    expect(buildUser({ id: 'someone' })).toMatchObject({ id: 'someone', display_name: 'someone' })
  })

  it('build artists and albums shaped like the live ones', () => {
    const liveTrack = savedTracks.body.items[0].track

    expect(keys(buildArtist())).toEqual(keys(liveTrack.artists[0]))
    expect(keys(buildAlbum())).toEqual(keys(liveTrack.album))
    expect(keys(buildFullArtist())).toEqual(keys(artists.body.artists[0]))
    expect(keys(buildFullAlbum())).toEqual(keys(albums.body.albums[0]))
    expect(buildFullAlbum({ id: 'album1' }).tracks).toMatchObject({ href: `${API}/albums/album1/tracks?offset=0&limit=50` })
  })

  it('build tracks shaped like a live saved track', () => {
    const liveItem = savedTracks.body.items[0]

    expect(keys(buildTrack())).toEqual(keys(liveItem.track))
    expect(keys(buildSavedTrack())).toEqual(keys(liveItem))
    expect(buildSavedTrack({ track: buildTrack({ name: 'Song' }), added_at: '2020-01-01T00:00:00Z' }))
      .toMatchObject({ added_at: '2020-01-01T00:00:00Z', track: { name: 'Song' } })
  })

  it('build saved albums shaped like a live saved album', () => {
    const liveItem = savedAlbums.body.items[0]

    expect(keys(buildSavedAlbum())).toEqual(keys(liveItem))
    expect(keys(buildSavedAlbum().album)).toEqual(keys(liveItem.album))
    expect(buildSavedAlbum({ album: buildFullAlbum({ name: 'Record' }), added_at: '2020-01-01T00:00:00Z' }))
      .toMatchObject({ added_at: '2020-01-01T00:00:00Z', album: { name: 'Record' } })
  })

  it('build playlist items shaped like a live playlist item', () => {
    const liveItem = playlistTracks.body.items[0]
    const item = buildPlaylistItem({ track: buildTrack({ name: 'Song' }), added_by: buildUser({ id: 'someone' }) })

    expect(keys(item)).toEqual(keys(liveItem))
    expect(keys(item.track!)).toEqual(keys(liveItem.track))
    expect(item.item).toEqual(item.track)
    expect(item.track!.name).toBe('Song')
    expect(item.added_by).toEqual({
      external_urls: { spotify: 'https://open.spotify.com/user/someone' },
      href: `${API}/users/someone`,
      id: 'someone',
      type: 'user',
      uri: 'spotify:user:someone',
    })
  })

  it('build playlist items with a null track', () => {
    expect(buildPlaylistItem({ track: null })).toMatchObject({ track: null, item: null })
  })

  it('build local tracks', () => {
    const item = buildPlaylistItem({
      track: buildLocalTrack({ name: 'Heart of Stone', artist: 'The Waymores', album: 'Heart of Stone', duration_ms: 128000 }),
    })

    expect(item.is_local).toBe(true)
    expect(item.track).toMatchObject({
      album: { name: 'Heart of Stone', uri: null },
      artists: [{ name: 'The Waymores', uri: null }],
      duration_ms: 128000,
      id: null,
      is_local: true,
      name: 'Heart of Stone',
      uri: 'spotify:local:The+Waymores:Heart+of+Stone:Heart+of+Stone:128',
    })
  })

  it('build playlists shaped like a live playlist', () => {
    const playlist = buildPlaylist({ id: 'playlist1', name: 'Mix', tracks: { total: 10 } })

    expect(keys(playlist)).toEqual(keys(playlists.body.items[2]))
    expect(playlist).toMatchObject({
      name: 'Mix',
      tracks: { href: `${API}/playlists/playlist1/tracks`, total: 10 },
      items: { href: `${API}/playlists/playlist1/items`, total: 10 },
      uri: 'spotify:playlist:playlist1',
    })
  })

  it('build audio features shaped like the live ones', () => {
    expect(keys(buildAudioFeatures())).toEqual(keys(audioFeatures.body.audio_features[0]))
    expect(buildAudioFeatures({ id: 'track1', tempo: 120 })).toMatchObject({
      tempo: 120,
      track_href: `${API}/tracks/track1`,
      analysis_url: `${API}/audio-analysis/track1`,
      uri: 'spotify:track:track1',
    })
  })
})

describe('pagination', () => {
  const url = `${API}/playlists/37i9dQZF1DWYBF1dYDPlHw/tracks`

  it('builds pages matching live multi-page responses', () => {
    for (const page of [page1, page2, page3]) {
      const built = buildPage(page.body.items, { url, offset: page.body.offset, limit: 100, total: 300 })

      expect(pageFields(built)).toEqual(pageFields(page.body))
      expect(built.items).toBe(page.body.items)
    }
  })

  it('defaults to a single page holding every item', () => {
    expect(buildPage(['a', 'b'], { url })).toEqual({
      href: `${url}?offset=0&limit=20`, items: ['a', 'b'], limit: 20, next: null, offset: 0, previous: null, total: 2,
    })
  })

  it('splits items into linked pages', () => {
    const pages = paginate(['a', 'b', 'c', 'd', 'e'], { url, limit: 2 })

    expect(pages.map(page => page.items)).toEqual([['a', 'b'], ['c', 'd'], ['e']])
    expect(pages.map(page => [page.offset, page.total])).toEqual([[0, 5], [2, 5], [4, 5]])
    expect(pages.map(page => page.next)).toEqual([`${url}?offset=2&limit=2`, `${url}?offset=4&limit=2`, null])
    expect(pages.map(page => page.previous)).toEqual([null, `${url}?offset=0&limit=2`, `${url}?offset=2&limit=2`])
  })

  it('returns one empty page for no items', () => {
    expect(paginate([], { url, limit: 2 })).toEqual([buildPage([], { url, limit: 2 })])
  })

  it('serves the page a request URL asks for', () => {
    const items = ['a', 'b', 'c', 'd', 'e']

    expect(pageAt(items, `${url}?offset=2&limit=2`)).toEqual(paginate(items, { url, limit: 2 })[1])
    expect(pageAt(items, url)).toEqual(buildPage(items, { url, limit: 20 }))
    expect(pageAt(items, url, 3).items).toEqual(['a', 'b', 'c'])
  })
})

describe('apiError', () => {
  it('returns the documented error responses', () => {
    for (const fixture of [error401, error429, error503]) {
      const { method, url, ...response } = fixture
      expect(apiError(fixture.status)).toEqual(response)
    }
  })

  it('builds other errors in the same shape', () => {
    expect(apiError(500, 'Invalid request')).toEqual({
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: { error: { status: 500, message: 'Invalid request' } },
    })
  })
})

it('builders depend on neither MSW nor the test runner', () => {
  const source = fs.readFileSync(path.join(__dirname, 'builders.ts'), 'utf8')

  expect(source).not.toMatch(/from ['"](msw|@?jest|vitest)/)
  expect(source).not.toMatch(/\bjest\.|\bvi\./)
})

import me from './live/me.json'
import savedTracks from './live/me-tracks.json'
import playlists from './live/users-exportifytestuser-playlists-offset-0-limit-20.json'
import playlistTracks from './live/playlists-fakeplaylist0000000001-tracks-offset-0-limit-100.json'
import artists from './live/artists-1.json'
import albums from './live/albums-1.json'
import audioFeatures from './live/audio-features-1.json'
import error401 from './documented/error-401.json'
import error429 from './documented/error-429.json'
import error503 from './documented/error-503.json'

type Json = Record<string, any>

export const API = 'https://api.spotify.com/v1'

const savedTrackTemplate = savedTracks.body.items[0]
const playlistTemplate = playlists.body.items.find(playlist => playlist.owner.id === me.body.id)!
const playlistItemTemplate = playlistTracks.body.items[0]
const documentedErrors = [error401, error429, error503]

const links = (type: string) => (id: string) => ({
  external_urls: { spotify: `https://open.spotify.com/${type}/${id}` },
  href: `${API}/${type}s/${id}`,
  uri: `spotify:${type}:${id}`,
})

const build = (template: Json, overrides: Json, derive: (id: string) => Json): Json =>
  ({ ...template, ...derive(overrides.id ?? template.id), ...overrides })

// Keeps exactly the template's keys, so a value takes the live shape of the context it's used in
const conform = (template: Json, value: Json) =>
  Object.fromEntries(Object.keys(template).map(key => [key, key in value ? value[key] : template[key]]))

export const buildMe = (overrides: Json = {}) => build(me.body, overrides, links('user'))

export const buildUser = (overrides: Json = {}) =>
  build({ ...playlistTemplate.owner, display_name: overrides.id ?? playlistTemplate.owner.display_name }, overrides, links('user'))

export const buildArtist = (overrides: Json = {}) => build(savedTrackTemplate.track.artists[0], overrides, links('artist'))

export const buildFullArtist = (overrides: Json = {}) => build(artists.body.artists[0], overrides, links('artist'))

export const buildAlbum = (overrides: Json = {}) => build(savedTrackTemplate.track.album, overrides, links('album'))

export const buildFullAlbum = (overrides: Json = {}) => build(albums.body.albums[0], overrides, id => ({
  ...links('album')(id),
  tracks: buildPage([], { url: `${API}/albums/${id}/tracks`, limit: 50 }),
}))

export const buildTrack = (overrides: Json = {}) => build(savedTrackTemplate.track, overrides, links('track'))

const plusEncode = (value: string) => encodeURIComponent(value).replace(/%20/g, '+')

export function buildLocalTrack({ name, artist, album, duration_ms }: { name: string; artist: string; album: string; duration_ms: number }) {
  return {
    album: {
      album_type: null, artists: [], available_markets: [], external_urls: {}, href: null, id: null, images: [],
      name: album, release_date: null, release_date_precision: null, type: 'album', uri: null,
    },
    artists: [{ external_urls: {}, href: null, id: null, name: artist, type: 'artist', uri: null }],
    available_markets: [],
    disc_number: 0,
    duration_ms,
    explicit: false,
    external_ids: {},
    external_urls: {},
    href: null,
    id: null,
    is_local: true,
    name,
    popularity: 0,
    preview_url: null,
    track_number: 0,
    type: 'track',
    uri: ['spotify:local', ...[artist, album, name].map(plusEncode), Math.round(duration_ms / 1000)].join(':'),
  }
}

export const buildSavedTrack = (overrides: Json = {}) =>
  ({ added_at: savedTrackTemplate.added_at, track: buildTrack(), ...overrides })

export function buildPlaylistItem({ track = buildTrack(), added_by = buildUser(), ...overrides }: Json = {}): Json {
  const playlistTrack = track && conform(playlistItemTemplate.track, track)

  return {
    ...playlistItemTemplate,
    added_by: conform(playlistItemTemplate.added_by, added_by),
    is_local: Boolean(track?.is_local),
    track: playlistTrack,
    item: playlistTrack,
    ...overrides,
  }
}

export function buildPlaylist({ tracks, ...overrides }: Json = {}) {
  const total = tracks?.total ?? playlistTemplate.tracks.total

  return build(playlistTemplate, overrides, id => ({
    ...links('playlist')(id),
    tracks: { href: `${API}/playlists/${id}/tracks`, total },
    items: { href: `${API}/playlists/${id}/items`, total },
  }))
}

export const buildAudioFeatures = (overrides: Json = {}) => build(audioFeatures.body.audio_features[0], overrides, id => ({
  uri: `spotify:track:${id}`,
  track_href: `${API}/tracks/${id}`,
  analysis_url: `${API}/audio-analysis/${id}`,
}))

interface PageOptions { url: string; offset?: number; limit?: number; total?: number }

export function buildPage<T>(items: T[], { url, offset = 0, limit = 20, total = items.length }: PageOptions) {
  const pageUrl = (pageOffset: number) => `${url}?offset=${pageOffset}&limit=${limit}`

  return {
    href: pageUrl(offset),
    items,
    limit,
    next: offset + limit < total ? pageUrl(offset + limit) : null,
    offset,
    previous: offset > 0 ? pageUrl(Math.max(0, offset - limit)) : null,
    total,
  }
}

export function paginate<T>(items: T[], { url, limit = 20 }: { url: string; limit?: number }) {
  const offsets = Array.from({ length: Math.max(1, Math.ceil(items.length / limit)) }, (_, i) => i * limit)
  return offsets.map(offset => buildPage(items.slice(offset, offset + limit), { url, offset, limit, total: items.length }))
}

// The page of `items` a request for `requestUrl` gets, honouring its offset and limit query parameters
export function pageAt<T>(items: T[], requestUrl: string, defaultLimit = 20) {
  const { origin, pathname, searchParams } = new URL(requestUrl)
  const offset = Number(searchParams.get('offset') ?? 0)
  const limit = Number(searchParams.get('limit') ?? defaultLimit)

  return buildPage(items.slice(offset, offset + limit), { url: origin + pathname, offset, limit, total: items.length })
}

export function apiError(status: number, message = 'Error') {
  const documented = documentedErrors.find(error => error.status === status)
  if (documented) return { status, headers: documented.headers, body: documented.body }

  return {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: { error: { status, message } },
  }
}

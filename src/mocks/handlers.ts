import { http, HttpResponse } from 'msw'
import {
  API, apiError, buildAlbum, buildArtist, buildAudioFeatures, buildFullAlbum, buildFullArtist, buildLocalTrack, buildMe,
  buildPage, buildPlaylist, buildPlaylistItem, buildSavedTrack, buildTrack, buildUser, pageAt,
} from '../test/fixtures/spotify/builders'
import { Track } from '../spotify'

export const handlerCalled = vi.fn()

const image = (hash: string) => [{ height: 640, url: `https://i.scdn.co/image/ab67616d0000b273${hash}`, width: 640 }]

const watsonbox = buildUser({ id: 'watsonbox' })

const sixBySeven = buildArtist({ id: '4TXdHyuAOl3rAOFmZ6MeKz', name: 'Six by Seven' })
const crying = buildTrack({
  id: '1GrLfs4TEvAZ86HVzXHchS',
  name: 'Crying',
  artists: [sixBySeven],
  album: buildAlbum({
    id: '4iwv7b8gDPKztLkKCbWyhi',
    name: 'Best of Six By Seven',
    artists: [sixBySeven],
    release_date: '2017-02-17',
    release_date_precision: 'day',
    images: image('f485821b346237acbbca07ea'),
  }),
  disc_number: 1,
  track_number: 3,
  duration_ms: 198093,
  preview_url: 'https://p.scdn.co/mp3-preview/daf08df57a49c215c8c53dc5fe88dec5461f15c9?cid=9950ac751e34487dbbe027c4fd7f8e99',
  explicit: false,
  popularity: 2,
  external_ids: { isrc: 'UK4UP1300002' },
})

const ghostpoet = buildArtist({ id: '69lEbRQRe29JdyLrewNAvD', name: 'Ghostpoet' })
const peanutButterBlues = buildAlbum({
  id: '6jiLkuSnhzDvzsHJlweoGh',
  name: 'Peanut Butter Blues and Melancholy Jam',
  artists: [ghostpoet],
  release_date: '2011',
  release_date_precision: 'year',
  images: image('306e7640be17c5b3468e6e80'),
})
const ghostpoetTrack = (overrides: Partial<Track>) =>
  buildTrack({ artists: [ghostpoet], album: peanutButterBlues, disc_number: 1, explicit: false, ...overrides })
const oneTwos = ghostpoetTrack({
  id: '7ATyvp3TmYBmGW7YuC8DJ3',
  name: 'One Twos / Run Run Run',
  track_number: 1,
  duration_ms: 241346,
  preview_url: 'https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99',
  popularity: 22,
  external_ids: { isrc: 'GBMEF1100339' },
})
const usAgainstWhatever = ghostpoetTrack({
  id: '0FNanBLvmFEDyD75Whjj52',
  name: 'Us Against Whatever Ever',
  track_number: 2,
  duration_ms: 269346,
  preview_url: 'https://p.scdn.co/mp3-preview/e5e39be10697be8755532d02c52319ffa6d58688?cid=9950ac751e34487dbbe027c4fd7f8e99',
  popularity: 36,
  external_ids: { isrc: 'GBMEF1000270' },
})

const ghostpoetPlaylist = buildPlaylist({
  id: '4XOGDpHMrVoH33uJEwHWU5',
  name: 'Ghostpoet – Peanut Butter Blues and Melancholy Jam',
  owner: watsonbox,
  public: false,
  collaborative: false,
  tracks: { total: 10 },
})
const playlistsUrl = `${API}/me/playlists`
export const ghostpoetTracksUrl = `${API}/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks`
const addedByWatsonbox = (track: Track | null, added_at = '2020-11-03T15:19:04Z') =>
  buildPlaylistItem({ track, added_at, added_by: watsonbox })

export const errorResponse = (status: number, message?: string, headers: Record<string, string> = {}) => () => {
  const error = apiError(status, message)
  return HttpResponse.json(error.body, { status, headers: { ...error.headers, ...headers } })
}

export const spotifyGet = (url: string, body: (request: Request) => object, { ids }: { ids?: string } = {}) =>
  http.get(url, ({ request }) => {
    handlerCalled(request.url)

    const error =
      request.headers.get('Authorization') !== 'Bearer TEST_ACCESS_TOKEN' ? errorResponse(401) :
      ids !== undefined && new URL(request.url).searchParams.get('ids') !== ids ? errorResponse(500, 'Invalid request for this handler') :
      null

    if (error) return error()

    return HttpResponse.json(body(request))
  })

export const pagedGet = (url: string, items: object[], defaultLimit?: number) =>
  spotifyGet(url, request => pageAt(items, request.url, defaultLimit))

const tracksPage = (items: object[]) => pagedGet(ghostpoetTracksUrl, items, 100)

export const handlers = [
  http.options(`${API}/me`, () => HttpResponse.text('body')),

  spotifyGet(`${API}/me`, () => buildMe({ id: 'watsonbox', display_name: 'watsonbox' })),

  pagedGet(`${API}/me/tracks`, [buildSavedTrack({ added_at: '2020-07-19T09:24:39Z', track: crying })]),

  // Ensure that a null playlist doesn't break anything
  spotifyGet(playlistsUrl, () => buildPage([ghostpoetPlaylist, null], { url: playlistsUrl, total: 1 })),

  tracksPage([addedByWatsonbox(oneTwos), addedByWatsonbox(usAgainstWhatever)]),

  spotifyGet(`${API}/artists`, () => ({
    artists: [buildFullArtist({ id: sixBySeven.id, name: sixBySeven.name, genres: ['nottingham indie'] })],
  }), { ids: sixBySeven.id }),

  spotifyGet(`${API}/audio-features`, () => ({
    audio_features: [buildAudioFeatures({
      id: crying.id,
      danceability: 0.416,
      energy: 0.971,
      key: 0,
      loudness: -5.550,
      mode: 1,
      speechiness: 0.0575,
      acousticness: 0.00104,
      instrumentalness: 0.0391,
      liveness: 0.440,
      valence: 0.190,
      tempo: 131.988,
      duration_ms: 198093,
      time_signature: 4,
    })],
  }), { ids: crying.id }),

  spotifyGet(`${API}/albums`, () => ({
    albums: [buildFullAlbum({
      ...crying.album,
      album_type: 'compilation',
      genres: ['something', 'something else'],
      label: 'Beggars Banquet',
      copyrights: [
        { text: '2016 Beggars Banquet Records Ltd.', type: 'C' },
        { text: '2016 Beggars Banquet Records Ltd.', type: 'P' },
      ],
    })],
  }), { ids: crying.album.id }),
]

export const missingPlaylistsHandlers = [
  // Two playlists indicated but only one returned
  spotifyGet(playlistsUrl, () => buildPage([ghostpoetPlaylist], { url: playlistsUrl, total: 2 })),
]

export const nullAlbumHandlers = [
  spotifyGet(`${API}/albums`, () => ({ albums: [null] }), { ids: crying.album.id }),
]

export const nullTrackHandlers = [
  tracksPage([buildPlaylistItem({ track: null, added_at: '2020-11-08T22:12:50Z', added_by: buildUser({ id: '' }) })]),
]

const addedByOtherUser = (track: Track) =>
  buildPlaylistItem({ track, added_at: '2021-02-24T06:12:40Z', added_by: buildUser({ id: 'u8ins5esg43wtxk4h66o5d1nb' }) })

export const localTrackHandlers = [
  tracksPage([
    addedByOtherUser(buildLocalTrack({ name: 'Heart of Stone', artist: 'The Waymores', album: 'Heart of Stone', duration_ms: 128000 })),
    addedByOtherUser(buildLocalTrack({
      name: 'Heard It Through The Red Wine', artist: 'Charlie Marie', album: 'Heard It Through The Red Wine', duration_ms: 227000,
    })),
  ]),
]

export const duplicateTrackHandlers = [
  tracksPage([addedByWatsonbox(oneTwos), addedByWatsonbox(oneTwos, '2020-11-20T15:19:04Z')]),
]

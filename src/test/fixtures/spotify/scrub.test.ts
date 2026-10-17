import { findLeaks, fixtureName, RawResponse, scrub, sha256 } from './scrub'

const USER_ID = 'realuser0000000000000000abcd'
const DISPLAY_NAME = 'Real Person'
const ACCOUNT_ID = 'acct123456'
const OWNED_PLAYLIST_ID = 'ownedPlaylist000000001'
const OWNED_SNAPSHOT_ID = 'AAAAownedsnapshot+/0000000000001'
const PUBLIC_PLAYLIST_ID = '37i9dQZF1DWYBF1dYDPlHw'
const PUBLIC_SNAPSHOT_ID = 'AAAApublicsnapshot00000000000001'
const API = 'https://api.spotify.com/v1'
const MARKETS = ['AR', 'AU', 'AT', 'GB', 'US']

const user = (id: string, displayName: string) => ({
  display_name: displayName,
  external_urls: { spotify: `https://open.spotify.com/user/${id}` },
  href: `${API}/users/${id}`,
  id,
  type: 'user',
  uri: `spotify:user:${id}`,
})

const playlist = (id: string, snapshotId: string, owner: object) => ({
  id,
  name: `Playlist ${id}`,
  snapshot_id: snapshotId,
  href: `${API}/playlists/${id}`,
  uri: `spotify:playlist:${id}`,
  owner,
  tracks: { href: `${API}/playlists/${id}/tracks`, total: 2 },
})

const track = (n: number) => ({
  added_by: user(USER_ID, DISPLAY_NAME),
  track: { id: `track${n}`, available_markets: MARKETS, album: { available_markets: MARKETS } },
})

const page = (href: string, items: unknown[], total = items.length) => ({
  href, limit: 100, next: null, offset: 0, previous: null, total, items,
})

const response = (url: string, body: unknown): RawResponse => ({
  url,
  status: 200,
  headers: { 'cache-control': 'private, max-age=0', 'content-length': '123', 'content-type': 'application/json; charset=utf-8' },
  body,
})

const capture = (): RawResponse[] => [
  response(`${API}/me`, { account_id: ACCOUNT_ID, ...user(USER_ID, DISPLAY_NAME), followers: { href: null, total: 0 }, images: [] }),
  response(`${API}/users/${USER_ID}/playlists?offset=0&limit=20`, page(`${API}/users/${USER_ID}/playlists?offset=0&limit=20`, [
    playlist(PUBLIC_PLAYLIST_ID, PUBLIC_SNAPSHOT_ID, user('spotify', 'Spotify')),
    playlist(OWNED_PLAYLIST_ID, OWNED_SNAPSHOT_ID, user(USER_ID, DISPLAY_NAME)),
  ])),
  response(`${API}/playlists/${OWNED_PLAYLIST_ID}/tracks?offset=0&limit=100`, page(`${API}/playlists/${OWNED_PLAYLIST_ID}/tracks`, [track(1), track(2)])),
  response(`${API}/playlists/${PUBLIC_PLAYLIST_ID}/tracks?offset=0&limit=100`, page(`${API}/playlists/${PUBLIC_PLAYLIST_ID}/tracks`, Array.from({ length: 100 }, (_, i) => track(i)), 300)),
  response(`${API}/artists?ids=a1,a2`, { artists: [{ id: 'a1' }, { id: 'a2' }] }),
  response(`${API}/artists?ids=a3`, { artists: [{ id: 'a3' }] }),
  response(`${API}/audio-features?ids=t1,t2`, { audio_features: [{ id: 't1' }, { id: 't2' }] }),
  response(`${API}/audio-features?ids=t3,e1`, { audio_features: [{ id: 't3' }, null] }),
  response(`${API}/audio-features?ids=t4`, { audio_features: [{ id: 't4' }] }),
]

const allText = (value: unknown) => JSON.stringify(value)

describe('scrub', () => {
  it('replaces the account identifiers everywhere, including URLs, hrefs and owner objects', () => {
    const text = allText(scrub(capture()).fixtures)

    expect(text).not.toContain(USER_ID)
    expect(text).not.toContain(DISPLAY_NAME)
    expect(text).not.toContain(ACCOUNT_ID)
    expect(text).toContain('https://open.spotify.com/user/exportifytestuser')
  })

  it('gives /me stable fake values', () => {
    const me = scrub(capture()).fixtures['me.json'].body

    expect(me).toMatchObject({
      account_id: 'FakeAcct00',
      display_name: 'Test User',
      id: 'exportifytestuser',
      uri: 'spotify:user:exportifytestuser',
    })
  })

  it('replaces the ids and snapshot ids of playlists the account owns', () => {
    const { fixtures } = scrub(capture())
    const text = allText(fixtures)

    expect(text).not.toContain(OWNED_PLAYLIST_ID)
    expect(text).not.toContain(OWNED_SNAPSHOT_ID)
    expect(fixtures['playlists-fakeplaylist0000000001-tracks-offset-0-limit-100.json'].url)
      .toBe(`${API}/playlists/fakeplaylist0000000001/tracks?offset=0&limit=100`)
    expect(text).toContain('fakesnapshot00000000000000000001')
  })

  it('leaves public catalogue data and other owners alone', () => {
    const text = allText(scrub(capture()).fixtures)

    expect(text).toContain(PUBLIC_PLAYLIST_ID)
    expect(text).toContain(PUBLIC_SNAPSHOT_ID)
    expect(text).toContain('spotify:user:spotify')
  })

  it('cuts available_markets to two countries at every depth', () => {
    const items = scrub(capture()).fixtures['playlists-fakeplaylist0000000001-tracks-offset-0-limit-100.json'].body.items

    expect(items[0].track.available_markets).toEqual(['AR', 'AU'])
    expect(items[0].track.album.available_markets).toEqual(['AR', 'AU'])
  })

  it('trims long pages but keeps the real pagination envelope', () => {
    const body = scrub(capture()).fixtures[`playlists-${PUBLIC_PLAYLIST_ID}-tracks-offset-0-limit-100.json`].body

    expect(body.items).toHaveLength(25)
    expect(body).toMatchObject({ total: 300, limit: 100, offset: 0, next: null })
  })

  it('keeps the first batch per endpoint plus batches with null entries', () => {
    const names = Object.keys(scrub(capture()).fixtures)

    expect(names).toContain('artists-1.json')
    expect(names).toContain('audio-features-1.json')
    expect(names).toContain('audio-features-2.json')
    expect(names).toHaveLength(7)
  })

  it('records trims and dropped batches in the index', () => {
    const { index } = scrub(capture())

    expect(index).toContainEqual(expect.objectContaining({
      file: `playlists-${PUBLIC_PLAYLIST_ID}-tracks-offset-0-limit-100.json`,
      note: 'items trimmed from 100 to 25',
    }))
    expect(index).toContainEqual(expect.objectContaining({ file: 'audio-features-2.json', note: 'contains null entries' }))
    expect(index.find(entry => entry.file === 'me.json')).toEqual({ file: 'me.json', method: 'GET', url: `${API}/me`, status: 200 })
  })

  it('drops content-length, which no longer matches the trimmed body', () => {
    const headers = scrub(capture()).fixtures['me.json'].headers

    expect(headers).toEqual({ 'cache-control': 'private, max-age=0', 'content-type': 'application/json; charset=utf-8' })
  })

  it('returns hashes of the replaced values, never the values', () => {
    const { privateValueHashes } = scrub(capture())

    expect(privateValueHashes).toContainEqual({ label: 'user id', length: USER_ID.length, sha256: sha256(USER_ID) })
    expect(privateValueHashes).toContainEqual({ label: 'owned playlist snapshot id', length: OWNED_SNAPSHOT_ID.length, sha256: sha256(OWNED_SNAPSHOT_ID) })
    expect(privateValueHashes).toHaveLength(5)
    expect(allText(privateValueHashes)).not.toContain(USER_ID)
  })

  it('is deterministic', () => {
    expect(scrub(capture())).toEqual(scrub(capture()))
  })

  it('refuses a capture without /me, since it cannot tell what to replace', () => {
    expect(() => scrub(capture().slice(1))).toThrow('/me')
  })
})

describe('fixtureName', () => {
  it('slugs the path and query', () => {
    expect(fixtureName(`${API}/me/tracks?offset=0&limit=50`)).toBe('me-tracks-offset-0-limit-50.json')
    expect(fixtureName(`${API}/me`)).toBe('me.json')
  })
})

describe('findLeaks', () => {
  const hashes = [
    { label: 'user id', length: USER_ID.length, sha256: sha256(USER_ID) },
    { label: 'display name', length: DISPLAY_NAME.length, sha256: sha256(DISPLAY_NAME) },
  ]

  it('finds a private value embedded in a URL', () => {
    expect(findLeaks(`{"href":"${API}/users/${USER_ID}/playlists"}`, hashes)).toEqual(['user id'])
  })

  it('finds a private value containing spaces', () => {
    expect(findLeaks(`{"display_name":"${DISPLAY_NAME}"}`, hashes)).toEqual(['display name'])
  })

  it('passes clean text', () => {
    expect(findLeaks(`{"href":"${API}/users/exportifytestuser"}`, hashes)).toEqual([])
  })
})

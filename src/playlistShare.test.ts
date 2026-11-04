import { createHash } from "node:crypto"
import JSZip from "jszip"
import { server } from "./mocks/server"
import { handlerCalled, pagedGet } from "./mocks/handlers"
import { API, buildPlaylist, buildPlaylistItem, buildTrack } from "./test/fixtures/spotify/builders"
import { createPlaylistShareLink, decodePlaylistSnapshot, encodePlaylistSnapshot, MAX_SHARE_LINK_LENGTH, PlaylistSnapshot, sharedTrackUrl, ShareLinkTooLargeError } from "./playlistShare"

const snapshot: PlaylistSnapshot = {
  version: 1,
  name: 'Музыка 🎶 / 日本語',
  tracks: [
    ['spotify:track:1GrLfs4TEvAZ86HVzXHchS', 'Crying "again"\nNow', 'Six by Seven', 'Best of Six By Seven'],
    ['spotify:track:1GrLfs4TEvAZ86HVzXHchS', 'Crying "again"\nNow', 'Six by Seven', 'Best of Six By Seven'],
    ['spotify:local:artist:album:song:120', 'Local song', 'Local artist', 'Local album'],
  ],
}

const hashOf = (link: string) => new URL(link).hash
const archive = async (data: unknown) => '#playlist=' + await new JSZip().file('playlist.json', JSON.stringify(data)).generateAsync({ type: 'base64', compression: 'DEFLATE' }).then(value => value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''))

beforeEach(() => {
  window.history.replaceState(null, '', '/exportify/?code=SECRET_CODE&app_client_id=PRIVATE_CLIENT#access_token=SECRET_TOKEN')
  localStorage.setItem('access_token', 'TEST_ACCESS_TOKEN')
})

test('round-trips Unicode, duplicates and local tracks without copying callback or account data into the link', async () => {
  const link = await encodePlaylistSnapshot(snapshot)

  expect(link).toMatch(/^https:\/\/exportify.app\/exportify\/#playlist=[\w-]+$/)
  expect(link).not.toContain('SECRET')
  expect(link).not.toContain('PRIVATE_CLIENT')
  expect(await decodePlaylistSnapshot(hashOf(link))).toEqual(snapshot)
  expect(await decodePlaylistSnapshot(hashOf(await encodePlaylistSnapshot({ version: 1, name: '', tracks: [] })))).toEqual({ version: 1, name: '', tracks: [] })
})

test('continues to open links in the original version 1 format', async () => {
  expect(await decodePlaylistSnapshot(await archive(snapshot))).toEqual(snapshot)
})

test('does not lengthen links when the original format compresses better', async () => {
  for (const source of [snapshot, { version: 1 as const, name: '', tracks: [] }]) {
    const link = await encodePlaylistSnapshot(source)
    expect(hashOf(link).length).toBeLessThanOrEqual((await archive(source)).length)
    expect(await decodePlaylistSnapshot(hashOf(link))).toEqual(source)
  }
})

test.each([1000, 2000])('shares all %i tracks through the paginated Spotify loader and reopens the complete snapshot', async count => {
  const tracks = Array.from({ length: count }, (_, i) => buildTrack({
    id: createHash('sha256').update(`track-${i}`).digest('hex').slice(0, 22),
    name: `Песня ${i} — ${createHash('sha256').update(`title-${i}`).digest('hex').slice(0, 18)}`,
    album: { ...buildTrack().album, name: `Album ${i % 250}` },
  }))
  const playlist = buildPlaylist({ id: 'large', name: 'Large playlist', tracks: { total: count } })
  server.use(pagedGet(`${API}/playlists/large/tracks`, tracks.map(track => buildPlaylistItem({ track })), 100))

  const link = await createPlaylistShareLink(playlist)
  const decoded = await decodePlaylistSnapshot(hashOf(link))
  const expected: PlaylistSnapshot = {
    version: 1, name: playlist.name,
    tracks: tracks.map(track => [track.uri, track.name, track.artists.map(artist => artist.name).join(', '), track.album.name]),
  }

  expect(link.length).toBeLessThan(MAX_SHARE_LINK_LENGTH)
  expect(hashOf(link).length).toBeLessThan((await archive(expected)).length)
  expect(decoded).toEqual(expected)
  expect(handlerCalled.mock.calls.map(([url]) => url)).toEqual(Array.from({ length: count / 100 }, (_, i) => `${API}/playlists/large/tracks?offset=${i * 100}&limit=100`))
})

const trackId = '1GrLfs4TEvAZ86HVzXHchS'
const compactSnapshot = [2, 'Compact 🎶', ['Artist', 'Album'], ['t' + trackId], ['Song'], [0], [1]]

test('restores compact columns, repeated dictionary entries and duplicate, episode, local and arbitrary URIs exactly', async () => {
  const uris = ['t' + trackId, 't' + trackId, 'e' + trackId, 'uspotify:local:artist:album:song:120', 'ut' + trackId, 'u', 'ujavascript:alert(1)']
  const data = [2, 'Compact 🎶', ['Artist', 'Album'], uris, Array(uris.length).fill('Song'), Array(uris.length).fill(0), Array(uris.length).fill(1)]
  const decoded = await decodePlaylistSnapshot(await archive(data))

  expect(decoded).toEqual({
    version: 1, name: 'Compact 🎶',
    tracks: ['spotify:track:' + trackId, 'spotify:track:' + trackId, 'spotify:episode:' + trackId,
      'spotify:local:artist:album:song:120', 't' + trackId, '', 'javascript:alert(1)']
      .map(uri => [uri, 'Song', 'Artist', 'Album']),
  })
  expect(await decodePlaylistSnapshot(await archive([2, '', [], [], [], [], []]))).toEqual({ version: 1, name: '', tracks: [] })
})

test.each([-1, 0.5, 2, '0', null])('rejects invalid compact dictionary references (%#)', async index => {
  for (const [artists, albums] of [[[index], [1]], [[0], [index]]]) {
    await expect(decodePlaylistSnapshot(await archive([...compactSnapshot.slice(0, 5), artists, albums]))).rejects.toThrow('Invalid playlist snapshot')
  }
})

test.each([
  [3, ...compactSnapshot.slice(1)],
  compactSnapshot.slice(0, 6),
  [...compactSnapshot, []],
  [2, 42, ...compactSnapshot.slice(2)],
  [2, 'name', [123], ...compactSnapshot.slice(3)],
  [2, 'name', ['Artist', 'Album'], ['t' + trackId], [], [0], [1]],
  [2, 'name', ['Artist', 'Album'], ['not-an-encoded-uri'], ['Song'], [0], [1]],
  [2, 'name', ['Artist', 'Album'], ['tshort'], ['Song'], [0], [1]],
  [2, 'name', ['Artist', 'Album'], ['t' + trackId], ['Song'], [], [1]],
])('rejects malformed compact columns and URI markers (%#)', async data => {
  await expect(decodePlaylistSnapshot(await archive(data))).rejects.toThrow('Invalid playlist snapshot')
})

test('bounds the restored size of compact dictionary references before rendering', async () => {
  const count = 10_000
  const data = [2, 'Small dictionary, large expansion', ['x'.repeat(200)],
    Array(count).fill('t' + trackId), Array(count).fill('Song'), Array(count).fill(0), Array(count).fill(0)]
  await expect(decodePlaylistSnapshot(await archive(data))).rejects.toThrow('too large')
  await expect(decodePlaylistSnapshot(await archive([2, 'x'.repeat(1_999_970), [], [], [], [], []]))).rejects.toThrow('too large')
})

test('does not include added-by identities and skips unavailable tracks', async () => {
  const playlist = buildPlaylist({ id: 'partial', tracks: { total: 2 } })
  server.use(pagedGet(`${API}/playlists/partial/tracks`, [buildPlaylistItem({ track: null }), buildPlaylistItem()], 100))
  const decoded = await decodePlaylistSnapshot(hashOf(await createPlaylistShareLink(playlist)))

  expect(decoded.tracks).toHaveLength(1)
  expect(Object.keys(decoded)).toEqual(['version', 'name', 'tracks'])
  expect(decoded.tracks[0]).toHaveLength(4)
})

test.each(['#playlist=', '#playlist=broken', '#playlist=%', '#other=data', '#playlist=' + 'x'.repeat(MAX_SHARE_LINK_LENGTH)])('rejects malformed or overlong links (%#)', async hash => {
  await expect(decodePlaylistSnapshot(hash)).rejects.toThrow()
})

test.each([
  null,
  { ...snapshot, version: 2 },
  { ...snapshot, name: 42 },
  { ...snapshot, tracks: [[1, 'name', 'artist', 'album']] },
  { ...snapshot, tracks: [['uri', 'name']] },
  { ...snapshot, tracks: Array(10_001).fill(snapshot.tracks[0]) },
])('rejects unsupported versions and malformed snapshots (%#)', async data => {
  await expect(decodePlaylistSnapshot(await archive(data))).rejects.toThrow('Invalid playlist snapshot')
})

test('rejects a small compressed archive that expands beyond the decoded limit', async () => {
  await expect(decodePlaylistSnapshot(await archive({ ...snapshot, name: 'x'.repeat(2_000_001) }))).rejects.toThrow('too large')
  await expect(encodePlaylistSnapshot({ ...snapshot, name: 'x'.repeat(2_000_001) })).rejects.toBeInstanceOf(ShareLinkTooLargeError)
})

test('links only to Spotify tracks and episodes, leaving local or untrusted URIs as plain text', () => {
  expect(sharedTrackUrl(snapshot.tracks[0][0])).toBe('https://open.spotify.com/track/1GrLfs4TEvAZ86HVzXHchS')
  expect(sharedTrackUrl('spotify:episode:1GrLfs4TEvAZ86HVzXHchS')).toBe('https://open.spotify.com/episode/1GrLfs4TEvAZ86HVzXHchS')
  for (const uri of ['javascript:alert(1)', 'https://evil.example/', 'spotify:track:../../evil', snapshot.tracks[2][0]]) expect(sharedTrackUrl(uri)).toBeUndefined()
})

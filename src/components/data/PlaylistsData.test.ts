import { server } from "../../mocks/server"
import { handlerCalled, pagedGet } from "../../mocks/handlers"
import { API, buildPlaylist, buildSavedTrack, buildUser } from "../../test/fixtures/spotify/builders"
import PlaylistsData from "./PlaylistsData"

const requestedUrls = () => handlerCalled.mock.calls.map(([url]) => url)
const range = (count: number) => Array.from({ length: count }, (_, i) => i)

const me = buildUser({ id: 'me' })
const someoneElse = buildUser({ id: 'someone' })

function servePlaylists(playlists: object[]) {
  server.use(
    pagedGet(`${API}/users/me/playlists`, playlists),
    pagedGet(`${API}/me/tracks`, range(3).map(() => buildSavedTrack())),
  )
}

const names = (playlists: any[]) => playlists.map(p => p.name)

describe("PlaylistsData", () => {
  test("puts the liked tracks playlist first in the first slice", async () => {
    servePlaylists([buildPlaylist({ id: 'p1', name: 'One', owner: me })])

    const slice = await new PlaylistsData('TEST_ACCESS_TOKEN', 'me').slice(0, 20)

    expect(slice[0]).toMatchObject({
      id: 'liked',
      name: 'Liked',
      owner: { id: 'me' },
      tracks: { href: `${API}/me/tracks`, limit: 20, total: 3 },
      uri: 'spotify:user:me:saved',
    })
    expect(names(slice)).toEqual(['Liked', 'One'])
  })

  test("loads every page of playlists when exporting all", async () => {
    servePlaylists(range(120).map(i => buildPlaylist({ id: `p${i}`, name: `Playlist ${i}`, owner: me })))
    const onStarted = vi.fn()
    const onDone = vi.fn()

    const all = await new PlaylistsData('TEST_ACCESS_TOKEN', 'me', onStarted, onDone).all()

    expect(all).toHaveLength(121)
    expect(requestedUrls()).toEqual([
      `${API}/users/me/playlists?offset=0&limit=50`,
      `${API}/users/me/playlists?offset=50&limit=50`,
      `${API}/users/me/playlists?offset=100&limit=50`,
      `${API}/me/tracks`,
    ])
    expect(onStarted).toHaveBeenCalledOnce()
    expect(onDone).toHaveBeenCalledOnce()
  })

  test("counts and serves loaded playlists from cache", async () => {
    servePlaylists([buildPlaylist({ id: 'p1', owner: me }), buildPlaylist({ id: 'p2', owner: me })])
    const playlistsData = new PlaylistsData('TEST_ACCESS_TOKEN', 'me')

    expect(await playlistsData.total()).toBe(2)
    await playlistsData.slice(0, 50)

    expect(requestedUrls().filter(url => url.includes('/playlists'))).toHaveLength(1)
  })

  describe("search", () => {
    let playlistsData: PlaylistsData

    beforeEach(() => {
      servePlaylists([
        buildPlaylist({ id: 'p1', name: 'Morning Jazz', owner: me, public: true, collaborative: false }),
        buildPlaylist({ id: 'p2', name: 'Evening jazz', owner: someoneElse, public: false, collaborative: true }),
        buildPlaylist({ id: 'p3', name: 'Workout', owner: me, public: false, collaborative: false }),
      ])
      playlistsData = new PlaylistsData('TEST_ACCESS_TOKEN', 'me')
    })

    test.each([
      ['JAZZ', ['Morning Jazz', 'Evening jazz']],
      ['public:true', ['Morning Jazz']],
      ['public:false', ['Evening jazz', 'Workout']],
      ['collaborative:true', ['Evening jazz']],
      ['owner:me', ['Morning Jazz', 'Workout']],
      ['owner:Someone', ['Evening jazz']],
    ])("%s", async (query, expected) => {
      expect(names(await playlistsData.search(query))).toEqual(expected)
    })
  })
})

import { rest } from "msw"
import { setupServer } from "msw/node"
import { PlaylistImportService } from "./PlaylistImportService"

jest.mock("@bugsnag/js")

const server = setupServer(
  rest.post("https://api.spotify.com/v1/me/playlists", (req, res, ctx) => {
    return res(
      ctx.json({
        id: "new_playlist_123",
        name: "Test Imported Playlist",
        uri: "spotify:playlist:new_playlist_123"
      })
    )
  }),
  rest.post("https://api.spotify.com/v1/playlists/:playlistId/items", (req, res, ctx) => {
    return res(
      ctx.json({
        snapshot_id: "snapshot_abc"
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("PlaylistImportService", () => {
  it("creates playlist and adds tracks in batches of 100", async () => {
    const trackUris = Array.from({ length: 250 }, (_, i) => `spotify:track:${i}`)
    const progressCalls: Array<{ playlistName: string; count: number; total: number }> = []

    const result = await PlaylistImportService.importPlaylist({
      accessToken: "mock_token",
      name: "Test Imported Playlist",
      isPublic: false,
      trackUris,
      onProgress: (name, count, total) => {
        progressCalls.push({ playlistName: name, count, total })
      }
    })

    expect(result.id).toBe("new_playlist_123")
    expect(result.name).toBe("Test Imported Playlist")
    expect(result.importedTracksCount).toBe(250)
    expect(result.totalTracksCount).toBe(250)
    expect(progressCalls.length).toBe(3)
    expect(progressCalls[progressCalls.length - 1]).toEqual({ playlistName: "Test Imported Playlist", count: 250, total: 250 })
  })

  it("handles empty track list by creating empty playlist", async () => {
    const result = await PlaylistImportService.importPlaylist({
      accessToken: "mock_token",
      name: "Empty Playlist",
      isPublic: true,
      trackUris: []
    })

    expect(result.id).toBe("new_playlist_123")
    expect(result.importedTracksCount).toBe(0)
  })

  it("imports multiple playlists sequentially and reports progress", async () => {
    const items = [
      { name: "Playlist 1", trackUris: ["spotify:track:1", "spotify:track:2"] },
      { name: "Playlist 2", trackUris: ["spotify:track:3"] }
    ]
    const progressLogs: any[] = []

    const result = await PlaylistImportService.importMultiplePlaylists({
      accessToken: "mock_token",
      items,
      isPublic: false,
      onProgress: (pIdx, pTotal, pName, count, total) => {
        progressLogs.push({ pIdx, pTotal, pName, count, total })
      }
    })

    expect(result.successfulPlaylistsCount).toBe(2)
    expect(result.totalTracksCount).toBe(3)
    expect(progressLogs.length).toBe(2)
    expect(progressLogs[0]).toEqual({
      pIdx: 0,
      pTotal: 2,
      pName: "Playlist 1",
      count: 2,
      total: 2
    })
    expect(progressLogs[1]).toEqual({
      pIdx: 1,
      pTotal: 2,
      pName: "Playlist 2",
      count: 1,
      total: 1
    })
  })

  it("propagates 403 scope error during multiple playlists import", async () => {
    server.use(
      rest.post("https://api.spotify.com/v1/me/playlists", (req, res, ctx) => {
        return res(ctx.status(403), ctx.json({ error: { message: "Insufficient client scope" } }))
      })
    )

    await expect(
      PlaylistImportService.importMultiplePlaylists({
        accessToken: "mock_token",
        items: [{ name: "P1", trackUris: ["spotify:track:1"] }],
        isPublic: false
      })
    ).rejects.toMatchObject({ response: { status: 403 } })
  })
})

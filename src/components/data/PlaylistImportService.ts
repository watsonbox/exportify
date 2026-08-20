import { apiPost } from "helpers"

export interface ImportPlaylistParams {
  accessToken: string
  name: string
  isPublic: boolean
  trackUris: string[]
  onProgress?: (playlistName: string, importedCount: number, totalTracks: number) => void
}

export interface ImportPlaylistResult {
  id: string
  name: string
  importedTracksCount: number
  totalTracksCount: number
}

export interface ImportMultiplePlaylistsParams {
  accessToken: string
  items: Array<{ name: string; trackUris: string[] }>
  isPublic: boolean
  onProgress?: (
    playlistIndex: number,
    totalPlaylists: number,
    playlistName: string,
    importedTracks: number,
    totalTracks: number
  ) => void
}

export interface ImportMultiplePlaylistsResult {
  successfulPlaylistsCount: number
  totalTracksCount: number
  failedPlaylists: Array<{ name: string; error: any }>
}

export class PlaylistImportService {
  private static readonly BATCH_SIZE = 100

  static async importPlaylist(params: ImportPlaylistParams): Promise<ImportPlaylistResult> {
    const { accessToken, name, isPublic, trackUris, onProgress } = params

    // 1. Create playlist on Spotify (default private and non-collaborative)
    const createPlaylistUrl = "https://api.spotify.com/v1/me/playlists"
    const createResponse = await apiPost(createPlaylistUrl, accessToken, {
      name: name,
      public: isPublic,
      collaborative: false,
      description: "Imported via Exportify"
    })

    const playlist = createResponse.data
    const playlistId = playlist.id
    const totalTracks = trackUris.length
    let importedTracksCount = 0

    // 2. Add tracks in batches of 100
    const addItemsUrl = `https://api.spotify.com/v1/playlists/${playlistId}/items`

    for (let i = 0; i < totalTracks; i += this.BATCH_SIZE) {
      const batch = trackUris.slice(i, i + this.BATCH_SIZE)
      await apiPost(addItemsUrl, accessToken, {
        uris: batch
      })
      importedTracksCount += batch.length
      if (onProgress) {
        onProgress(name, importedTracksCount, totalTracks)
      }
    }

    return {
      id: playlistId,
      name: name,
      importedTracksCount,
      totalTracksCount: totalTracks
    }
  }

  static async importMultiplePlaylists(params: ImportMultiplePlaylistsParams): Promise<ImportMultiplePlaylistsResult> {
    const { accessToken, items, isPublic, onProgress } = params
    let successfulPlaylistsCount = 0
    let totalTracksCount = 0
    const failedPlaylists: Array<{ name: string; error: any }> = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const result = await this.importPlaylist({
          accessToken,
          name: item.name,
          isPublic,
          trackUris: item.trackUris,
          onProgress: (playlistName, importedCount, totalTracks) => {
            if (onProgress) {
              onProgress(i, items.length, playlistName, importedCount, totalTracks)
            }
          }
        })
        successfulPlaylistsCount++
        totalTracksCount += result.importedTracksCount
      } catch (error: any) {
        if (error?.response?.status === 403) {
          throw error
        }
        failedPlaylists.push({ name: item.name, error })
      }
    }

    if (successfulPlaylistsCount === 0 && failedPlaylists.length > 0) {
      throw failedPlaylists[0].error
    }

    return {
      successfulPlaylistsCount,
      totalTracksCount,
      failedPlaylists
    }
  }
}

export default PlaylistImportService

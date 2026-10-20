import i18n from "../../i18n/config"
import { apiCall } from "helpers"
import { Paging, SavedAlbum, SavedTrack, SimplifiedPlaylist } from "spotify"

// Liked Songs isn't a playlist on Spotify, so it's built from /me/tracks and exported alongside them
export interface LikedSongsPlaylist {
  id: "liked"
  name: string
  public: false
  collaborative: false
  owner: { id: string; display_name: string; uri: string }
  tracks: { href: string; limit: number; total: number }
  uri: string
}

// Saved albums are listed and exported like a playlist, with albums in place of tracks
export interface SavedAlbumsPlaylist {
  id: "albums"
  name: string
  public: false
  collaborative: false
  owner: { id: string; display_name: string; uri: string }
  albums: { href: string; total: number }
  uri: string
}

export type TracksPlaylist = SimplifiedPlaylist | LikedSongsPlaylist
export type ExportablePlaylist = TracksPlaylist | SavedAlbumsPlaylist

// Stands in for a playlist that hasn't been loaded yet
export type PlaylistPlaceholder = { [K in keyof SimplifiedPlaylist]?: undefined }

const isLoaded = (playlist: SimplifiedPlaylist | PlaylistPlaceholder | null): playlist is SimplifiedPlaylist =>
  playlist != null && Object.keys(playlist).length > 0

// Handles cached loading of all or subsets of playlist data
class PlaylistsData {
  PLAYLIST_LIMIT = 50
  PLACEHOLDER: PlaylistPlaceholder = {}

  userId: string
  private onPlaylistsLoadingStarted?: () => void
  private onPlaylistsLoadingDone?: () => void
  private data: (SimplifiedPlaylist | PlaylistPlaceholder | null)[]
  private likedTracksPlaylist: LikedSongsPlaylist | null
  private savedAlbumsPlaylist?: SavedAlbumsPlaylist | null
  private dataInitialized = false

  constructor(userId: string, onPlaylistsLoadingStarted?: () => void, onPlaylistsLoadingDone?: () => void) {
    this.userId = userId
    this.onPlaylistsLoadingStarted = onPlaylistsLoadingStarted
    this.onPlaylistsLoadingDone = onPlaylistsLoadingDone
    this.data = []
    this.likedTracksPlaylist = null
  }

  async total() {
    if (!this.dataInitialized) {
      await this.loadSlice()
    }

    return this.data.filter(p => p).length
  }

  async slice(start: number, end: number): Promise<(ExportablePlaylist | PlaylistPlaceholder)[]> {
    await this.loadSlice(start, end)
    const libraryPlaylists = await this.loadLibraryPlaylists()
    const playlists = this.data.slice(start, end).filter(p => p != null)

    // It's a little ugly, but we slip in liked tracks and saved albums with the first slice
    if (start === 0) {
      return [...libraryPlaylists, ...playlists]
    } else {
      return playlists
    }
  }

  async all(): Promise<ExportablePlaylist[]> {
    await this.loadAll()
    const libraryPlaylists = await this.loadLibraryPlaylists()

    // Remove any uninitialized playlists when exporting
    return [...libraryPlaylists, ...this.data.filter(isLoaded)]
  }

  async search(query: string): Promise<SimplifiedPlaylist[]> {
    await this.loadAll()

    // Remove any uninitialized playlists when exporting
    const results = this.data.filter(isLoaded)

    if (query.startsWith("public:")) {
      return results.filter(p => p.public === query.endsWith(":true"))
    } else if (query.startsWith("collaborative:")) {
      return results.filter(p => p.collaborative === query.endsWith(":true"))
    } else if (query.startsWith("owner:")) {
      let owner = query.match(/owner:(.*)/)?.at(-1)?.toLowerCase()
      if (owner === "me") owner = this.userId

      return results.filter(p => p.owner).filter(p => p.owner.id === owner)
    } else {
      // Case-insensitive search in playlist name
      // TODO: Add lazy evaluation for performance?
      return results.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    }
  }

  async loadAll() {
    if (this.onPlaylistsLoadingStarted) {
      this.onPlaylistsLoadingStarted()
    }

    try {
      await this.loadSlice()

      // Get the rest of them if necessary
      for (let offset = this.PLAYLIST_LIMIT; offset < this.data.length; offset = offset + this.PLAYLIST_LIMIT) {
        await this.loadSlice(offset, offset + this.PLAYLIST_LIMIT)
      }
    } finally {
      if (this.onPlaylistsLoadingDone) {
        this.onPlaylistsLoadingDone()
      }
    }
  }

  private async loadSlice(start = 0, end = start + this.PLAYLIST_LIMIT) {
    if (this.dataInitialized) {
      const loadedData = this.data.slice(start, end)

      if (loadedData.filter(i => i != null && Object.keys(i).length === 0).length === 0) {
        return loadedData
      }
    }

    const playlistsUrl = `https://api.spotify.com/v1/me/playlists?offset=${start}&limit=${end - start}`
    const playlistsResponse = await apiCall<Paging<SimplifiedPlaylist | null>>(playlistsUrl)
    const playlistsData = playlistsResponse.data

    if (!this.dataInitialized) {
      this.data = Array(playlistsData.total).fill(this.PLACEHOLDER)
      this.dataInitialized = true
    }

    this.data.splice(start, playlistsData.items.length, ...playlistsData.items)
  }

  private async loadLibraryPlaylists(): Promise<ExportablePlaylist[]> {
    const likedTracksPlaylist = await this.loadLikedTracksPlaylist()
    const savedAlbumsPlaylist = await this.loadSavedAlbumsPlaylist()

    return savedAlbumsPlaylist ? [likedTracksPlaylist, savedAlbumsPlaylist] : [likedTracksPlaylist]
  }

  private async loadLikedTracksPlaylist(): Promise<LikedSongsPlaylist> {
    if (this.likedTracksPlaylist !== null) {
      return this.likedTracksPlaylist
    }

    const likedTracksUrl = `https://api.spotify.com/v1/me/tracks`
    const likedTracksResponse = await apiCall<Paging<SavedTrack>>(likedTracksUrl)
    const likedTracksData = likedTracksResponse.data

    this.likedTracksPlaylist = {
      "id": "liked",
      "name": "Liked",
      "public": false,
      "collaborative": false,
      "owner": {
        "id": this.userId,
        "display_name": this.userId,
        "uri": "spotify:user:" + this.userId
      },
      "tracks": {
        "href": "https://api.spotify.com/v1/me/tracks",
        "limit": likedTracksData.limit,
        "total": likedTracksData.total
      },
      "uri": "spotify:user:" + this.userId + ":saved"
    }

    return this.likedTracksPlaylist
  }

  // Null when there are no saved albums, so the row is left out
  private async loadSavedAlbumsPlaylist(): Promise<SavedAlbumsPlaylist | null> {
    if (this.savedAlbumsPlaylist !== undefined) {
      return this.savedAlbumsPlaylist
    }

    const savedAlbumsUrl = "https://api.spotify.com/v1/me/albums"
    const savedAlbumsResponse = await apiCall<Paging<SavedAlbum>>(`${savedAlbumsUrl}?limit=1`)
    const total = savedAlbumsResponse.data.total

    this.savedAlbumsPlaylist = total === 0 ? null : {
      "id": "albums",
      "name": i18n.t("saved_albums.name"),
      "public": false,
      "collaborative": false,
      "owner": {
        "id": this.userId,
        "display_name": this.userId,
        "uri": "spotify:user:" + this.userId
      },
      "albums": {
        "href": savedAlbumsUrl,
        "total": total
      },
      "uri": "spotify:user:" + this.userId + ":collection:albums"
    }

    return this.savedAlbumsPlaylist
  }
}

export default PlaylistsData

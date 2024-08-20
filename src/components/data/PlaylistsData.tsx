import { apiCall } from "helpers"

// Handles cached loading of all or subsets of playlist data
class PlaylistsData {
  PLAYLIST_LIMIT = 50
  SEARCH_LIMIT = 20
  PLACEHOLDER = {}

  userId: string
  private accessToken: string
  private onPlaylistsLoadingStarted?: () => void
  private onPlaylistsLoadingDone?: () => void
  private data: any[]
  private likedTracksPlaylist: any
  private dataInitialized = false

  constructor(accessToken: string, userId: string, onPlaylistsLoadingStarted?: () => void, onPlaylistsLoadingDone?: () => void) {
    this.accessToken = accessToken
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

  async slice(start: number, end: number) {
    await this.loadSlice(start, end)
    await this.loadLikedTracksPlaylist()

    // It's a little ugly, but we slip in liked tracks with the first slice
    if (start === 0) {
      return [this.likedTracksPlaylist, ...this.data.slice(start, end).filter(p => p)]
    } else {
      return this.data.slice(start, end).filter(p => p)
    }
  }

  async all() {
    await this.loadAll()
    await this.loadLikedTracksPlaylist()

    return [this.likedTracksPlaylist, ...this.data.filter(p => p)]
  }

  async search(query: string) {
    await this.loadAll()

    // Case-insensitive search in playlist name
    // TODO: Add lazy evaluation for performance?
    return this.data
      .filter(p => p)
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, this.SEARCH_LIMIT)
  }

  async loadAll() {
    if (this.onPlaylistsLoadingStarted) {
      this.onPlaylistsLoadingStarted()
    }

    await this.loadSlice()

    // Get the rest of them if necessary
    for (var offset = this.PLAYLIST_LIMIT; offset < this.data.length; offset = offset + this.PLAYLIST_LIMIT) {
      await this.loadSlice(offset, offset + this.PLAYLIST_LIMIT)
    }

    if (this.onPlaylistsLoadingDone) {
      this.onPlaylistsLoadingDone()
    }
  }

  private async loadSlice(start = 0, end = start + this.PLAYLIST_LIMIT) {
    if (this.dataInitialized) {
      const loadedData = this.data.slice(start, end)

      if (loadedData.filter(i => i != null && Object.keys(i).length === 0).length === 0) {
        return loadedData
      }
    }

    const playlistsUrl = `https://api.spotify.com/v1/users/${this.userId}/playlists?offset=${start}&limit=${end-start}`
    const playlistsResponse = await apiCall(playlistsUrl, this.accessToken)
    const playlistsData = playlistsResponse.data

    if (!this.dataInitialized) {
      this.data = Array(playlistsData.total).fill(this.PLACEHOLDER)
      this.dataInitialized = true
    }

    this.data.splice(start, playlistsData.items.length, ...playlistsData.items)
  }

  private async loadLikedTracksPlaylist() {
    if (this.likedTracksPlaylist !== null) {
      return
    }

    const likedTracksUrl = `https://api.spotify.com/v1/users/${this.userId}/tracks`
    const likedTracksResponse = await apiCall(likedTracksUrl, this.accessToken)
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
  }
}

export default PlaylistsData

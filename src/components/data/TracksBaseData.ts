import i18n from "../../i18n/config"
import TracksData from "./TracksData"
import { apiCall } from "helpers"
import { Paging, PlaylistItem, SavedTrack, Track, UserReference } from "spotify"
import { ExportablePlaylist } from "./PlaylistsData"

// What playlist items and saved tracks have in common, once items whose track is gone are left out
export interface TrackItem {
  added_at: string
  added_by?: UserReference | null
  track: Track
}

const hasTrack = (item: PlaylistItem | SavedTrack): item is TrackItem => item.track != null

class TracksBaseData extends TracksData {
  playlist: ExportablePlaylist

  constructor(playlist: ExportablePlaylist) {
    super()
    this.playlist = playlist
  }

  dataLabels() {
    return [
      i18n.t("track.track_uri"),
      i18n.t("track.track_name"),
      i18n.t("track.artist_uris"),
      i18n.t("track.artist_names"),
      i18n.t("track.album_uri"),
      i18n.t("track.album_name"),
      i18n.t("track.album_artist_uris"),
      i18n.t("track.album_artist_names"),
      i18n.t("track.album_release_date"),
      i18n.t("track.album_image_url"),
      i18n.t("track.disc_number"),
      i18n.t("track.track_number"),
      i18n.t("track.track_duration"),
      i18n.t("track.track_preview_url"),
      i18n.t("track.explicit"),
      i18n.t("track.popularity"),
      i18n.t("track.isrc")
    ]
  }

  async trackItems() {
    await this.getPlaylistItems()

    return this.playlistItems
  }

  async data() {
    await this.getPlaylistItems()

    return new Map(this.playlistItems.map(item => {
      return [
        item.track.uri,
        [
          item.track.uri,
          item.track.name,
          item.track.artists.map((a) => { return a.uri }).join(', '),
          item.track.artists.map((a) => { return (a.name ?? "").replace(/,/g, "\\,") }).join(', '),
          item.track.album.uri == null ? '' : item.track.album.uri,
          item.track.album.name,
          item.track.album.artists.map((a) => { return a.uri }).join(', '),
          item.track.album.artists.map((a) => { return (a.name ?? "").replace(/,/g, "\\,") }).join(', '),
          item.track.album.release_date == null ? '' : item.track.album.release_date,
          item.track.album.images[0] == null ? '' : item.track.album.images[0].url,
          item.track.disc_number,
          item.track.track_number,
          item.track.duration_ms,
          item.track.preview_url == null ? '' : item.track.preview_url,
          item.track.explicit,
          item.track.popularity,
          item.track.external_ids.isrc == null ? '' : item.track.external_ids.isrc
        ]
      ]
    }))
  }

  // Memoization supporting multiple calls
  private playlistItems: TrackItem[] = []
  private async getPlaylistItems() {
    if (this.playlistItems.length > 0) {
      return this.playlistItems
    }

    const requests = []
    const limit = this.playlist.id === "liked" ? 50 : 100 // The most /me/tracks and playlist items each allow

    for (let offset = 0; offset < this.playlist.tracks.total; offset = offset + limit) {
      requests.push(`${this.playlist.tracks.href.split('?')[0]}?offset=${offset}&limit=${limit}`)
    }

    const trackPromises = requests.map(request => { return apiCall<Paging<PlaylistItem | SavedTrack>>(request) })
    const trackResponses = await Promise.all(trackPromises)

    this.playlistItems = trackResponses.flatMap(response => {
      return response.data.items.filter(hasTrack) // Exclude null track attributes
    })
  }
}

export default TracksBaseData

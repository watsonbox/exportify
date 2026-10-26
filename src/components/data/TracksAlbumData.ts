import i18n from "../../i18n/config"
import TracksData from "./TracksData"
import { apiCall } from "helpers"
import { Album, Track } from "spotify"

class TracksAlbumData extends TracksData {
  ALBUM_LIMIT = 20

  tracks: Track[]

  constructor(tracks: Track[]) {
    super()
    this.tracks = tracks
  }

  dataLabels() {
    return [
      i18n.t("track.album.album_genres"),
      i18n.t("track.album.label"),
      i18n.t("track.album.copyrights")
    ]
  }

  async data() {
    const albumIds = Array.from(new Set(this.tracks.map((track) => track.album.id).filter((id): id is string => Boolean(id))))

    const requests = []

    // Batch fetches are gone, so each album is requested on its own
    for (const albumId of albumIds) {
      requests.push(`https://api.spotify.com/v1/albums/${albumId}`)
    }

    const albumPromises = requests.map((request) => apiCall<Album | null>(request))
    const albumResponses = await Promise.all(albumPromises)

    const albumDataById = new Map<string, string[]>(
      albumResponses.map((response) => response.data).filter((album): album is Album => album != null).map((album) => {
        return [
          album.id,
          [
            album.genres.join(", "),
            album.label ?? "",
            album.copyrights.map((c) => `${c.type} ${c.text}`).join(", ")
          ]
        ]
      })
    )

    return new Map<string, string[]>(
      this.tracks.map((track) => [track.uri, (track.album.id && albumDataById.get(track.album.id)) || ["", "", ""]])
    )
  }
}

export default TracksAlbumData

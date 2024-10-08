import i18n from "../../i18n/config"
import TracksData from "./TracksData"
import { apiCall } from "helpers"

class TracksAlbumData extends TracksData {
  ALBUM_LIMIT = 20

  tracks: any[]

  constructor(accessToken: string, tracks: any[]) {
    super(accessToken)
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
    const albumIds = Array.from(new Set(this.tracks.filter((track: any) => track.album.id).map((track: any) => track.album.id)))

    let requests = []

    for (var offset = 0; offset < albumIds.length; offset = offset + this.ALBUM_LIMIT) {
      requests.push(`https://api.spotify.com/v1/albums?ids=${albumIds.slice(offset, offset + this.ALBUM_LIMIT)}`)
    }

    const albumPromises = requests.map((request) => apiCall(request, this.accessToken))
    const albumResponses = await Promise.all(albumPromises)

    const albumDataById = new Map<string, string[]>(
      albumResponses.flatMap((response) => response.data.albums.map((album: any) => {
        return [
          album == null ? "" : album.id,
          [
            album == null ? "" : album.genres.join(", "),
            album == null ? "" : album.label,
            album == null ? "" : album.copyrights.map((c: any) => `${c.type} ${c.text}`).join(", ")
          ]
        ]
      }))
    )

    return new Map<string, string[]>(
      this.tracks.map((track: any) => [track.uri, albumDataById.get(track.album.id) || ["", "", ""]])
    )
  }
}

export default TracksAlbumData

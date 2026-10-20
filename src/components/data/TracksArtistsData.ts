import i18n from "../../i18n/config"
import TracksData from "./TracksData"
import { apiCall } from "helpers"
import { ArtistsResponse, Track } from "spotify"

class TracksArtistsData extends TracksData {
  ARTIST_LIMIT = 50

  tracks: Track[]

  constructor(tracks: Track[]) {
    super()
    this.tracks = tracks
  }

  dataLabels() {
    return [
      i18n.t("track.artist.artist_genres")
    ]
  }

  async data() {
    const artistIds = Array.from(new Set(this.tracks.flatMap((track) => {
      return track
        .artists
        .filter((a) => a.type === "artist")
        .map((a) => a.id)
        .filter((id): id is string => Boolean(id))
    })))

    const requests = []

    for (let offset = 0; offset < artistIds.length; offset = offset + this.ARTIST_LIMIT) {
      requests.push(`https://api.spotify.com/v1/artists?ids=${artistIds.slice(offset, offset + this.ARTIST_LIMIT)}`)
    }

    const artistPromises = requests.map(request => { return apiCall<ArtistsResponse>(request) })
    const artistResponses = await Promise.all(artistPromises)

    const artistsById = new Map(artistResponses.flatMap((response) => response.data.artists).map((artist) => [artist.id, artist]))

    return new Map<string, string[]>(this.tracks.map((track) => {
      return [
        track.uri,
        [
          track.artists.map((a) => {
            const artist = a.id == null ? undefined : artistsById.get(a.id)
            return artist ? artist.genres.filter((g) => g).join(',') : ""
          }).filter((g) => g).join(",")
        ]
      ]
    }))
  }
}

export default TracksArtistsData

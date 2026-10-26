import i18n from "../../i18n/config"
import TracksData from "./TracksData"
import { apiCall } from "helpers"
import { Artist, Track } from "spotify"

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

    // Batch fetches are gone, so each artist is requested on its own
    for (const artistId of artistIds) {
      requests.push(`https://api.spotify.com/v1/artists/${artistId}`)
    }

    const artistPromises = requests.map(request => { return apiCall<Artist>(request) })
    const artistResponses = await Promise.all(artistPromises)

    const artistsById = new Map(artistResponses.map((response) => response.data).map((artist) => [artist.id, artist]))

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

import TracksData from "./TracksData"
import { apiCall } from "helpers"

class TracksArtistsData extends TracksData {
  ARTIST_LIMIT = 50

  tracks: any[]

  constructor(accessToken: string, tracks: any[]) {
    super(accessToken)
    this.tracks = tracks
  }

  dataLabels() {
    return [
      "Artist Genres"
    ]
  }

  async data() {
    const artistIds = Array.from(new Set(this.tracks.flatMap((track: any) => {
      return track
        .artists
        .filter((a: any) => a.type === "artist")
        .map((a: any) => a.id)
        .filter((i: string) => i)
    })))

    let requests = []

    for (var offset = 0; offset < artistIds.length; offset = offset + this.ARTIST_LIMIT) {
      requests.push(`https://api.spotify.com/v1/artists?ids=${artistIds.slice(offset, offset + this.ARTIST_LIMIT)}`)
    }

    const artistPromises = requests.map(request => { return apiCall(request, this.accessToken) })
    const artistResponses = await Promise.all(artistPromises)

    const artistsById = new Map(artistResponses.flatMap((response) => response.data.artists).map((artist: any) => [artist.id, artist]))

    return new Map<string, string[]>(this.tracks.map((track: any) => {
      return [
        track.uri,
        [
          track.artists.map((a: any) => {
            return artistsById.has(a.id) ? artistsById.get(a.id)!.genres.filter((g: string) => g).join(',') : ""
          }).filter((g: string) => g).join(",")
        ]
      ]
    }))
  }
}

export default TracksArtistsData

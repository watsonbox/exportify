import { apiCall } from "helpers";
import i18n from "i18n/config";

class SavedAlbumData {
  private accessToken: string

  /**
   * we fetch this count on initial load of App.tsx. We need it here to calculate how many 
   * pages of requests we need to make
   */
  private savedAlbumCount: number

  constructor(accessToken: string, savedAlbumCount: number) {
    this.accessToken = accessToken
    this.savedAlbumCount = savedAlbumCount
  }

  dataLabels() {
    return [
      i18n.t("album.album_uri"),
      i18n.t("album.album_name"),
      i18n.t("album.album_type"),
      i18n.t("album.album_artist_uris"),
      i18n.t("album.album_artist_names"),
      i18n.t("album.album_release_date"),
      i18n.t("album.album_release_date_precision"),
      i18n.t("album.album_track_count"),
      i18n.t("album.saved_at"),
    ]
  }

  private savedAlbumItems: any[] = [];
  async fetchSavedAlbumItems() {
    if (this.savedAlbumItems.length > 0) {
      return this.savedAlbumItems
    }
    const requests = []
    const limit = 50 // max allowed by spotify API

    for (let offset = 0; offset < this.savedAlbumCount; offset = offset + limit) {
      requests.push(`https://api.spotify.com/v1/me/albums?limit=${limit}&offset=${offset}`)
    }

    const albumPromises = requests.map((request) => {
      return apiCall(request, this.accessToken)
    })
    const albumResponses = await Promise.all(albumPromises)
    this.savedAlbumItems = albumResponses.flatMap((response) => {
      return response.data.items.filter((i: any) => i.album)
    })
    return this.savedAlbumItems
  }

  async data() {
    await this.fetchSavedAlbumItems()

    return new Map(
      this.savedAlbumItems.map((item) => {
        return [
          item.album.uri,
          [
            item.album.uri,
            item.album.name,
            item.album.album_type,
            item.album.artists
              .map((a: any) => {
                return a.uri;
              })
              .join(", "),
            item.album.artists
              .map((a: any) => {
                return String(a.name).replace(/,/g, "\\,");
              })
              .join(", "),
            item.album.release_date,
            item.album.release_date_precision,
            item.album.tracks.total,
            item.added_at
          ],
        ]
      })
    )
  }
}

export default SavedAlbumData

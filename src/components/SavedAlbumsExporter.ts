import { saveAs } from "file-saver"
import i18n from "../i18n/config"

import { apiCall } from "helpers"
import { Paging, SavedAlbum, SimplifiedArtist } from "spotify"
import { CsvValue } from "components/data/TracksData"
import { SavedAlbumsPlaylist } from "components/data/PlaylistsData"

const LIMIT = 50 // The most /me/albums allows

const artistUris = (artists: SimplifiedArtist[]) => artists.map(a => a.uri).join(', ')
const artistNames = (artists: SimplifiedArtist[]) => artists.map(a => (a.name ?? "").replace(/,/g, "\\,")).join(', ')
const sanitize = (value: CsvValue) => '"' + String(value).replace(/"/g, '""') + '"'

// Handles exporting saved albums as a CSV file, one line per album
class SavedAlbumsExporter {
  playlist: SavedAlbumsPlaylist

  constructor(playlist: SavedAlbumsPlaylist) {
    this.playlist = playlist
  }

  async export() {
    const blob = new Blob([await this.csvData()], { type: "text/csv;charset=utf-8" })
    saveAs(blob, this.fileName(), { autoBom: false })
  }

  async csvData() {
    const columnNames = [
      i18n.t("track.album_uri"),
      i18n.t("track.album_name"),
      i18n.t("track.album_artist_uris"),
      i18n.t("track.album_artist_names"),
      i18n.t("saved_albums.album_type"),
      i18n.t("track.album_release_date"),
      i18n.t("saved_albums.total_tracks"),
      i18n.t("track.album.label"),
      i18n.t("saved_albums.upc"),
      i18n.t("track.popularity"),
      i18n.t("track.album_image_url"),
      i18n.t("track.added_at")
    ]

    const lines = (await this.savedAlbums()).map(({ album, added_at }) => [
      album.uri,
      album.name,
      artistUris(album.artists),
      artistNames(album.artists),
      album.album_type ?? '',
      album.release_date ?? '',
      album.total_tracks ?? '',
      album.label,
      album.external_ids.upc ?? '',
      album.popularity,
      album.images[0]?.url ?? '',
      added_at
    ])

    return [columnNames, ...lines].map(line => line.map(sanitize).join(",") + "\n").join("")
  }

  fileName(withExtension = true): string {
    return "saved_albums" + (withExtension ? this.fileExtension() : "")
  }

  fileExtension(): string {
    return ".csv"
  }

  private async savedAlbums() {
    const requests = []

    for (let offset = 0; offset < this.playlist.albums.total; offset = offset + LIMIT) {
      requests.push(apiCall<Paging<SavedAlbum>>(`${this.playlist.albums.href}?offset=${offset}&limit=${LIMIT}`))
    }

    const responses = await Promise.all(requests)

    return responses.flatMap(response => response.data.items)
  }
}

export default SavedAlbumsExporter

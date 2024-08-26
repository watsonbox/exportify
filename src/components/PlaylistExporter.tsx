import { saveAs } from "file-saver"
import i18n from "../i18n/config"

import TracksData from "components/data/TracksData"
import TracksBaseData from "components/data/TracksBaseData"
import TracksArtistsData from "components/data/TracksArtistsData"
import TracksAudioFeaturesData from "components/data/TracksAudioFeaturesData"
import TracksAlbumData from "components/data/TracksAlbumData"

class TracksCsvFile {
  playlist: any
  trackItems: any
  columnNames: string[]
  lineData: Map<string, string[]>

  lineTrackUris: string[]
  lineTrackData: string[][]

  constructor(playlist: any, trackItems: any) {
    this.playlist = playlist
    this.trackItems = trackItems
    this.columnNames = [
      i18n.t("track.added_by"),
      i18n.t("track.added_at")
    ]

    this.lineData = new Map()
    this.lineTrackUris = trackItems.map((i: any) => i.track.uri)
    this.lineTrackData = trackItems.map((i: any) => [
      i.added_by == null ? '' : i.added_by.uri,
      i.added_at
    ])
  }

  async addData(tracksData: TracksData, before = false) {
    if (before) {
      this.columnNames.unshift(...tracksData.dataLabels())
    } else {
      this.columnNames.push(...tracksData.dataLabels())
    }

    const data: Map<string, string[]> = await tracksData.data()

    this.lineTrackUris.forEach((uri: string, index: number) => {
      if (data.has(uri)) {
        if (before) {
          this.lineTrackData[index].unshift(...data.get(uri)!)
        } else {
          this.lineTrackData[index].push(...data.get(uri)!)
        }
      }
    })
  }

  content(): string {
    let csvContent = ''

    csvContent += this.columnNames.map(this.sanitize).join() + "\n"

    this.lineTrackData.forEach((lineTrackData, trackId) => {
      csvContent += lineTrackData.map(this.sanitize).join(",") + "\n"
    })

    return csvContent
  }

  sanitize(string: string): string {
    return '"' + String(string).replace(/"/g, '""') + '"'
  }
}

// Handles exporting a single playlist as a CSV file
class PlaylistExporter {
  accessToken: string
  playlist: any
  config: any

  constructor(accessToken: string, playlist: any, config: any) {
    this.accessToken = accessToken
    this.playlist = playlist
    this.config = config
  }

  async export() {
    return this.csvData().then((data) => {
      var blob = new Blob([data], { type: "text/csv;charset=utf-8" })
      saveAs(blob, this.fileName(), { autoBom: false })
    })
  }

  async csvData() {
    const tracksBaseData = new TracksBaseData(this.accessToken, this.playlist)
    const items = await tracksBaseData.trackItems()
    const tracks = items.map(i => i.track)
    const tracksCsvFile = new TracksCsvFile(this.playlist, items)

    // Add base data before existing (item) data, for backward compatibility
    await tracksCsvFile.addData(tracksBaseData, true)

    if (this.config.includeArtistsData) {
      await tracksCsvFile.addData(new TracksArtistsData(this.accessToken, tracks))
    }

    if (this.config.includeAudioFeaturesData) {
      await tracksCsvFile.addData(new TracksAudioFeaturesData(this.accessToken, tracks))
    }

    if (this.config.includeAlbumData) {
      await tracksCsvFile.addData(new TracksAlbumData(this.accessToken, tracks))
    }

    return tracksCsvFile.content()
  }

  fileName(withExtension = true): string {
    return this.playlist.name.replace(/[\x00-\x1F\x7F/\\<>:;"|=,.?*[\] ]+/g, "_").toLowerCase() + (withExtension ? this.fileExtension() : "") // eslint-disable-line no-control-regex
  }

  fileExtension(): string {
    return ".csv"
  }
}

export default PlaylistExporter

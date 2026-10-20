import { saveAs } from "file-saver"
import i18n from "../i18n/config"

import TracksData, { CsvValue } from "components/data/TracksData"
import TracksBaseData, { TrackItem } from "components/data/TracksBaseData"
import TracksArtistsData from "components/data/TracksArtistsData"
import TracksAudioFeaturesData from "components/data/TracksAudioFeaturesData"
import TracksAlbumData from "components/data/TracksAlbumData"
import { TracksPlaylist } from "components/data/PlaylistsData"
import { ExportConfig } from "components/ConfigDropdown"

class TracksCsvFile {
  playlist: TracksPlaylist
  trackItems: TrackItem[]
  columnNames: string[]
  lineData: Map<string, CsvValue[]>

  lineTrackUris: string[]
  lineTrackData: CsvValue[][]

  constructor(playlist: TracksPlaylist, trackItems: TrackItem[]) {
    this.playlist = playlist
    this.trackItems = trackItems
    this.columnNames = [
      i18n.t("track.added_by"),
      i18n.t("track.added_at")
    ]

    this.lineData = new Map()
    this.lineTrackUris = trackItems.map((i) => i.track.uri)
    this.lineTrackData = trackItems.map((i) => [
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

    const data = await tracksData.data()

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

    this.lineTrackData.forEach((lineTrackData) => {
      csvContent += lineTrackData.map(this.sanitize).join(",") + "\n"
    })

    return csvContent
  }

  sanitize(value: CsvValue): string {
    return '"' + String(value).replace(/"/g, '""') + '"'
  }
}

// Handles exporting a single playlist as a CSV file
class PlaylistExporter {
  playlist: TracksPlaylist
  config: ExportConfig

  constructor(playlist: TracksPlaylist, config: ExportConfig) {
    this.playlist = playlist
    this.config = config
  }

  async export() {
    return this.csvData().then((data) => {
      const blob = new Blob([data], { type: "text/csv;charset=utf-8" })
      saveAs(blob, this.fileName(), { autoBom: false })
    })
  }

  async csvData() {
    const tracksBaseData = new TracksBaseData(this.playlist)
    const items = await tracksBaseData.trackItems()
    const tracks = items.map(i => i.track)
    const tracksCsvFile = new TracksCsvFile(this.playlist, items)

    // Add base data before existing (item) data, for backward compatibility
    await tracksCsvFile.addData(tracksBaseData, true)

    if (this.config.includeArtistsData) {
      await tracksCsvFile.addData(new TracksArtistsData(tracks))
    }

    if (this.config.includeAudioFeaturesData) {
      await tracksCsvFile.addData(new TracksAudioFeaturesData(tracks))
    }

    if (this.config.includeAlbumData) {
      await tracksCsvFile.addData(new TracksAlbumData(tracks))
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

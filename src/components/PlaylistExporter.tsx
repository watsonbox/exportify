import { saveAs } from "file-saver"

import TracksData from "components/data/TracksData"
import TracksBaseData from "components/data/TracksBaseData"
import TracksArtistsData from "components/data/TracksArtistsData"
import TracksAudioFeaturesData from "components/data/TracksAudioFeaturesData"
import TracksExtendedAlbumData from "components/data/TracksExtendedAlbumData"

class TracksCsvFile {
  playlist: any
  columnNames: string[]
  lineData: Map<string, string[]>

  constructor(playlist: any) {
    this.playlist = playlist
    this.columnNames = []
    this.lineData = new Map()
  }

  async addData(tracksData: TracksData) {
    this.columnNames.push(...tracksData.dataLabels())

    const data: Map<string, string[]> = await tracksData.data()

    data.forEach((value: string[], key: string) => {
      if (this.lineData.has(key)) {
        this.lineData.get(key)!.push(...value)
      } else {
        this.lineData.set(key, value)
      }
    })
  }

  content(): string {
    let csvContent = ''

    csvContent += this.columnNames.map(this.sanitize).join() + "\n"

    this.lineData.forEach((lineData, trackId) => {
      csvContent += lineData.map(this.sanitize).join(",") + "\n"
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
      var blob = new Blob([ data ], { type: "text/csv;charset=utf-8" })
      saveAs(blob, this.fileName(), true)
    })
  }

  async csvData() {
    const tracksCsvFile = new TracksCsvFile(this.playlist)
    const tracksBaseData = new TracksBaseData(this.accessToken, this.playlist)

    await tracksCsvFile.addData(tracksBaseData)
    const tracks = await tracksBaseData.tracks()

    if (this.config.includeArtistsData) {
      const tracksArtistsData = new TracksArtistsData(this.accessToken, tracks)
      await tracksCsvFile.addData(tracksArtistsData)
    }

    if (this.config.includeAudioFeaturesData) {
      const tracksAudioFeaturesData = new TracksAudioFeaturesData(this.accessToken, tracks)
      await tracksCsvFile.addData(tracksAudioFeaturesData)
    }

    if (this.config.includeExtendedAlbumData) {
      const tracksExtendedAlbumData = new TracksExtendedAlbumData(this.accessToken, tracks)
      await tracksCsvFile.addData(tracksExtendedAlbumData)
    }

    tracksBaseData.tracks()

    return tracksCsvFile.content()
  }

  fileName(): string {
    return this.playlist.name.replace(/[\x00-\x1F\x7F/\\<>:;"|=,.?*[\] ]+/g, "_").toLowerCase() + ".csv" // eslint-disable-line no-control-regex
  }
}

export default PlaylistExporter

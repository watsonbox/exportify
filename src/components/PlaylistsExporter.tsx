import React from "react"
import { withTranslation, WithTranslation } from "react-i18next"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { saveAs } from "file-saver"
import JSZip from "jszip"

import PlaylistExporter from "./PlaylistExporter"
import SavedAlbumsExporter from "./SavedAlbumsExporter"
import PlaylistsData from "./data/PlaylistsData"
import { ExportConfig } from "./ConfigDropdown"

interface PlaylistsExporterProps extends WithTranslation {
  playlistsData: PlaylistsData
  searchQuery: string
  config: ExportConfig
  onPlaylistExportStarted: (playlistName: string, doneCount: number) => void
  onPlaylistsExportDone: () => void
  onApiError: (error: unknown) => void
}

// Handles exporting all playlist data as a zip file
class PlaylistsExporter extends React.Component<PlaylistsExporterProps> {
  state = {
    exporting: false
  }

  async export(playlistsData: PlaylistsData, searchQuery: string, config: ExportConfig) {
    const playlistFileNames = new Set<string>()
    const playlistCsvExports = new Array<string>()

    const playlists = searchQuery === "" ? await playlistsData.all() : await playlistsData.search(searchQuery)

    let doneCount = 0

    for (const playlist of playlists) {
      this.props.onPlaylistExportStarted(playlist.name, doneCount)

      const exporter = "albums" in playlist ? new SavedAlbumsExporter(playlist) : new PlaylistExporter(playlist, config)
      const csvData = await exporter.csvData()
      let fileName = exporter.fileName(false)

      for (let i = 1; playlistFileNames.has(fileName + exporter.fileExtension()); i++) {
        fileName = exporter.fileName(false) + ` (${i})`
      }

      playlistFileNames.add(fileName + exporter.fileExtension())
      playlistCsvExports.push(csvData)

      doneCount++
    }

    this.props.onPlaylistsExportDone()

    const zip = new JSZip()

    Array.from(playlistFileNames).forEach(function (fileName, i) {
      zip.file(fileName, playlistCsvExports[i])
    })

    saveAs(await zip.generateAsync({ type: "blob" }), "spotify_playlists.zip")
  }

  exportPlaylists = () => {
    this.setState(
      { exporting: true },
      () => {
        this.export(
          this.props.playlistsData,
          this.props.searchQuery,
          this.props.config
        ).catch(this.props.onApiError).finally(() => {
          this.setState({ exporting: false })
        })
      }
    )
  }

  render() {
    const text = this.props.searchQuery === "" ? this.props.i18n.t("export_all") : this.props.i18n.t("export_search_results")

    return <Button type="submit" variant="outline-secondary" onClick={this.exportPlaylists} className="text-nowrap btn-xs" disabled={this.state.exporting} >
      <FontAwesomeIcon icon={['far', 'file-archive']} /> {text}
    </Button >
  }
}

export default withTranslation()(PlaylistsExporter)

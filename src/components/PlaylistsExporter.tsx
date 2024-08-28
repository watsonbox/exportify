import React from "react"
import { withTranslation, WithTranslation } from "react-i18next"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { saveAs } from "file-saver"
import JSZip from "jszip"

import PlaylistExporter from "./PlaylistExporter"
import { apiCallErrorHandler } from "helpers"
import PlaylistsData from "./data/PlaylistsData"

interface PlaylistsExporterProps extends WithTranslation {
  accessToken: string
  playlistsData: PlaylistsData
  searchQuery: string
  config: any
  onPlaylistExportStarted: (playlistName: string, doneCount: number) => void
  onPlaylistsExportDone: () => void
}

// Handles exporting all playlist data as a zip file
class PlaylistsExporter extends React.Component<PlaylistsExporterProps> {
  state = {
    exporting: false
  }

  async export(accessToken: string, playlistsData: PlaylistsData, searchQuery: string, config: any) {
    let playlistFileNames = new Set<string>()
    let playlistCsvExports = new Array<string>()

    const playlists = searchQuery === "" ? await playlistsData.all() : await playlistsData.search(searchQuery)

    let doneCount = 0

    for (const playlist of playlists) {
      this.props.onPlaylistExportStarted(playlist.name, doneCount)

      let exporter = new PlaylistExporter(accessToken, playlist, config)
      let csvData = await exporter.csvData()
      let fileName = exporter.fileName(false)

      for (let i = 1; playlistFileNames.has(fileName + exporter.fileExtension()); i++) {
        fileName = exporter.fileName(false) + ` (${i})`
      }

      playlistFileNames.add(fileName + exporter.fileExtension())
      playlistCsvExports.push(csvData)

      doneCount++
    }

    this.props.onPlaylistsExportDone()

    var zip = new JSZip()

    Array.from(playlistFileNames).forEach(function (fileName, i) {
      zip.file(fileName, playlistCsvExports[i])
    })

    zip.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, "spotify_playlists.zip");
    })
  }

  exportPlaylists = () => {
    this.setState(
      { exporting: true },
      () => {
        this.export(
          this.props.accessToken,
          this.props.playlistsData,
          this.props.searchQuery,
          this.props.config
        ).catch(apiCallErrorHandler).then(() => {
          this.setState({ exporting: false })
        })
      }
    )
  }

  render() {
    const text = this.props.searchQuery === "" ? this.props.i18n.t("export_all") : this.props.i18n.t("export_search_results")

    // @ts-ignore
    return <Button type="submit" variant="outline-secondary" size="xs" onClick={this.exportPlaylists} className="text-nowrap" disabled={this.state.exporting} >
      <FontAwesomeIcon icon={['far', 'file-archive']} /> {text}
    </Button >
  }
}

export default withTranslation()(PlaylistsExporter)

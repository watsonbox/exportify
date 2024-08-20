import React from "react"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { saveAs } from "file-saver"
import JSZip from "jszip"

import PlaylistExporter from "./PlaylistExporter"
import { apiCallErrorHandler } from "helpers"

// Handles exporting all playlist data as a zip file
class PlaylistsExporter extends React.Component {
  async export(accessToken, playlistsData, searchQuery, config) {
    let playlistFileNames = []
    let playlistCsvExports = []

    const playlists = searchQuery === "" ?
      await playlistsData.all(this.props.onLoadedPlaylistCountChanged) :
      await playlistsData.search(searchQuery, this.props.onLoadedPlaylistCountChanged)

    let doneCount = 0

    for (const playlist of playlists) {
      this.props.onPlaylistExportStarted(playlist.name, doneCount)

      let exporter = new PlaylistExporter(accessToken, playlist, config)
      let csvData = await exporter.csvData()

      playlistFileNames.push(exporter.fileName(playlist))
      playlistCsvExports.push(csvData)

      doneCount++
    }

    this.props.onPlaylistsExportDone()

    var zip = new JSZip()

    playlistCsvExports.forEach(function(csv, i) {
      zip.file(playlistFileNames[i], csv)
    })

    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, "spotify_playlists.zip");
    })
  }

  exportPlaylists = () => {
    this.export(
      this.props.accessToken,
      this.props.playlistsData,
      this.props.searchQuery,
      this.props.config
    ).catch(apiCallErrorHandler)
  }

  render() {
    const text = this.props.searchQuery === "" ? "Export All" : "Export Results"

    return <Button type="submit" variant="outline-secondary" size="xs" onClick={this.exportPlaylists} className="text-nowrap">
      <FontAwesomeIcon icon={['far', 'file-archive']} /> {text}
    </Button>
  }
}

export default PlaylistsExporter

import React from "react"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { saveAs } from "file-saver"
import JSZip from "jszip"

import PlaylistExporter from "./PlaylistExporter"
import { apiCallErrorHandler } from "helpers"

// Handles exporting all playlist data as a zip file
class PlaylistsExporter extends React.Component {
  async export(accessToken, playlistsData, config) {
    let playlistFileNames = []
    let playlistCsvExports = []

    const playlists = await playlistsData.all(this.props.onLoadedPlaylistCountChanged)

    let doneCount = 0

    for (const playlist of playlists) {
      if(playlist){
        this.props.onPlaylistExportStarted(playlist.name, doneCount)
  
        let exporter = new PlaylistExporter(accessToken, playlist, config)
        let csvData = await exporter.csvData()
  
        playlistFileNames.push(exporter.fileName(playlist))
        playlistCsvExports.push(csvData)
  
        doneCount++
      }
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
      this.props.config
    ).catch(apiCallErrorHandler)
  }

  render() {
    return <Button type="submit" variant="outline-secondary" size="xs" onClick={this.exportPlaylists} className="text-nowrap" disabled={this.props.disabled}>
      <FontAwesomeIcon icon={['far', 'file-archive']}/> Export All
    </Button>
  }
}

export default PlaylistsExporter

import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { saveAs } from "file-saver"
import JSZip from "jszip"

import PlaylistExporter from "./PlaylistExporter"
import { apiCall } from "helpers"

// Handles exporting all playlist data as a zip file
class PlaylistsExporter extends React.Component {
  async export(accessToken, playlistCount, likedSongsLimit, likedSongsCount) {
    var playlistFileNames = []
    var playlistCsvExports = []

    apiCall("https://api.spotify.com/v1/me", accessToken).then(async (response) => {
      var limit = 20;
      var userId = response.id;
      var requests = [];

      // Add playlists
      for (var offset = 0; offset < playlistCount; offset = offset + limit) {
        var url = "https://api.spotify.com/v1/users/" + userId + "/playlists";
        requests.push(`${url}?offset=${offset}&limit=${limit}`)
      }

      let playlistPromises = requests.map((request, index) => {
        return apiCall(request, accessToken).then((response) => {
          this.props.onLoadedPlaylistsCountChanged((index + 1) * limit)
          return response
        })
      })

      let playlists = (await Promise.all(playlistPromises)).flatMap(response => response.items)

      // Add library of saved tracks
      playlists.unshift({
        "id": "liked",
        "name": "Liked",
        "tracks": {
          "href": "https://api.spotify.com/v1/me/tracks",
          "limit": likedSongsLimit,
          "total": likedSongsCount
        },
      })

      let trackPromises = playlists.map((playlist, index) => {
        return PlaylistExporter.csvData(accessToken, playlist).then((csvData) => {
          playlistFileNames.push(PlaylistExporter.fileName(playlist))
          playlistCsvExports.push(csvData)
          this.props.onExportedPlaylistsCountChanged(index + 1)
        })
      })

      await Promise.all(trackPromises)

      var zip = new JSZip()

      playlistCsvExports.forEach(function(csv, i) {
        zip.file(playlistFileNames[i], csv)
      })

      zip.generateAsync({ type: "blob" }).then(function(content) {
        saveAs(content, "spotify_playlists.zip");
      })
    })
  }

  exportPlaylists = () => {
    this.export(this.props.accessToken, this.props.playlistCount, this.props.likedSongs.limit, this.props.likedSongs.count)
  }

  render() {
    return <button className="btn btn-default btn-xs" type="submit" onClick={this.exportPlaylists}>
      <span className="fa fa-file-archive"></span><FontAwesomeIcon icon={['far', 'file-archive']}/> Export All
    </button>
  }
}

export default PlaylistsExporter

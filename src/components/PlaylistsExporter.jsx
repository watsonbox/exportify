import $ from "jquery" // TODO: Remove jQuery dependency
import { saveAs } from "file-saver"
import JSZip from "jszip"

import PlaylistExporter from "./PlaylistExporter"
import { apiCall } from "helpers"

// Handles exporting all playlist data as a zip file
let PlaylistsExporter = {
  export: function(access_token, playlistCount, likedSongsLimit, likedSongsCount) {
    var playlistFileNames = [];

    apiCall("https://api.spotify.com/v1/me", access_token).then(function(response) {
      var limit = 20;
      var userId = response.id;
      var requests = [];

      // Add playlists
      for (var offset = 0; offset < playlistCount; offset = offset + limit) {
        var url = "https://api.spotify.com/v1/users/" + userId + "/playlists";
        requests.push(
          apiCall(`${url}?offset=${offset}&limit=${limit}`, access_token)
        )
      }

      $.when.apply($, requests).then(function() {
        var playlists = [];
        var playlistExports = [];

        // Handle either single or multiple responses
        if (typeof arguments[0].href == 'undefined') {
          $(arguments).each(function(i, response) {
            if (typeof response[0].items === 'undefined') {
              // Single playlist
              playlists.push(response[0]);
            } else {
              // Page of playlists
              $.merge(playlists, response[0].items);
            }
          })
        } else {
          playlists = arguments[0].items
        }

        // Add library of saved tracks
        playlists.unshift({
          "id": "liked",
          "name": "Liked",
          "tracks": {
            "href": "https://api.spotify.com/v1/me/tracks",
            "limit": likedSongsLimit,
            "total": likedSongsCount
          },
        });

        $(playlists).each(function(i, playlist) {
          playlistFileNames.push(PlaylistExporter.fileName(playlist));
          playlistExports.push(PlaylistExporter.csvData(access_token, playlist));
        });

        return $.when.apply($, playlistExports);
      }).then(function() {
        var zip = new JSZip();

        $(arguments).each(function(i, response) {
          zip.file(playlistFileNames[i], response)
        });

        zip.generateAsync({ type: "blob" }).then(function(content) {
          saveAs(content, "spotify_playlists.zip");
        })
      });
    });
  }
}

export default PlaylistsExporter

import $ from "jquery" // TODO: Remove jQuery dependency
import { saveAs } from "file-saver"

import { apiCall } from "helpers"

// Handles exporting a single playlist as a CSV file
var PlaylistExporter = {
  export: function(access_token, playlist) {
    this.csvData(access_token, playlist).then((data) => {
      var blob = new Blob([ data ], { type: "text/csv;charset=utf-8" });
      saveAs(blob, this.fileName(playlist), true);
    })
  },

  csvData: function(access_token, playlist) {
    var requests = [];
    var limit = playlist.tracks.limit || 100;

    for (var offset = 0; offset < playlist.tracks.total; offset = offset + limit) {
      requests.push(
        apiCall(`${playlist.tracks.href.split('?')[0]}?offset=${offset}&limit=${limit}`, access_token)
      )
    }

    return $.when.apply($, requests).then(function() {
      var responses = [];

      // Handle either single or multiple responses
      if (typeof arguments[0] != 'undefined') {
        if (typeof arguments[0].href == 'undefined') {
          responses = Array.prototype.slice.call(arguments).map(function(a) { return a[0] });
        } else {
          responses = [arguments[0]];
        }
      }

      var tracks = responses.map(function(response) {
        return response.items.map(function(item) {
          return item.track && [
            item.track.uri,
            item.track.name,
            item.track.artists.map(function(artist) { return artist.uri }).join(', '),
            item.track.artists.map(function(artist) { return String(artist.name).replace(/,/g, "\\,") }).join(', '),
            item.track.album.uri,
            item.track.album.name,
            item.track.disc_number,
            item.track.track_number,
            item.track.duration_ms,
            item.added_by == null ? '' : item.added_by.uri,
            item.added_at
          ];
        }).filter(e => e);
      });

      // Flatten the array of pages
      tracks = $.map(tracks, function(n) { return n })

      tracks.unshift([
        "Track URI",
        "Track Name",
        "Artist URI",
        "Artist Name",
        "Album URI",
        "Album Name",
        "Disc Number",
        "Track Number",
        "Track Duration (ms)",
        "Added By",
        "Added At"
      ]);

      let csvContent = '';

      tracks.forEach(function(row, index){
        let dataString = row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(",");
        csvContent += dataString + "\n";
      });

      return csvContent;
    });
  },

  fileName: function(playlist) {
    return playlist.name.replace(/[\x00-\x1F\x7F/\\<>:;"|=,.?*[\] ]+/g, "_").toLowerCase() + ".csv"; // eslint-disable-line no-control-regex
  }
}

export default PlaylistExporter

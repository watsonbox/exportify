import { saveAs } from "file-saver"

import { apiCall } from "helpers"

// Handles exporting a single playlist as a CSV file
var PlaylistExporter = {
  export: function(accessToken, playlist) {
    return this.csvData(accessToken, playlist).then((data) => {
      var blob = new Blob([ data ], { type: "text/csv;charset=utf-8" });
      saveAs(blob, this.fileName(playlist), true);
    })
  },

  csvData: async function(accessToken, playlist) {
    var requests = [];
    var limit = playlist.tracks.limit || 100;

    // Add tracks
    for (var offset = 0; offset < playlist.tracks.total; offset = offset + limit) {
      requests.push(`${playlist.tracks.href.split('?')[0]}?offset=${offset}&limit=${limit}`)
    }

    let promises = requests.map((request) => {
      return apiCall(request, accessToken)
    })

    let tracks = (await Promise.all(promises)).flatMap(response => {
      return response.data.items.map(item => {
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
      }).filter(e => e)
    })

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
  },

  fileName: function(playlist) {
    return playlist.name.replace(/[\x00-\x1F\x7F/\\<>:;"|=,.?*[\] ]+/g, "_").toLowerCase() + ".csv"; // eslint-disable-line no-control-regex
  }
}

export default PlaylistExporter

window.Helpers = {
  authorize: function() {
    var client_id = this.getQueryParam('app_client_id');

    // Use Exportify application client_id if none given
    if (client_id == '') {
      client_id = "9950ac751e34487dbbe027c4fd7f8e99"
    }

    window.location = "https://accounts.spotify.com/authorize" +
      "?client_id=" + client_id +
      "&redirect_uri=" + encodeURIComponent([location.protocol, '//', location.host, location.pathname].join('')) +
      "&scope=playlist-read-private%20playlist-read-collaborative" +
      "&response_type=token";
  },

  // http://stackoverflow.com/a/901144/4167042
  getQueryParam: function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  },

  apiCall: function(url, access_token) {
    return $.ajax({
      url: url,
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    }).fail(function (jqXHR, textStatus) {
      if (jqXHR.status == 401) {
        // Return to home page after auth token expiry
        window.location = window.location.href.split('#')[0]
      } else if (jqXHR.status == 429) {
        // API Rate-limiting encountered
        window.location = window.location.href.split('#')[0] + '?rate_limit_message=true'
      } else {
        // Otherwise report the error so user can raise an issue
        alert(jqXHR.responseText);
      }
    })
  },

  getTracksRequests: function(url, total, access_token) {
    limit = 100;
    var requests = [];

    for (var offset = 0; offset < total; offset = offset + limit) {
      requests.push(
        window.Helpers.apiCall(url + '?offset=' + offset + '&limit=' + limit, access_token)
      )
    }
    return requests;
  },

  getAlbumsRequests: function(ids, access_token) {
    limit = 20;
    var requests = [];

    for (var id = 0; id < ids.length; id = id + limit) {
      var subIds = ids.slice(id, id + limit);
      requests.push(
        window.Helpers.apiCall('https://api.spotify.com/v1/albums' + '?ids=' + subIds.join(','), access_token)
      )
    }

    return requests;
  },

  getArtistsRequests: function(ids, access_token) {
    limit = 50;
    var requests = [];

    for (var id = 0; id < ids.length; id = id + limit) {
      var subIds = ids.slice(id, id + limit);
      requests.push(
        window.Helpers.apiCall('https://api.spotify.com/v1/artists' + '?ids=' + subIds.join(','), access_token)
      )
    }

    return requests;
  },

  fetchRequests: function(requests) {
    return $.when.apply($, requests).then(function() {
      var responses = Array.from(arguments).slice(0, requests.length);

      // Handle either single or multiple responses
      if (typeof responses[0] != 'undefined') {
        if (Array.isArray(responses[0])) {
          responses = Array.prototype.slice.call(responses).map(function(a) { return a[0] });
        } else {
          responses = [responses[0]];
        }
      }

      return responses;
    });
  },

  fetchFullTracks: function(access_token, playlist) {
    var tracksRequests = Helpers.getTracksRequests(playlist.tracks.href.split('?')[0], playlist.tracks.total, access_token);

    return Helpers.fetchRequests(tracksRequests)
      .then(function(responses) {
        var trackItems = responses.map(function(response) { return response.items });
        trackItems = $.map(trackItems, function(n) { return n });
        return trackItems;
      })
      .then(function(trackItems) {
        var albumsIds = trackItems.map(function(trackItem) {return trackItem.track.album.id});
        var albumsRequests = Helpers.getAlbumsRequests(albumsIds, access_token);
        return Helpers.fetchRequests(albumsRequests)
          .then(function(responses) {
            var albums = responses.map(function(response) { return response.albums });
            albums = $.map(albums, function(n) { return n });
            return {trackItems: trackItems, albums: albums};
          })
      })
      .then(function(obj) {
        var trackItems = obj.trackItems;
        var artistsIds = trackItems.map(function(trackItem) { return trackItem.track.artists.map(function(artist) { return artist.id })});
        artistsIds = $.map(artistsIds, function(n) { return n });

        var artistsRequests = Helpers.getArtistsRequests(artistsIds, access_token);
        return Helpers.fetchRequests(artistsRequests)
          .then(function(responses) {
            var artists = responses.map(function(response) { return response.artists });
            artists = $.map(artists, function(n) { return n });
            return {trackItems: trackItems, albums: obj.albums, artists: artists};
          })
      })
      .then(function(obj) {
        var trackItems = obj.trackItems;
        var allAlbums = obj.albums;
        var allArtists = obj.artists;

        trackItems = trackItems.map(function(trackItem) {
          var album = allAlbums.find(function(album) { return album.id === trackItem.track.album.id });
          trackItem.track.album = album;
          return trackItem;
        });

        trackItems = trackItems.map(function(trackItem) {
          var trackArtistIds = trackItem.track.artists.map(function(artist) { return artist.id });
          var artists = allArtists.filter(function(artist) { return trackArtistIds.includes(artist.id) });
          trackItem.track.artists = artists;
          return trackItem;
        });

        return trackItems;
      });
  }
}


var PlaylistTable = React.createClass({
  getInitialState: function() {
    return {
      playlists: [],
      playlistCount: 0,
      nextURL: null,
      prevURL: null
    };
  },

  loadPlaylists: function(url) {
    var userId = '';
    var firstPage = typeof url === 'undefined' || url.indexOf('offset=0') > -1;

    window.Helpers.apiCall("https://api.spotify.com/v1/me", this.props.access_token).then(function(response) {
      userId = response.id;

      // Show starred playlist if viewing first page
      if (firstPage) {
        return $.when.apply($, [
          window.Helpers.apiCall(
            "https://api.spotify.com/v1/users/" + userId + "/starred",
            this.props.access_token
          ),
          window.Helpers.apiCall(
            "https://api.spotify.com/v1/users/" + userId + "/playlists",
            this.props.access_token
          )
        ])
      } else {
        return window.Helpers.apiCall(url, this.props.access_token);
      }
    }.bind(this)).done(function() {
      var response;
      var playlists = [];

      if (arguments[1] === 'success') {
        response = arguments[0];
        playlists = arguments[0].items;
      } else {
        response = arguments[1][0];
        playlists = $.merge([arguments[0][0]], arguments[1][0].items);
      }

      if (this.isMounted()) {
        this.setState({
          playlists: playlists,
          playlistCount: response.total,
          nextURL: response.next,
          prevURL: response.previous
        });

        $('#playlists').fadeIn();
        $('#subtitle').text((response.offset + 1) + '-' + (response.offset + response.items.length) + ' of ' + response.total + ' playlists for ' + userId)
      }
    }.bind(this))
  },

  exportPlaylists: function() {
    PlaylistsExporter.export(this.props.access_token, this.state.playlistCount);
  },

  componentDidMount: function() {
    this.loadPlaylists(this.props.url);
  },

  render: function() {
    if (this.state.playlists.length > 0) {
      return (
        <div id="playlists">
          <Paginator nextURL={this.state.nextURL} prevURL={this.state.prevURL} loadPlaylists={this.loadPlaylists}/>
          <table className="table table-hover">
            <thead>
              <tr>
                <th style={{width: "30px"}}></th>
                <th>Name</th>
                <th style={{width: "150px"}}>Owner</th>
                <th style={{width: "100px"}}>Tracks</th>
                <th style={{width: "120px"}}>Public?</th>
                <th style={{width: "120px"}}>Collaborative?</th>
                <th style={{width: "100px"}} className="text-right"><button className="btn btn-default btn-xs" type="submit" onClick={this.exportPlaylists}><span className="fa fa-file-archive-o"></span> Export All</button></th>
              </tr>
            </thead>
            <tbody>
              {this.state.playlists.map(function(playlist, i) {
                return <PlaylistRow playlist={playlist} key={playlist.id} access_token={this.props.access_token}/>;
              }.bind(this))}
            </tbody>
          </table>
          <Paginator nextURL={this.state.nextURL} prevURL={this.state.prevURL} loadPlaylists={this.loadPlaylists}/>
        </div>
      );
    } else {
      return <div className="spinner"></div>
    }
  }
});

var PlaylistRow = React.createClass({
  exportPlaylist: function() {
    PlaylistExporter.export(this.props.access_token, this.props.playlist);
  },

  renderTickCross: function(condition) {
    if (condition) {
      return <i className="fa fa-lg fa-check-circle-o"></i>
    } else {
      return <i className="fa fa-lg fa-times-circle-o" style={{ color: '#ECEBE8' }}></i>
    }
  },

  renderIcon: function(playlist) {
    if (playlist.name == 'Starred') {
      return <i className="glyphicon glyphicon-star" style={{ color: 'gold' }}></i>;
    } else {
      return <i className="fa fa-music"></i>;
    }
  },

  render: function() {
    playlist = this.props.playlist
    if(playlist.uri==null) return (
      <tr key={this.props.key}>
        <td>{this.renderIcon(playlist)}</td>
        <td>{playlist.name}</td>
        <td colSpan="2">This playlist is not supported</td>
        <td>{this.renderTickCross(playlist.public)}</td>
        <td>{this.renderTickCross(playlist.collaborative)}</td>
        <td>&nbsp;</td>
      </tr>
    );
    return (
      <tr key={this.props.key}>
        <td>{this.renderIcon(playlist)}</td>
        <td><a href={playlist.uri}>{playlist.name}</a></td>
        <td><a href={playlist.owner.uri}>{playlist.owner.id}</a></td>
        <td>{playlist.tracks.total}</td>
        <td>{this.renderTickCross(playlist.public)}</td>
        <td>{this.renderTickCross(playlist.collaborative)}</td>
        <td className="text-right"><button className="btn btn-default btn-xs btn-success" type="submit" onClick={this.exportPlaylist}><span className="glyphicon glyphicon-save"></span> Export</button></td>
      </tr>
    );
  }
});

var Paginator = React.createClass({
  nextClick: function(e) {
    e.preventDefault()

    if (this.props.nextURL != null) {
      this.props.loadPlaylists(this.props.nextURL)
    }
  },

  prevClick: function(e) {
    e.preventDefault()

    if (this.props.prevURL != null) {
      this.props.loadPlaylists(this.props.prevURL)
    }
  },

  render: function() {
    if (this.props.nextURL != null || this.props.prevURL != null) {
      return (
        <nav className="paginator text-right">
          <ul className="pagination pagination-sm">
            <li className={this.props.prevURL == null ? 'disabled' : ''}>
              <a href="#" aria-label="Previous" onClick={this.prevClick}>
                <span aria-hidden="true">&laquo;</span>
              </a>
            </li>
            <li className={this.props.nextURL == null ? 'disabled' : ''}>
              <a href="#" aria-label="Next" onClick={this.nextClick}>
                <span aria-hidden="true">&raquo;</span>
              </a>
            </li>
          </ul>
        </nav>
      )
    } else {
      return <div>&nbsp;</div>
    }
  }
});

// Handles exporting all playlist data as a zip file
var PlaylistsExporter = {
  export: function(access_token, playlistCount) {
    var playlistFileNames = [];

    window.Helpers.apiCall("https://api.spotify.com/v1/me", access_token).then(function(response) {
      var limit = 20;
      var userId = response.id;

      // Initialize requests with starred playlist
      var requests = [
        window.Helpers.apiCall(
          "https://api.spotify.com/v1/users/" + userId + "/starred",
          access_token
        )
      ];

      // Add other playlists
      for (var offset = 0; offset < playlistCount; offset = offset + limit) {
        var url = "https://api.spotify.com/v1/users/" + userId + "/playlists";
        requests.push(
          window.Helpers.apiCall(url + '?offset=' + offset + '&limit=' + limit, access_token)
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

        $(playlists).each(function(i, playlist) {
          playlistFileNames.push(PlaylistExporter.fileName(playlist));
          playlistExports.push(PlaylistExporter.csvData(access_token, playlist));
        });

        return $.when.apply($, playlistExports);
      }).then(function() {
        var zip = new JSZip();
        var responses = [];

        $(arguments).each(function(i, response) {
          zip.file(playlistFileNames[i], response)
        });

        var content = zip.generate({ type: "blob" });
        saveAs(content, "spotify_playlists.zip");
      });
    });
  }
}

// Handles exporting a single playlist as a CSV file
var PlaylistExporter = {
  export: function(access_token, playlist) {
    this.csvData(access_token, playlist).then(function(data) {
      var blob = new Blob(["\uFEFF" + data], { type: "text/csv;charset=utf-8" });
      saveAs(blob, this.fileName(playlist));
    }.bind(this))
  },

  csvData: function(access_token, playlist) {
    return Helpers.fetchFullTracks(access_token, playlist)
      .then(function(trackItems) {
          var tracks = trackItems.map(function(trackItem) {

            var artistGenres = trackItem.track.artists.map(function(artist) { return artist.genres });

            return [
              trackItem.track.uri,
              trackItem.track.name,
              trackItem.track.artists.map(function(artist) { return artist.name }).join(', '),
              artistGenres.filter(function(genres) { return genres.length }).length ? artistGenres.map(function(genres) { return genres.join(', ')}).join('; ') : '',
              trackItem.track.artists.map(function(artist) { return artist.popularity }).join(', '),
              trackItem.track.album.name,
              trackItem.track.album.album_type,
              trackItem.track.album.artists.map(function(artist) {return artist.name}).join(', '),
              trackItem.track.album.genres.join(', '),
              trackItem.track.album.popularity,
              trackItem.track.album.release_date,
              trackItem.track.album.release_date_precision,
              trackItem.track.disc_number,
              trackItem.track.track_number,
              trackItem.track.duration_ms,
              trackItem.added_by == null ? '' : trackItem.added_by.uri,
              trackItem.added_at
            ].map(function(track) { return '"' + String(track).replace(/"/g, '""') + '"'; })
           });

          tracks.unshift([
            "Spotify URI",
            "Track Name",
            "Artist Names",
            "Artist Genres",
            "Artist Popularity",
            "Album Name",
            "Album Type",
            "Album Artists",
            "Album Genres",
            "Album Popularity",
            "Album Release Date",
            "Album Release Date Precision",
            "Disc Number",
            "Track Number",
            "Track Duration (ms)",
            "Added By",
            "Added At"
          ]);

          csvContent = '';
          tracks.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += index < tracks.length ? dataString+ "\n" : dataString;
          });

          return csvContent;
      })
  },

  fileName: function(playlist) {
    return playlist.name.replace(/[^a-z0-9\- ]/gi, '').replace(/[ ]/gi, '_').toLowerCase() + ".csv";
  }
}

$(function() {
  var vars = window.location.hash.substring(1).split('&');
  var key = {};
  for (i=0; i<vars.length; i++) {
    var tmp = vars[i].split('=');
    key[tmp[0]] = tmp[1];
  }

  if (window.Helpers.getQueryParam('rate_limit_message') != '') {
    // Show rate limit message
    $('#rateLimitMessage').show();
  } else if (typeof key['access_token'] === 'undefined') {
    $('#loginButton').css('display', 'inline-block')
  } else {
    React.render(<PlaylistTable access_token={key['access_token']} />, playlistsContainer);
  }
});

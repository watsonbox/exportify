/*
  TODO:

  - Handle unauthorized response from API
  - Pagination for exporting long playlists (extract logic)
  - Improve on simple CSV generation
  - Make note about download attribute browser support in README
*/

var PlaylistTable = React.createClass({
  getInitialState: function() {
    return {
      playlists: [],
      nextURL: null,
      prevURL: null
    };
  },

  loadPlaylists: function(url) {
    var userId = '';

    $.ajax({
      url: "https://api.spotify.com/v1/me",
      headers: {
        'Authorization': 'Bearer ' + this.props.access_token
      }
    }).then(function(response) {
      userId = response.id;

      return $.ajax({
        url: typeof url !== 'undefined' ? url : "https://api.spotify.com/v1/users/" + userId + "/playlists",
        headers: {
          'Authorization': 'Bearer ' + this.props.access_token
        },
      });
    }.bind(this)).done(function(response) {
      if (this.isMounted()) {
        this.setState({
          playlists: response.items,
          nextURL: response.next,
          prevURL: response.previous
        });

        $('#playlists').fadeIn();
        $('#subtitle').text((response.offset + 1) + '-' + (response.offset + response.items.length) + ' of ' + response.total + ' playlists for ' + userId)
      }
    }.bind(this))
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
                <th>Owner</th>
                <th>Tracks</th>
                <th>Public?</th>
                <th>Collaborative?</th>
                <th></th>
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
    $.ajax({
      url: this.props.playlist.tracks.href,
      headers: {
        'Authorization': 'Bearer ' + this.props.access_token
      },
      success: function(response) {
        var tracks = response.items.map(function(item) {
          return [
            item.track.uri,
            item.track.name,
            item.track.artists[0].name,
            item.track.album.name,
            item.added_by == null ? '' : item.added_by.uri,
            item.added_at
          ].map(function(track) { return '"' + track + '"'; })
        });

        tracks.unshift([
          "Spotify URI",
          "Name",
          "Artist Name",
          "Album Name",
          "Added By",
          "Added At"
        ]);

        var csvContent = "data:text/csv;charset=utf-8,";
        tracks.forEach(function(infoArray, index){
           dataString = infoArray.join(",");
           csvContent += index < tracks.length ? dataString+ "\n" : dataString;
        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "playlist.csv");

        link.click();
      }
    });
  },

  render: function() {
    playlist = this.props.playlist

    return (
      <tr key={this.props.key}>
        <td><i className="fa fa-music"></i></td>
        <td><a href={playlist.uri}>{playlist.name}</a></td>
        <td><a href={playlist.owner.uri}>{playlist.owner.id}</a></td>
        <td>{playlist.tracks.total}</td>
        <td>{playlist.public ? 'Yes' : 'No'}</td>
        <td>{playlist.collaborative ? 'Yes' : 'No'}</td>
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

$(function() {
  var vars = window.location.hash.substring(1).split('&');
  var key = {};
  for (i=0; i<vars.length; i++) {
    var tmp = vars[i].split('=');
    key[tmp[0]] = tmp[1];
  }

  if (typeof key['access_token'] === 'undefined') {
    $('#loginButton').css('display', 'inline-block')
  } else {
    React.render(<PlaylistTable access_token={key['access_token']} />, playlistsContainer);
  }
});

/*
  TODO:

  - Handle unauthorized response from API
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
    $.ajax({
      url: url,
      headers: {
        'Authorization': 'Bearer ' + this.props.access_token
      },
      success: function(response) {
        console.log(response);

        if (this.isMounted()) {
          this.setState({
            playlists: response.items,
            nextURL: response.next,
            prevURL: response.previous
          });
        }
      }.bind(this)
    });
  },

  componentDidMount: function() {
    this.loadPlaylists(this.props.url);
  },

  render: function() {
    return (
      <div>
        <Paginator nextURL={this.state.nextURL} prevURL={this.state.prevURL} loadPlaylists={this.loadPlaylists}/>
        <table className="table">
          <thead>
            <tr>
              <th style={{width: "30px"}}></th>
              <th>Name</th>
              <th>Owner</th>
              <th>Tracks</th>
              <th>Public?</th>
              <th>Collaborative?</th>
            </tr>
          </thead>
          <tbody>
            {this.state.playlists.map(function(playlist, i) {
              return <PlaylistRow playlist={playlist} key={playlist.id}/>;
            })}
          </tbody>
        </table>
      </div>
    );
  }
});

var PlaylistRow = React.createClass({
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
      </tr>
    );
  }
});

var Paginator = React.createClass({
  nextClick: function(e) {
    e.preventDefault()
    this.props.loadPlaylists(this.props.nextURL)
  },

  prevClick: function(e) {
    e.preventDefault()
    this.props.loadPlaylists(this.props.prevURL)
  },

  render: function() {
    if (this.props.nextURL != null || this.props.prevURL != null) {
      return (
        <nav className="text-right">
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
    $('#loginButton').show()
  } else {
    React.render(<PlaylistTable url="https://api.spotify.com/v1/users/watsonbox/playlists" access_token={key['access_token']} />, playlists);
  }
});

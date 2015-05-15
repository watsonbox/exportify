var PlaylistTable = React.createClass({
  render: function() {
    return (
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
          {this.props.playlists.items.map(function(playlist, i) {
            return (
              <tr key={i}>
                <td><i className="fa fa-music"></i></td>
                <td><a href={playlist.uri}>{playlist.name}</a></td>
                <td><a href={playlist.owner.uri}>{playlist.owner.id}</a></td>
                <td>{playlist.tracks.total}</td>
                <td>{playlist.public ? 'Yes' : 'No'}</td>
                <td>{playlist.collaborative ? 'Yes' : 'No'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
});

function startApp(access_token) {
  $.ajax({
    url: 'https://api.spotify.com/v1/users/watsonbox/playlists',
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    success: function(response) {
      // Render list of Spotify playlists
      console.log(response);
      React.render(<PlaylistTable playlists={response} />, playlists);
    }
  });
}

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
    startApp(key['access_token']);
  }
});
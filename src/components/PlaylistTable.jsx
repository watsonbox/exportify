import React from "react"
import $ from "jquery" // TODO: Remove jQuery dependency
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import PlaylistRow from "./PlaylistRow"
import Paginator from "./Paginator"
import PlaylistsExporter from "./PlaylistsExporter"
import { apiCall } from "helpers"

class PlaylistTable extends React.Component {
  state = {
    playlists: [],
    playlistCount: 0,
    likedSongsLimit: 0,
    likedSongsCount: 0,
    nextURL: null,
    prevURL: null
  }

  loadPlaylists = (url) => {
    var userId = '';
    var firstPage = typeof url === 'undefined' || url.indexOf('offset=0') > -1;

    apiCall("https://api.spotify.com/v1/me", this.props.accessToken).then((response) => {
      userId = response.id;

      // Show liked tracks playlist if viewing first page
      if (firstPage) {
        return Promise.all([
          apiCall(
            "https://api.spotify.com/v1/users/" + userId + "/playlists",
            this.props.accessToken
          ),
          apiCall(
            "https://api.spotify.com/v1/users/" + userId + "/tracks",
            this.props.accessToken
          )
        ])
      } else {
        return Promise.all([apiCall(url, this.props.accessToken)])
      }
    }).then(([playlistsResponse, likedTracksResponse]) => {
      let playlists = playlistsResponse.items;

      // Show library of saved tracks if viewing first page
      if (firstPage) {
        playlists.unshift({
          "id": "liked",
          "name": "Liked",
          "public": false,
          "collaborative": false,
          "owner": {
            "id": userId,
            "display_name": userId,
            "uri": "spotify:user:" + userId
          },
          "tracks": {
            "href": "https://api.spotify.com/v1/me/tracks",
            "limit": likedTracksResponse.limit,
            "total": likedTracksResponse.total
          },
          "uri": "spotify:user:" + userId + ":saved"
        });

        // FIXME: Handle unmounting
        this.setState({
          likedSongsLimit: likedTracksResponse.limit,
          likedSongsCount: likedTracksResponse.total
        })
      }

      // FIXME: Handle unmounting
      this.setState({
        playlists: playlists,
        playlistCount: playlistsResponse.total,
        nextURL: playlistsResponse.next,
        prevURL: playlistsResponse.previous
      });

      $('#playlists').fadeIn();
      $('#subtitle').text((playlistsResponse.offset + 1) + '-' + (playlistsResponse.offset + playlistsResponse.items.length) + ' of ' + playlistsResponse.total + ' playlists for ' + userId)
    })
  }

  exportPlaylists = () => {
    PlaylistsExporter.export(this.props.accessToken, this.state.playlistCount, this.state.likedSongsLimit, this.state.likedSongsCount);
  }

  componentDidMount() {
    this.loadPlaylists(this.props.url);
  }

  render() {
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
                <th style={{width: "100px"}} className="text-right">
                  <button className="btn btn-default btn-xs" type="submit" onClick={this.exportPlaylists}>
                    <span className="fa fa-file-archive"></span><FontAwesomeIcon icon={['far', 'file-archive']}/> Export All
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {this.state.playlists.map((playlist, i) => {
                return <PlaylistRow playlist={playlist} key={playlist.id} accessToken={this.props.accessToken}/>
              })}
            </tbody>
          </table>
          <Paginator nextURL={this.state.nextURL} prevURL={this.state.prevURL} loadPlaylists={this.loadPlaylists}/>
        </div>
      );
    } else {
      return <div className="spinner" data-testid="playlistTableSpinner"></div>
    }
  }
}

export default PlaylistTable

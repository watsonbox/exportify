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

  loadPlaylists(url) {
    var userId = '';
    var firstPage = typeof url === 'undefined' || url.indexOf('offset=0') > -1;

    apiCall("https://api.spotify.com/v1/me", this.props.access_token).then(function(response) {
      userId = response.id;

      // Show liked tracks playlist if viewing first page
      if (firstPage) {
        return $.when.apply($, [
          apiCall(
            "https://api.spotify.com/v1/users/" + userId + "/tracks",
            this.props.access_token
          ),
          apiCall(
            "https://api.spotify.com/v1/users/" + userId + "/playlists",
            this.props.access_token
          )
        ])
      } else {
        return apiCall(url, this.props.access_token);
      }
    }.bind(this)).done(function() {
      var response;
      var playlists = [];

      if (arguments[1] === 'success') {
        response = arguments[0];
        playlists = arguments[0].items;
      } else {
        response = arguments[1][0];
        playlists = arguments[1][0].items;
      }

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
            "limit": arguments[0][0].limit,
            "total": arguments[0][0].total
          },
          "uri": "spotify:user:" + userId + ":saved"
        });

        // FIXME: Handle unmounting
        this.setState({
          likedSongsLimit: arguments[0][0].limit,
          likedSongsCount: arguments[0][0].total
        })
      }

      // FIXME: Handle unmounting
      this.setState({
        playlists: playlists,
        playlistCount: response.total,
        nextURL: response.next,
        prevURL: response.previous
      });

      $('#playlists').fadeIn();
      $('#subtitle').text((response.offset + 1) + '-' + (response.offset + response.items.length) + ' of ' + response.total + ' playlists for ' + userId)

    }.bind(this))
  }

  exportPlaylists() {
    PlaylistsExporter.export(this.props.access_token, this.state.playlistCount, this.state.likedSongsLimit, this.state.likedSongsCount);
  }

  componentDidMount() {
    this.loadPlaylists(this.props.url);
  }

  render() {
    if (this.state.playlists.length > 0) {
      return (
        <div id="playlists">
          <Paginator nextURL={this.state.nextURL} prevURL={this.state.prevURL} loadPlaylists={this.loadPlaylists.bind(this)}/>
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
                  <button className="btn btn-default btn-xs" type="submit" onClick={this.exportPlaylists.bind(this)}>
                    <span className="fa fa-file-archive"></span><FontAwesomeIcon icon={['far', 'file-archive']}/> Export All
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {this.state.playlists.map(function(playlist, i) {
                return <PlaylistRow playlist={playlist} key={playlist.id} access_token={this.props.access_token}/>
              }.bind(this))}
            </tbody>
          </table>
          <Paginator nextURL={this.state.nextURL} prevURL={this.state.prevURL} loadPlaylists={this.loadPlaylists.bind(this)}/>
        </div>
      );
    } else {
      return <div className="spinner" data-testid="playlistTableSpinner"></div>
    }
  }
}

export default PlaylistTable

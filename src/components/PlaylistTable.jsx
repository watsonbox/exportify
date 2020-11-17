import React from "react"
import { ProgressBar } from "react-bootstrap"

import PlaylistRow from "./PlaylistRow"
import Paginator from "./Paginator"
import PlaylistsExporter from "./PlaylistsExporter"
import { apiCall, apiCallErrorHandler } from "helpers"

class PlaylistTable extends React.Component {
  state = {
    playlists: [],
    playlistCount: 0,
    likedSongs: {
      limit: 0,
      count: 0
    },
    nextURL: null,
    prevURL: null,
    progressBar: {
      show: false,
      label: "",
      value: 0
    }
  }

  loadPlaylists = (url) => {
    var userId = '';
    var firstPage = typeof url === 'undefined' || url.indexOf('offset=0') > -1;

    apiCall("https://api.spotify.com/v1/me", this.props.accessToken).then((response) => {
      userId = response.data.id;

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
      const playlistsData = playlistsResponse.data
      const playlists = playlistsData.items

      // Show library of saved tracks if viewing first page
      if (firstPage) {
        const likedTracksData = likedTracksResponse.data

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
            "limit": likedTracksData.limit,
            "total": likedTracksData.total
          },
          "uri": "spotify:user:" + userId + ":saved"
        });

        // FIXME: Handle unmounting
        this.setState({
          likedSongs: {
            limit: likedTracksData.limit,
            count: likedTracksData.total
          }
        })
      }

      // FIXME: Handle unmounting
      this.setState({
        playlists: playlists,
        playlistCount: playlistsData.total,
        nextURL: playlistsData.next,
        prevURL: playlistsData.previous
      });

      if (document.getElementById("subtitle") !== null) {
        document.getElementById("subtitle").textContent = `${playlistsData.offset + 1}-${playlistsData.offset + playlistsData.items.length} of ${playlistsData.total} playlists for ${userId}`
      }
    }).catch(apiCallErrorHandler)
  }

  handleLoadedPlaylistsCountChanged = (count) => {
    this.setState({
      progressBar: {
        show: true,
        label: "Loading playlists...",
        value: count
      }
    })
  }

  handleExportedPlaylistsCountChanged = (count) => {
    this.setState({
      progressBar: {
        show: true,
        label: count >= this.state.playlistCount ? "Done!" : "Exporting tracks...",
        value: count
      }
    })
  }

  componentDidMount() {
    this.loadPlaylists(this.props.url);
  }

  render() {
    const progressBar = <ProgressBar striped active={this.state.progressBar.value < this.state.playlistCount} now={this.state.progressBar.value} max={this.state.playlistCount} label={this.state.progressBar.label} />

    if (this.state.playlistCount > 0) {
      return (
        <div id="playlists">
          <div id="playlistsHeader">
            <Paginator nextURL={this.state.nextURL} prevURL={this.state.prevURL} loadPlaylists={this.loadPlaylists}/>
            {this.state.progressBar.show && progressBar}
          </div>
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
                  <PlaylistsExporter
                    accessToken={this.props.accessToken}
                    onLoadedPlaylistsCountChanged={this.handleLoadedPlaylistsCountChanged}
                    onExportedPlaylistsCountChanged={this.handleExportedPlaylistsCountChanged}
                    playlistCount={this.state.playlistCount}
                    likedSongs={this.state.likedSongs}
                  />
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

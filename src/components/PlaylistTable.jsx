import React from "react"
import { ProgressBar } from "react-bootstrap"

import ConfigDropdown from "./ConfigDropdown"
import PlaylistRow from "./PlaylistRow"
import Paginator from "./Paginator"
import PlaylistsExporter from "./PlaylistsExporter"
import { apiCall, apiCallErrorHandler } from "helpers"

class PlaylistTable extends React.Component {
  PAGE_SIZE = 20

  userId = null

  state = {
    playlists: [],
    playlistCount: 0,
    likedSongs: {
      limit: 0,
      count: 0
    },
    currentPage: 1,
    progressBar: {
      show: false,
      label: "",
      value: 0
    },
    config: {
      includeArtistsData: false,
      includeAudioFeaturesData: false
    }
  }

  constructor(props) {
    super(props)

    if (props.config) {
      this.state.config = props.config
    }
  }

  loadPlaylists = async () => {
    const playlistsUrl = `https://api.spotify.com/v1/users/${this.userId}/playlists?offset=${this.PAGE_SIZE * (this.state.currentPage-1)}&limit=${this.PAGE_SIZE}`
    const playlistsResponse = await apiCall(playlistsUrl, this.props.accessToken)
    const playlistsData = playlistsResponse.data
    const playlists = playlistsData.items

    // Show library of saved tracks if viewing first page
    if (this.state.currentPage === 1) {
      const likedTracksUrl = `https://api.spotify.com/v1/users/${this.userId}/tracks`
      const likedTracksResponse = await apiCall(likedTracksUrl, this.props.accessToken)
      const likedTracksData = likedTracksResponse.data

      playlists.unshift({
        "id": "liked",
        "name": "Liked",
        "public": false,
        "collaborative": false,
        "owner": {
          "id": this.userId,
          "display_name": this.userId,
          "uri": "spotify:user:" + this.userId
        },
        "tracks": {
          "href": "https://api.spotify.com/v1/me/tracks",
          "limit": likedTracksData.limit,
          "total": likedTracksData.total
        },
        "uri": "spotify:user:" + this.userId + ":saved"
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
      playlistCount: playlistsData.total
    })

    if (document.getElementById("subtitle") !== null) {
      const min = ((this.state.currentPage - 1) * this.PAGE_SIZE) + 1
      const max = min + this.PAGE_SIZE - 1

      document.getElementById("subtitle").textContent = `${min}-${max} of ${this.state.playlistCount} playlists for ${this.userId}`
    }
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

  handlePlaylistsExportDone = () => {
    this.setState({
      progressBar: {
        show: true,
        label: "Done!",
        value: this.state.playlistCount
      }
    })
  }

  handlePlaylistExportStarted = (playlistName, doneCount) => {
    this.setState({
      progressBar: {
        show: true,
        label: `Exporting ${playlistName}...`,
        value: doneCount
      }
    })
  }

  handleConfigChanged = (config) => {
    this.setState({ config: config })
  }

  handlePageChanged = (page) => {
    this.setState({ currentPage: page }, this.loadPlaylists)
  }

  async componentDidMount() {
    try {
      this.userId = await apiCall("https://api.spotify.com/v1/me", this.props.accessToken)
        .then(response => response.data.id)

      await this.loadPlaylists()
    } catch(error) {
      apiCallErrorHandler(error)
    }
  }

  render() {
    const progressBar = <ProgressBar striped variant="primary" animated={this.state.progressBar.value < this.state.playlistCount} now={this.state.progressBar.value} max={this.state.playlistCount} label={this.state.progressBar.label} />

    if (this.state.playlistCount > 0) {
      return (
        <div id="playlists">
          <div id="playlistsHeader">
            <Paginator currentPage={this.state.currentPage} pageLimit={this.PAGE_SIZE} totalRecords={this.state.playlistCount} onPageChanged={this.handlePageChanged}/>
            <ConfigDropdown onConfigChanged={this.handleConfigChanged} />
            {this.state.progressBar.show && progressBar}
          </div>
          <table className="table table-hover table-sm">
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
                    onPlaylistExportDone={this.handlePlaylistsExportDone}
                    onPlaylistExportStarted={this.handlePlaylistExportStarted}
                    playlistCount={this.state.playlistCount}
                    likedSongs={this.state.likedSongs}
                    config={this.state.config}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {this.state.playlists.map((playlist, i) => {
                return <PlaylistRow
                  playlist={playlist}
                  key={playlist.id}
                  accessToken={this.props.accessToken}
                  config={this.state.config}
                />
              })}
            </tbody>
          </table>
          <div id="playlistsFooter">
            <Paginator currentPage={this.state.currentPage} pageLimit={this.PAGE_SIZE} totalRecords={this.state.playlistCount} onPageChanged={this.handlePageChanged}/>
          </div>
        </div>
      );
    } else {
      return <div className="spinner" data-testid="playlistTableSpinner"></div>
    }
  }
}

export default PlaylistTable

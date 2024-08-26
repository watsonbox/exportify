import React from "react"
import { withTranslation, Translation } from "react-i18next"
import { ProgressBar } from "react-bootstrap"

import Bugsnag from "@bugsnag/js"
import PlaylistsData from "./data/PlaylistsData"
import ConfigDropdown from "./ConfigDropdown"
import PlaylistSearch from "./PlaylistSearch"
import PlaylistRow from "./PlaylistRow"
import Paginator from "./Paginator"
import PlaylistsExporter from "./PlaylistsExporter"
import { apiCall, apiCallErrorHandler } from "helpers"

class PlaylistTable extends React.Component {
  PAGE_SIZE = 20

  userId = null
  playlistsData = null

  state = {
    initialized: false,
    searchQuery: "",
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
      includeAudioFeaturesData: false,
      includeAlbumData: false
    }
  }

  constructor(props) {
    super(props)

    this.configDropdown = React.createRef()
    this.playlistSearch = React.createRef()

    if (props.config) {
      this.state.config = props.config
    }
  }

  handlePlaylistSearch = async (query) => {
    if (query.length === 0) {
      this.handlePlaylistSearchCancel()
    } else {
      const playlists = await this.playlistsData.search(query).catch(apiCallErrorHandler)

      this.setState({
        searchQuery: query,
        playlists: playlists,
        playlistCount: playlists.length,
        currentPage: 1,
        progressBar: {
          show: false
        }
      })

      let key = "subtitle_search"
      if (query.startsWith("public:") || query.startsWith("collaborative:") || query.startsWith("owner:")) {
        key += "_advanced"
      }

      this.props.onSetSubtitle(<Translation>{(t) => t(key, { total: playlists.length, query: query })}</Translation>)
    }
  }

  handlePlaylistSearchCancel = () => {
    return this.loadCurrentPlaylistPage().catch(apiCallErrorHandler)
  }

  loadCurrentPlaylistPage = async () => {
    if (this.playlistSearch.current) {
      this.playlistSearch.current.clear()
    }

    try {
      const playlists = await this.playlistsData.slice(
        ((this.state.currentPage - 1) * this.PAGE_SIZE),
        ((this.state.currentPage - 1) * this.PAGE_SIZE) + this.PAGE_SIZE
      )

      // FIXME: Handle unmounting
      this.setState(
        {
          initialized: true,
          searchQuery: "",
          playlists: playlists,
          playlistCount: await this.playlistsData.total(),
          progressBar: {
            show: false
          }
        },
        () => {
          const min = ((this.state.currentPage - 1) * this.PAGE_SIZE) + 1
          const max = Math.min(min + this.PAGE_SIZE - 1, this.state.playlistCount)
          this.props.onSetSubtitle(
            <Translation>{(t) => t("subtitle", { min: min, max: max, total: this.state.playlistCount, userId: this.userId })}</Translation>
          )
        }
      )
    } catch (error) {
      apiCallErrorHandler(error)
    }
  }

  handlePlaylistsLoadingStarted = () => {
    Bugsnag.leaveBreadcrumb("Started exporting all playlists")

    this.configDropdown.current.spin(true)
  }

  handlePlaylistsLoadingDone = () => {
    this.configDropdown.current.spin(false)
  }

  handlePlaylistsExportDone = () => {
    Bugsnag.leaveBreadcrumb("Finished exporting all playlists")

    this.setState({
      progressBar: {
        show: true,
        label: this.props.i18n.t("exporting_done"),
        value: this.state.playlistCount
      }
    })
  }

  handlePlaylistExportStarted = (playlistName, doneCount) => {
    Bugsnag.leaveBreadcrumb(`Started exporting playlist ${playlistName}`)

    this.setState({
      progressBar: {
        show: true,
        label: this.props.i18n.t("exporting_playlist", { playlistName: playlistName }),
        value: doneCount
      }
    })
  }

  handleConfigChanged = (config) => {
    Bugsnag.leaveBreadcrumb(`Config updated to ${JSON.stringify(config)}`)

    this.setState({ config: config })
  }

  handlePageChanged = (page) => {
    try {
      this.setState(
        { currentPage: page },
        this.loadCurrentPlaylistPage
      )
    } catch (error) {
      apiCallErrorHandler(error)
    }
  }

  async componentDidMount() {
    try {
      const user = await apiCall("https://api.spotify.com/v1/me", this.props.accessToken)
        .then(response => response.data)

      Bugsnag.setUser(user.id, user.uri, user.display_name)

      this.userId = user.id
      this.playlistsData = new PlaylistsData(
        this.props.accessToken,
        this.userId,
        this.handlePlaylistsLoadingStarted,
        this.handlePlaylistsLoadingDone
      )

      await this.loadCurrentPlaylistPage()
    } catch (error) {
      apiCallErrorHandler(error)
    }
  }

  render() {
    const progressBar = <ProgressBar striped variant="primary" animated={this.state.progressBar.value < this.state.playlistCount} now={this.state.progressBar.value} max={this.state.playlistCount} label={this.state.progressBar.label} />

    if (this.state.initialized) {
      return (
        <div id="playlists">
          <div id="playlistsHeader">
            <Paginator currentPage={this.state.currentPage} pageLimit={this.state.searchQuery === "" ? this.PAGE_SIZE : this.state.playlistCount} totalRecords={this.state.playlistCount} onPageChanged={this.handlePageChanged} />
            <PlaylistSearch onPlaylistSearch={this.handlePlaylistSearch} onPlaylistSearchCancel={this.handlePlaylistSearchCancel} ref={this.playlistSearch} />
            <ConfigDropdown onConfigChanged={this.handleConfigChanged} ref={this.configDropdown} />
            {this.state.progressBar.show && progressBar}
          </div>
          <div className="table-responsive-sm">
            <table className="table table-hover table-sm">
              <thead>
                <tr>
                  <th style={{ width: "30px" }}></th>
                  <th>{this.props.i18n.t("playlist.name")}</th>
                  <th style={{ width: "150px" }}>{this.props.i18n.t("playlist.owner")}</th>
                  <th style={{ width: "100px" }} className="d-none d-sm-table-cell">{this.props.i18n.t("playlist.tracks")}</th>
                  <th style={{ width: "120px" }} className="d-none d-sm-table-cell">{this.props.i18n.t("playlist.public")}</th>
                  <th style={{ width: "120px" }} className="d-none d-md-table-cell">{this.props.i18n.t("playlist.collaborative")}</th>
                  <th style={{ width: "100px" }} className="text-end">
                    <PlaylistsExporter
                      accessToken={this.props.accessToken}
                      onPlaylistsExportDone={this.handlePlaylistsExportDone}
                      onPlaylistExportStarted={this.handlePlaylistExportStarted}
                      playlistsData={this.playlistsData}
                      searchQuery={this.state.searchQuery}
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
          </div>
          <div id="playlistsFooter">
            <Paginator currentPage={this.state.currentPage} pageLimit={this.state.searchQuery === "" ? this.PAGE_SIZE : this.state.playlistCount} totalRecords={this.state.playlistCount} onPageChanged={this.handlePageChanged} />
          </div>
        </div >
      );
    } else {
      return <div className="spinner" data-testid="playlistTableSpinner"></div>
    }
  }
}

export default withTranslation()(PlaylistTable)

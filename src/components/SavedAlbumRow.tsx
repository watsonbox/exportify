import "./SavedAlbumRow.scss";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { apiCall, apiCallErrorHandler } from "helpers";
import React from "react";
import { Button, ProgressBar } from "react-bootstrap";
import { withTranslation, WithTranslation } from "react-i18next";
import SavedAlbumExporter from "./SavedAlbumExporter";

interface SavedAlbumRowProps extends WithTranslation {
  accessToken: string
}

class SavedAlbumRow extends React.Component<SavedAlbumRowProps> {
  state = {
    initialized: false,
    exporting: false,
    savedAlbumCount: 0,
    progressBar: {
      show: false,
      label: "",
      value: 0
    },
  }

  exportAlbums = () => {
    this.setState({ exporting: true }, () => {
      new SavedAlbumExporter(this.props.accessToken, this.state.savedAlbumCount)
        .export()
        .catch(apiCallErrorHandler)
        .then(() => {
          this.setState({ exporting: false });
        })
    })
  }

  // We make one 'dummy' call to the user's saved album API to get the count
  async componentDidMount() {
    try {
      const res = await apiCall(
        `https://api.spotify.com/v1/me/albums?limit=1`,
        this.props.accessToken
      ).then((response) => response.data)

      this.setState({
        savedAlbumCount: res.total,
        initialized: true,
      })
    } catch (error) {
      apiCallErrorHandler(error)
    }
  }

  render() {
    const icon = ["fas", this.state.exporting ? "sync" : "download"]
    const progressBar = (
      <ProgressBar
        striped
        variant="primary"
        animated={this.state.progressBar.value < this.state.savedAlbumCount}
        now={this.state.progressBar.value}
        max={this.state.savedAlbumCount}
      />
    );

    if (this.state.initialized) {
      return (
        <div id="saved-albums">
          <h4>Saved albums</h4>
          <div id="saved-album-row">
            <FontAwesomeIcon icon={["fas", "record-vinyl"]} size="lg" />
            <span>{this.state.savedAlbumCount} saved albums</span>
            {/* @ts-ignore */}
            <Button type="submit" variant="primary" size="xs" onClick={this.exportAlbums} disabled={this.state.exporting} className="text-nowrap">
              {/* @ts-ignore */}
              <FontAwesomeIcon icon={icon} size="sm" spin={this.state.exporting} /> {this.props.i18n.t("playlist.export")}
            </Button>
          </div>
        </div>
      )
    } else {
      return <div className="spinner" data-testid="savedAlbumRowSpinner"></div>
    }
  }
}

export default withTranslation()(SavedAlbumRow)

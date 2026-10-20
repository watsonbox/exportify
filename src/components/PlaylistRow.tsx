import React from "react"
import { withTranslation, WithTranslation } from "react-i18next"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import PlaylistExporter from "./PlaylistExporter"
import { ExportablePlaylist, PlaylistPlaceholder } from "./data/PlaylistsData"
import { ExportConfig } from "./ConfigDropdown"

interface PlaylistRowProps extends WithTranslation {
  playlist: ExportablePlaylist | PlaylistPlaceholder,
  config: ExportConfig
  onApiError: (error: unknown) => void
}

class PlaylistRow extends React.Component<PlaylistRowProps> {
  state = {
    exporting: false
  }

  exportPlaylist = (playlist: ExportablePlaylist) => {
    this.setState(
      { exporting: true },
      () => {
        (new PlaylistExporter(
          playlist,
          this.props.config
        )).export().catch(this.props.onApiError).finally(() => {
          this.setState({ exporting: false })
        })
      }
    )
  }

  renderTickCross(condition?: boolean | null) {
    if (condition) {
      return <FontAwesomeIcon icon={['far', 'check-circle']} size="sm" />
    } else {
      return <FontAwesomeIcon icon={['far', 'times-circle']} size="sm" className="opacity-25" />
    }
  }

  renderIcon(playlist: ExportablePlaylist | PlaylistPlaceholder) {
    if (playlist.id === 'liked') {
      return <FontAwesomeIcon icon={['far', 'heart']} style={{ color: 'red' }} />;
    } else {
      return <FontAwesomeIcon icon={['fas', 'music']} />;
    }
  }

  render() {
    const playlist = this.props.playlist

    if (playlist.uri == null) return (
      <tr>
        <td>{this.renderIcon(playlist)}</td>
        <td>{playlist.name}</td>
        <td className="d-none d-sm-table-cell" colSpan={2}>{this.props.i18n.t("playlist.not_supported")}</td>
        <td className="d-none d-sm-table-cell">{this.renderTickCross(playlist.public)}</td>
        <td className="d-none d-md-table-cell">{this.renderTickCross(playlist.collaborative)}</td>
        <td>&nbsp;</td>
      </tr >
    );

    return (
      <tr>
        <td>{this.renderIcon(playlist)}</td>
        <td><a href={playlist.uri}>{playlist.name}</a></td>
        <td><a href={playlist.owner.uri}>{playlist.owner.display_name}</a></td>
        <td className="d-none d-sm-table-cell">{playlist.tracks.total}</td>
        <td className="d-none d-sm-table-cell">{this.renderTickCross(playlist.public)}</td>
        <td className="d-none d-md-table-cell">{this.renderTickCross(playlist.collaborative)}</td>
        <td className="text-end">
          <Button type="submit" variant="primary" onClick={() => this.exportPlaylist(playlist)} disabled={this.state.exporting} className="text-nowrap btn-xs">
            <FontAwesomeIcon icon={['fas', this.state.exporting ? 'sync' : 'download']} size="sm" spin={this.state.exporting} /> {this.props.i18n.t("playlist.export")}
          </Button>
        </td>
      </tr>
    );
  }
}

export default withTranslation()(PlaylistRow)

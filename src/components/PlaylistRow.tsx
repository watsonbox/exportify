import React from "react"
import { withTranslation, WithTranslation } from "react-i18next"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import PlaylistExporter from "./PlaylistExporter"
import SavedAlbumsExporter from "./SavedAlbumsExporter"
import PlaylistShare from "./PlaylistShare"
import { ExportablePlaylist, PlaylistPlaceholder } from "./data/PlaylistsData"
import { ExportConfig } from "./ConfigDropdown"

interface PlaylistRowProps extends WithTranslation {
  playlist: ExportablePlaylist | PlaylistPlaceholder,
  config: ExportConfig
  onApiError: (error: unknown) => void
}

class PlaylistRow extends React.Component<PlaylistRowProps> {
  state = {
    exporting: false,
    sharing: false
  }

  exportPlaylist = (playlist: ExportablePlaylist) => {
    this.setState(
      { exporting: true },
      () => {
        ("albums" in playlist ? new SavedAlbumsExporter(playlist) : new PlaylistExporter(
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
    } else if ("albums" in playlist) {
      return <FontAwesomeIcon icon={['fas', 'record-vinyl']} />;
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

    return (<>
      <tr>
        <td>{this.renderIcon(playlist)}</td>
        <td><a href={playlist.uri}>{playlist.name}</a></td>
        <td><a href={playlist.owner.uri}>{playlist.owner.display_name}</a></td>
        <td className="d-none d-sm-table-cell">{"albums" in playlist ? <>{playlist.albums.total} <span className="small opacity-75">{this.props.i18n.t("saved_albums.album", { count: playlist.albums.total })}</span></> : playlist.tracks.total}</td>
        <td className="d-none d-sm-table-cell">{this.renderTickCross(playlist.public)}</td>
        <td className="d-none d-md-table-cell">{this.renderTickCross(playlist.collaborative)}</td>
        <td className="text-end">
          <div className="d-flex flex-wrap justify-content-end gap-1">
            {!("albums" in playlist) && <Button type="button" variant="outline-secondary" className="text-nowrap btn-xs playlist-share-action" aria-expanded={this.state.sharing} aria-controls={`share-${playlist.id}`} onClick={() => this.setState({ sharing: !this.state.sharing })}>
              <FontAwesomeIcon icon={['fas', 'link']} size="sm" /> {this.props.i18n.t("share.action")}
            </Button>}
            <Button type="submit" variant="primary" onClick={() => this.exportPlaylist(playlist)} disabled={this.state.exporting} className="text-nowrap btn-xs">
              <FontAwesomeIcon icon={['fas', this.state.exporting ? 'sync' : 'download']} size="sm" spin={this.state.exporting} /> {this.props.i18n.t("playlist.export")}
            </Button>
          </div>
        </td>
      </tr>
      {this.state.sharing && !("albums" in playlist) && <tr><td colSpan={7}><PlaylistShare playlist={playlist} onApiError={this.props.onApiError} /></td></tr>}
    </>);
  }
}

export default withTranslation()(PlaylistRow)

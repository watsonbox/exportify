import React from "react"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import { apiCallErrorHandler } from "helpers"
import PlaylistExporter from "./PlaylistExporter"

class PlaylistRow extends React.Component {
  state = {
    exporting: false
  }

  exportPlaylist = () => {
    this.setState(
      { exporting: true },
      () => {
        (new PlaylistExporter(
          this.props.accessToken,
          this.props.playlist,
          this.props.config
        )).export().catch(apiCallErrorHandler).then(() => {
          this.setState({ exporting: false })
        })
      }
    )
  }

  renderTickCross(condition) {
    if (condition) {
      return <FontAwesomeIcon icon={['far', 'check-circle']} size="sm" />
    } else {
      return <FontAwesomeIcon icon={['far', 'times-circle']} size="sm" className="opacity-25" />
    }
  }

  renderIcon(playlist) {
    if (playlist.name === 'Liked') {
      return <FontAwesomeIcon icon={['far', 'heart']} style={{ color: 'red' }} />;
    } else {
      return <FontAwesomeIcon icon={['fas', 'music']} />;
    }
  }

  render() {
    let playlist = this.props.playlist
    const icon = ['fas', (this.state.exporting ? 'sync' : 'download')]

    if(playlist.uri==null) return (
      <tr key={playlist.name}>
        <td>{this.renderIcon(playlist)}</td>
        <td>{playlist.name}</td>
        <td colSpan="2">This playlist is not supported</td>
        <td>{this.renderTickCross(playlist.public)}</td>
        <td>{this.renderTickCross(playlist.collaborative)}</td>
        <td>&nbsp;</td>
      </tr>
    );

    return (
      <tr key={playlist.uri}>
        <td>{this.renderIcon(playlist)}</td>
        <td><a href={playlist.uri}>{playlist.name}</a></td>
        <td><a href={playlist.owner.uri}>{playlist.owner.display_name}</a></td>
        <td>{playlist.tracks.total}</td>
        <td>{this.renderTickCross(playlist.public)}</td>
        <td>{this.renderTickCross(playlist.collaborative)}</td>
        <td className="text-end">
          <Button type="submit" variant="primary" size="xs" onClick={this.exportPlaylist} disabled={this.state.exporting} className="text-nowrap">
            <FontAwesomeIcon icon={icon} size="sm" spin={this.state.exporting} /> Export
          </Button>
        </td>
      </tr>
    );
  }
}

export default PlaylistRow

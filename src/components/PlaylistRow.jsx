import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import PlaylistExporter from "./PlaylistExporter"

class PlaylistRow extends React.Component {
  exportPlaylist = () => {
    PlaylistExporter.export(this.props.accessToken, this.props.playlist);
  }

  renderTickCross(condition) {
    if (condition) {
      return <FontAwesomeIcon icon={['far', 'check-circle']} size="sm" />
    } else {
      return <FontAwesomeIcon icon={['far', 'times-circle']} size="sm" style={{ color: '#ECEBE8' }} />
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
        <td className="text-right"><button className="btn btn-default btn-xs btn-success" type="submit" onClick={this.exportPlaylist}><span className="glyphicon glyphicon-save"></span> Export</button></td>
      </tr>
    );
  }
}

export default PlaylistRow

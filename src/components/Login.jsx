import React from "react"
import { withTranslation } from "react-i18next"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { getQueryParam } from "helpers"

class Login extends React.Component {
  authorize() {
    let clientId = getQueryParam("app_client_id")
    let changeUser = getQueryParam("change_user") !== ""

    // Use Exportify application clientId if none given
    if (clientId === '') {
      clientId = "9950ac751e34487dbbe027c4fd7f8e99"
    }

    window.location.href = "https://accounts.spotify.com/authorize" +
      "?client_id=" + clientId +
      "&redirect_uri=" + encodeURIComponent([window.location.protocol, '//', window.location.host, window.location.pathname].join('')) +
      "&scope=playlist-read-private%20playlist-read-collaborative%20user-library-read" +
      "&response_type=token" +
      "&show_dialog=" + changeUser;
  }

  render() {
    return (
      <Button id="loginButton" type="submit" variant="outline-secondary" size="lg" onClick={this.authorize}>
        <FontAwesomeIcon icon={['far', 'check-circle']} size="sm" /> {this.props.i18n.t("get_started")}
      </Button>
    )
  }
}

export default withTranslation()(Login)

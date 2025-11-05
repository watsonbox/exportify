import React from "react"
import { withTranslation, WithTranslation } from "react-i18next"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { initiateSpotifyAuth } from "auth"

class Login extends React.Component<WithTranslation> {
  authorize = async () => {
    const searchParams = new URLSearchParams(window.location.search)
    const clientId = searchParams.get("app_client_id") || undefined
    const changeUser = searchParams.has("change_user")

    await initiateSpotifyAuth({ clientId, changeUser })
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

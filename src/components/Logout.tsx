import React from "react"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

class Logout extends React.Component {
  handleClick = () => {
    window.location.href = `${window.location.href.split('#')[0]}?change_user=true`
  }

  render() {
    return (
      <Button id="logoutButton" type="submit" variant="link" size="lg" onClick={this.handleClick} title="Change user">
        <FontAwesomeIcon icon={['fas', 'sign-out-alt']} size="lg" />
      </Button>
    )
  }
}

export default Logout

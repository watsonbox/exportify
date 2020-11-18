import React from "react"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { authorize } from "helpers"

class Login extends React.Component {
  render() {
    return (
      <Button id="loginButton" type="submit" variant="outline-secondary" size="lg" onClick={authorize}>
        <FontAwesomeIcon icon={['far', 'check-circle']} size="sm" /> Get Started
      </Button>
    )
  }
}

export default Login

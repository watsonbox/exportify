import React from "react"
import { Button, Modal, Table } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

type TopMenuProps = {
  loggedIn: boolean
}

class TopMenu extends React.Component<TopMenuProps> {
  state = {
    showHelp: false
  }

  handleToggleHelp = () => {
    this.setState({ showHelp: !this.state.showHelp })
  }

  handleLogoutClick = () => {
    window.location.href = `${window.location.href.split('#')[0]}?change_user=true`
  }

  handleDarkModeClick = () => {
    this.setStoredTheme(this.getPreferredTheme() === "dark" ? "light" : "dark")
    this.setTheme(this.getPreferredTheme())
  }

  getStoredTheme = () => localStorage.getItem('theme')
  setStoredTheme = (theme: string) => localStorage.setItem('theme', theme)

  getPreferredTheme = () => {
    const storedTheme = this.getStoredTheme()
    if (storedTheme) {
      return storedTheme
    }

    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  setTheme = (theme: string) => {
    document.documentElement.setAttribute('data-bs-theme', theme)
  }

  componentDidMount() {
    this.setTheme(this.getPreferredTheme())
  }

  render() {
    const helpButton = this.props.loggedIn ? (
      <>
        <Button id="infoButton" type="submit" variant="link" size="lg" onClick={this.handleToggleHelp} title="Help">
          <FontAwesomeIcon icon={['fas', 'circle-info']} size="lg" />
        </Button>
        <Modal size="lg" show={this.state.showHelp} onHide={this.handleToggleHelp}>
          <Modal.Header closeButton>

            <Modal.Title>Quick Reference</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5><FontAwesomeIcon icon={['fas', 'search']} size="sm" className="opacity-25 me-2" />Advanced Search Syntax</h5>
            <Table size="sm" striped bordered>
              <thead>
                <tr>
                  <th>Search query</th>
                  <th>Behavior</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>public:true</code></td>
                  <td>Only show public playlists</td>
                </tr>
                <tr>
                  <td><code>public:false</code></td>
                  <td>Only show private playlists</td>
                </tr>
                <tr>
                  <td><code>collaborative:true</code></td>
                  <td>Only show collaborative playlists</td>
                </tr>
                <tr>
                  <td><code>collaborative:false</code></td>
                  <td>Don't show collaborative playlists</td>
                </tr>
                <tr>
                  <td><code>owner:me</code></td>
                  <td>Only show playlists I own</td>
                </tr>
                <tr>
                  <td><code>owner:[owner]</code></td>
                  <td>Only show playlists owned by <code>[owner]</code></td>
                </tr>
              </tbody>
            </Table>

            <p>For more detail please refer to the <a href="https://github.com/watsonbox/exportify" target="_blank" rel="noreferrer">full project documentation</a>.</p>
          </Modal.Body>
        </Modal>
      </>
    ) : ''

    const logoutButton = this.props.loggedIn ? <Button id="logoutButton" type="submit" variant="link" size="lg" onClick={this.handleLogoutClick} title="Change user">
      <FontAwesomeIcon icon={['fas', 'sign-out-alt']} size="lg" />
    </Button> : ''

    return (
      <div id="topMenu">
        {helpButton}
        <Button id="darkModeButton" type="submit" variant="link" size="lg" onClick={this.handleDarkModeClick} title="Toggle dark mode">
          <FontAwesomeIcon icon={['fas', 'lightbulb']} size="lg" />
        </Button>
        {logoutButton}
      </div>
    )
  }
}

export default TopMenu

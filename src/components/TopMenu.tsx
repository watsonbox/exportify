import React from "react"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

type TopMenuProps = {
  loggedIn: boolean
}

class TopMenu extends React.Component<TopMenuProps> {
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
    const logoutButton = this.props.loggedIn ? <Button id="logoutButton" type="submit" variant="link" size="lg" onClick={this.handleLogoutClick} title="Change user">
      <FontAwesomeIcon icon={['fas', 'sign-out-alt']} size="lg" />
    </Button> : ''

    return (
      <div id="topMenu">
        <Button id="darkModeButton" type="submit" variant="link" size="lg" onClick={this.handleDarkModeClick} title="Toggle dark mode">
          <FontAwesomeIcon icon={['fas', 'lightbulb']} size="lg" />
        </Button>
        {logoutButton}
      </div>
    )
  }
}

export default TopMenu

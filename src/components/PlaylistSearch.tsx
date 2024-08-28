import './PlaylistSearch.scss'

import React from "react"
import { withTranslation, WithTranslation } from "react-i18next"
import { Form, InputGroup } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

interface PlaylistSearchProps extends WithTranslation {
  onPlaylistSearch: (query: string) => void
  onPlaylistSearchCancel: () => Promise<any>
}

class PlaylistSearch extends React.Component<PlaylistSearchProps> {
  private searchField = React.createRef<HTMLInputElement>()

  state = {
    searchSubmitted: false,
    query: ""
  }

  clear() {
    this.setState(
      { searchSubmitted: false, query: "" },
      () => {
        if (this.searchField.current) {
          this.searchField.current.value = ""
        }
      }
    )
  }

  handleKeyDown = (event: React.KeyboardEvent) => {
    event.stopPropagation()

    if (event.key === 'Enter') {
      this.submitSearch()

      event.preventDefault()
    } else if (event.key === 'Escape') {
      this.cancelSearch()
    }
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ query: event.target.value })
  }

  private submitSearch = () => {
    if (this.state.query.length > 0) {
      this.setState(
        { searchSubmitted: true },
        () => { this.props.onPlaylistSearch(this.state.query) }
      )
    }
  }

  private cancelSearch = () => {
    this.props.onPlaylistSearchCancel().then(() => {
      this.clear()

      if (this.searchField.current) {
        this.searchField.current.blur()
      }
    })
  }

  render() {
    const icon = (this.state.searchSubmitted)
      ? <FontAwesomeIcon icon={['fas', 'times']} size="sm" onClick={this.cancelSearch} className="closeIcon" />
      : <FontAwesomeIcon icon={['fas', 'search']} size="sm" onClick={this.submitSearch} className="searchIcon" />

    const className = this.state.query.length > 0 ? "search queryPresent" : "search"

    return (
      <Form className={className}>
        <InputGroup>
          <Form.Control type="text" role="searchbox" placeholder={this.props.i18n.t("search")} size="sm" onChange={this.handleChange} onKeyDown={this.handleKeyDown} ref={this.searchField} className="border-end-0 border" />
          <InputGroup.Text className="bg-transparent">
            {icon}
          </InputGroup.Text>

        </InputGroup>
      </Form>
    )
  }
}

// https://stackoverflow.com/a/77677875
export interface PlaylistSearchRef extends PlaylistSearch { }
export default withTranslation("translations", { withRef: true })(PlaylistSearch) as
  React.ForwardRefExoticComponent<Omit<PlaylistSearchProps, keyof WithTranslation> & React.RefAttributes<PlaylistSearchRef>>

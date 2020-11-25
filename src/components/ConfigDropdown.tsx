import './ConfigDropdown.scss'

import React from "react"
import { Dropdown, Form } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

type ConfigDropdownProps = {
  onConfigChanged: (config: any) => void
}

class ConfigDropdown extends React.Component<ConfigDropdownProps> {
  private includeArtistsDataCheck = React.createRef<HTMLInputElement>()
  private includeAudioFeaturesDataCheck = React.createRef<HTMLInputElement>()

  state = {
    spin: false
  }

  handleCheckClick = (event: React.MouseEvent) => {
    event.stopPropagation()

    if ((event.target as HTMLElement).nodeName === "INPUT") {
      this.props.onConfigChanged({
        includeArtistsData: this.includeArtistsDataCheck.current?.checked || false,
        includeAudioFeaturesData: this.includeAudioFeaturesDataCheck.current?.checked || false
      })
    }
  }

  spin(spin: boolean) {
    this.setState({ spin: spin })
  }

  render() {
    return (
      <Dropdown>
        <Dropdown.Toggle variant="link">
          <FontAwesomeIcon icon={['fas', 'cog']} size="lg" spin={this.state.spin} />
        </Dropdown.Toggle>
        <Dropdown.Menu align="right">
          <Dropdown.Item onClickCapture={this.handleCheckClick} as="div">
            <Form.Check
              id="config-include-artists-data"
              type="switch"
              label="Include artists data"
              ref={this.includeArtistsDataCheck}
            />
          </Dropdown.Item>
          <Dropdown.Item onClickCapture={this.handleCheckClick} as="div">
            <Form.Check
              id="config-include-audio-features-data"
              type="switch"
              label="Include audio features data"
              ref={this.includeAudioFeaturesDataCheck}/>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

export default ConfigDropdown

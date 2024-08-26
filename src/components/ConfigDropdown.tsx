import './ConfigDropdown.scss'

import React from "react"
import { withTranslation, WithTranslation } from "react-i18next"
import { Dropdown, Form } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

interface ConfigDropdownProps extends WithTranslation {
  onConfigChanged: (config: any) => void
}

class ConfigDropdown extends React.Component<ConfigDropdownProps> {
  private includeArtistsDataCheck = React.createRef<HTMLInputElement>()
  private includeAudioFeaturesDataCheck = React.createRef<HTMLInputElement>()
  private includeAlbumDataCheck = React.createRef<HTMLInputElement>()

  state = {
    spin: false
  }

  handleCheckClick = (event: React.MouseEvent) => {
    event.stopPropagation()

    if ((event.target as HTMLElement).nodeName === "INPUT") {
      this.props.onConfigChanged({
        includeArtistsData: this.includeArtistsDataCheck.current?.checked || false,
        includeAudioFeaturesData: this.includeAudioFeaturesDataCheck.current?.checked || false,
        includeAlbumData: this.includeAlbumDataCheck.current?.checked || false
      })
    }
  }

  spin(spin: boolean) {
    this.setState({ spin: spin })
  }

  render() {
    return (
      <Dropdown className="configDropdown">
        <Dropdown.Toggle variant="link">
          <FontAwesomeIcon icon={['fas', 'cog']} size="lg" spin={this.state.spin} />
        </Dropdown.Toggle>
        <Dropdown.Menu align="end">
          <Dropdown.Item onClickCapture={this.handleCheckClick} as="div">
            <Form.Check
              id="config-include-artists-data"
              type="switch"
              label={this.props.i18n.t("config.include_artists_data")}
              ref={this.includeArtistsDataCheck}
            />
          </Dropdown.Item>
          <Dropdown.Item onClickCapture={this.handleCheckClick} as="div">
            <Form.Check
              id="config-include-audio-features-data"
              type="switch"
              label={this.props.i18n.t("config.include_audio_features_data")}
              ref={this.includeAudioFeaturesDataCheck} />
          </Dropdown.Item>
          <Dropdown.Item onClickCapture={this.handleCheckClick} as="div">
            <Form.Check
              id="config-include-album-data"
              type="switch"
              label={this.props.i18n.t("config.include_album_data")}
              ref={this.includeAlbumDataCheck} />
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

export default withTranslation("translations", { withRef: true })(ConfigDropdown)

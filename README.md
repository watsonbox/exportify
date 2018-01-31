<a href="https://rawgit.com/delight-im/exportify/master/exportify.html"><img src="screenshot.png"/></a>

Export your Spotify playlists and library using the Web API by clicking on the link below:

[https://rawgit.com/delight-im/exportify/master/exportify.html](https://rawgit.com/delight-im/exportify/master/exportify.html)

As many users have noticed with Spotify, there is no way to export or archive one’s playlists or library from the official clients for safekeeping. This application provides a simple interface for doing that using the Spotify Web API.

No data will be saved on any third-party server – the entire application runs in your browser.

## Usage

Click “Get Started”, grant Exportify *read-only* access to your playlists and library, then click the “Export” button to start the export.

Click “Export All” to save a ZIP file containing one CSV file for each playlist in your account. This may take a while when many (large) playlists exist.

### Re-importing playlists

Once playlists are saved, it’s also pretty straightforward to re-import them into Spotify. Open up an exported CSV file in Excel or LibreOffice Calc, for example, then select and copy the `spotify:track:xxx` URIs. Finally, create a playlist in Spotify and paste in the URIs.

### Export Format

Track data is exported in [CSV](http://en.wikipedia.org/wiki/Comma-separated_values) format with the following fields:

 * Spotify URI
 * Track Name
 * Artist Name
 * Album Name
 * Disc Number
 * Track Number
 * Track Duration (ms)
 * Added By
 * Added At

## Rate limiting or throttling

If you hit Spotify’s rate limits for their Web API, you may want to [register your own “Client ID”](#registering-your-own-application-for-the-spotify-web-api), which allows for more API calls independent of other users.

## Development

If you want to test changes in a development version, you should fire up a local web server, e.g. using Apache, nginx, Python or PHP, and navigate your browser to `exportify.html` on `localhost`. Additionally, you may want to [register your own “Client ID”](#registering-your-own-application-for-the-spotify-web-api) for the Spotify Web API.

## Registering your own application for the Spotify Web API

 1. Go to [Spotify’s developer site](https://developer.spotify.com/my-applications)
 1. Choose to create a new app
 1. Enter an arbitrary title and description for your new app
 1. Locate the “Client ID” for your new app and write it down
 1. “Edit” your app
 1. As “Redirect URIs”, add

    ```
    https://rawgit.com/delight-im/exportify/master/exportify.html
    ```

    and, if you want to work on a local development version, your local URL, e.g.:

    ```
    http://localhost/exportify/exportify.html
    ```

 1. Save the new settings
 1. Navigate your browser to

    ```
    https://rawgit.com/delight-im/exportify/master/exportify.html?client_id=<YOUR_CLIENT_ID>
    ```

    to start using your own “Client ID” for the Spotify Web API

 1. If you want to work on a local development version, you may want to change the “Client ID” directly in the code

## References

 * [Spotify Web API](https://developer.spotify.com/web-api/)
   * [Saved tracks](https://developer.spotify.com/web-api/get-users-saved-tracks/)
   * [List of playlists](https://developer.spotify.com/web-api/get-list-users-playlists/)
   * [Playlist details](https://developer.spotify.com/web-api/get-playlist/)
   * [Permissions](https://developer.spotify.com/web-api/using-scopes/)

## Contributing

All contributions are welcome! If you wish to contribute, please create an issue first so that your feature, problem or question can be discussed.

## License

This project is licensed under the terms of the [MIT License](https://opensource.org/licenses/MIT).

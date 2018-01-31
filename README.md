<a href="https://rawgit.com/delight-im/exportify/master/exportify.html"><img src="screenshot.png"/></a>

Export your Spotify playlists and library using the Web API by clicking on the link below:

[https://rawgit.com/delight-im/exportify/master/exportify.html](https://rawgit.com/delight-im/exportify/master/exportify.html)

As many users have noted, there is no way to export/archive playlists from the Spotify client for safekeeping. This application provides a simple interface for doing that using the Spotify Web API.

No data will be saved – the entire application runs in the browser.

## Usage

Click “Get Started”, grant Exportify read-only access to your playlists, then click the “Export” button to export a playlist.

Click “Export All” to save a zip file containing a CSV file for each playlist in your account. This may take a while when many playlists exist and/or they are large.

### Re-importing Playlists

Once playlists are saved, it’s also pretty straightforward to re-import them into Spotify. Open up the CSV file in Excel, for example, select and copy the `spotify:track:xxx` URIs, then simply create a playlist in Spotify and paste them in.

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

## Notes

 * The CSV export uses the HTML5 download attribute which is not [supported](http://caniuse.com/#feat=download) in all browsers. Where not supported the CSV will be rendered in the browser and must be saved manually.
 * According to Spotify [documentation](https://developer.spotify.com/web-api/working-with-playlists/), "Folders are not returned through the Web API at the moment, nor can be created using it".
 * It has been [pointed out](https://github.com/watsonbox/exportify/issues/6) that due to the large number of requests required to export all playlists, rate limiting errors may sometimes be encountered. Features will soon be added to make handling these more robust, but in the meantime these issues can be overcome by [creating your own Spotify application](https://github.com/watsonbox/exportify/issues/6#issuecomment-110793132).

## Contributing

 1. [Fork the project](https://github.com/delight-im/exportify/fork)
 1. Create your feature branch (`git checkout -b my-new-feature`)
 1. Commit your changes (`git commit -am 'Add some feature'`)
 1. Push to the branch (`git push origin my-new-feature`)
 1. Create a new Pull Request

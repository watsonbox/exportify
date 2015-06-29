[![Build Status](http://img.shields.io/travis/watsonbox/exportify.svg?style=flat)](https://travis-ci.org/watsonbox/exportify)

<a href="https://rawgit.com/watsonbox/exportify/master/exportify.html"><img src="screenshot.png"/></a>

Export your Spotify playlists using the Web API by clicking on the link below:

[https://rawgit.com/watsonbox/exportify/master/exportify.html](https://rawgit.com/watsonbox/exportify/master/exportify.html)

As many users have noted, there is no way to export/archive playlists from the Spotify client for safekeeping. This application provides a simple interface for doing that using the Spotify Web API.

No data will be saved - the entire application runs in the browser.


## Usage

Click 'Get Started', grant Exportify read-only access to your playlists, then click the 'Export' button to export a playlist.

Click 'Export All' to save a zip file containing a CSV file for each playlist in your account. This may take a while when many playlists exist and/or they are large.


### Re-importing Playlists

Once playlists are saved, it's also pretty straightforward to re-import them into Spotify. Open up the CSV file in Excel, for example, select and copy the `spotify:track:xxx` URIs, then simply create a playlist in Spotify and paste them in.


### Export Format

Track data is exported in [CSV](http://en.wikipedia.org/wiki/Comma-separated_values) format with the following fields:

- Spotify URI
- Track Name
- Artist Name
- Album Name
- Disc Number
- Track Number
- Track Duration (ms)
- Added By
- Added At


## Development

Developers wishing to make changes to Exportify should use a local web server. For example, using Python (in the Exportify repo dir):

```bash
python -m SimpleHTTPServer
```

Then open [http://localhost:8000/exportify.html](http://localhost:8000/exportify.html).


## Notes

- The CSV export uses the HTML5 download attribute which is not [supported](http://caniuse.com/#feat=download) in all browsers. Where not supported the CSV will be rendered in the browser and must be saved manually.

- According to Spotify [documentation](https://developer.spotify.com/web-api/working-with-playlists/), "Folders are not returned through the Web API at the moment, nor can be created using it".

- It has been [pointed out](https://github.com/watsonbox/exportify/issues/6) that due to the large number of requests required to export all playlists, rate limiting errors may sometimes be encountered. Features will soon be added to make handling these more robust, but in the meantime these issues can be overcome by [creating your own Spotify application](https://github.com/watsonbox/exportify/issues/6#issuecomment-110793132).


## Contributing

1. Fork it ( https://github.com/watsonbox/exportify/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

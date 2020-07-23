[![Build Status](http://img.shields.io/travis/htaunay/exportify.svg?style=flat)](https://travis-ci.org/htaunay/exportify)

<a href="https://rawgit.com/htaunay/exportify/master/exportify.html"><img src="screenshot.png"/></a>

Export your Spotify playlists using the Web API by clicking on the link below:

[Open demo](https://rawcdn.githack.com/htaunay/exportify/4c8f8fa65a9e8632313d5065901ef56d6aa68409/exportify.html)

As many users have noted, there is no way to export/archive playlists from the Spotify client for safekeeping. This application provides a simple interface for doing that using the Spotify Web API.

No data will be saved - the entire application runs in the browser.

## Usage

Click 'Get Started', grant Exportify read-only access to your playlists, then click the 'Export' button to export a playlist.

Click 'Export Page' to save a zip file containing a CSV file for each playlist in the current page.

#### Why isn't there a button to export all playlists?

See [this commit](https://github.com/htaunay/exportify/commit/f8d7150abc46b2e8954b1c03e09535df0f93a79e).

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

If you decide to work with your own Spotify developer app, you will also need to update
your Spotify developer app to set `http://localhost:8000/exportify.html` as a Redirect URI. 

## Notes

- The CSV export uses the HTML5 download attribute which is not [supported](http://caniuse.com/#feat=download) in all browsers. Where not supported the CSV will be rendered in the browser and must be saved manually.

- According to Spotify [documentation](https://developer.spotify.com/web-api/working-with-playlists/), "Folders are not returned through the Web API at the moment, nor can be created using it".

## Contributing

1. Fork it ( https://github.com/htaunay/exportify/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

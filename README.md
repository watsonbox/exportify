<a href="https://rawgit.com/watsonbox/exportify/master/exportify.html"><img src="screenshot.png"/></a>

Export your Spotify playlists using the Web API by clicking on the link below:

[https://rawgit.com/watsonbox/exportify/master/exportify.html](https://rawgit.com/watsonbox/exportify/master/exportify.html)

As many users have noted, there is no way to export/archive playlists from the Spotify client for safekeeping. This application provides a simple interface for doing that using the Spotify Web API.

No data will be saved - the entire application runs in the browser.


## Export Format

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


## Notes

- The CSV export uses the HTML5 download attribute which is not [supported](http://caniuse.com/#feat=download) in all browsers. Where not supported the CSV will be rendered in the browser and must be saved manually.


## Contributing

1. Fork it ( https://github.com/watsonbox/exportify/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

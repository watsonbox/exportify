[![Build Status](http://img.shields.io/travis/watsonbox/exportify.svg?style=flat)](https://travis-ci.org/watsonbox/exportify)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/watsonbox/exportify/master)

Export your Spotify playlists for analysis or just safekeeping: [exportify.net](https://exportify.net)

<a href="https://pavelkomarov.com/exportify/app"><img src="screenshot.png"/></a>

### Export Format

Track data is exported in [CSV](http://en.wikipedia.org/wiki/Comma-separated_values) format with the following fields:

- Spotify ID
- Artist IDs
- Track Name
- Album Name
- Artist Name(s)
- Release Date
- Duration (ms)
- Popularity
- Added By
- Added At
- Genres
- Danceability
- Energy
- Key
- Loudness
- Mode
- Speechiness
- Acousticness
- Instrumentalness
- Liveness
- Valence
- Tempo
- Time Signature

### Analysis

Run the [Jupyter Notebook](https://github.com/watsonbox/exportify/blob/master/taste_analysis.ipynb) or [launch it in Binder](https://mybinder.org/v2/gh/watsonbox/exportify/master) to get a variety of plots about the music in a playlist including:

- Most common artists
- Most common genres
- Release date distribution
- Popularity distribution
- Comparisons of Acousticness, Valence, etc. to normal
- Time signatures and keys
- All songs plotted in 2D to indicate relative similarities


### Development

Developers wishing to make changes to Exportify should use a local web server. For example, using Python (in the Exportify repo dir):

```bash
python -m http.server
```

Then open [http://localhost:8000](http://localhost:8000).

### Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -m "message"`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

# Liked-songs playlist sorter

Sorts Spotify Liked Songs (exported with this Exportify fork) into 25 playlists by each song's primary artist,
and builds a page with one card per playlist. Each card has buttons that copy Spotify track links, which you paste
into a playlist in the Spotify desktop app (Ctrl+V / ⌘V). Nothing here writes to Spotify: the app stays read-only.

Python 3 standard library only (covers need `pillow numpy opencv-python`).

## Where the data lives

The repo is public, so the playlist contents (`data/playlists.json`, `data/state.json`) and CSV exports are
gitignored. The published page **Liked Songs, Sorted** (https://claude.ai/artifact/M7jjV7YcWMxLdzbwYyqhm1)
holds both files, and `tools/from_page.py` restores them from it.

## Adding newly liked songs (the usual update)

1. On exportify.app (browser in English), export **Liked Songs** to CSV. Turning on the artist genres
   option helps sort unknown artists.
2. Give the CSV to Claude Code and ask it to sort the new liked songs. Claude then:
   1. saves the published page and runs `python tools/from_page.py <page.html>`;
   2. runs `python tools/update.py liked.csv` (dry run) and shows where each new song goes;
   3. sorts any `??` artists by adding them to `tools/genres2.py` (or uses `--place ID="playlist"` / `--skip ID`);
   4. runs `python tools/update.py liked.csv --apply`, which rebuilds `site/index.html`;
   5. republishes the page to the same link.
3. On the page, each card that got songs has a **Copy N new songs** button. Paste those into the matching
   Spotify playlist.

`update.py` only looks at songs liked since the last update (`state.json`'s `last_update`), skips songs already
in a playlist (including other versions of the same song), and flags the new ones `fresh`. Each run clears the
previous run's `fresh` flags; pass `--keep-fresh` if those weren't pasted yet. Where a song goes:

1. a `--place` override;
2. a hand-curated playlist (french vibes, café parisien, lofi study) when most of the artist's songs are there;
3. the genre rule from `tools/classify.py` (pop and rap split by mood and year), if the artist already has songs in that playlist;
4. else the playlist that already holds most of the artist's songs;
5. else the genre rule, or `??` for an artist no rule knows.

## Files

- `tools/classify.py`: genre rules, artist → genre → playlist. Also works on its own: `python tools/classify.py new.csv old.csv`.
- `tools/genres.py`, `tools/genres2.py`: artist → genre maps; add new artists to `genres2.py`.
- `tools/update.py`: sorts new liked songs into `data/playlists.json`.
- `tools/build_page.py`: `data/` + `site/template.html` → `site/index.html`.
- `tools/from_page.py`: built page → `data/playlists.json` + `data/state.json`.
- `tools/covers.py`, `tools/get_fonts.sh`: playlist covers (`bash tools/get_fonts.sh`, then `python tools/covers.py ["name" ...]`; each must stay under Spotify's 256 KB limit).
- `data/spotify_descriptions.json`: paste-ready playlist descriptions.

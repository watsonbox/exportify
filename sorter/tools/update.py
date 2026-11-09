"""Sort newly liked songs into the existing playlists.

Usage:
  python tools/update.py liked.csv                      # dry run: show where each new song would go
  python tools/update.py liked.csv --apply              # write data/playlists.json and rebuild site/index.html
Options:
  --since 2026-11-08T00:00:00Z   only look at songs liked at or after this time (default: data/state.json)
  --place TRACK_ID="playlist"    put one song in a playlist by hand (repeatable; TRACK_ID or full Spotify link)
  --skip TRACK_ID                leave one song out (repeatable)
  --keep-fresh                   keep last update's "fresh" flags (use if those songs aren't pasted yet)

liked.csv is an Exportify export of Liked Songs (English column headers). A song is "new" when it was liked
since the last update and isn't already in a playlist (any version of it). Each new song goes to:
  1. a --place override, else
  2. a hand-curated playlist the genre rules never produce (french vibes, café parisien, lofi study), when it
     holds most of the primary artist's songs, else
  3. the classifier's playlist (tools/classify.py), if the primary artist already has songs there, else
  4. the playlist that already holds most of the primary artist's songs (this respects hand placements,
     e.g. French artists in "french vibes"), else
  5. the classifier's playlist, or "??" when the artist is unknown. --apply refuses to run while any "??" remain.
"""
import argparse, collections, csv, json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from classify import KEY_TO_PLAYLIST, artists, genre, sub

R = os.path.join(HERE, '..')
PLAYLISTS = os.path.join(R, 'data/playlists.json')
STATE = os.path.join(R, 'data/state.json')
DEFAULT_SINCE = '2026-11-08T00:00:00Z'  # the Nov 8 2026 update; songs from that day already placed are skipped by id


def track_id(s):
    return re.sub(r'.*[/:]', '', s.split('?')[0].strip())


def song_key(name, artist_field):
    return (re.sub(r'\s*[-(\[].*', '', name).lower().strip(), (artists(artist_field) or [''])[0])


def load_json(p, default):
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else default


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('csv')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--since')
    ap.add_argument('--place', action='append', default=[])
    ap.add_argument('--skip', action='append', default=[])
    ap.add_argument('--keep-fresh', action='store_true')
    a = ap.parse_args()

    data = json.load(open(PLAYLISTS, encoding='utf-8'))
    names = [p['name'] for p in data]
    state = load_json(STATE, {})
    since = a.since or state.get('last_update', DEFAULT_SINCE)
    place = {}
    for x in a.place:
        tid, _, pl = x.rpartition('=')
        if pl not in names: sys.exit(f'--place: no playlist named {pl!r}. Playlists: {", ".join(names)}')
        place[track_id(tid)] = pl
    skip = {track_id(x) for x in a.skip}

    have_ids = {t[0] for p in data for t in p['tracks']}
    have_keys = {song_key(t[1], t[2]): p['name'] for p in data for t in p['tracks']}
    curated = set(names) - {v for v in KEY_TO_PLAYLIST.values() if v}
    history = collections.defaultdict(collections.Counter)  # primary artist -> playlist counts (picks count too)
    for p in data:
        for t in p['tracks']: history[(artists(t[2]) or [''])[0]][p['name']] += 1

    rows = list(csv.DictReader(open(a.csv, encoding='utf-8-sig')))
    need = {'Track URI', 'Track Name', 'Artist Name(s)', 'Added At'}
    if rows and not need <= rows[0].keys():
        sys.exit(f'{a.csv} is missing columns {sorted(need - rows[0].keys())}. Export with Exportify in English.')
    latest = max([r['Added At'] for r in rows] + [since])
    rows = sorted((r for r in rows if r['Added At'] >= since), key=lambda r: r['Added At'], reverse=True)

    plan = collections.defaultdict(list); notes = []
    for r in rows:
        tid = track_id(r['Track URI'])
        if not tid or r['Track URI'].startswith('spotify:local:') or tid in have_ids: continue
        label = f"{r['Track Name']} | {r['Artist Name(s)']}"
        if tid in skip: notes.append(f'skipped by hand: {label}'); continue
        k = song_key(r['Track Name'], r['Artist Name(s)'])
        if k in have_keys and tid not in place:
            notes.append(f'already have a version in "{have_keys[k]}": {label}'); continue
        main_artist = (artists(r['Artist Name(s)']) or [''])[0]
        rule = KEY_TO_PLAYLIST.get(sub(r, genre(r)))
        seen = history.get(main_artist)
        if tid in place: pl, why = place[tid], 'placed by hand'
        elif rule is None: notes.append(f'skip-listed artist: {label}'); continue
        elif seen and seen.most_common(1)[0][0] in curated: pl, why = seen.most_common(1)[0][0], 'hand-curated artist'
        elif seen and rule in seen: pl, why = rule, 'genre rule'
        elif seen: pl, why = seen.most_common(1)[0][0], f'artist already in "{seen.most_common(1)[0][0]}"'
        elif rule in names: pl, why = rule, 'genre rule (artist new to playlists)'
        else:
            pl, why = '??', 'unknown artist'
            if r.get('Artist Genres'): why += f" (Spotify genres: {r['Artist Genres']})"
        have_keys[k] = pl
        plan[pl].append((tid, r, why))

    total = sum(len(v) for v in plan.values())
    print(f'Songs liked since {since}: {len(rows)}. New to sort: {total}.')
    for pl in sorted(plan, key=lambda x: (x != '??', x)):
        print(f'\n== {pl} ({len(plan[pl])})')
        for tid, r, why in plan[pl]:
            print(f"   {r['Track Name']} | {r['Artist Name(s)']} | {tid} | {why}")
    if notes: print('\nNot added:'); [print('   ' + n) for n in notes]

    if not a.apply:
        print('\nDry run. Re-run with --apply to write the playlists.'); return
    if '??' in plan:
        sys.exit('\nPlace the ?? songs first: add the artist to tools/genres2.py, or pass --place ID="playlist" / --skip ID.')
    if not a.keep_fresh:
        for p in data: p['tracks'] = [[f for f in t if f != 'fresh'] for t in p['tracks']]
    by_name = {p['name']: p for p in data}
    for pl, items in plan.items():
        by_name[pl]['tracks'][:0] = [[tid, r['Track Name'], r['Artist Name(s)'], 'fresh'] for tid, r, _ in items]
    json.dump(data, open(PLAYLISTS, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    state['last_update'] = latest
    json.dump(state, open(STATE, 'w', encoding='utf-8'), indent=1)
    print(f'\nAdded {total} songs. Next update looks at songs liked from {latest}.')
    subprocess.run([sys.executable, os.path.join(HERE, 'build_page.py')], check=True)


if __name__ == '__main__':
    main()

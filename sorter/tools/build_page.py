"""Inline data/playlists.json into site/template.html -> site/index.html (the copy-paste playlist page).
playlists.json track rows are [spotify_track_id, name, artists, *flags]; flags: 'new' = recommended song not in
liked songs, 'fresh' = newly liked since last update (gets a 'Copy N new songs' button).
data/state.json (last_update) is embedded too, so tools/from_page.py can restore both files from the page."""
import json, os, urllib.parse
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
data = json.load(open(os.path.join(R, 'data/playlists.json'), encoding='utf-8'))
page = []
for p in data:
    tr = []
    for row in p['tracks']:
        t = {'n': row[1], 'a': row[2], 'u': 'https://open.spotify.com/track/' + row[0]}
        for f in row[3:]: t[f] = 1
        tr.append(t)
    recs = [{'n': n, 'a': a, 'u': 'https://open.spotify.com/search/' + urllib.parse.quote(n + ' ' + a)} for n, a in p['recs']]
    page.append({'name': p['name'], 'desc': p['desc'], 'sd': p['spotify_description'], 'tracks': tr, 'recs': recs})
state_path = os.path.join(R, 'data/state.json')
state = json.load(open(state_path, encoding='utf-8')) if os.path.exists(state_path) else {}
tpl = open(os.path.join(R, 'site/template.html'), encoding='utf-8').read()
# </ is escaped so a song title can never close the <script> tag
js = lambda v: json.dumps(v, ensure_ascii=False).replace('</', '<\\/')
open(os.path.join(R, 'site/index.html'), 'w', encoding='utf-8').write(
    tpl.replace('__DATA__', js(page)).replace('__STATE__', js(state)))
print('wrote site/index.html with', len(page), 'playlists,', sum(len(p['tracks']) for p in page), 'songs')

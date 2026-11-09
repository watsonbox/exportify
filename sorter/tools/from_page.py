"""Restore data/playlists.json and data/state.json from a built page (site/index.html or the published copy).
Usage: python tools/from_page.py path/to/page.html
The playlist data lives only in the published page (it's kept out of git), so a new session starts by saving
the published page locally and running this."""
import json, os, re, sys
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

html = open(sys.argv[1], encoding='utf-8').read()
page = json.loads(re.search(r'const DATA=(\[.*?\]);\n', html, re.S).group(1))
m = re.search(r'const STATE=(\{.*?\});\n', html, re.S)
state = json.loads(m.group(1)) if m else {}

data = []
for p in page:
    tracks = [[t['u'].rsplit('/', 1)[-1], t['n'], t['a']] + [f for f in ('new', 'fresh') if t.get(f)] for t in p['tracks']]
    data.append({'name': p['name'], 'desc': p['desc'], 'spotify_description': p['sd'],
                 'recs': [[x['n'], x['a']] for x in p['recs']], 'tracks': tracks})

os.makedirs(os.path.join(R, 'data'), exist_ok=True)
json.dump(data, open(os.path.join(R, 'data/playlists.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
if state:
    json.dump(state, open(os.path.join(R, 'data/state.json'), 'w', encoding='utf-8'), indent=1)
print('restored', len(data), 'playlists,', sum(len(p['tracks']) for p in data), 'songs; state:', state or 'none in page')

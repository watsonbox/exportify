"""Sort liked songs (Exportify CSV) into playlist keys by primary artist.
Usage: python tools/classify.py path/to/liked.csv [path/to/previous_liked.csv]
With a previous export, prints only songs added since then."""
import csv, collections, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from genres2 import G, SAD, HYPE, FEELS

KEY_TO_PLAYLIST = {
 'RAP_FEELS': 'in my feels', 'RAP_HYPE': 'pre-workout', 'RAP_OLD': 'rap throwbacks', 'POP_NEW': 'pop on repeat',
 'POP_OLD': 'throwback pop', 'POP_SAD': '3am thoughts', 'EDM': 'festival mode', 'ANTHEM': 'stadium anthems',
 'INDIE': 'indie sunsets', 'LOFI': 'Underwater', 'DESI': 'bollywood nights', 'LATIN': 'reggaetón',
 'ARABIC': 'arabesque', 'AFRO': 'afrobeats', 'AFROHOUSE': 'afro house', 'UK': 'uk rap', 'RNB': 'late night r&b',
 'CLASSIC': 'golden oldies', 'COUNTRY': 'back roads', 'JAZZ': 'smoky jazz bar', 'CARIB': 'island time',
 'PUNK': 'pop punk', 'SKIP': None, 'UNK': '?? (place by hand)'}
# NOTE: genre 'LOFI' is the old catch-all of slowed/sad artists -> playlist "Underwater".
# The real "lofi study" playlist (instrumental) and the French / Arabic-ballad picks are hand-curated.

def artists(s):
    """Split Exportify's artist column: names joined by ', ', commas inside a name escaped as '\\,'."""
    return [a.replace('\\,', ',') for a in re.split(r'(?<!\\), ', s or '') if a]

def year(r):
    try: return int(r['Album Release Date'][:4])
    except Exception: return 2020

def genre(r):
    gs = [G[a] for a in artists(r['Artist Name(s)']) if a in G]
    if not gs: return 'UNK'
    # a pop/rap/R&B/EDM song with an Afrobeats or Latin guest usually sounds like that genre
    if gs[0] in ('POP', 'RAP', 'RNB', 'EDM'):
        for p in ('AFRO', 'LATIN'):
            if p in gs: return p
    return gs[0]

def sub(r, g):
    arts = artists(r['Artist Name(s)'])
    if g == 'POP':
        if any(a in SAD for a in arts): return 'POP_SAD'
        return 'POP_OLD' if year(r) < 2016 else 'POP_NEW'
    if g == 'RAP':
        if year(r) < 2013: return 'RAP_OLD'
        for pool in (arts[:1], arts):
            if any(a in HYPE for a in pool): return 'RAP_HYPE'
            if any(a in FEELS for a in pool): return 'RAP_FEELS'
        return 'RAP_OLD' if year(r) < 2016 else 'RAP_FEELS'
    if g == 'ANTHEM' and year(r) < 1995: return 'CLASSIC'
    return g

def classify(rows):
    out = collections.defaultdict(list); seen = set()
    for r in rows:
        k = (re.sub(r'\s*[-(\[].*', '', r['Track Name']).lower().strip(), (artists(r['Artist Name(s)']) or [''])[0])
        if k in seen: continue  # drop duplicate versions of the same song
        seen.add(k); out[sub(r, genre(r))].append(r)
    return out

if __name__ == '__main__':
    rows = list(csv.DictReader(open(sys.argv[1], encoding='utf-8')))
    if len(sys.argv) > 2:
        old = {r['Track URI'] for r in csv.DictReader(open(sys.argv[2], encoding='utf-8'))}
        rows = [r for r in rows if r['Track URI'] not in old]
    for k, v in sorted(classify(rows).items(), key=lambda x: -len(x[1])):
        print(f'== {KEY_TO_PLAYLIST.get(k, k)} ({len(v)})')
        for r in v: print(f"   {r['Track Name']} | {r['Artist Name(s)']} | https://open.spotify.com/track/{r['Track URI'].split(':')[-1]}")

import math, random, os, io, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 1200
D = os.path.dirname(os.path.abspath(__file__))
FD = os.path.join(D, '..', 'fonts'); OUT = os.path.join(D, '..', 'covers'); os.makedirs(OUT, exist_ok=True)
FONTS = {
 'anton': 'Anton-Regular', 'bebas': 'BebasNeue-Regular', 'abril': 'AbrilFatface-Regular', 'bungee': 'Bungee-Regular',
 'lobster': 'Lobster-Regular', 'pacifico': 'Pacifico-Regular', 'shrikhand': 'Shrikhand-Regular', 'archivo': 'ArchivoBlack-Regular',
 'dmserif': 'DMSerifDisplay-Regular', 'dmital': 'DMSerifDisplay-Italic', 'instital': 'InstrumentSerif-Italic',
 'pfital': 'PlayfairDisplay-Italic', 'playfair': 'PlayfairDisplay', 'italiana': 'Italiana-Regular', 'rye': 'Rye-Regular',
 'righteous': 'Righteous-Regular', 'bowlby': 'BowlbyOneSC-Regular', 'unbounded': 'Unbounded', 'monoton': 'Monoton-Regular',
 'caveat': 'Caveat', 'yatra': 'YatraOne-Regular', 'vt323': 'VT323-Regular', 'rubikmono': 'RubikMonoOne-Regular',
}
_fc = {}
def F(n, s):
    k = (n, s)
    if k not in _fc:
        f = ImageFont.truetype(f'{FD}/{FONTS[n]}.ttf', s)
        if n in ('playfair', 'pfital', 'unbounded'):
            try: f.set_variation_by_name('Black')
            except Exception:
                try: f.set_variation_by_name('Bold')
                except Exception: pass
        if n == 'caveat':
            try: f.set_variation_by_name('Bold')
            except Exception: pass
        _fc[k] = f
    return _fc[k]

def hexc(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def layer(w=S, h=S): return Image.new('RGBA', (w, h), (0, 0, 0, 0))

# ---------- backgrounds
def vgrad(cols, power=1.0):
    cs = [np.array(hexc(c)[:3], float) for c in cols]
    t = np.linspace(0, 1, S) ** power
    seg = len(cs) - 1
    arr = np.zeros((S, 3))
    for i, v in enumerate(t):
        k = min(int(v * seg), seg - 1); u = v * seg - k
        arr[i] = cs[k] * (1 - u) + cs[k + 1] * u
    arr = np.repeat(arr[:, None, :], S, axis=1)
    return Image.fromarray(arr.astype(np.uint8)).convert('RGBA')

def marble(cols, seed=0, scale=1.0, bands=2.2):
    rng = np.random.default_rng(seed)
    N = 300
    y, x = np.mgrid[0:N, 0:N].astype(np.float32) / N * scale
    def n(px, py, oct=3):
        v = np.zeros_like(px); amp = 1
        for o in range(oct):
            a, b, c, d = rng.uniform(0.7, 1.8, 4) * (1.8 ** o); ph = rng.uniform(0, 6.28, 2)
            v += amp * np.sin(px * a * 3 + np.sin(py * b * 3 + ph[0]) * 1.2) * np.cos(py * c * 3 + np.cos(px * d * 3 + ph[1]) * 1.2)
            amp *= 0.45
        return v
    qx = n(x, y); qy = n(x + 5.2, y + 1.3)
    v = n(x + 0.9 * qx, y + 0.9 * qy)
    v = (np.sin(v * bands * math.pi) + 1) / 2
    cs = np.array([hexc(c)[:3] for c in cols], float)
    seg = len(cs) - 1
    k = np.clip((v * seg).astype(int), 0, seg - 1); u = (v * seg - k)[..., None]
    arr = (cs[k] * (1 - u) + cs[k + 1] * u).astype(np.uint8)
    im = Image.fromarray(arr).resize((S, S), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3))
    return im.convert('RGBA')

def grain(img, amt=10, seed=0):
    rng = np.random.default_rng(seed)
    a = np.array(img.convert('RGB')).astype(np.int16) + rng.normal(0, amt, (S, S, 1))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')

# ---------- type
def mixed_line(txt, fonts, size, fill, offset=0, stroke=0, stroke_fill=None, tracking=0):
    """render txt letter-by-letter cycling fonts; returns tight RGBA image"""
    W = int(size * len(txt) * 1.3) + 200; H = int(size * 1.9)
    im = layer(W, H); d = ImageDraw.Draw(im)
    x = 40; base = int(size * 1.35)
    for i, ch in enumerate(txt):
        f = F(fonts[(i + offset) % len(fonts)], size)
        d.text((x, base), ch, font=f, fill=hexc(fill) if isinstance(fill, str) else fill, anchor='ls',
               stroke_width=stroke, stroke_fill=hexc(stroke_fill) if stroke_fill else None)
        x += f.getlength(ch) + tracking
    bb = im.getbbox()
    return im.crop(bb) if bb else im

def fit_w(im, w, h=None):
    r = w / im.width
    nh = int(im.height * r) if h is None else h
    return im.resize((int(w), max(1, nh)), Image.LANCZOS)

def stack(name, fonts, colors, rows, width=S - 60, gap=12, size=260, stroke=0, stroke_fill=None, rowh=None):
    """rows of the name, each stretched to full width, fonts rotating per row"""
    lines = []
    for r in range(rows):
        ln = mixed_line(name, fonts, size, colors[r % len(colors)], offset=r, stroke=stroke, stroke_fill=stroke_fill)
        lines.append(fit_w(ln, width, rowh))
    tot = sum(l.height for l in lines) + gap * (rows - 1)
    out = layer(S, max(S, tot))
    y = (out.height - tot) // 2
    for l in lines:
        out.alpha_composite(l, ((S - l.width) // 2, y)); y += l.height + gap
    if out.height > S:
        out = out.crop((0, (out.height - S) // 2, S, (out.height - S) // 2 + S))
    return out

# ---------- warps
def warp(img, kind, strength=1.0, **kw):
    a = np.array(img)
    h, w = a.shape[:2]
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2
    if kind == 'sphere':
        nx, ny = (x - cx) / (w / 2), (y - cy) / (h / 2)
        r = np.sqrt(nx ** 2 + ny ** 2); rad = kw.get('rad', 0.95)
        m = r < rad
        rn = r / rad
        f = np.where(m, np.power(np.clip(rn, 1e-6, 1), strength) / np.clip(rn, 1e-6, 1), 1)
        mx = cx + nx * f * (w / 2); my = cy + ny * f * (h / 2)
    elif kind == 'wave':
        A, L = kw.get('amp', 40) * strength, kw.get('wl', 260)
        mx = x + A * np.sin(y / L * 2 * math.pi + kw.get('ph', 0))
        my = y + A * 0.6 * np.sin(x / (L * 1.3) * 2 * math.pi)
    elif kind == 'swirl':
        dx, dy = x - cx, y - cy; r = np.sqrt(dx ** 2 + dy ** 2); R = w * 0.6
        th = np.arctan2(dy, dx) + strength * np.clip(1 - r / R, 0, 1) ** 2
        mx = cx + r * np.cos(th); my = cy + r * np.sin(th)
    elif kind == 'bulge_x':
        nx = (x - cx) / (w / 2)
        mx = cx + np.sign(nx) * np.abs(nx) ** strength * (w / 2); my = y
    out = cv2.remap(a, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    return Image.fromarray(out)

def sparkles(img, n, col='#ffffff', seed=0, smin=18, smax=55):
    rnd = random.Random(seed); l = layer(); d = ImageDraw.Draw(l)
    for _ in range(n):
        x, y, s = rnd.uniform(40, S - 40), rnd.uniform(40, S - 40), rnd.uniform(smin, smax)
        t = s * 0.16
        d.polygon([(x, y - s), (x + t, y - t), (x + s, y), (x + t, y + t), (x, y + s), (x - t, y + t), (x - s, y), (x - t, y - t)], fill=hexc(col))
    return Image.alpha_composite(img, l)

def shadowed(base, lay, off=(10, 12), col=(0, 0, 0, 120), blur=10):
    a = lay.getchannel('A'); sh = Image.new('RGBA', lay.size, col); sh.putalpha(a.point(lambda v: v * col[3] // 255))
    s2 = layer(); s2.alpha_composite(sh, off)
    return Image.alpha_composite(Image.alpha_composite(base, s2.filter(ImageFilter.GaussianBlur(blur))), lay)

# ---------- layouts
def L_sphere(name, bg, fonts, colors, rows=4, strength=1.8, stroke=0, stroke_fill=None, rad=0.98, size=240):
    t = stack(name, fonts, colors, rows, width=S - 40, gap=6, size=size, stroke=stroke, stroke_fill=stroke_fill)
    t = warp(t, 'sphere', strength, rad=rad)
    return shadowed(bg, t)

def L_stack(name, bg, fonts, colors, rows=7, wave=0, stroke=0, stroke_fill=None, gap=8, hl=None, hlcol=None, size=240):
    cols = list(colors)
    t = stack(name, fonts, cols, rows, width=S - 50, gap=gap, size=size, stroke=stroke, stroke_fill=stroke_fill)
    if hl is not None:
        t2 = stack(name, fonts, [hlcol] * rows, rows, width=S - 50, gap=gap, size=size)
        # replace one row: crude—overlay highlight rows band
        hh = t.height / rows
        band = t2.crop((0, int(hl * hh), S, int((hl + 1) * hh)))
        clear = Image.new('RGBA', (S, band.height), (0, 0, 0, 0)); t.paste(clear, (0, int(hl * hh))); t.alpha_composite(band, (0, int(hl * hh)))
    if wave: t = warp(t, 'wave', 1, amp=wave, wl=520)
    return shadowed(bg, t, blur=6)

def L_diag(name, bg, fonts, fill, stroke_fill, rows=7, angle=-18, stroke=10, spark='#ffffff', seed=0):
    big = layer(int(S * 1.6), int(S * 1.6))
    name = name if len(name) >= 6 else '  '.join([name] * 3)
    lines = [fit_w(mixed_line(name, fonts, 230, fill, offset=r, stroke=stroke, stroke_fill=stroke_fill), int(S * 1.5)) for r in range(rows)]
    y = (big.height - sum(l.height for l in lines) - 10 * rows) // 2
    for i, l in enumerate(lines):
        big.alpha_composite(l, ((big.width - l.width) // 2 + (60 if i % 2 else -60), y)); y += l.height + 10
    big = big.rotate(angle, resample=Image.BICUBIC)
    o = (big.width - S) // 2; t = big.crop((o, o, o + S, o + S))
    t = warp(t, 'wave', 1, amp=22, wl=700)
    img = shadowed(bg, t, off=(14, 16), col=(0, 0, 0, 140))
    return sparkles(img, 12, spark, seed)

def L_vertical(name, bg, fonts, colors, rows=5, wave=30, stroke=0, stroke_fill=None):
    t = stack(name, fonts, colors, rows, width=S - 40, gap=4, size=240, stroke=stroke, stroke_fill=stroke_fill)
    t = t.rotate(90, resample=Image.BICUBIC)
    t = warp(t, 'wave', 1, amp=wave, wl=600)
    return shadowed(bg, t, off=(8, 8), col=(0, 0, 0, 150), blur=6)

def L_script(name, bg, font, fill, stroke_fill, motif=None, seed=0, y=470, amp=45, line2=None, font2=None):
    t = layer()
    ln = fit_w(mixed_line(name, [font], 300, fill, stroke=12, stroke_fill=stroke_fill), S - 90)
    if line2:
        l2 = fit_w(mixed_line(line2, [font2 or font], 300, fill, stroke=12, stroke_fill=stroke_fill), S - 260)
        tot = ln.height + l2.height + 10
        t.alpha_composite(ln, ((S - ln.width) // 2, y - tot // 2)); t.alpha_composite(l2, ((S - l2.width) // 2, y - tot // 2 + ln.height + 10))
    else:
        t.alpha_composite(ln, ((S - ln.width) // 2, y - ln.height // 2))
    t = warp(t, 'wave', 1, amp=amp, wl=900, ph=1.0)
    img = shadowed(bg, t, off=(10, 12), col=(0, 0, 0, 120))
    if motif: img = motif(img)
    return img

def L_tile(name, cols_pairs, fonts, rows=9, seed=0, hl=None, hlpair=None):
    """each letter in its own cell, cell bg/fg alternating like a checkerboard"""
    img = Image.new('RGBA', (S, S), hexc(cols_pairs[0][0])); d = ImageDraw.Draw(img)
    n = len(name); cw = S / n; ch = S / rows
    for r in range(rows):
        for i, c in enumerate(name):
            bgc, fgc = cols_pairs[(i + r) % len(cols_pairs)]
            if hl is not None and r == hl: bgc, fgc = hlpair[(i + r) % 2]
            x0, y0 = i * cw, r * ch
            d.rectangle((x0, y0, x0 + cw + 1, y0 + ch + 1), fill=hexc(bgc))
            if c == ' ': continue
            f = F(fonts[(i * 3 + r) % len(fonts)], int(ch * 1.25))
            g = layer(int(cw * 3), int(ch * 3)); gd = ImageDraw.Draw(g)
            gd.text((g.width / 2, g.height / 2), c, font=f, fill=hexc(fgc), anchor='mm')
            bb = g.getbbox()
            if not bb: continue
            g = g.crop(bb).resize((int(cw * 0.96), int(ch * 0.92)), Image.LANCZOS)
            img.alpha_composite(g, (int(x0 + cw * 0.02), int(y0 + ch * 0.04)))
    return img

# ---------- motifs
def flower_row(cols, y=1010, seed=0):
    def f(img):
        l = layer(); d = ImageDraw.Draw(l); rnd = random.Random(seed)
        x = 70
        while x < S + 60:
            r = rnd.uniform(70, 95); c1, c2 = rnd.sample(cols, 2)
            for k in range(12):
                a = 2 * math.pi * k / 12
                d.ellipse((x + r * 0.62 * math.cos(a) - r * 0.36, y + r * 0.62 * math.sin(a) - r * 0.36, x + r * 0.62 * math.cos(a) + r * 0.36, y + r * 0.62 * math.sin(a) + r * 0.36), fill=hexc(c1), outline=hexc('#1a0a0a'), width=4)
            d.ellipse((x - r * 0.4, y - r * 0.4, x + r * 0.4, y + r * 0.4), fill=hexc(c2), outline=hexc('#1a0a0a'), width=4)
            x += r * 1.75
        return Image.alpha_composite(img, l)
    return f

def sun_row(col, y=1020):
    def f(img):
        l = layer(); d = ImageDraw.Draw(l)
        for x in range(100, S + 100, 250):
            d.ellipse((x - 80, y - 80, x + 80, y + 80), fill=hexc(col), outline=hexc('#1a0a0a'), width=6)
            for k in range(12):
                a = 2 * math.pi * k / 12
                d.line((x + 95 * math.cos(a), y + 95 * math.sin(a), x + 125 * math.cos(a), y + 125 * math.sin(a)), fill=hexc('#1a0a0a'), width=8)
        return Image.alpha_composite(img, l)
    return f

def mountain_row(cols, y=1000):
    def f(img):
        l = layer(); d = ImageDraw.Draw(l)
        for k, c in enumerate(cols):
            pts = [(0, S)] + [(x, y - 40 + k * 60 - 90 * abs(math.sin(x / (170 + k * 40) + k))) for x in range(0, S + 20, 20)] + [(S, S)]
            d.polygon(pts, fill=hexc(c))
        return Image.alpha_composite(img, l)
    return f

SERIF = ['abril', 'pfital', 'dmserif', 'instital', 'playfair']
BOLD = ['anton', 'bowlby', 'archivo', 'bungee', 'bebas']
MIX = ['abril', 'anton', 'pfital', 'archivo', 'lobster', 'dmital', 'bowlby']
FUN = ['shrikhand', 'righteous', 'lobster', 'bungee', 'pacifico']

COVERS = [
 ('arabesque', lambda: L_tile('Arabesque', [('#0d3b2e', '#e8c26a'), ('#e8c26a', '#0d3b2e')], ['abril', 'pfital', 'anton', 'dmital', 'archivo'], rows=9, hl=4, hlpair=[('#7a1f2b', '#f6e7c1'), ('#f6e7c1', '#7a1f2b')])),
 ('french vibes', lambda: L_diag('French Vibes', vgrad(['#1d2bff', '#7b2cff', '#ff3d8b']), MIX, '#ffffff', '#120a3a', seed=2)),
 ('café parisien', lambda: grain(L_stack('Café Parisien', vgrad(['#f4dcc4', '#e8bfa0']), SERIF, ['#7a1424', '#2a1410', '#7a1424', '#2a1410'], rows=7, wave=18, size=220), 8)),
 ('in my feels', lambda: L_sphere('in my feels', marble(['#0b1a4a', '#2f5fb3', '#a8c8ff', '#2f5fb3', '#0b1a4a'], 4), ['pfital', 'instital', 'dmital', 'lobster'], ['#ffffff', '#dfe9ff'], rows=4, strength=1.9)),
 ('pre-workout', lambda: grain(L_stack('PRE-WORKOUT', Image.new('RGBA', (S, S), hexc('#0b0b0b')), BOLD, ['#ff1f2d', '#ffffff'], rows=9, wave=0, gap=6, size=220), 16)),
 ('rap throwbacks', lambda: L_vertical('Rap Throwbacks', marble(['#3a1a06', '#c8661c', '#f2b84a', '#c8661c', '#3a1a06'], 6), ['bowlby', 'abril', 'anton', 'lobster', 'archivo'], ['#fff3d6', '#1a0a00'], rows=5, wave=28)),
 ('pop on repeat', lambda: L_sphere('Pop on Repeat', marble(['#ff3d8b', '#ff9a3c', '#ffe066', '#ff9a3c', '#ff3d8b'], 7), FUN, ['#ffffff', '#3a0a2a'], rows=4, strength=1.7, stroke=0)),
 ('throwback pop', lambda: L_diag('Throwback Pop', vgrad(['#ff7ad9', '#8f5bff', '#2bd4ff']), FUN, '#ffffff', '#2a0f6b', angle=16, seed=8)),
 ('3am thoughts', lambda: grain(L_stack('3am thoughts', vgrad(['#05060f', '#141a3a']), ['vt323', 'pfital', 'anton', 'instital', 'rubikmono'], ['#c7d1ff', '#5a6799'], rows=8, wave=22, hl=3, hlcol='#ff4d6d', size=220), 10)),
 ('festival mode', lambda: L_sphere('Festival Mode', marble(['#0a0014', '#ff2bd6', '#2bf0ff', '#8f5bff', '#0a0014'], 10, bands=4), ['monoton', 'bungee', 'righteous', 'anton'], ['#ffffff', '#0a0014'], rows=4, strength=1.35)),
 ('stadium anthems', lambda: grain(L_stack('STADIUM ANTHEMS', vgrad(['#0b1430', '#26357a']), ['bebas', 'anton', 'bowlby', 'archivo'], ['#ffc94d', '#ffffff'], rows=8, wave=0, size=220), 10)),
 ('indie sunsets', lambda: grain(L_script('indie', vgrad(['#2b1b4f', '#c2477a', '#ff8a5c', '#ffd36e']), 'lobster', '#fff1e0', '#2b1b4f', motif=sun_row('#ffd36e'), y=470, line2='sunsets'), 8)),
 ('lofi study', lambda: L_tile('lofi study', [('#c9b8e8', '#3d2f5a'), ('#f3e6f0', '#6b5a8a')], ['vt323', 'instital', 'righteous', 'dmital'], rows=9)),
 ('underwater', lambda: L_sphere('Underwater', marble(['#1b2233', '#4a5a7a', '#c8b6d9', '#4a5a7a', '#1b2233'], 31), ['instital', 'pfital', 'dmital', 'lobster'], ['#f2ecff', '#c8b6d9'], rows=5, strength=1.4)),
 ('bollywood nights', lambda: L_script('Bollywood', marble(['#5a0533', '#e0287a', '#ffb300', '#e0287a', '#5a0533'], 14), 'yatra', '#ffd54f', '#3a0322', motif=flower_row(['#ffb300', '#ff5e3a', '#e0287a', '#ffe066'], seed=14), y=450, line2='Nights', font2='lobster')),
 ('reggaetón', lambda: L_vertical('Reggaetón', marble(['#7a0019', '#ff2d2d', '#ffb31f', '#ff2d2d', '#7a0019'], 15), ['archivo', 'lobster', 'bowlby', 'pfital'], ['#ffe14d', '#14001f'], rows=5, wave=34)),
 ('afrobeats', lambda: L_vertical('Afrobeats', marble(['#0b5e33', '#f2b705', '#d62828', '#111111', '#0b5e33'], 16, bands=4), ['bowlby', 'abril', 'anton', 'shrikhand'], ['#ffffff', '#ffffff'], rows=5, wave=30)),
 ('afro house', lambda: L_sphere('Afro House', marble(['#4a1a0c', '#e07a3f', '#f6d7a7', '#e07a3f', '#4a1a0c'], 17), ['abril', 'anton', 'pfital', 'bowlby'], ['#2a0f08', '#fff3e0'], rows=5, strength=1.35)),
 ('uk rap', lambda: L_tile('UK RAP', [('#111111', '#d9d9d9'), ('#d9d9d9', '#111111')], ['archivo', 'anton', 'bowlby', 'abril'], rows=7, hl=3, hlpair=[('#c6ff3d', '#111111'), ('#111111', '#c6ff3d')])),
 ('late night r&b', lambda: L_diag('R&B', vgrad(['#1a0533', '#6a1b9a', '#ff4fa3']), ['abril', 'pfital', 'anton'], '#ffffff', '#1a0533', rows=8, angle=-22, seed=19)),
 ('golden oldies', lambda: grain(L_stack('Golden Oldies', vgrad(['#4a0c18', '#2a060e']), SERIF, ['#f2cf7a', '#c9963a'], rows=8, wave=14, size=220), 9)),
 ('back roads', lambda: grain(L_script('Back', vgrad(['#3b2a5a', '#c9725b', '#f2a65a', '#f7d9a8']), 'rye', '#fff3d6', '#3d2632', motif=mountain_row(['#9c4f4a', '#6b3a3f', '#3d2632'], y=980), y=430, amp=30, line2='Roads'), 10)),
 ('smoky jazz bar', lambda: L_sphere('Smoky Jazz', marble(['#03100f', '#123536', '#3d6b5e', '#123536', '#03100f'], 22), ['pfital', 'abril', 'dmital', 'instital'], ['#f6e7b8', '#e0b95a'], rows=4, strength=1.4, stroke=6, stroke_fill='#03100f')),
 ('island time', lambda: grain(L_script('island', vgrad(['#7fd3ff', '#b8f0c8', '#ffe8a3']), 'pacifico', '#ffd400', '#0b6b39', motif=lambda im: flower_row(['#e0262c', '#ffd400', '#1a9e4b'], seed=23)(im), y=450, line2='time'), 8)),
 ('pop punk', lambda: L_tile('POP PUNK', [('#ff4fae', '#111111'), ('#111111', '#ff4fae')], ['anton', 'bowlby', 'caveat', 'archivo', 'bungee'], rows=8, hl=4, hlpair=[('#ffffff', '#111111'), ('#111111', '#ffffff')])),
]

def slug(n): return n.replace(' + ', '-and-').replace(' ', '-').replace('&', 'and').replace('é', 'e').replace('ó', 'o')

def save(img, name):
    img = img.convert('RGB').resize((1000, 1000), Image.LANCZOS); q = 92
    while True:
        b = io.BytesIO(); img.save(b, 'JPEG', quality=q, optimize=True, progressive=True)
        if b.tell() < 250_000 or q <= 60: break
        q -= 4
    open(os.path.join(OUT, slug(name) + '.jpg'), 'wb').write(b.getvalue()); return b.tell(), q

if __name__ == '__main__':
    only = sys.argv[1:]
    for n, fn in COVERS:
        if only and n not in only: continue
        sz, q = save(fn(), n); print(f'{n:18s} {sz // 1024}KB q{q}')
    T = 330; sheet = Image.new('RGB', (6 * T, 4 * T), 'white')
    for i, (n, _) in enumerate(COVERS):
        p = os.path.join(OUT, slug(n) + '.jpg')
        if os.path.exists(p): sheet.paste(Image.open(p).resize((T - 10, T - 10)), ((i % 6) * T + 5, (i // 6) * T + 5))
    sheet.save(os.path.join(OUT, 'all-covers-preview.jpg'), quality=85)

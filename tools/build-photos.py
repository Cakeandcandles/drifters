#!/usr/bin/env python3
"""Builds the film-roll photo derivatives and manifest in media/roll/ from Drifters/attachments*.
Originals are read only. attachments (2) is a byte-identical copy of attachments and is skipped.
Run: python3 -I tools/build-photos.py
"""
import json, os, random
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'Drifters', 'attachments')
B = os.path.join(ROOT, 'Drifters', 'attachments3')
OUT = os.path.join(ROOT, 'media', 'roll')
os.makedirs(OUT, exist_ok=True)

# (source dir, filename, slug, alt) in roll order: one trip, day by day.
ROLL = [
 (A, 'Photo Jul 01 2025, 8 52 41 AM.JPG',  'trailhead',      'Friends hiking a gravel trail toward a rocky peak under scattered clouds'),
 (A, 'Photo Jul 01 2025, 9 09 09 AM.JPG',  'red-rock',       'The crew walking with backpacks among red sandstone boulders'),
 (A, 'Photo Jul 01 2025, 9 11 26 AM.JPG',  'red-rock-climb', 'A friend climbing layered red rock while others wait above'),
 (A, 'Photo Jul 01 2025, 4 36 53 PM.JPG',  'desert-highway', 'An empty desert highway running straight toward distant mountains'),
 (A, 'Photo Jul 02 2025, 5 05 52 PM.JPG',  'canyon-arms',    'A friend standing on a boulder with arms spread wide above a canyon'),
 (A, 'Photo Jul 03 2025, 8 08 09 AM.JPG',  'camp-oaks',      'Tents pitched in a gravel clearing under old oak trees'),
 (A, 'Photo Jul 03 2025, 11 43 31 AM.JPG', 'van-nap',        'Two friends in cowboy hats asleep on each other in the back of the van'),
 (A, 'Photo Jul 03 2025, 5 53 11 PM.JPG',  'dunes',          'Quad bikes and helmets on the sand dunes, one friend turning to the camera'),
 (B, 'Photo Jul 06 2025, 1 59 52 PM.JPG',  'bridge-leak',    'A bridge road at midday washed by a pink light leak'),
 (B, 'Photo Jul 06 2025, 5 03 00 PM.JPG',  'waterfall-shout','A friend mid-shout at the edge of a rushing mountain stream'),
 (B, 'Photo Jul 06 2025, 6 34 38 PM.JPG',  'sequoias',       'Giant sequoias rising into the light with an orange leak across the frame'),
 (A, 'Photo Jul 06 2025, 7 32 29 PM.JPG',  'camp-grill',     'The crew gathered around a camp grill under tall pines'),
 (B, 'Photo Jul 06 2025, 7 32 59 PM.JPG',  'camp-pines',     'The whole group standing together among the pines at camp'),
 (A, 'Photo Jul 06 2025, 8 14 07 PM.JPG',  'lookout-selfie', 'A selfie at a lookout as the sun sets behind the ridges'),
 (B, 'Photo Jul 06 2025, 8 20 20 PM.JPG',  'ridges-dusk',    'Blue mountain ridges at dusk under a pink and orange light leak'),
 (A, 'Photo Jul 06 2025, 8 22 18 PM.JPG',  'railing-laugh',  'Two friends laughing at a railing in the last of the light'),
 (A, 'Photo Jul 06 2025, 8 25 51 PM.JPG',  'railing-lean',   'A friend leaning on the lookout rail above the hazy blue ridges'),
 (B, 'Photo Jul 06 2025, 8 35 40 PM.JPG',  'five-sunset',    'Five friends arm in arm at the lookout at sunset'),
 (B, 'Photo Jul 06 2025, 8 41 56 PM.JPG',  'burnt-trees',    'Burnt trees silhouetted against the last orange light on the horizon'),
 (B, 'Photo Jul 07 2025, 7 55 05 AM.JPG',  'morning-sun',    'Morning sun bursting through the pines above the camp road'),
 (A, 'Photo Jul 08 2025, 12 00 14 PM (1).JPG','yosemite',    'The whole crew posing in front of El Capitan and Yosemite Valley'),
 (B, 'Photo Jul 08 2025, 1 39 39 PM.JPG',  'creek',          'A creek winding through the forest, a red light leak across the water'),
 (A, 'Photo Jul 08 2025, 4 27 00 PM.JPG',  'rock-gully',     'Friends scrambling down a shaded rock gully beside a stream'),
 (B, 'Photo Jul 08 2025, 10 24 02 PM.JPG', 'campfire-leak',  'A campfire at night with a rainbow light leak down the frame'),
 (B, 'Photo Jul 08 2025, 10 24 12 PM.JPG', 'campfire',       'The crew sitting close around the campfire at night'),
 (B, 'Photo Jul 09 2025, 1 56 33 PM.JPG',  'ebikes',         'Electric bikes lined up on a mountain ridge trail'),
 (B, 'Photo Jul 09 2025, 2 36 47 PM.JPG',  'alpine-lake',    'A deep blue alpine lake below snow-patched granite peaks'),
 (A, 'Photo Jul 09 2025, 8 28 34 PM.JPG',  'van-chaos',      'Goofing around in the van, one friend standing, another yelling'),
 (B, 'Photo Jul 10 2025, 8 43 38 PM.JPG',  'white-robe',     'A friend in a white robe, sunglasses and cowboy hat outside a cabin at dusk'),
 (B, 'Photo Jul 14 2025, 6 57 22 PM.JPG',  'hot-tub',        'A hot tub selfie with the crew under the pines'),
 (B, 'Photo Jul 15 2025, 1 08 13 PM.JPG',  'gondola',        'Helmets on in the open-air gondola heading up the mountain'),
 (A, 'Photo Jul 15 2025, 1 37 12 PM.JPG',  'via-ferrata',    'Climbing a granite face on a via ferrata, helmets and harnesses on'),
 (A, 'Photo Jul 15 2025, 2 48 09 PM.JPG',  'granite-dome',   'Climbers roped together on a granite dome under a deep blue sky'),
]
assert len(ROLL) == 33, len(ROLL)
manifest = []
for i, (d, fn, slug, alt) in enumerate(ROLL, 1):
    im = ImageOps.exif_transpose(Image.open(os.path.join(d, fn))).convert('RGB')
    w, h = im.size
    base = f'{i:02d}-{slug}'
    small = im.copy(); small.thumbnail((720, 720), Image.LANCZOS)
    small.save(os.path.join(OUT, base + '.webp'), 'WEBP', quality=78, method=6)
    large = im.copy(); large.thumbnail((1600, 1600), Image.LANCZOS)
    large.save(os.path.join(OUT, base + '-lg.webp'), 'WEBP', quality=82, method=6)
    manifest.append({'id': base, 'src': f'media/roll/{base}.webp', 'large': f'media/roll/{base}-lg.webp',
                     'w': large.width, 'h': large.height, 'tw': small.width, 'th': small.height, 'alt': alt,
                     'day': fn[6:12]})
with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=0)

# film grain tile: transparent PNG with sparse light and dark speckles
random.seed(7)
g = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); px = g.load()
for y in range(256):
    for x in range(256):
        v = random.random()
        if v < 0.18: px[x, y] = (255, 240, 220, random.randint(40, 110))
        elif v > 0.84: px[x, y] = (0, 0, 0, random.randint(40, 120))
g.save(os.path.join(ROOT, 'media', 'grain.png'), optimize=True)
tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f'{len(manifest)} photos, roll folder {tot/1e6:.1f} MB')


# ---------------------------------------------------------------------------
# Background postcards from Drifters/more-attachments: soft, warm, faded derivatives
# (blur and grade are baked in so the page never runs a filter), plus a deterministic
# scatter that is written into index.html between the collage markers.
from PIL import ImageFilter, ImageEnhance
import random as _random
MORE = os.path.join(ROOT, 'Drifters', 'more-attachments')
BG = os.path.join(ROOT, 'media', 'bg')
os.makedirs(BG, exist_ok=True)
# (file, slug, area) — area 'reel' = the Moments section, 'trailer' = above the footer
MORE_ROLL = [
 ('IMG_2047.jpeg',        'road-selfie',   'reel'),
 ('DSC06554.jpeg',        'crew-woods',    'reel'),
 ('IMG_2237.jpeg',        'pine-branch',   'reel'),
 ('IMG_2286.jpeg',        'paraglide',     'reel'),
 ('image 0004.jpeg',      'flag-road',     'reel'),
 ('image 0009.jpeg',      'canyon-creek',  'reel'),
 ('IMG_2079.jpeg',        'rain-ponchos',  'reel'),
 ('IMG_2295.jpeg',        'van-selfie',    'reel'),
 ('20260705_160122.jpg',  'horse',         'trailer'),
 ('IMG_2179.jpeg',        'geyser',        'trailer'),
 ('image 0000.jpeg',      'palms',         'trailer'),
 ('DSC06558.jpeg',        'crew-woods-2',  'trailer'),
]
bg = []
for i, (fn, slug, area) in enumerate(MORE_ROLL, 1):
    im = ImageOps.exif_transpose(Image.open(os.path.join(MORE, fn))).convert('RGB')
    im.thumbnail((560, 560), Image.LANCZOS)
    im = im.filter(ImageFilter.GaussianBlur(radius=max(im.size) * 0.011))
    im = ImageEnhance.Color(im).enhance(0.82)
    im = ImageEnhance.Contrast(im).enhance(0.86)
    im = ImageEnhance.Brightness(im).enhance(1.04)
    warm = Image.new('RGB', im.size, (217, 185, 138))
    im = Image.blend(im, warm, 0.16)
    im = im.point(lambda v: int(v * 0.9 + 22))  # lifted blacks, like a faded print
    name = f'{i:02d}-{slug}.webp'
    im.save(os.path.join(BG, name), 'WEBP', quality=72, method=6)
    bg.append({'src': f'media/bg/{name}', 'w': im.width, 'h': im.height, 'area': area})
with open(os.path.join(BG, 'manifest.json'), 'w') as f:
    json.dump(bg, f, indent=0)

# Scatter: a loose grid with seeded jitter; --x/--y/--w are percentages of the section box,
# --r the tilt. Cards may bleed past the edges; neighbours are nudged together so some overlap.
def scatter(cards, bands, seed, wr=(34, 50)):
    """bands: list of (y_min, y_max, count). Cards are spread across x within each band with
    seeded jitter; neighbours land close enough to overlap here and there."""
    rnd = _random.Random(seed)
    out = []; k = 0
    for (y0, y1, count) in bands:
        slots = list(range(count)); rnd.shuffle(slots)
        for slot in slots:
            if k >= len(cards): break
            card = cards[k]; k += 1
            x = -8 + (84 / count) * (slot + 0.5 + rnd.uniform(-0.38, 0.38))
            y = rnd.uniform(y0, y1)
            w = rnd.uniform(*wr) * (0.82 if card['w'] < card['h'] else 1.0)
            out.append({**card, 'x': round(x, 1), 'y': round(y, 1), 'w': round(w, 1), 'r': round(rnd.uniform(-14, 14), 1), 'layer': 'near' if k % 2 else 'far'})
    return out

def markup(cards, indent='      '):
    far = [c for c in cards if c['layer'] == 'far']; near = [c for c in cards if c['layer'] == 'near']
    def one(c):
        return (f'{indent}    <div class="pc" style="--x:{c["x"]}%;--y:{c["y"]}%;--w:{c["w"]}%;--r:{c["r"]}deg">'
                f'<img src="./{c["src"]}" width="{c["w" if False else "w"]}" height="{c["h"]}" alt="" loading="lazy" decoding="async"></div>')
    lines = [f'{indent}<div class="collage" aria-hidden="true">', f'{indent}  <div class="collage-layer far">']
    lines += [one(c) for c in far]
    lines += [f'{indent}  </div>', f'{indent}  <div class="collage-layer near">']
    lines += [one(c) for c in near]
    lines += [f'{indent}  </div>', f'{indent}</div>']
    return '\n'.join(lines)

# The strip covers the middle of the Moments section and the video the middle of the trailer
# section, so the cards live in the bands above and below, where they can be seen.
reel_cards = scatter([c for c in bg if c['area'] == 'reel'], bands=[(-6, 7, 4), (79, 89, 4)], seed=11, wr=(40, 58))
trailer_cards = scatter([c for c in bg if c['area'] == 'trailer'], bands=[(-12, 3, 2), (66, 82, 2)], seed=5, wr=(42, 60))
html_path = os.path.join(ROOT, 'index.html')
import re as _re
html = open(html_path).read()
for key, cards in (('reel', reel_cards), ('trailer', trailer_cards)):
    block = f'<!-- collage:{key} -->\n{markup(cards, "    ")}\n    <!-- /collage:{key} -->'
    if f'<!-- collage:{key} -->' in html:
        html = _re.sub(rf'<!-- collage:{key} -->.*?<!-- /collage:{key} -->', block, html, flags=_re.S)
    else:
        anchor = '<section class="reel" aria-label="The film roll">\n' if key == 'reel' else '<section class="trailer" aria-label="This summer, on tape">\n'
        html = html.replace(anchor, anchor + '    ' + block + '\n')
open(html_path, 'w').write(html)
print(f'{len(bg)} background postcards; collage markup written into index.html')

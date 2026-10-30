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

#!/usr/bin/env python3
"""Tile QA screenshots into one labelled contact sheet. python3 -I tools/sheet.py <dir> <out.jpg> [cols] [cellwidth]"""
import sys, os, glob
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6; cw = int(sys.argv[4]) if len(sys.argv) > 4 else 300
files = sorted(f for f in glob.glob(os.path.join(d, '*.jpg')) if 'sheet' not in f)
tiles = []
for f in files:
    im = Image.open(f); r = cw / im.width; im = im.resize((cw, int(im.height * r))); tiles.append((os.path.basename(f)[:-4], im))
ch = max(t.height for _, t in tiles) + 18
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (cw + 6), rows * ch), (30, 30, 30)); dr = ImageDraw.Draw(sheet)
for i, (name, im) in enumerate(tiles):
    x = (i % cols) * (cw + 6); y = (i // cols) * ch
    sheet.paste(im, (x, y + 16)); dr.text((x + 2, y + 2), name, fill=(255, 220, 160))
sheet.save(out, quality=80); print(out, sheet.size, len(tiles), 'shots')

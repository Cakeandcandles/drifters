#!/usr/bin/env bash
# Builds the compressed video derivatives in media/ from the originals in Drifters/.
# Originals are read only. Re-run any time; outputs are overwritten.
set -euo pipefail
cd "$(dirname "$0")/.."
FF="${FFMPEG:-$(command -v ffmpeg || echo /home/cakeandcandles/.claude/jobs/64e843bb/tmp/vid/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2)}"
SRC=Drifters
OUT=media
# Phone-first budget: 720 px wide, about 2 Mbps, 6-8 second loops. Half the pixels of 1080p and a third of the bytes.
COMMON=(-c:v libx264 -preset slow -crf 24 -maxrate 2.0M -bufsize 4.0M -profile:v high -level 4.0 -pix_fmt yuv420p -g 48 -keyint_min 48 -sc_threshold 0 -movflags +faststart -an -threads 0)

# name | source | crop (w:h:x:y, measured inner footage window with a 6px inset) | output size | poster time | loop start | loop length
enc () {
  local name="$1" src="$2" crop="$3" size="$4" pt="$5" start="${6:-0}" len="${7:-}"
  echo "== $name"
  local vf="scale=$size:flags=lanczos"
  [ "$crop" != "none" ] && vf="crop=$crop,$vf"
  local trim=(-ss "$start"); [ -n "$len" ] && trim+=(-t "$len")
  "$FF" -hide_banner -loglevel warning -stats -y "${trim[@]}" -i "$SRC/$src" -vf "$vf" "${COMMON[@]}" "$OUT/$name.mp4"
  "$FF" -hide_banner -loglevel error -y -ss "$pt" -i "$SRC/$src" -vf "$vf" -frames:v 1 -q:v 4 "$OUT/$name.jpg"
}

# 9:16 windows (clips 2 and 3): measured x 1303..2535 and 1297..2542 -> inset -> 1224 wide.
# Loop windows skip the blurred flash intros of clips 2 and 4 and keep the strongest 8 seconds.
enc tape-hero "clip 2 nenenen.mp4"   "1224:2160:1308:0" 720:1280 2.4 1.7 8.0
enc tape-1    "clip 3 nennenen.mp4"  "1224:2160:1308:0" 720:1280 0.6 0   8.4
# 3:4 windows (clips 1 and 4): measured x 1104..2734 and 1113..2726 -> inset -> 1600 wide, centred on 1920
enc tape-2    "clip 1 , nenenen.mp4" "1600:2160:1120:0" 720:960  5.2
enc tape-3    "clip 4 nenene.mp4"    "1600:2160:1120:0" 720:960  7.5 1.6 8.2
# trailer, full frame
echo "== trailer"
"$FF" -hide_banner -loglevel warning -stats -y -i "$SRC/horizontal clip 2.mp4" -vf "scale=1280:720:flags=lanczos" "${COMMON[@]}" -crf 25 -maxrate 1.5M -bufsize 3M "$OUT/trailer.mp4"
"$FF" -hide_banner -loglevel error -y -sseof -0.3 -i "$SRC/horizontal clip 2.mp4" -vf "scale=1280:720:flags=lanczos" -frames:v 1 -q:v 3 "$OUT/trailer.jpg"
# hero background, re-encoded at native size
"$FF" -hide_banner -loglevel error -y -i "$SRC/hero-background.webp" -c:v libwebp -quality 85 "$OUT/valley.webp"
ls -la "$OUT"

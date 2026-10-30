#!/usr/bin/env bash
# Builds the compressed video derivatives in media/ from the originals in Drifters/.
# Originals are read only. Re-run any time; outputs are overwritten.
set -euo pipefail
cd "$(dirname "$0")/.."
FF="${FFMPEG:-$(command -v ffmpeg || echo /home/cakeandcandles/.claude/jobs/64e843bb/tmp/vid/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2)}"
SRC=Drifters
OUT=media
COMMON=(-c:v libx264 -preset slow -crf 23 -maxrate 3.6M -bufsize 7.2M -profile:v high -level 4.1 -pix_fmt yuv420p -g 48 -keyint_min 48 -sc_threshold 0 -movflags +faststart -an -threads 0)

# name | source | crop (w:h:x:y, measured inner footage window with a 6px inset) | output size | poster time
enc () {
  local name="$1" src="$2" crop="$3" size="$4" pt="$5"
  echo "== $name"
  local vf="scale=$size:flags=lanczos"
  [ "$crop" != "none" ] && vf="crop=$crop,$vf"
  "$FF" -hide_banner -loglevel warning -stats -y -i "$SRC/$src" -vf "$vf" "${COMMON[@]}" "$OUT/$name.mp4"
  "$FF" -hide_banner -loglevel error -y -ss "$pt" -i "$SRC/$src" -vf "$vf" -frames:v 1 -q:v 3 "$OUT/$name.jpg"
}

# 9:16 windows (clips 2 and 3): measured x 1303..2535 and 1297..2542 -> inset -> 1224 wide.
# Output size is the standard 1080x1920 so every hardware decoder treats it as an ordinary phone video.
enc tape-hero "clip 2 nenenen.mp4"   "1224:2160:1308:0" 1080:1920 2.4
enc tape-1    "clip 3 nennenen.mp4"  "1224:2160:1308:0" 1080:1920 0.6
# 3:4 windows (clips 1 and 4): measured x 1104..2734 and 1113..2726 -> inset -> 1600 wide, centred on 1920
enc tape-2    "clip 1 , nenenen.mp4" "1600:2160:1120:0" 1080:1440 5.2
enc tape-3    "clip 4 nenene.mp4"    "1600:2160:1120:0" 1080:1440 7.5
# trailer, full frame
echo "== trailer"
"$FF" -hide_banner -loglevel warning -stats -y -i "$SRC/horizontal clip 2.mp4" -vf "scale=1280:720:flags=lanczos" "${COMMON[@]}" -crf 24 "$OUT/trailer.mp4"
"$FF" -hide_banner -loglevel error -y -sseof -0.3 -i "$SRC/horizontal clip 2.mp4" -vf "scale=1280:720:flags=lanczos" -frames:v 1 -q:v 3 "$OUT/trailer.jpg"
# hero background, re-encoded at native size
"$FF" -hide_banner -loglevel error -y -i "$SRC/hero-background.webp" -c:v libwebp -quality 85 "$OUT/valley.webp"
ls -la "$OUT"

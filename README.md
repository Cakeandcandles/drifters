# Drifters & Co. — teaser site

A static, one-page, scroll-driven site. No framework, no build step. Deploy the repository root to GitHub Pages
(`.nojekyll` is present; all URLs are relative, so a project subpath works).

```
index.html      the page
styles.css      tokens, scenes (rest and live states), reduced-motion overrides
js/             main.js (boot) · progress.js (sticky-scene scroll engine) · scenes.js (opening, tapes, closing)
                video.js (playback manager) · reel.js (film strip) · lightbox.js (photo window)
media/          compressed derivatives used by the site (videos, posters, roll photos, SVG marks, grain)
fonts/          self-hosted Rammetto One and Archivo (OFL)
tools/          build-media.sh (video derivatives) · build-photos.py (roll photos + manifest + grain)
                serve.mjs (local server, optional subpath) · qa.mjs (headless phone/desktop tour) · perf.mjs
Drifters/       the original media (git-ignored: 473 MB, three clips exceed GitHub's 100 MB file limit)
```

Rebuild derivatives after changing originals:

```
./tools/build-media.sh            # needs ffmpeg (set FFMPEG=/path/to/ffmpeg if not on PATH)
python3 -I tools/build-photos.py  # needs Pillow
```

Local preview: `node tools/serve.mjs 8080` or `node tools/serve.mjs 8081 /Drifters-concert` for the subpath case.

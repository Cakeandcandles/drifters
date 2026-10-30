// Playback manager: which videos are wanted, by whom, and what to do when
// autoplay is refused. At most two videos play at once (during a tape change).
export function createVideoManager({ autoplay = true } = {}) {
  const all = [...document.querySelectorAll('video[data-video]')];
  const groups = new Map();      // group name -> Set<video>
  const manual = new Set();      // videos the visitor started by hand (reduced motion)
  let unlocked = autoplay;       // false once a play() was refused, until a tap

  const fallbackFor = (v) => v.closest('.tape-layer, .stage, .trailer-frame')?.querySelector('.play-fallback');

  function wanted() {
    const w = new Set(manual);
    if (autoplay) for (const g of groups.values()) for (const v of g) w.add(v);
    return w;
  }

  function sync() {
    const w = wanted();
    for (const v of all) {
      const shouldPlay = w.has(v) && !document.hidden;
      if (shouldPlay) {
        if (v.paused) {
          if (v.preload === 'none') v.preload = 'auto';
          const pr = v.play();
          if (pr && pr.catch) pr.catch((err) => {
            if (err && (err.name === 'NotAllowedError' || err.name === 'NotSupportedError')) {
              unlocked = false;
              const b = fallbackFor(v); if (b) b.hidden = false;
            }
          });
        }
      } else if (!v.paused) {
        v.pause();
      }
    }
    if (unlocked) for (const v of all) { const b = fallbackFor(v); if (b && !manual.size) b.hidden = true; }
  }

  function setGroup(name, vids) {
    groups.set(name, new Set(vids));
    sync();
  }

  // One tap on any fallback unlocks every wanted video.
  for (const b of document.querySelectorAll('.play-fallback')) {
    b.addEventListener('click', () => {
      unlocked = true;
      if (!autoplay) {
        const v = b.closest('.tape-layer, .stage, .trailer-frame')?.querySelector('video');
        if (v) { manual.has(v) ? manual.delete(v) : manual.add(v); b.setAttribute('aria-label', manual.has(v) ? 'Pause video' : 'Play video'); }
      }
      for (const v of wanted()) v.play().catch(() => {});
      for (const x of document.querySelectorAll('.play-fallback')) if (autoplay) x.hidden = true;
      sync();
    });
  }

  // Preload one scene ahead; play by visibility for videos no scene drives.
  const near = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting && v.preload === 'none') { v.preload = 'auto'; if (v.readyState === 0) v.load(); }
    }
  }, { rootMargin: '100% 0px 100% 0px' });

  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (autoplay) setGroup('io:' + v.dataset.video, e.intersectionRatio > 0.25 ? [v] : []);
      else {
        const b = fallbackFor(v);
        if (b) b.hidden = e.intersectionRatio <= 0.25;
        if (e.intersectionRatio <= 0.25 && manual.has(v)) { manual.delete(v); if (b) b.setAttribute('aria-label', 'Play video'); sync(); }
      }
    }
  }, { threshold: [0, 0.25, 0.5] });

  function observe(v) { near.observe(v); seen.observe(v); }

  for (const v of all) {
    v.muted = true; v.defaultMuted = true; v.volume = 0;
    v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    if (!autoplay) { v.autoplay = false; v.removeAttribute('autoplay'); v.pause(); }
    v.addEventListener('error', () => { v.removeAttribute('autoplay'); v.classList.add('is-broken'); });
    v.addEventListener('volumechange', () => { if (!v.muted) v.muted = true; });
  }

  document.addEventListener('visibilitychange', sync);
  addEventListener('pageshow', sync);

  return { setGroup, sync, observe, all };
}

// The film roll: a native horizontal scroller. Scrolling it spins the spool
// and tilts the frames nearest the edges, so the strip reads as film coming off a reel.
export function initReel(root, { reduced = false } = {}) {
  const strip = root.querySelector('.strip');
  const spool = root.querySelector('.spool');
  const frames = [...root.querySelectorAll('.fr')];
  const visible = new Set();
  let raf = 0, spoolR = 100, W = 1;

  function measure() { spoolR = Math.max(40, spool.offsetWidth / 2); W = strip.clientWidth || 1; }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
    if (!reduced) schedule();
  }, { root: strip, rootMargin: '0px 30% 0px 30%' });
  frames.forEach((f) => io.observe(f));

  function paint() {
    raf = 0;
    const sl = strip.scrollLeft;
    const cx = W / 2;
    // Read everything first, then write.
    const reads = [];
    for (const f of visible) {
      const r = f.getBoundingClientRect();
      reads.push([f, (r.left + r.width / 2 - cx) / W]);
    }
    spool.style.setProperty('--spin', (sl / spoolR).toFixed(4) + 'rad');
    for (const [f, d] of reads) {
      f.style.setProperty('--tilt', (d * 3).toFixed(2) + 'deg');
      f.style.setProperty('--lift', (d * d * 16).toFixed(1) + 'px');
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(paint); }

  measure();
  if (!reduced) {
    strip.addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', () => { measure(); schedule(); });
    schedule();
  }

  // Mouse drag to scroll. Touch keeps native momentum.
  let down = false, sx = 0, sl0 = 0, moved = false;
  strip.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; sx = e.clientX; sl0 = strip.scrollLeft;
    strip.classList.add('dragging');
  });
  strip.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 6) moved = true;
    if (moved) { strip.scrollLeft = sl0 - dx; e.preventDefault(); }
  });
  const up = () => { if (!down) return; down = false; strip.classList.remove('dragging'); };
  strip.addEventListener('pointerup', up);
  strip.addEventListener('pointercancel', up);
  strip.addEventListener('pointerleave', up);
  strip.addEventListener('click', (e) => {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);
  strip.addEventListener('dragstart', (e) => e.preventDefault());

  // The cue above the strip goes once the visitor has pulled the strip a little, and stays gone.
  const cue = root.querySelector('.reel-cue');
  if (cue) {
    const x0 = strip.scrollLeft;
    const onFirstPull = () => {
      if (Math.abs(strip.scrollLeft - x0) < 40) return;
      strip.removeEventListener('scroll', onFirstPull);
      cue.classList.add('is-gone');
      setTimeout(() => { cue.hidden = true; }, 450);
    };
    strip.addEventListener('scroll', onFirstPull, { passive: true });
  }

  initReelSound(strip);
}

// Sprocket clicks while the strip is moving: a short filtered noise burst every few
// pixels of travel, synthesised with Web Audio (no audio file). Armed by the first
// touch, click or key on the strip, as browsers require.
function initReelSound(strip) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  let ctx = null, noise = null, lastX = strip.scrollLeft, travelled = 0, lastAt = 0;

  function arm() {
    if (!ctx) {
      try { ctx = new AC(); } catch { return; }
      const len = Math.ceil(ctx.sampleRate * 0.03);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  for (const ev of ['pointerdown', 'touchend', 'keydown', 'click']) strip.addEventListener(ev, arm, { passive: true });

  function click(strength) {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600 + Math.random() * 1600; bp.Q.value = 1.4;
    const g = ctx.createGain(); g.gain.value = 0.05 + 0.07 * strength;
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start();
  }

  strip.addEventListener('scroll', () => {
    const x = strip.scrollLeft;
    const dx = Math.abs(x - lastX); lastX = x;
    if (!ctx || ctx.state !== 'running' || document.hidden) return;
    travelled += dx;
    const now = performance.now();
    if (travelled >= 26 && now - lastAt >= 30) {
      travelled = 0; lastAt = now;
      click(Math.min(1, dx / 60));
    }
  }, { passive: true });
}

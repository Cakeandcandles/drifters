// The film roll: a native horizontal scroller that never ends. The strip holds three
// copies of the roll; whenever scrolling comes to rest in the first or last copy, the
// position is moved by exactly one copy width into the middle one. The layouts are
// identical, so the jump cannot be seen. Scrolling spins the spool and tilts the frames
// nearest the edges, so the strip reads as film coming off a reel.
export function initReel(root, { reduced = false } = {}) {
  const strip = root.querySelector('.strip');
  const film = root.querySelector('.film');
  const spool = root.querySelector('.spool');
  const originals = [...film.children];
  const n = originals.length;

  // Clones before and after. They are reachable by pointer (the lightbox reads their data)
  // but stay out of the keyboard order and the accessibility tree.
  const cloneSet = () => {
    const frag = document.createDocumentFragment();
    for (const li of originals) {
      const c = li.cloneNode(true);
      c.classList.add('is-clone');
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('button').forEach((b) => { b.tabIndex = -1; });
      frag.appendChild(c);
    }
    return frag;
  };
  if (n) { film.prepend(cloneSet()); film.append(cloneSet()); }
  const frames = [...film.children];

  let W = 1, turns = 1, spoolR = 100, V = 1;
  function measure() {
    const prevW = W;
    W = n ? Math.max(1, frames[2 * n].offsetLeft - frames[n].offsetLeft) : 1;
    spoolR = Math.max(40, spool.offsetWidth / 2);
    turns = Math.max(1, Math.round(W / (2 * Math.PI * spoolR)));
    V = strip.clientWidth || 1;
    if (prevW !== W && prevW > 1) {
      const rel = (((strip.scrollLeft - prevW) % prevW) + prevW) % prevW;
      strip.scrollLeft = W + rel * (W / prevW);
    }
  }
  measure();
  if (n) strip.scrollLeft = W;

  // Re-centre into the middle copy, only when the strip is at rest.
  function recentre() {
    if (!n) return;
    const x = strip.scrollLeft;
    if (x < W * 0.5) strip.scrollLeft = x + W;
    else if (x > W * 1.5) strip.scrollLeft = x - W;
  }
  let restTimer = 0;
  strip.addEventListener('scroll', () => { clearTimeout(restTimer); restTimer = setTimeout(recentre, 140); }, { passive: true });
  if ('onscrollend' in window) strip.addEventListener('scrollend', recentre);

  // Spool and tilt.
  const visible = new Set();
  let raf = 0;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
    if (!reduced) schedule();
  }, { root: strip, rootMargin: '0px 30% 0px 30%' });
  frames.forEach((f) => io.observe(f));

  function paint() {
    raf = 0;
    const cx = V / 2;
    const reads = [];
    for (const f of visible) {
      const r = f.getBoundingClientRect();
      reads.push([f, (r.left + r.width / 2 - cx) / V]);
    }
    // One copy width is a whole number of turns, so the re-centre jump never shows on the spool.
    spool.style.setProperty('--spin', ((strip.scrollLeft / W) * 2 * Math.PI * turns).toFixed(4) + 'rad');
    for (const [f, d] of reads) {
      f.style.setProperty('--tilt', (d * 3).toFixed(2) + 'deg');
      f.style.setProperty('--lift', (d * d * 16).toFixed(1) + 'px');
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(paint); }
  if (!reduced) {
    strip.addEventListener('scroll', schedule, { passive: true });
    schedule();
  }
  addEventListener('resize', () => { measure(); if (!reduced) schedule(); });

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

  return { get copyWidth() { return W; } };
}

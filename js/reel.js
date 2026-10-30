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
}

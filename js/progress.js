// Scroll-progress engine: maps each sticky scene's scroll position to p in [0, 1].
// Native scrolling only. One passive scroll listener, one rAF loop that runs
// only while a scene is near the viewport and still settling.
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function createEngine({ smooth = 0.2 } = {}) {
  const scenes = [];
  const listeners = [];
  let raf = 0;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const s = scenes.find((x) => x.el === e.target);
      if (!s || s.near === e.isIntersecting) continue;
      s.near = e.isIntersecting;
      if (s.near) s.p = -1; // snap to the real position on arrival, no catch-up sweep
      s.onNear?.(s.near);
    }
    kick();
  }, { rootMargin: '60% 0px 60% 0px' });

  function measure() {
    for (const s of scenes) s.stageH = s.stage.getBoundingClientRect().height;
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    raf = 0;
    let busy = false;
    // Read phase: one rect per near scene.
    for (const s of scenes) {
      if (!s.near) continue;
      const r = s.el.getBoundingClientRect();
      const range = r.height - s.stageH;
      s.top = r.top;
      s.target = range > 1 ? clamp01(-r.top / range) : 0;
    }
    // Write phase: transforms and opacity only, inside each scene's update.
    for (const s of scenes) {
      if (!s.near) continue;
      const d = s.target - s.p;
      if (Math.abs(d) < 0.0005) {
        if (s.p !== s.target) { s.p = s.target; s.update(s.p); }
        continue;
      }
      s.p = s.p < 0 ? s.target : s.p + d * smooth;
      s.update(s.p);
      busy = true;
    }
    // The scene whose stage is pinned right now (its top has passed and it has not released).
    const pinned = scenes.find((s) => s.near && s.top <= 0.5 && s.target > 0 && s.target < 0.999) || null;
    for (const fn of listeners) fn(pinned, pinned ? pinned.p : 0, busy);
    if (busy) raf = requestAnimationFrame(tick);
  }

  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => {
    measure();
    for (const s of scenes) s.resize?.();
    kick();
  });

  return {
    add(el, stage, update, { resize, onNear } = {}) {
      const s = { el, stage, update, resize, onNear, p: -1, target: 0, near: false, stageH: stage.getBoundingClientRect().height };
      scenes.push(s);
      io.observe(el);
      return s;
    },
    kick,
    measure,
    onUpdate(fn) { listeners.push(fn); },
  };
}

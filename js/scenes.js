// The three sticky scenes. Each is a pure function of p, written as CSS custom
// properties on a handful of elements (transform, opacity, clip-path only).
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
const easeInQuint = (t) => t * t * t * t * t;
const set = (el, name, value) => el.style.setProperty(name, value);

/* Scene A/B: the frame grows out of the postcard until it fills the screen. */
export function opening(section, engine) {
  const stage = section.querySelector('.stage');
  const frame = section.querySelector('.frame');
  const valley = section.querySelector('.valley');
  const dim = section.querySelector('.dim');
  const masthead = section.querySelector('.masthead');
  let g = null;

  function resize() {
    const W = stage.clientWidth, H = stage.clientHeight;
    const svh = Math.min(H, window.innerHeight);
    const clipW = Math.min(W, H * 9 / 16), clipH = clipW * 16 / 9;
    const cl = (W - clipW) / 2, ct = (H - clipH) / 2;
    const m = parseFloat(getComputedStyle(stage).getPropertyValue('--m')) || 16;
    const fhPref = (parseFloat(getComputedStyle(frame).getPropertyValue('--frame-h')) || 56) / 100 * svh;
    const fw = Math.min(0.70 * W, fhPref * 9 / 16), fh = fw * 16 / 9;
    const cx = W - m - fw / 2;
    const cy = svh - 0.09 * svh - fh / 2;
    g = { cl, ct, clipH, s0: fw / clipW, tx0: cx - W / 2, ty0: cy - H / 2 };
    set(frame, '--rail', (clipH * 0.07).toFixed(1) + 'px');
  }

  function update(p) {
    const e = easeInOutCubic(p);
    const k = 1 - e;
    set(frame, '--s', (g.s0 + (1 - g.s0) * e).toFixed(4));
    set(frame, '--tx', (g.tx0 * k).toFixed(1) + 'px');
    set(frame, '--ty', (g.ty0 * k).toFixed(1) + 'px');
    set(frame, '--r', (-3 * k).toFixed(2) + 'deg');
    set(frame, '--cl', (g.cl * k).toFixed(1) + 'px');
    set(frame, '--ct', (g.ct * k).toFixed(1) + 'px');
    set(frame, '--rail-out', easeOutCubic(clamp01((p - 0.55) / 0.35)).toFixed(3));
    set(valley, '--bg-s', (1 + 0.12 * p).toFixed(4));
    set(dim, '--bg-dim', (0.65 * e).toFixed(3));
    const hdr = easeOutCubic(clamp01(p / 0.12));
    set(masthead, '--hdr', hdr.toFixed(3));
    masthead.style.visibility = hdr >= 0.999 ? 'hidden' : 'visible';
  }

  resize();
  section.classList.add('is-live');
  update(0);
  engine.add(section, stage, update, { resize });
}

/* Scene D: three tapes; each change is a short flicker, then a sideways sweep. */
export function tapes(section, engine, videos) {
  const stage = section.querySelector('.stage');
  const layers = [...section.querySelectorAll('.tape-layer')];
  const vids = layers.map((l) => l.querySelector('video'));
  const T0 = 0.28, T1 = 0.44, T2 = 0.70, T3 = 0.86;
  let lastKey = '', near = false;

  function plain(i) {
    const l = layers[i];
    l.classList.add('is-on');
    set(l, '--x', '0%'); set(l, '--y', '0px'); set(l, '--sc', '1');
    set(l, '--clip', 'none'); set(l, '--dim', '0'); set(l, '--op', '1');
  }
  function off(i) { layers[i].classList.remove('is-on'); }

  function transition(a, b, t, dir) {
    const la = layers[a], lb = layers[b];
    la.classList.add('is-on'); lb.classList.add('is-on');
    const fl = Math.min(1, t / 0.08);
    const u = t <= 0.08 ? 0 : easeInOutCubic((t - 0.08) / 0.92);
    // Outgoing: three low-contrast dips and a 2px jitter, then it slides away and darkens.
    const dip = t < 0.08 ? 1 - 0.3 * Math.max(0, Math.sin(fl * Math.PI * 3)) : 1;
    const jit = t < 0.08 ? 2 * Math.sin(fl * Math.PI * 6) : 0;
    set(la, '--x', (dir * -18 * u).toFixed(2) + '%');
    set(la, '--y', jit.toFixed(2) + 'px');
    set(la, '--sc', '1'); set(la, '--clip', 'none');
    set(la, '--dim', (0.55 * u).toFixed(3));
    set(la, '--op', dip.toFixed(3));
    // Incoming: revealed by a wipe from the side it comes from, settling from a slight zoom.
    const edge = (100 - 100 * u).toFixed(2) + '%';
    set(lb, '--clip', dir > 0 ? `inset(0 0 0 ${edge})` : `inset(0 ${edge} 0 0)`);
    set(lb, '--x', '0%'); set(lb, '--y', '0px');
    set(lb, '--sc', (1.06 - 0.06 * u).toFixed(4));
    set(lb, '--dim', '0'); set(lb, '--op', '1');
  }

  function update(p) {
    let key, live;
    if (p < T0) { plain(0); off(1); off(2); live = [0]; }
    else if (p < T1) { transition(0, 1, (p - T0) / (T1 - T0), 1); off(2); live = [1]; }
    else if (p < T2) { off(0); plain(1); off(2); live = [1]; }
    else if (p < T3) { off(0); transition(1, 2, (p - T2) / (T3 - T2), -1); live = [2]; }
    else { off(0); off(1); plain(2); live = [2]; }
    key = live.join('+');
    if (near && key !== lastKey) {
      lastKey = key;
      videos.setGroup('tapes', live.map((i) => vids[i]));
    }
  }

  section.classList.add('is-live');
  update(0);
  engine.add(section, stage, update, {
    onNear(n) {
      near = n; lastKey = '';
      if (!n) videos.setGroup('tapes', []);
    },
  });
}

/* The announcement: the first line squeezes together, pops, and is flung off the screen;
   the second line's words tumble in one by one and land with a bounce. */
const easeInQuad = (t) => t * t;
const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

export function announce(section, engine) {
  const stage = section.querySelector('.stage');
  const a = section.querySelector('.msg-a .t');
  const b = section.querySelector('.msg-b');
  const words = [...b.querySelectorAll('.w')];

  function update(p) {
    // Line one.
    let sx = 1, sy = 1, ls = -0.01, rot = 0, tx = 0, ty = 0, op = 1, pop = 1, gap = 1;
    if (p < 0.28) { /* at rest */ }
    else if (p < 0.52) {
      const u = (p - 0.28) / 0.24, e = easeInOutCubic(u);
      sx = 1 - 0.92 * e; sy = 1 + 0.3 * e; ls = -0.01 - 0.31 * e; gap = 1 - 0.55 * e;
      rot = 5 * Math.sin(u * Math.PI * 3) * (1 - 0.5 * e);
    } else if (p < 0.56) {
      const u = (p - 0.52) / 0.04;
      sx = 0.08; sy = 1.3; ls = -0.32; gap = 0.45; pop = 1 + 0.3 * Math.sin(u * Math.PI);
    } else if (p < 0.66) {
      const u = (p - 0.56) / 0.10, e = easeInQuad(u);
      sx = 0.08; sy = 1.3; ls = -0.32; gap = 0.45;
      tx = -140 * e; ty = -7 * Math.sin(u * Math.PI); rot = -14 * u;
      op = u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1;
    } else { op = 0; }
    set(a, '--sx', sx.toFixed(4)); set(a, '--sy', sy.toFixed(4)); set(a, '--ls', ls.toFixed(3) + 'em');
    set(a, '--rot', rot.toFixed(2) + 'deg'); set(a, '--tx', tx.toFixed(2) + 'vw'); set(a, '--ty', ty.toFixed(2) + 'vh');
    set(a, '--op', op.toFixed(3)); set(a, '--pop', pop.toFixed(4)); set(a, '--gap', gap.toFixed(3));
    a.style.visibility = op > 0.001 ? 'visible' : 'hidden';

    // Line two, word by word.
    const on = p > 0.64;
    b.style.visibility = on ? 'visible' : 'hidden';
    words.forEach((w, k) => {
      const start = 0.64 + k * 0.035, u = clamp01((p - start) / 0.18);
      if (!on || u <= 0) { w.style.transform = 'translate(30vw, 40vh) rotate(18deg) scale(1.5, .7)'; w.style.opacity = '0'; return; }
      // Travel without overshoot so words never cross the line above; the bounce lives in the scale.
      const m = 1 - easeOutCubic(u), b = 1 - easeOutBack(u);
      w.style.transform = `translate(${(30 * m).toFixed(2)}vw, ${(40 * m).toFixed(2)}vh) rotate(${(18 * m).toFixed(2)}deg) scale(${(1 + 0.5 * b).toFixed(3)}, ${(1 - 0.3 * b).toFixed(3)})`;
      w.style.opacity = Math.min(1, u * 4).toFixed(3);
    });
  }

  section.classList.add('is-live');
  update(0);
  engine.add(section, stage, update);
}

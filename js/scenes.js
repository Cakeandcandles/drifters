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

/* Scene F: a sheet of green rises to the half line, then three messages take turns. */
export function closing(section, engine) {
  const stage = section.querySelector('.stage');
  const sheet = section.querySelector('.sheet');
  const messages = section.querySelector('.messages');
  const msgs = [...section.querySelectorAll('.msg')];
  // in-start, in-end, out-start, out-end
  const seg = [[0.24, 0.32, 0.46, 0.54], [0.54, 0.62, 0.74, 0.82], [0.82, 0.90, 1.5, 1.6]];

  function update(p) {
    const rise = easeOutCubic(clamp01(p / 0.22));
    const sy = (100 * (1 - rise)).toFixed(2) + '%';
    set(sheet, '--sy', sy);
    set(sheet, '--sr', (1.5 * (1 - rise)).toFixed(2) + 'deg');
    set(messages, '--sy', sy);
    msgs.forEach((el, i) => {
      const [a, b, c, d] = seg[i];
      let y = 70, o = 0;
      if (p < a) { y = 70; o = 0; }
      else if (p < b) { const u = easeOutQuint((p - a) / (b - a)); y = 70 * (1 - u); o = u; }
      else if (p < c) { y = 0; o = 1; }
      else if (p < d) { const u = easeInQuint((p - c) / (d - c)); y = -70 * u; o = 1 - u; }
      else { y = -70; o = 0; }
      set(el, '--my', y.toFixed(2) + '%');
      set(el, '--mo', o.toFixed(3));
      el.style.visibility = o > 0.001 ? 'visible' : 'hidden';
    });
  }

  section.classList.add('is-live');
  update(0);
  engine.add(section, stage, update);
}

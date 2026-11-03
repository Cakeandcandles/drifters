// The scroll indicator: a pin that travels down a dashed trail while a scene holds the page.
// It fades in once the hold has begun, fades out as it releases, and hops if the visitor pauses.
export function initIndicator(engine) {
  const el = document.querySelector('.trail');
  if (!el) return;
  const pinG = el.querySelector('.trail-pin-g');
  const TRAVEL = 118; // route length in SVG units (y 6 → 144, minus the pin's own height)
  let shown = false, lastP = -1, lastChange = performance.now(), nextNudge = 0, moveTimer = 0;

  engine.onUpdate((scene, p, busy) => {
    const want = !!scene && p > 0.02 && p < 0.97;
    if (want !== shown) { shown = want; el.classList.toggle('is-on', shown); if (!shown) el.classList.remove('hop'); }
    if (!scene) return;
    pinG.setAttribute('transform', `translate(0 ${(p * TRAVEL).toFixed(1)})`);
    if (Math.abs(p - lastP) > 0.0005) {
      lastP = p; lastChange = performance.now(); nextNudge = 0;
      el.classList.add('moving'); el.classList.remove('hop');
      clearTimeout(moveTimer); moveTimer = setTimeout(() => el.classList.remove('moving'), 160);
    }
  });

  // A gentle reminder to keep going, when the page has sat still mid-hold.
  setInterval(() => {
    if (!shown) return;
    const now = performance.now();
    if (now - lastChange < 2500 || now < nextNudge) return;
    el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
    nextNudge = now + 4000;
  }, 500);
}

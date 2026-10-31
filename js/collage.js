// Background postcards: two layers per collage drift a few percent in opposite directions
// as the section passes through the viewport. Transform only; not started under reduced motion.
export function initCollages() {
  const items = [...document.querySelectorAll('.collage')].map((el) => ({
    el, section: el.parentElement, far: el.querySelector('.far'), near: el.querySelector('.near'), on: false,
  })).filter((i) => i.far && i.near);
  if (!items.length) return;
  let raf = 0, vh = innerHeight;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) { const it = items.find((i) => i.section === e.target); if (it) it.on = e.isIntersecting; }
    kick();
  }, { rootMargin: '25% 0px 25% 0px' });
  items.forEach((i) => io.observe(i.section));
  function tick() {
    raf = 0;
    for (const it of items) {
      if (!it.on) continue;
      const r = it.section.getBoundingClientRect();
      const t = (r.top + r.height / 2 - vh / 2) / (vh + r.height); // -0.5 above … 0.5 below
      it.far.style.transform = `translate3d(0, ${(t * 8).toFixed(2)}%, 0)`;
      it.near.style.transform = `translate3d(0, ${(-t * 14).toFixed(2)}%, 0)`;
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; kick(); });
  kick();
}

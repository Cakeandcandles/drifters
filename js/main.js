import { createEngine } from './progress.js';
import { opening, tapes, announce } from './scenes.js';
import { initIndicator } from './indicator.js';
import { createVideoManager } from './video.js';
import { initReel } from './reel.js';
import { initLightbox } from './lightbox.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const videos = createVideoManager({ autoplay: !reduced });

const reel = document.querySelector('.reel');
initReel(reel, { reduced });
initLightbox(reel);

const driven = new Set();
if (!reduced) {
  const engine = createEngine();
  opening(document.querySelector('.opening'), engine);
  const tapeSection = document.querySelector('.tapes');
  tapes(tapeSection, engine, videos);
  tapeSection.querySelectorAll('video').forEach((v) => driven.add(v));
  announce(document.querySelector('.announce'), engine);
  initIndicator(engine);
  engine.measure();
  engine.kick();
}
for (const v of videos.all) if (!driven.has(v)) videos.observe(v);

// Entrances for the breath section: once, on arrival.
const rises = document.querySelectorAll('.rise');
if (rises.length) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.2 });
  rises.forEach((el) => io.observe(el));
}

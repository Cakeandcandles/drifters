// Headless frame-rate and long-task probe while scrolling through each scene with videos playing.
// node tools/perf.mjs <url> [--w 390 --h 844 --dsf 3]
import { Browser, sleep } from '/home/cakeandcandles/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const args = process.argv.slice(2); const url = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const W = +opt('w', 390), H = +opt('h', 844), dsf = +opt('dsf', 3);
const b = await Browser.launch({ width: W, height: H, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ width: W, height: H, dsf, mobile: true });
await p.goto(url, { settleMs: 2000 });
const ranges = await p.eval(() => { const vh = innerHeight; const o = {}; for (const s of document.querySelectorAll('.scene')) { const r = s.getBoundingClientRect(); o[s.className.split(' ')[1]] = [Math.round(r.top + scrollY), Math.round(r.top + scrollY + r.height - vh)]; } const reel = document.querySelector('.reel').getBoundingClientRect(); o.reel = [Math.round(reel.top + scrollY - vh / 2), Math.round(reel.top + scrollY + reel.height / 2)]; return o; });
const probe = (from, to, ms) => p.eval(([from, to, ms]) => new Promise((res) => {
  const t0 = performance.now(); let n = 0; const longs = []; let worst = 0, last = t0;
  const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => longs.push(Math.round(e.duration)))); po.observe({ type: 'longtask' });
  const tick = () => { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; const k = Math.min(1, (now - t0) / ms); scrollTo(0, from + (to - from) * k); if (now - t0 < ms) requestAnimationFrame(tick); else { po.disconnect(); res({ fps: Math.round(n / (ms / 1000)), worstFrameMs: Math.round(worst), longTasks: longs, playing: [...document.querySelectorAll('video')].filter((v) => !v.paused).map((v) => v.dataset.video) }); } };
  requestAnimationFrame(tick);
}), [from, to, ms]);
const out = {};
for (const [name, [a, c]] of Object.entries(ranges)) { out[name + ' down'] = await probe(a, c, 3000); out[name + ' up'] = await probe(c, a, 2000); }
console.log(JSON.stringify({ viewport: `${W}x${H}@${dsf}`, ...out }, null, 1));
await b.close();

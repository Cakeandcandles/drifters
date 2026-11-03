// Headless-Chrome QA: scrolls the page through every scene, screenshots each stop,
// records video states, console errors and failed requests.
// node tools/qa.mjs <url> <outdir> [--w 390 --h 844 --dsf 2 --desktop --reduced --noautoplay --label name]
import { Browser, sleep } from '/home/cakeandcandles/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args[0], out = args[1];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);
const W = +opt('w', 390), H = +opt('h', 844), dsf = +opt('dsf', 2);
const mobile = !has('desktop');
mkdirSync(out, { recursive: true });

const extraArgs = has('noautoplay') ? ['--autoplay-policy=user-gesture-required'] : ['--autoplay-policy=no-user-gesture-required'];
const b = await Browser.launch({ width: W, height: H, extraArgs });
const p = await b.newPage({ width: W, height: H, dsf, mobile, reducedMotion: has('reduced') });
const failed = [];
const reqs = new Map();
await p.send('Network.enable');
b.on(p.sessionId, 'Network.loadingFailed', (e) => failed.push(e.errorText + ' ' + (reqs.get(e.requestId) || e.requestId || '').replace(url, '')));
b.on(p.sessionId, 'Network.requestWillBeSent', (e) => reqs.set(e.requestId, e.request.url));
let mediaOk = 0;
b.on(p.sessionId, 'Network.responseReceived', (e) => { if (e.response.status >= 400) failed.push(e.response.status + ' ' + e.response.url); if (/\.mp4/.test(e.response.url) && (e.response.status === 200 || e.response.status === 206)) mediaOk++; });
const logs = [];
await p.send('Log.enable');
b.on(p.sessionId, 'Log.entryAdded', (e) => logs.push(e.entry.level + ': ' + e.entry.text));
b.on(p.sessionId, 'Runtime.consoleAPICalled', (e) => { if (e.type === 'error' || e.type === 'warning') logs.push(e.type + ': ' + e.args.map((a) => a.value || a.description).join(' ')); });

if (has('rejectplay')) {
  // Simulate a browser that refuses autoplay: every play() rejects with NotAllowedError until a user gesture.
  await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    (() => { const orig = HTMLMediaElement.prototype.play; let allowed = false;
      addEventListener('pointerdown', () => { allowed = true; }, true); addEventListener('click', () => { allowed = true; }, true);
      HTMLMediaElement.prototype.play = function () { if (!allowed) { this.pause(); const e = new DOMException('play() failed: no user gesture yet', 'NotAllowedError'); return Promise.reject(e); } return orig.call(this); }; })();` });
}
await p.goto(url, { settleMs: 2500 });

const state = () => p.eval(() => {
  const vh = innerHeight;
  const scenes = {};
  for (const s of document.querySelectorAll('.scene')) {
    const r = s.getBoundingClientRect();
    scenes[s.className.split(' ')[1]] = { top: Math.round(r.top + scrollY), height: Math.round(r.height), range: Math.round(r.height - vh) };
  }
  const el = (sel) => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), height: Math.round(r.height) }; };
  return { vh, scenes, breath: el('.breath'), reel: el('.reel'), trailer: el('.trailer'), footer: el('.colophon'), docH: document.documentElement.scrollHeight, docW: document.documentElement.scrollWidth };
});
const videos = () => p.eval(() => [...document.querySelectorAll('video')].map((v) => `${v.dataset.video}:${v.paused ? 'paused' : 'PLAYING'} t=${v.currentTime.toFixed(1)} rs=${v.readyState} ${v.error ? 'ERR' : ''}`).join(' | '));

const st = await state();
const stops = [];
const sc = (name, f) => { const s = st.scenes[name]; return Math.round(s.top + f * s.range); };
stops.push(['A-p0', 0], ['B-p25', sc('opening', .25)], ['B-p50', sc('opening', .5)], ['B-p75', sc('opening', .75)], ['B-p100', sc('opening', 1)]);
for (const f of [0, .2, .35, .45, .53, .58, .62, .7, .8, .95, 1]) stops.push([`N-p${Math.round(f * 100)}`, sc('announce', f)]);
for (const f of [0, .3, .34, .38, .42, .5, .72, .76, .8, .86, 1]) stops.push([`D-p${Math.round(f * 100)}`, sc('tapes', f)]);
stops.push(['E-reel', st.reel.top + Math.round(st.reel.height / 2 - st.vh / 2)]);
stops.push(['F-breath', st.breath.top + Math.round(st.breath.height / 2 - st.vh / 2)]);
stops.push(['G-trailer', st.trailer.top - Math.round((st.vh - st.trailer.height) / 2)], ['H-footer', st.docH - st.vh]);

const report = [`url ${url}  viewport ${W}x${H}@${dsf} mobile=${mobile} reduced=${has('reduced')} noautoplay=${has('noautoplay')}`, `doc ${st.docW}x${st.docH} vh=${st.vh} horizontal-overflow=${st.docW > W}`, JSON.stringify(st.scenes)];
async function shoot(label, y) {
  await p.eval((y) => scrollTo(0, y), y);
  await sleep(700);
  await p.screenshot({ path: join(out, label + '.jpg'), quality: 70 });
  const trail = await p.eval(() => { const t = document.querySelector('.trail'); if (!t) return 'none'; return t.classList.contains('is-on') ? 'trail:on ' + (t.querySelector('.trail-pin-g')?.getAttribute('transform') || '') : 'trail:off'; });
  report.push(`${label.padEnd(10)} y=${String(y).padStart(6)}  ${trail.padEnd(26)} ${await videos()}`);
}
for (const [label, y] of stops) await shoot(label, y);
// Reverse pass through the tapes and the opening.
for (const [label, y] of [['R-D-p80', sc('tapes', .8)], ['R-D-p38', sc('tapes', .38)], ['R-D-p0', sc('tapes', 0)], ['R-N-p70', sc('announce', .7)], ['R-N-p45', sc('announce', .45)], ['R-N-p10', sc('announce', .1)], ['R-B-p50', sc('opening', .5)], ['R-A-p0', 0]]) await shoot(label, y);

// Reel interaction: drag the strip, then open a portrait and a landscape frame.
await p.eval((y) => scrollTo(0, y), st.reel.top + Math.round(st.reel.height / 2 - st.vh / 2));
await sleep(500);
const stripBox = await p.eval(() => { const r = document.querySelector('.strip').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
// A real touch drag on the strip (three moves), then a programmatic scroll for the spool check.
const tx = Math.round(stripBox.x), ty = Math.round(stripBox.y);
await p.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tx, y: ty }] });
for (let i = 1; i <= 6; i++) await p.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: tx - i * 60, y: ty }] });
await p.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(600);
report.push('reel scrollLeft after touch drag: ' + (await p.eval(() => document.querySelector('.strip').scrollLeft)) + ' spool spin: ' + (await p.eval(() => document.querySelector('.spool').style.getPropertyValue('--spin'))));
report.push('reel cue after drag: ' + (await p.eval(() => { const c = document.querySelector('.reel-cue'); return c ? (c.hidden ? 'hidden' : c.className) : 'none'; })));
// Infinite loop: fling most of a copy forward, rest, and confirm we are back inside the middle copy
// with the same frame under the left edge as before the silent jump.
const loop = await p.eval(async () => {
  const strip = document.querySelector('.strip'), film = document.querySelector('.film');
  const n = film.children.length / 3, W = film.children[2 * n].offsetLeft - film.children[n].offsetLeft;
  const firstVisible = () => { const L = strip.getBoundingClientRect().left + parseFloat(getComputedStyle(strip).paddingLeft); for (const f of film.children) { if (f.getBoundingClientRect().right > L + 4) return f.querySelector('button').dataset.large.split('/').pop(); } };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  await wait(1800); // let any momentum from the synthesised fling settle
  const out = { W, n, startLeft: strip.scrollLeft };
  strip.scrollLeft += W * 0.92; await wait(500); out.afterFling = strip.scrollLeft; out.inMiddle = strip.scrollLeft >= W * 0.5 && strip.scrollLeft <= W * 1.5;
  const before = firstVisible(); strip.scrollLeft += W; await wait(50); const after = firstVisible(); strip.scrollLeft -= W; await wait(400);
  out.sameFrameAfterJump = before === after; out.frame = before; out.restLeft = strip.scrollLeft;
  strip.scrollLeft -= W * 1.3; await wait(500); out.afterBackFling = strip.scrollLeft; out.inMiddleAfterBack = strip.scrollLeft >= W * 0.5 && strip.scrollLeft <= W * 1.5;
  out.clones = film.querySelectorAll('.is-clone[aria-hidden="true"]').length; out.tabbableClones = film.querySelectorAll('.is-clone button:not([tabindex="-1"])').length;
  return out;
});
report.push('loop: ' + JSON.stringify(loop));
await p.screenshot({ path: join(out, 'E-reel-looped.jpg'), quality: 70 });

await p.eval(() => document.querySelector('.strip').scrollBy({ left: 700 }));
await sleep(900);
await p.screenshot({ path: join(out, 'E-reel-scrolled.jpg'), quality: 70 });
report.push('reel scrollLeft after drag: ' + (await p.eval(() => document.querySelector('.strip').scrollLeft)));
for (const [label, sel] of [['W-portrait', '.fr[style*="--ar:0.75"] button'], ['W-landscape', '.fr[style*="--ar:1.33"] button']]) {
  const before = await p.eval(() => ({ y: scrollY, sl: document.querySelector('.strip').scrollLeft }));
  const ok = await p.eval((sel) => { const b = document.querySelector(sel); if (!b) return false; b.click(); return true; }, sel);
  await sleep(900);
  await p.screenshot({ path: join(out, label + '.jpg'), quality: 70 });
  const dims = await p.eval(() => { const i = document.querySelector('#window-img'); const r = i.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)} natural ${i.naturalWidth}x${i.naturalHeight} open=${document.querySelector('.window').open}`; });
  await p.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await p.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(300);
  const after = await p.eval(() => ({ y: scrollY, sl: document.querySelector('.strip').scrollLeft, open: document.querySelector('.window').open, focus: document.activeElement?.tagName + '.' + document.activeElement?.className }));
  report.push(`${label}: clicked=${ok} img ${dims} | before y=${before.y} sl=${before.sl} after y=${after.y} sl=${after.sl} open=${after.open} focus=${after.focus}`);
}
if (has('rejectplay')) {
  await p.eval(() => scrollTo(0, 0)); await sleep(600);
  const vis = await p.eval(() => [...document.querySelectorAll('.play-fallback')].map((b) => !b.hidden).join(','));
  await p.screenshot({ path: join(out, 'X-fallback-visible.jpg'), quality: 70 });
  const bb = await p.eval(() => { const b = document.querySelector('.opening .play-fallback'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bb.x, y: bb.y }] });
  await p.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(800);
  report.push(`fallback buttons visible before tap: ${vis}; after tap: ` + (await p.eval(() => [...document.querySelectorAll('.play-fallback')].map((b) => !b.hidden).join(','))) + ' | ' + (await videos()));
  await p.screenshot({ path: join(out, 'X-fallback-after.jpg'), quality: 70 });
}
report.push('--- media responses ok (200/206): ' + mediaOk);
report.push('--- console errors: ' + JSON.stringify(p.consoleErrors), '--- log: ' + JSON.stringify(logs.slice(0, 20)), '--- failed requests: ' + JSON.stringify(failed));
writeFileSync(join(out, 'report.txt'), report.join('\n'));
console.log(report.join('\n'));
await b.close();

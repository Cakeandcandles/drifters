// Static server for QA. `node tools/serve.mjs [port] [prefix]`
// With a prefix (e.g. /Drifters-concert) the site is served under that subpath, like GitHub Pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
const port = +(process.argv[2] || 8080);
const prefix = (process.argv[3] || '').replace(/\/$/, '');
const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.mp4': 'video/mp4', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
createServer(async (req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (prefix) { if (!url.startsWith(prefix + '/') && url !== prefix) { res.writeHead(404); return res.end('outside prefix'); } url = url.slice(prefix.length) || '/'; }
  if (url.endsWith('/')) url += 'index.html';
  const file = normalize(join(root, url));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    const s = await stat(file);
    const type = types[extname(file)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && type.startsWith('video')) {
      const [a, b] = range.replace('bytes=', '').split('-').map(Number);
      const start = a || 0, end = b || s.size - 1;
      const buf = (await readFile(file)).subarray(start, end + 1);
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${s.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length });
      return res.end(buf);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': s.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('not found: ' + url); }
}).listen(port, () => console.log(`serving ${root} at http://localhost:${port}${prefix}/`));

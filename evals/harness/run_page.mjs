// Open a folder's index.html once in headless Chromium, wait for its map to settle, and (optionally) grade it.
//
//   node evals/harness/run_page.mjs FOLDER [--checks evals/tasks/checks.mjs --task N] [--shot out.png]
//
// The page gets window.MAPBOX_ACCESS_TOKEN (from .env) before any of its scripts run, and must assign its map to
// window.map. The folder is served at http://127.0.0.1:PORT/ so the page can fetch files beside it.
// Prints one line: RESULT {json}. Exit 0 if the check passed (or no check was given and the map settled), 1 if not.
//
// "Settled" = window.map exists within 30 s, then the map fires 'idle' (style, sources and tiles loaded, no camera
// movement) within 60 s. A check then reads the map's state through t.eval(...) and can screenshot, click or wait.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

export const VIEWPORT = { width: 800, height: 600 };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

export function token() {
  if (process.env.MAPBOX_ACCESS_TOKEN) return process.env.MAPBOX_ACCESS_TOKEN;
  const env = path.join(ROOT, '.env');
  if (!fs.existsSync(env)) throw new Error('no .env with MAPBOX_ACCESS_TOKEN');
  const m = fs.readFileSync(env, 'utf8').match(/^MAPBOX_ACCESS_TOKEN=(\S+)/m);
  if (!m) throw new Error('.env has no MAPBOX_ACCESS_TOKEN');
  return m[1];
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/geo+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.csv': 'text/csv', '.txt': 'text/plain' };

function serve(folder) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(folder, rel);
    if (!file.startsWith(path.resolve(folder)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const redact = (s, tok) => String(s).split(tok).join('<token>').replace(/access_token=[^&\s"']+/g, 'access_token=<token>');

export async function runPage(folder, { checks, task, check, shot } = {}) {
  const tok = token();
  const server = await serve(folder);
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true, args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = { console: [], page: [], requests: [] };
  const hosts = {};
  const rec = { folder, task, port, viewport: VIEWPORT };
  const t0 = Date.now();
  try {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    await context.addInitScript((t) => { window.MAPBOX_ACCESS_TOKEN = t; }, tok);
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.console.push(redact(m.text(), tok).slice(0, 500)); });
    page.on('pageerror', (e) => errors.page.push(redact(e.message, tok).slice(0, 500)));
    page.on('request', (r) => { try { const h = new URL(r.url()).host; hosts[h] = (hosts[h] || 0) + 1; } catch {} });
    page.on('response', (r) => { if (r.status() >= 400) errors.requests.push(`${r.status()} ${redact(r.url(), tok).slice(0, 200)}`); });
    page.on('requestfailed', (r) => { if (!/events\.mapbox\.com/.test(r.url())) errors.requests.push(`failed ${redact(r.url(), tok).slice(0, 200)} ${r.failure()?.errorText}`); });

    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load', timeout: 30000 }).catch((e) => errors.page.push('goto: ' + e.message));
    rec.has_map = await page.waitForFunction(() => window.map && typeof window.map.getStyle === 'function', null, { timeout: 30000 }).then(() => true, () => false);
    const idle = async (ms = 60000) => page.evaluate((ms) => new Promise((res) => {
      const m = window.map; let done = false;
      const finish = (v) => { if (!done) { done = true; res(v); } };
      m.once('idle', () => finish(true));
      m.triggerRepaint();
      setTimeout(() => finish(false), ms);
    }), ms).catch(() => false);
    rec.settled = rec.has_map ? await idle() : false;
    rec.load_seconds = Math.round((Date.now() - t0) / 100) / 10;

    const screenshot = async () => PNG.sync.read(await page.screenshot({ type: 'png' }));
    const t = {
      page,
      errors,
      idle,
      eval: (fn, arg) => page.evaluate(fn, arg),
      screenshot,
      // mean RGB (0-255) of a (2r+1)^2 patch centred on (x, y), top-left origin, of a fresh screenshot
      patch: async (x, y, r = 2, img) => {
        img = img || await screenshot();
        let s = [0, 0, 0], n = 0;
        for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) {
          if (i < 0 || j < 0 || i >= img.width || j >= img.height) continue;
          const k = (j * img.width + i) * 4; s[0] += img.data[k]; s[1] += img.data[k + 1]; s[2] += img.data[k + 2]; n++;
        }
        return s.map((v) => Math.round(v / n));
      },
    };

    if ((checks && task !== undefined) || check) {
      if (!rec.has_map) Object.assign(rec, { passed: false, reasons: ['window.map was never set'] });
      else if (!rec.settled) Object.assign(rec, { passed: false, reasons: ['the map never fired idle within 60 s'] });
      else {
        const fn = check || (await import(path.resolve(checks) + `?t=${Date.now()}`).then((mod) => (mod.default || mod)[task]));
        if (!fn) throw new Error(`no check for task ${task} in ${checks}`);
        const v = await fn(t).catch((e) => ({ passed: false, reasons: ['check threw: ' + String(e.message || e).slice(0, 300)] }));
        Object.assign(rec, { ...v, passed: !!v.passed, reasons: v.reasons || [], numbers: v.numbers });
      }
    } else {
      rec.passed = rec.has_map && rec.settled;
    }
    if (shot) await page.screenshot({ path: shot }).catch(() => {});
  } catch (e) {
    Object.assign(rec, { passed: false, reasons: ['harness error: ' + redact(e.message, tok).slice(0, 300)] });
  } finally {
    await browser.close();
    server.close();
  }
  rec.errors = errors;
  rec.requests_by_host = hosts;
  rec.seconds = Math.round((Date.now() - t0) / 100) / 10;
  return rec;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const a = process.argv.slice(2);
  const opt = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
  const folder = a[0];
  if (!folder) { console.error('usage: node evals/harness/run_page.mjs FOLDER [--checks FILE --task N] [--shot out.png]'); process.exit(2); }
  const rec = await runPage(path.resolve(folder), { checks: opt('--checks'), task: opt('--task') !== undefined ? Number(opt('--task')) : undefined, shot: opt('--shot') });
  console.log('RESULT ' + JSON.stringify(rec));
  process.exit(rec.passed ? 0 : 1);
}

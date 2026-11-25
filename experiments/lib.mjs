// Shared parts of every experiment (see METHOD.md): build a GL JS page, open it once in headless Chromium with the
// account's token, let the experiment's check measure it, and write experiments/<area>/results/<name>.json plus
// screenshots no wider than 512 px.
//
//   mapExperiment({ file: import.meta.url, question, html, assets, check })   a page with a map
//   apiExperiment({ file: import.meta.url, question, run })                   web-service requests from Node, no map
//
// A check returns { facts: [{ fact, holds, numbers? }], numbers? }. Each fact is one plain sentence that could come
// out false; `holds` says whether it did. The JSON records which Mapbox requests were refused (HTTP >= 400), so a
// refusal by Mapbox is never confused with a mistake in the page.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { runPage, token } from '../evals/harness/run_page.mjs';

export const GLJS = '3.35.2';

export function page({ title, script, css = '', body = '' }) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<link href="https://api.mapbox.com/mapbox-gl-js/v${GLJS}/mapbox-gl.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v${GLJS}/mapbox-gl.js"></script>
<style>html, body, #map { margin: 0; width: 100%; height: 100%; } ${css}</style>
</head>
<body>
<div id="map"></div>
${body}
<script>
mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;
${script}
</script>
</body>
</html>
`;
}

function where(file) {
  const p = fileURLToPath(file);
  const dir = path.dirname(p);
  return { dir, area: path.basename(dir), name: path.basename(p, '.mjs'), results: path.join(dir, 'results') };
}

function shrink(src, out) {
  execFileSync('sips', ['-Z', '512', src, '--out', out], { stdio: 'ignore' });
}

const redact = (s, tok) => String(s).split(tok).join('<token>').replace(/access_token=[^&\s"']+/g, 'access_token=<token>');

// ---- pixel measures on decoded PNGs ({ width, height, data }) ----

// mean brightness (0-255) and mean saturation (0-1) over the pixels where inside(x, y) is true (default: all)
export function stats(img, inside = () => true, step = 2) {
  let lum = 0, sat = 0, n = 0;
  for (let y = 0; y < img.height; y += step) for (let x = 0; x < img.width; x += step) {
    if (!inside(x, y)) continue;
    const k = (y * img.width + x) * 4, r = img.data[k], g = img.data[k + 1], b = img.data[k + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    lum += 0.2126 * r + 0.7152 * g + 0.0722 * b; sat += mx ? (mx - mn) / mx : 0; n++;
  }
  return { lum: Math.round((lum / n) * 10) / 10, sat: Math.round((sat / n) * 1000) / 1000 };
}

// mean absolute difference per channel (0-255) between two screenshots, over the pixels where inside(x, y) is true
export function diff(a, b, inside = () => true, step = 2) {
  let s = 0, n = 0;
  for (let y = 0; y < a.height; y += step) for (let x = 0; x < a.width; x += step) {
    if (!inside(x, y)) continue;
    const k = (y * a.width + x) * 4;
    s += (Math.abs(a.data[k] - b.data[k]) + Math.abs(a.data[k + 1] - b.data[k + 1]) + Math.abs(a.data[k + 2] - b.data[k + 2])) / 3; n++;
  }
  return Math.round((s / n) * 10) / 10;
}

// is the screen point inside a screen-space polygon [[x, y], ...]
export function inPolygon(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ---- geometry in Node ----

const R = 6371008.8;
const rad = (d) => (d * Math.PI) / 180;
export function metres([lng1, lat1], [lng2, lat2]) {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
// shortest distance in metres from a point to a polyline (local flat approximation, fine at city scale)
export function toLine(p, line) {
  const k = Math.cos(rad(p[1])) * rad(1) * R, m = rad(1) * R;
  const xy = ([lng, lat]) => [(lng - p[0]) * k, (lat - p[1]) * m];
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = xy(line[i - 1]), [bx, by] = xy(line[i]);
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0;
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
}
// area of a GeoJSON polygon ring list in km^2 (outer ring minus holes)
export function areaKm2(rings) {
  const ring = (r) => {
    const lat0 = r.reduce((s, c) => s + c[1], 0) / r.length, k = Math.cos(rad(lat0)) * rad(1) * R, m = rad(1) * R;
    let s = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += r[j][0] * k * (r[i][1] * m) - r[i][0] * k * (r[j][1] * m);
    return Math.abs(s / 2) / 1e6;
  };
  return rings.reduce((s, r, i) => s + (i === 0 ? ring(r) : -ring(r)), 0);
}
export function pointInRing([x, y], ring) { return inPolygon(x, y, ring); }

// ---- writing results ----

function write(w, rec) {
  fs.mkdirSync(w.results, { recursive: true });
  fs.writeFileSync(path.join(w.results, `${w.name}.json`), JSON.stringify(rec, null, 2) + '\n');
  const ok = rec.facts.filter((f) => f.holds).length;
  console.log(`${w.area}/${w.name}: ${ok}/${rec.facts.length} facts hold · served by Mapbox: ${rec.served_by_mapbox ? 'yes' : 'NO'}`);
  for (const f of rec.facts) console.log(`  ${f.holds ? 'holds ' : 'FAILS '} ${f.fact}${f.numbers ? '  ' + JSON.stringify(f.numbers) : ''}`);
  if (rec.refusals.length) console.log('  refused: ' + rec.refusals.join(' | '));
  if (rec.reasons?.length) console.log('  reasons: ' + rec.reasons.join(' | '));
  const errs = [...(rec.errors?.console || []), ...(rec.errors?.page || [])];
  if (errs.length) console.log('  page errors: ' + errs.slice(0, 5).join(' | '));
}

export async function mapExperiment({ file, question, html, assets = {}, check }) {
  const w = where(file);
  fs.mkdirSync(w.results, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `mbx-exp-${w.name}-`));
  fs.writeFileSync(path.join(tmp, 'index.html'), html);
  for (const [n, v] of Object.entries(assets)) fs.writeFileSync(path.join(tmp, n), v);
  const shots = [];
  const responses = [];
  const rec = await runPage(tmp, {
    check: async (t) => {
      t.page.on('response', (r) => { if (/mapbox\.com/.test(r.url())) responses.push({ status: r.status(), url: redact(r.url(), token()).slice(0, 160) }); });
      t.shot = async (label) => {
        const full = path.join(tmp, `${label}.png`), out = path.join(w.results, `${w.name}-${label}.png`);
        await t.page.screenshot({ path: full });
        shrink(full, out);
        shots.push(path.relative(w.dir, out));
        return PNG.sync.read(fs.readFileSync(full));
      };
      t.waitFor = (fn, ms = 30000, arg) => t.page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
      t.wait = (ms) => t.page.waitForTimeout(ms);
      return check(t);
    },
  });
  const facts = rec.facts || [];
  // a check may name requests it provoked a refusal from on purpose (expected_refusals: [substring, ...])
  const asked = rec.expected_refusals || [];
  // only an HTTP error from Mapbox is a refusal; a request GL JS cancelled itself (net::ERR_ABORTED, after the camera
  // moved on) is not
  const allRefusals = rec.errors.requests.filter((r) => /^\d{3} /.test(r) && /mapbox\.com/.test(r) && !/events\.mapbox\.com/.test(r));
  const refusals = allRefusals.filter((r) => !asked.some((a) => r.includes(a)));
  const out = {
    experiment: `${w.area}/${w.name}`,
    question,
    ran_at: new Date().toISOString(),
    gl_js: GLJS,
    served_by_mapbox: refusals.length === 0,
    refusals,
    refusals_asked_for: allRefusals.filter((r) => asked.some((a) => r.includes(a))),
    all_facts_hold: facts.length > 0 && facts.every((f) => f.holds),
    facts,
    numbers: rec.numbers,
    reasons: rec.reasons,
    screenshots: shots,
    use: { map_loads: 1, web_service_requests: rec.web_service_requests || 0, requests_by_host: rec.requests_by_host },
    errors: rec.errors,
    seconds: rec.seconds,
  };
  write(w, out);
  fs.rmSync(tmp, { recursive: true, force: true });
  return out;
}

export async function apiExperiment({ file, question, run }) {
  const w = where(file);
  fs.mkdirSync(w.results, { recursive: true });
  const tok = token();
  const calls = [];
  const shots = [];
  const secrets = [];
  const hide = (str) => secrets.reduce((a, [v, l]) => a.split(v).join(l), redact(str, tok));
  const api = {
    // GET a Mapbox URL with the token appended; returns { status, ok, json?, buffer, type, message? }
    async get(url) {
      const u = new URL(url);
      u.searchParams.set('access_token', tok);
      const r = await fetch(u);
      const buffer = Buffer.from(await r.arrayBuffer());
      const type = r.headers.get('content-type') || '';
      let json;
      if (/json/.test(type)) try { json = JSON.parse(buffer.toString('utf8')); } catch {}
      const call = { status: r.status, type, url: hide(u.toString()).slice(0, 200) };
      if (r.status >= 400) call.message = hide(json?.message || buffer.toString('utf8').slice(0, 200));
      calls.push(call);
      return { status: r.status, ok: r.ok, json, buffer, type, message: call.message };
    },
    // a value (such as the account name) that must never reach the results: replaced by <label> wherever it appears
    secret(value, label) { if (value) secrets.push([String(value), `<${label}>`]); },
    hide: (s) => hide(s),
    save(label, buffer, ext) {
      const full = path.join(os.tmpdir(), `mbx-exp-${w.name}-${label}.${ext}`), out = path.join(w.results, `${w.name}-${label}.png`);
      fs.writeFileSync(full, buffer);
      shrink(full, out);
      fs.rmSync(full, { force: true });
      shots.push(path.relative(w.dir, out));
    },
  };
  const t0 = Date.now();
  let v;
  try { v = await run(api); } catch (e) { v = { facts: [], reasons: ['run threw: ' + hide(e.message)] }; }
  const facts = v.facts || [];
  const out = {
    experiment: `${w.area}/${w.name}`,
    question,
    ran_at: new Date().toISOString(),
    served_by_mapbox: calls.every((c) => c.status < 400) || !!v.refusals_are_the_finding,
    refusals: calls.filter((c) => c.status >= 400).map((c) => `${c.status} ${c.url} ${c.message || ''}`.trim()),
    refusals_are_the_finding: !!v.refusals_are_the_finding,
    all_facts_hold: facts.length > 0 && facts.every((f) => f.holds),
    facts,
    numbers: v.numbers,
    reasons: v.reasons,
    screenshots: shots,
    use: { map_loads: 0, web_service_requests: calls.length, calls },
    seconds: Math.round((Date.now() - t0) / 100) / 10,
  };
  write(w, out);
  return out;
}

export const fact = (fact, holds, numbers) => ({ fact, holds: !!holds, ...(numbers ? { numbers } : {}) });

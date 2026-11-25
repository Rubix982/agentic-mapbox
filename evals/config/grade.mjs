// Run answers to evals/config/requests.json against a real Standard-style map and say which are right. (C-004)
//
//   import { grade } from './grade.mjs';  await grade(answers)  // answers: [{ setting, code, ... }]
//
// One page, one map load for the whole batch. For each answer, in order: every setting goes back to the style's
// default, the answer's code runs against the existing map, and the page reads back which settings changed and to
// what, along with whatever GL JS printed (console.warn, console.error, the map's 'error' event) and anything thrown.
// `map.on('load' | 'style.load' | 'idle', fn)` and their `once` forms call fn at once: the style has already loaded.
// An answer is right when the setting its request meant now holds the value asked for (requests.json `expect`).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runPage } from '../harness/run_page.mjs';

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://api.mapbox.com/mapbox-gl-js/v3.35.2/mapbox-gl.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.35.2/mapbox-gl.js"></script>
<style>html, body, #map { margin: 0; width: 100%; height: 100%; }</style></head>
<body><div id="map"></div><script>
mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;
window.map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/standard', center: [2.35, 48.85], zoom: 15 });
window.log = [];
for (const level of ['warn', 'error']) {
  const orig = console[level].bind(console);
  console[level] = (...a) => { window.log.push(level + ': ' + a.map((x) => (x && x.message) || String(x)).join(' ').slice(0, 300)); orig(...a); };
}
map.on('error', (e) => window.log.push('map error: ' + String((e.error && e.error.message) || e.message || e).slice(0, 300)));

const LOADED = ['load', 'style.load', 'idle', 'styledata', 'render'];
const proxy = new Proxy(map, {
  get(t, prop) {
    if (prop === 'on' || prop === 'once') return (ev, ...rest) => {
      const fn = rest[rest.length - 1];
      if (LOADED.includes(ev) && typeof fn === 'function' && rest.length === 1) { fn.call(t, { type: ev, target: t }); return proxy; }
      if (prop === 'once' && LOADED.includes(ev) && rest.length === 0) return Promise.resolve({ type: ev, target: t });
      return t[prop](ev, ...rest);
    };
    const v = t[prop];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});
const ctx = document.createElement('canvas').getContext('2d');
window.normColor = (v) => { if (typeof v !== 'string') return null; ctx.fillStyle = '#010203'; ctx.fillStyle = v; return ctx.fillStyle === '#010203' && v.toLowerCase() !== '#010203' ? null : ctx.fillStyle; };
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

window.runAnswer = async (code, defaults) => {
  map.setConfig('basemap', JSON.parse(JSON.stringify(defaults)));
  window.log = [];
  let thrown = null;
  try {
    const fn = new AsyncFunction('map', 'mapboxgl', code);
    await Promise.race([fn(proxy, mapboxgl), new Promise((r) => setTimeout(r, 3000))]);
  } catch (e) { thrown = String(e && e.message || e).slice(0, 300); }
  await new Promise((r) => setTimeout(r, 150));
  const now = map.getConfig('basemap') || {};
  const changed = {};
  for (const k of new Set([...Object.keys(defaults), ...Object.keys(now)])) {
    if (JSON.stringify(now[k]) !== JSON.stringify(defaults[k])) changed[k] = now[k];
  }
  return { changed, thrown, log: window.log.slice(0, 8) };
};
</script></body></html>
`;

function stripFences(text) {
  const m = text.match(/\`\`\`(?:[a-z]*)\n([\s\S]*?)\`\`\`/i);
  return (m ? m[1] : text).trim();
}

// the settings an answer names in setConfigProperty / setConfig calls, read from its text
export function namesIn(code) {
  const names = [], imports = new Set();
  for (const m of code.matchAll(/setConfigProperty\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/g)) { imports.add(m[1]); names.push(m[2]); }
  for (const m of code.matchAll(/setConfig\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{([\s\S]*?)\}\s*\)/g)) {
    imports.add(m[1]);
    for (const k of m[2].matchAll(/['"`]?([A-Za-z0-9_-]+)['"`]?\s*:/g)) names.push(k[1]);
  }
  return { names, imports: [...imports], other: [...new Set([...code.matchAll(/\b(set[A-Z][A-Za-z]+|addLayer|setStyle|new mapboxgl\.Map)\b/g)].map((m) => m[1]))].filter((x) => !/^setConfig/.test(x)) };
}

export async function grade(answers, requests) {
  const byName = Object.fromEntries(requests.map((r) => [r.setting, r]));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mbx-config-grade-'));
  fs.writeFileSync(path.join(dir, 'index.html'), PAGE);
  const rec = await runPage(dir, {
    check: async (t) => {
      const defaults = await t.eval(() => window.map.getConfig('basemap'));
      const out = [];
      for (const a of answers) {
        const code = stripFences(a.answer || '');
        const r = await t.eval(({ code, defaults }) => window.runAnswer(code, defaults), { code, defaults });
        const want = byName[a.setting].expect;
        const v = r.changed[a.setting];
        let right = false;
        if (a.setting in r.changed) {
          if ('equals' in want) right = v === want.equals;
          else if ('color' in want) right = (await t.eval((x) => window.normColor(x), v)) === (await t.eval((x) => window.normColor(x), want.color));
          else if ('includes' in want) right = typeof v === 'string' && v.includes(want.includes);
          else if ('min' in want) right = typeof v === 'number' && v >= want.min;
        }
        out.push({ ...a, code, right, value: v, changed: r.changed, thrown: r.thrown, log: r.log, ...namesIn(code) });
      }
      return { passed: true, graded: out, defaults_count: Object.keys(defaults).length };
    },
  });
  fs.rmSync(dir, { recursive: true, force: true });
  if (!rec.graded) throw new Error('grading page failed: ' + JSON.stringify(rec.reasons || rec.errors).slice(0, 500));
  return { graded: rec.graded, page: { seconds: rec.seconds, errors: rec.errors, defaults_count: rec.defaults_count } };
}

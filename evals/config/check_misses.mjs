// C-021: do C-021's two misses do what was asked, though C-004's check does not credit them? Four map loads:
// - theme: the session's answer, Standard untouched, and `theme: 'monochrome'`, each screenshotted after the map
//   settles; the measure is the share of pixels with any colour (largest minus smallest channel above 12).
// - roadsBrightness: the session's answer, with `roadsBrightness` read at the default light preset and again after
//   switching to 'night'.
//
//   node evals/config/check_misses.mjs evals/runs/config-20261127-042216-hint     writes evals/results/c021-misses.json
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runPage } from '../harness/run_page.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const answers = Object.fromEntries(fs.readFileSync(path.join(path.resolve(process.argv[2]), 'answers.jsonl'), 'utf8').trim().split('\n')
  .map((l) => JSON.parse(l)).map((r) => [r.setting, r.answer]));
const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.35.2/mapbox-gl.js"></script>
<link href="https://api.mapbox.com/mapbox-gl-js/v3.35.2/mapbox-gl.css" rel="stylesheet">
<style>html,body,#map{margin:0;height:100%}</style></head><body><div id="map"></div><script>
mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;
const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/standard', center: [2.35, 48.85], zoom: 15 });
window.map = map;
</script></body></html>`;
const settle = async (t) => { await t.idle(30000); await t.page.waitForTimeout(500); await t.idle(10000); };
const coloured = async (t) => {
  const img = await t.screenshot();
  let n = 0, c = 0;
  for (let k = 0; k < img.data.length; k += 4 * 7) {
    const r = img.data[k], g = img.data[k + 1], b = img.data[k + 2];
    n++; if (Math.max(r, g, b) - Math.min(r, g, b) > 12) c++;
  }
  return Math.round((c / n) * 1000) / 1000;
};
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mbx-c021-'));
fs.writeFileSync(path.join(work, 'index.html'), PAGE);
const run = (code, after) => runPage(work, { check: async (t) => {
  if (code) await t.eval((c) => { (0, eval)(c); }, code);
  await settle(t);
  return { passed: true, reasons: [], numbers: await after(t) };
} });

const out = { ran_at: new Date().toISOString(), runs: process.argv[2], theme: {}, roadsBrightness: {} };
const themeOf = (t) => t.eval(() => map.getConfigProperty('basemap', 'theme'));
for (const [name, code] of [['answer', answers.theme], ['untouched', null], ['monochrome', "map.setConfigProperty('basemap', 'theme', 'monochrome');"]]) {
  const v = await run(code, async (t) => ({ theme: await themeOf(t), coloured_share: await coloured(t) }));
  out.theme[name] = { ...v.numbers, errors: v.errors?.page || [] };
  console.log('theme', name, JSON.stringify(out.theme[name]));
}
const v = await run(answers.roadsBrightness, async (t) => {
  const read = () => t.eval(() => [map.getConfigProperty('basemap', 'lightPreset'), map.getConfigProperty('basemap', 'roadsBrightness')]);
  const before = await read();
  await t.eval(() => map.setConfigProperty('basemap', 'lightPreset', 'night'));
  await settle(t);
  return { at_start: before, after_night: await read() };
});
out.roadsBrightness = { ...v.numbers, errors: v.errors?.page || [] };
console.log('roadsBrightness', JSON.stringify(out.roadsBrightness));
fs.writeFileSync(path.join(ROOT, 'evals/results/c021-misses.json'), JSON.stringify(out, null, 2) + '\n');

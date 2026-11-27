// C-018 (T-016): which clip layers remove a page's own buildings? Task 5's reference page
// (tasks-3x/reference/task5.html) is loaded eight ways, each once in the harness, with a clip layer over its own
// footprints drawn after or before its building layer, with and without clip-layer-scope ['basemap'], and with a
// fill-extrusion in place of the building layer. Each is measured as task 5's check measures its roofs: seen from above
// at zoom 16.5 with Standard's labels and trees hidden, how many of the five footprints are terracotta at their centre.
// No Claude session; eight map loads.
//
//   node evals/clip_order_test.mjs        writes evals/results/c018-clip-order.json
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runPage } from './harness/run_page.mjs';
import { topDown, project } from './tasks-3x/checks.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const page = fs.readFileSync(path.join(HERE, 'tasks-3x/reference/task5.html'), 'utf8');
const data = path.join(HERE, 'tasks-3x/data/task5/footprints.geojson');
const SOURCE = "  map.addSource('plan', { type: 'geojson', data: 'footprints.geojson' });\n";
const start = page.indexOf("  map.addLayer({\n    id: 'plan',");
const end = page.indexOf('\n  });\n', start) + '\n  });\n'.length;
if (page.split(SOURCE).length !== 2 || start < 0 || end < start) throw new Error('task5.html is not laid out as expected');
const BUILDING = page.slice(start, end);
const EXTRUSION = `  map.addLayer({ id: 'plan', type: 'fill-extrusion', source: 'plan',
    paint: { 'fill-extrusion-color': '#b5523b', 'fill-extrusion-height': ['get', 'height_m'] } });
`;
const clip = (layout) => `  map.addLayer({ id: 'plan-clip', type: 'clip', source: 'plan'${layout ? `, layout: ${layout}` : ''} });\n`;
const MODEL = "{ 'clip-layer-types': ['model'] }";
const SCOPED = "{ 'clip-layer-types': ['model'], 'clip-layer-scope': ['basemap'] }";
// [name, own layer, clip layer or null, clip before the own layer?, predicted terracotta count]
const VARIANTS = [
  ['building, no clip', BUILDING, null, false, 5],
  ["building, clip after, types ['model']", BUILDING, clip(MODEL), false, 0],
  ["building, clip after, types ['model'], scope ['basemap']", BUILDING, clip(SCOPED), false, 0],
  ['building, clip after, no layout', BUILDING, clip(null), false, 0],
  ["building, clip before, types ['model']", BUILDING, clip(MODEL), true, 5],
  ["building, clip before, types ['model'], scope ['basemap']", BUILDING, clip(SCOPED), true, 5],
  ['fill-extrusion, no clip', EXTRUSION, null, false, 5],
  ["fill-extrusion, clip after, types ['model']", EXTRUSION, clip(MODEL), false, 5],
];

const measure = async (t) => {
  await topDown(t, [-0.04, 51.5365], 16.5);
  const fp = await t.eval(() => fetch('footprints.geojson').then((r) => r.json()));
  const centres = fp.features.map((f) => { const r = f.geometry.coordinates[0].slice(0, -1); return [r.reduce((a, p) => a + p[0], 0) / r.length, r.reduce((a, p) => a + p[1], 0) / r.length]; });
  const xy = await project(t, centres);
  const img = await t.screenshot();
  const rgb = [];
  for (const [x, y] of xy) rgb.push(await t.patch(x, y, 2, img));
  const terracotta = rgb.filter((c) => c[0] >= c[1] + 50 && c[0] >= c[2] + 60).length;
  const order = await t.eval(() => map.getStyle().layers.map((l) => `${l.id} (${l.type})`));
  const queryable = await t.eval(() => [...new Set(map.queryRenderedFeatures({ layers: ['plan'] }).map((f) => f.properties.name))].length);
  return { passed: true, reasons: [], numbers: { terracotta, rgb, order, queryable } };
};

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mbx-clip-order-'));
const out = { ran_at: new Date().toISOString(), page: 'evals/tasks-3x/reference/task5.html', variants: [] };
for (const [name, own, clipLayer, before, predicted] of VARIANTS) {
  let html = page.replace(BUILDING, '').replace(SOURCE, SOURCE + (before && clipLayer ? clipLayer + own : own + (clipLayer || '')));
  const dir = path.join(work, name.replace(/\W+/g, '-'));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.copyFileSync(data, path.join(dir, 'footprints.geojson'));
  const v = await runPage(dir, { check: measure, shot: path.join(dir, 'shot.png') });
  const n = v.numbers || {};
  const rec = { name, predicted, terracotta: n.terracotta ?? null, as_predicted: n.terracotta === predicted, queryable: n.queryable ?? null,
    order: n.order, rgb: n.rgb, settled: v.settled, reasons: v.reasons, page_errors: v.errors?.page || [] };
  out.variants.push(rec);
  console.log(`${name}: ${rec.terracotta} of 5 terracotta (predicted ${predicted}) · queryable ${rec.queryable} · order ${JSON.stringify(rec.order)}${rec.page_errors.length ? ' · errors ' + JSON.stringify(rec.page_errors) : ''}`);
}
fs.writeFileSync(path.join(HERE, 'results/c018-clip-order.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`all as predicted: ${out.variants.every((x) => x.as_predicted)} · pages and screenshots in ${work}`);

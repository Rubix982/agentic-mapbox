// C-016: did run 0's clip layer hide its own buildings? Loads that session's page (evals/results/c016-run0/) three ways,
// each once in the harness with task 5's check: as written; without its clip layer; and with the clip limited to the
// basemap ('clip-layer-scope': ['basemap']), which the style spec says "will only remove content from the Mapbox
// Standard style layers". No Claude session; three map loads.
//
//   node evals/clip_test.mjs        writes evals/results/c016-clip-test.json
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runPage } from './harness/run_page.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const page = fs.readFileSync(path.join(HERE, 'results/c016-run0/index.html'), 'utf8');
const data = path.join(HERE, 'tasks-3x/data/task5/footprints.geojson');
const CLIP = "layout: { 'clip-layer-types': ['model'] }";
const BLOCK = `tryAddLayer({
          id: CLIP_LAYER_ID,
          type: 'clip',
          source: SOURCE_ID,
          ${CLIP}
        });`;
if (page.split(BLOCK).length !== 2) throw new Error('the clip layer is not in the page exactly once');
const variants = {
  'as written': page,
  'without the clip layer': page.replace(BLOCK, ''),
  "clip limited to the basemap": page.replace(CLIP, "layout: { 'clip-layer-types': ['model'], 'clip-layer-scope': ['basemap'] }"),
};
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mbx-clip-test-'));
const out = { ran_at: new Date().toISOString(), page: 'evals/results/c016-run0/index.html', variants: [] };
for (const [name, html] of Object.entries(variants)) {
  const dir = path.join(work, name.replace(/\W+/g, '-'));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.copyFileSync(data, path.join(dir, 'footprints.geojson'));
  const v = await runPage(dir, { checks: path.join(HERE, 'tasks-3x/checks.mjs'), task: 5 });
  out.variants.push({ name, passed: v.passed, reasons: v.reasons, page_errors: v.errors?.page || [] });
  console.log(`${name}: ${v.passed ? 'passes' : 'fails'} ${v.passed ? '' : JSON.stringify(v.reasons)}`);
}
fs.writeFileSync(path.join(HERE, 'results/c016-clip-test.json'), JSON.stringify(out, null, 2) + '\n');

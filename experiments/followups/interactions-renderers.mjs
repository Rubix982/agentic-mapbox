// T-006 / C-007: run interactions.mjs three times with SwiftShader and three times with this Mac's GPU, and gather the
// pitch-0 and pitch-45 numbers into followups/results/interactions-renderers.json. Each run is one map load.
// It lives outside the four tour folders so experiments/run.mjs does not take it for an experiment.
//   node experiments/followups/interactions-renderers.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const STD = path.join(HERE, '../standard');
const runs = [];
for (const renderer of ['swiftshader', 'gpu']) for (let i = 1; i <= 3; i++) {
  const tag = `${renderer}-run`;
  const env = { ...process.env, MBX_TAG: tag, ...(renderer === 'gpu' ? { MBX_GPU: 'metal' } : {}) };
  execFileSync('node', [path.join(STD, 'interactions.mjs')], { env, stdio: 'inherit' });
  const r = JSON.parse(fs.readFileSync(path.join(STD, 'results', `interactions-${tag}.json`), 'utf8'));
  const f = Object.fromEntries(r.facts.map((x) => [x.fact, x]));
  const flat = f['At pitch 0 the same kind of click also changes the picture'];
  const tilted = f['At pitch 45 the clicked building turns blue at the click point (colorBuildingSelect)'];
  runs.push({ renderer, run: i, webgl_renderer: r.webgl_renderer, refusals: r.refusals.length,
    pitch0: { holds: flat.holds, ...flat.numbers }, pitch45: { holds: tilted.holds, ...tilted.numbers }, targets: r.numbers });
  console.log(renderer, i, 'pitch 0 frame difference', flat.numbers.frame_difference, 'pitch 45 holds', tilted.holds);
}
fs.mkdirSync(path.join(HERE, 'results'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'results', 'interactions-renderers.json'), JSON.stringify({ ran_at: new Date().toISOString(), runs }, null, 2) + '\n');

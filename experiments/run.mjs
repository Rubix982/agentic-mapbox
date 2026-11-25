// Run every experiment (or the ones named) one after another, then print a table of what each found.
//
//   node experiments/run.mjs                       all of them
//   node experiments/run.mjs 3d/clip api/matrix    just these
//   node experiments/run.mjs --table               only print the table from the results already written
//
// Either way it also writes experiments/gallery.html: every experiment's question, facts and screenshots on one page
// (open it in a browser; the screenshots are the files in */results/).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const areas = ['standard', '3d', 'data', 'api'];
const all = areas.flatMap((a) => fs.readdirSync(path.join(here, a)).filter((f) => f.endsWith('.mjs')).sort().map((f) => `${a}/${f.slice(0, -4)}`));
const args = process.argv.slice(2);
const pick = args.filter((a) => !a.startsWith('--'));
const todo = args.includes('--table') ? [] : pick.length ? pick : all;

for (const e of todo) {
  const r = spawnSync('node', [path.join(here, `${e}.mjs`)], { stdio: 'inherit', timeout: 300000 });
  if (r.status !== 0) console.log(`${e}: exited ${r.status ?? r.signal}`);
}

const rows = [];
const cards = [];
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let loads = 0, requests = 0;
for (const e of all) {
  const f = path.join(here, e.split('/')[0], 'results', `${e.split('/')[1]}.json`);
  if (!fs.existsSync(f)) { rows.push(`| ${e} | not run | | | |`); continue; }
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  const ok = r.facts.filter((x) => x.holds).length;
  loads += r.use.map_loads; requests += r.use.web_service_requests;
  rows.push(`| ${e} | ${r.served_by_mapbox ? 'yes' : 'refused'} | ${ok} of ${r.facts.length} | ${r.use.map_loads} | ${r.use.web_service_requests} | ${r.ran_at.slice(0, 16).replace('T', ' ')} |`);
  const shots = r.screenshots.map((p) => `<figure><img loading="lazy" src="${e.split('/')[0]}/${p}" alt=""><figcaption>${esc(path.basename(p, '.png').replace(e.split('/')[1] + '-', ''))}</figcaption></figure>`).join('');
  const facts = r.facts.map((x) => `<li class="${x.holds ? 'yes' : 'no'}"><span>${x.holds ? 'true' : 'false'}</span> ${esc(x.fact)}</li>`).join('');
  cards.push(`<section id="${e}"><h2>${esc(e)}</h2><p class="q">${esc(r.question)}</p><ul>${facts}</ul><div class="shots">${shots}</div></section>`);
}
fs.writeFileSync(path.join(here, 'gallery.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mapbox tour</title>
<style>
:root { --bg: #fafaf9; --fg: #1c1917; --muted: #57534e; --line: #e7e5e4; --yes: #15803d; --no: #b91c1c; }
@media (prefers-color-scheme: dark) { :root { --bg: #1c1917; --fg: #f5f5f4; --muted: #a8a29e; --line: #44403c; --yes: #4ade80; --no: #f87171; } }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 0 0 2px; font-family: ui-monospace, monospace; }
.sub { color: var(--muted); margin: 0 0 24px; }
section { border-top: 1px solid var(--line); padding: 20px 0; }
.q { margin: 0 0 8px; color: var(--muted); }
ul { list-style: none; padding: 0; margin: 0 0 12px; }
li { padding: 2px 0; } li span { display: inline-block; width: 44px; font: 600 12px ui-monospace, monospace; }
a { color: inherit; }
li.yes span { color: var(--yes); } li.no span { color: var(--no); }
.shots { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
figure { margin: 0; } img { width: 100%; height: auto; display: block; border: 1px solid var(--line); border-radius: 4px; }
figcaption { font-size: 12px; color: var(--muted); }
</style></head><body><main>
<h1>Mapbox tour</h1>
<p class="sub">${all.length} experiments, each run once with this account's public token (C-002). A fact marked false is a result, not a breakage: each was stated before the run and came out that way. Details in results.md.</p>
${cards.join('\n')}
<p class="sub">Map images © <a href="https://www.mapbox.com/about/maps">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://apps.mapbox.com/feedback/">Improve this map</a></strong>. Satellite imagery in 3d/terrain and api/static-images © Maxar. The screenshots are not covered by this repository's MIT licence.</p>
</main></body></html>
`);
console.log('\n| Experiment | Served by Mapbox | Facts that held | Map loads | Web-service requests | Ran (UTC) |\n|---|---|---|---|---|---|\n' + rows.join('\n'));
console.log(`\n${all.length} experiments · ${loads} map loads · ${requests} web-service requests`);

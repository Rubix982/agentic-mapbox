// Read the parameter tables of every page in Mapbox's API reference into inventory/api-params.json, for
// `kb.mjs api`. The pages go to .cache/api-docs/; both folders are git-ignored, as the text is Mapbox's.
//
//   node tools/api-docs.mjs
//
// The page list is docs.mapbox.com/api's sitemap, less its section indexes and changelogs (25 pages on 2026-11-25).
// The tables are read by experiments/mcp/docs_params.py (Python's standard library only).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cache = path.join(root, '.cache/api-docs');
fs.mkdirSync(cache, { recursive: true });
const get = async (u) => { const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.text(); };
const sitemap = await get('https://docs.mapbox.com/api/sitemap.xml');
const pages = [...sitemap.matchAll(/<loc>https:\/\/docs\.mapbox\.com\/api\/([a-z-]+(?:\/[a-z0-9-]+)?)\/<\/loc>/g)].map((m) => m[1])
  .filter((p) => !/^ja\//.test(p) && !/changelog$|^overview$/.test(p) && (p.includes('/') || p === 'feedback'));
for (const p of pages) {
  fs.writeFileSync(path.join(cache, p.replace('/', '_') + '.html'), await get(`https://docs.mapbox.com/api/${p}/`));
  await new Promise((r) => setTimeout(r, 300));
}
fs.writeFileSync(path.join(cache, 'fetched.txt'), new Date().toISOString() + '\n');
fs.mkdirSync(path.join(root, 'inventory'), { recursive: true });
execFileSync('python3', ['-I', path.join(root, 'experiments/mcp/docs_params.py'), cache, path.join(root, 'inventory/api-params.json')], { stdio: ['ignore', 'ignore', 'inherit'] });
const j = JSON.parse(fs.readFileSync(path.join(root, 'inventory/api-params.json'), 'utf8'));
const n = Object.values(j).flat().reduce((s, x) => s + x.params.length, 0);
console.log(`${pages.length} pages, ${n} parameters -> inventory/api-params.json`);

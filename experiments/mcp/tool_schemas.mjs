// Turn the input schemas of the 16 web-service tools in Mapbox's MCP server into JSON Schema, without running the server.
//
//   node experiments/mcp/tool_schemas.mjs
//
// Reads the clone in .cache/vendor/mcp-server (it must be at COMMIT), copies its src/ into .cache/mcp-schemas/, installs
// the zod and ipaddr.js versions its lockfile pins there (--ignore-scripts), and imports only the *.input.schema.ts
// files with Node's type stripping. zod's own toJSONSchema does the conversion. The MCP server is MIT, so the output,
// experiments/mcp/results/tool-schemas.json, is committed.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

export const COMMIT = 'ea129dc7e3e98b0818ccb19b682c1b357cc6c398';
export const TOOLS = ['search-and-geocode-tool', 'reverse-geocode-tool', 'category-search-tool', 'category-list-tool', 'place-details-tool', 'ground-location-tool', 'directions-tool', 'matrix-tool', 'optimization-tool', 'isochrone-tool', 'map-matching-tool', 'elevation-tool', 'static-map-image-tool', 'list-public-tokens-tool', 'feedback-tool', 'report-tool'];

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const MCP = path.join(ROOT, '.cache/vendor/mcp-server');
const WORK = path.join(ROOT, '.cache/mcp-schemas');
const OUT = path.join(ROOT, 'experiments/mcp/results/tool-schemas.json');

const CHILD = `
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
const tools = JSON.parse(process.argv[2]);
const out = {};
for (const t of tools) {
  const dir = path.resolve('src/tools', t);
  const f = fs.readdirSync(dir).find((x) => x.endsWith('.input.schema.ts'));
  const mod = await import(path.join(dir, f));
  out[t] = Object.fromEntries(Object.entries(mod)
    .filter(([, v]) => v && typeof v === 'object' && typeof v.safeParse === 'function')
    .map(([k, v]) => [k, z.toJSONSchema(v, { io: 'input', unrepresentable: 'any' })]));
}
process.stdout.write(JSON.stringify(out));
`;

const HOOKS = `export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); } catch (e) {
    if (spec.endsWith('.js') && (spec.startsWith('.') || spec.startsWith('/'))) return next(spec.slice(0, -3) + '.ts', ctx);
    throw e;
  }
}
`;

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const head = execFileSync('git', ['-C', MCP, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (head !== COMMIT) throw new Error(`.cache/vendor/mcp-server is at ${head}, expected ${COMMIT}`);
  const lock = JSON.parse(fs.readFileSync(path.join(MCP, 'package-lock.json'), 'utf8'));
  const pin = (name) => `${name}@${lock.packages[`node_modules/${name}`].version}`;
  const version = JSON.parse(fs.readFileSync(path.join(MCP, 'package.json'), 'utf8')).version;

  fs.rmSync(path.join(WORK, 'src'), { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.cpSync(path.join(MCP, 'src'), path.join(WORK, 'src'), { recursive: true });
  if (!fs.existsSync(path.join(WORK, 'node_modules/zod'))) {
    fs.writeFileSync(path.join(WORK, 'package.json'), '{"private": true}\n');
    execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', pin('zod'), pin('ipaddr.js')], { cwd: WORK, stdio: 'inherit' });
  }
  fs.writeFileSync(path.join(WORK, 'hooks.mjs'), HOOKS);
  fs.writeFileSync(path.join(WORK, 'register.mjs'), "import { register } from 'node:module';\nregister('./hooks.mjs', import.meta.url);\n");
  fs.writeFileSync(path.join(WORK, 'extract.mjs'), CHILD);
  const r = spawnSync('node', ['--experimental-strip-types', '--no-warnings', '--import', './register.mjs', 'extract.mjs', JSON.stringify(TOOLS)], { cwd: WORK, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(r.stderr);
  const tools = JSON.parse(r.stdout);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ source: 'github.com/mapbox/mcp-server', commit: COMMIT, version, zod: pin('zod'), tools }, null, 1) + '\n');
  for (const [t, s] of Object.entries(tools)) console.log(t.padEnd(26), Object.keys(s).join(', '));
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
}

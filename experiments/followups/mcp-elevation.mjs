// C-010 (T-008): start Mapbox's MCP server from source at the commit C-003 read, call elevation_tool once with C-009's
// 24 summit coordinates, and set its answers beside C-009's direct tile reads at the same points.
//   setup, once: git -C .cache/vendor/mcp-server archive ea129dc | tar -x -C .cache/mcp-build && (cd .cache/mcp-build && npm ci --ignore-scripts)
//   node experiments/followups/mcp-elevation.mjs
// (npm's @mapbox/mcp-server 0.18.1, its latest release, was published on 2026-11-17 and has no elevation_tool; the
// tool arrived in the source after it.)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { token } from '../../evals/harness/run_page.mjs';
import { fact } from '../lib.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BUILD = path.resolve(HERE, '../../.cache/mcp-build');
const COMMIT = 'ea129dc7e3e98b0818ccb19b682c1b357cc6c398';
const { summits } = JSON.parse(fs.readFileSync(path.join(HERE, 'summits.json'), 'utf8'));
const tiles = JSON.parse(fs.readFileSync(path.join(HERE, 'results/dem-summits-tiles.json'), 'utf8')).numbers.summits;
const tok = token();
const redact = (s) => String(s).split(tok).join('<token>').split(process.env.HOME).join('~');

const server = spawn(path.join(BUILD, 'node_modules/.bin/tsx'), [path.join(BUILD, 'src/index.ts')], {
  cwd: BUILD, env: { PATH: process.env.PATH, HOME: process.env.HOME, MAPBOX_ACCESS_TOKEN: tok, OTEL_TRACING_ENABLED: 'false' }, stdio: ['pipe', 'pipe', 'pipe'],
});
let buf = '', stderr = '';
const waiting = new Map();
server.stdout.on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    let m; try { m = JSON.parse(line); } catch { continue; }
    if (m.id !== undefined && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  }
});
server.stderr.on('data', (d) => (stderr += d));
let nextId = 1;
const rpc = (method, params) => new Promise((resolve, reject) => {
  const id = nextId++;
  waiting.set(id, resolve);
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  setTimeout(() => reject(new Error(`${method} timed out`)), 120000);
});

const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'elevation-check', version: '0.1' } });
server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
const list = await rpc('tools/list', {});
const listed = (list.result?.tools || []).map((t) => t.name);
const t0 = Date.now();
const call = await rpc('tools/call', { name: 'elevation_tool', arguments: { points: summits.map((s) => ({ longitude: s.lnglat[0], latitude: s.lnglat[1] })) } });
const seconds = Math.round((Date.now() - t0) / 100) / 10;
server.kill();

const res = call.result || {};
const text = (res.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
const sc = res.structuredContent || {};
const answered = (sc.points || []).map((p) => p.elevation ?? p.elevation_m ?? p.height);
const rows = summits.map((s, i) => {
  const d = tiles.find((x) => x.name === s.name);
  return { name: s.name, shape: s.shape, published_m: s.published_m, tool_m: answered[i] ?? null, direct_bilinear_m: d.at_point_m,
    tool_minus_direct_m: answered[i] != null ? Math.round((answered[i] - d.at_point_m) * 10) / 10 : null, tool_low_by_m: answered[i] != null ? Math.round(s.published_m - answered[i]) : null };
});
const matt = rows.find((r) => r.name === 'Matterhorn');
const out = {
  experiment: 'followups/mcp-elevation',
  question: "What does Mapbox's MCP elevation_tool answer for 24 summits' coordinates, and does it match the DEM tiles read directly?",
  ran_at: new Date().toISOString(),
  mcp_server: { source: 'github.com/mapbox/mcp-server', commit: COMMIT, server_info: { name: init.result?.serverInfo?.name, version: init.result?.serverInfo?.version }, tools_listed: listed.length, elevation_tool_listed: listed.includes('elevation_tool') },
  facts: [
    fact('The server lists elevation_tool', listed.includes('elevation_tool'), { tools_listed: listed.length }),
    fact('The call succeeded and returned one height per point', !res.isError && answered.filter((v) => typeof v === 'number').length === summits.length, { is_error: !!res.isError, heights: answered.length }),
    fact("Every answer is within 1 m of C-009's direct bilinear read at the same coordinate", rows.every((r) => r.tool_minus_direct_m != null && Math.abs(r.tool_minus_direct_m) <= 1), { largest_gap_m: Math.max(...rows.map((r) => Math.abs(r.tool_minus_direct_m ?? 1e9))) }),
    fact("For the Matterhorn the tool answers more than 800 m below the published 4,477.5 m", matt.tool_low_by_m > 800, matt),
  ],
  numbers: { summits: rows, structured_keys: Object.keys(sc), text: redact(text).slice(0, 4000), result_fields: sc.points?.[0] ? Object.keys(sc.points[0]) : null },
  use: { tool_calls: 1, seconds },
  stderr_excerpt: redact(stderr).slice(0, 500),
};
fs.mkdirSync(path.join(HERE, 'results'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'results/mcp-elevation.json'), JSON.stringify(out, null, 2) + '\n');
for (const f of out.facts) console.log(`${f.holds ? 'holds ' : 'FAILS '} ${f.fact}  ${JSON.stringify(f.numbers)}`);
console.log('result fields:', out.numbers.result_fields, 'structured keys:', out.numbers.structured_keys);
process.exit(0);

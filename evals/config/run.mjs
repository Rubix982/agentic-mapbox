// C-004: can the model name the Standard style's settings without help?
//
//   node evals/config/run.mjs --validate                 grade a right and a wrong answer per setting; no sessions
//   node evals/config/run.mjs [--runs 1] [--only a,b]    one fresh session per request (and run), then grade
//   node evals/config/run.mjs --regrade evals/runs/config-<stamp>
//
// Each session: `claude -p` in an empty folder under /private/tmp, on --model (default claude-opus-5-5), with no tools
// (--tools ""), no CLAUDE.md, skills, plugins or MCP servers (--safe-mode --strict-mcp-config), no Mapbox token in its
// environment, and one turn. It sees PROMPT with one request from requests.json, never the setting's name.
// Answers go to evals/runs/config-<stamp>/ (git-ignored); graded records to evals/results/c004-<stamp>.jsonl.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { grade } from './grade.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const { requests } = JSON.parse(fs.readFileSync(path.join(ROOT, 'evals/config/requests.json'), 'utf8'));

export const PROMPT = `A web page uses Mapbox GL JS v3.35.2. Its map was created with Mapbox's default Standard style:

  const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/standard', center: [2.35, 48.85], zoom: 15 });

The style has finished loading. Write the JavaScript that does the following to this existing \`map\` (do not create a new map):

{request}

Reply with only the JavaScript: no explanation and no code fences.`;

const a = process.argv.slice(2);
const opt = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

// the first run (config-20261125-042507) used a 5-minute limit and lost six sessions to it; reruns use 20
const LIMIT_MIN = Number(opt('--timeout-min', '20'));

function session(prompt, model) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const work = fs.mkdtempSync('/private/tmp/mbx-config-');
    const env = { ...process.env };
    delete env.MAPBOX_ACCESS_TOKEN;
    const args = ['-p', prompt, '--tools', '', '--safe-mode', '--strict-mcp-config', '--model', model, '--max-turns', '2', '--output-format', 'json', '--no-session-persistence'];
    const p = spawn('claude', args, { cwd: work, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => p.kill('SIGKILL'), LIMIT_MIN * 60 * 1000);
    p.on('close', (code) => {
      clearTimeout(timer);
      fs.rmSync(work, { recursive: true, force: true });
      let j = {};
      try { j = JSON.parse(out); } catch {}
      const killed = code === null;
      resolve({ answer: j.result ?? '', cost_usd: j.total_cost_usd ?? null, turns: j.num_turns ?? null, model_used: j.modelUsage ? Object.keys(j.modelUsage) : null, exit: code, seconds: Math.round((Date.now() - t0) / 1000), limit_min: LIMIT_MIN, error: killed ? `killed at the ${LIMIT_MIN}-minute limit` : j.is_error ? (j.result || 'error') : (code ? err.slice(0, 300) : null) });
    });
  });
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

function reference(r, wrong) {
  const e = r.expect;
  const v = 'equals' in e ? e.equals : 'color' in e ? e.color : 'includes' in e ? e.includes : 0.8;
  const name = wrong ? r.setting.replace(/^(show|color)([A-Z])/, (m, p, c) => (p === 'show' ? 'hide' : 'colour') + c).replace(/^(?!hide|colour)(.)/, (m, c) => c.toUpperCase()) : r.setting;
  return `map.setConfigProperty('basemap', ${JSON.stringify(name)}, ${JSON.stringify(v)});`;
}

function report(graded, label) {
  const right = graded.filter((g) => g.right).length;
  console.log(`\n${label}: ${right} of ${graded.length} right`);
  for (const g of graded.filter((x) => !x.right)) {
    console.log(`  ✗ ${g.setting.padEnd(40)} named: ${(g.names.join(', ') || '—').slice(0, 60).padEnd(60)} changed: ${JSON.stringify(g.changed).slice(0, 80)}${g.thrown ? '  threw: ' + g.thrown.slice(0, 80) : ''}${g.log.length ? '  log: ' + g.log[0].slice(0, 100) : ''}`);
  }
  return right;
}

if (a.includes('--validate')) {
  const right = requests.map((r) => ({ setting: r.setting, arm: 'reference', answer: reference(r, false) }));
  const wrong = requests.map((r) => ({ setting: r.setting, arm: 'wrong', answer: reference(r, true) }));
  const { graded, page } = await grade([...right, ...wrong], requests);
  const n1 = report(graded.filter((g) => g.arm === 'reference'), 'reference (the right name and value)');
  const n2 = report(graded.filter((g) => g.arm === 'wrong'), 'wrong (a plausible wrong name, right value)');
  const logs = graded.filter((g) => g.arm === 'wrong' && g.log.length).length;
  console.log(`\nwrong names that made GL JS print something: ${logs} of ${wrong.length}; e.g. ${graded.find((g) => g.arm === 'wrong' && g.log.length)?.log[0] || '—'}`);
  fs.mkdirSync(path.join(ROOT, 'evals/results'), { recursive: true });
  const file = path.join(ROOT, `evals/results/c004-validation-${stamp}.jsonl`);
  fs.writeFileSync(file, graded.map((g) => JSON.stringify(g)).join('\n') + '\n');
  console.log(`grader: ${n1}/${right.length} reference, ${n2}/${wrong.length} wrong · page ${page.seconds} s · ${path.relative(ROOT, file)}`);
  process.exit(n1 === right.length && n2 === 0 ? 0 : 1);
}

let base, answers;
if (a.includes('--regrade')) {
  base = path.resolve(opt('--regrade'));
  answers = fs.readFileSync(path.join(base, 'answers.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
} else {
  const model = opt('--model', 'claude-opus-5-5');
  const runs = Number(opt('--runs', '1'));
  const only = opt('--only') ? opt('--only').split(',') : null;
  const todo = [];
  for (let run = 0; run < runs; run++) for (const r of requests) if (!only || only.includes(r.setting)) todo.push({ setting: r.setting, run, request: r.request });
  base = path.join(ROOT, 'evals/runs', `config-${stamp}`);
  fs.mkdirSync(base, { recursive: true });
  const limit = Number(opt('--max-avg-cost', '0.10'));
  console.log(`${todo.length} sessions on ${model}; the first 5 alone, the rest 4 at a time if those average under $${limit}`);
  const one = async (t, k) => {
    const s = await session(PROMPT.replace('{request}', t.request), model);
    const rec = { ...t, model, ...s };
    fs.appendFileSync(path.join(base, 'answers.jsonl'), JSON.stringify(rec) + '\n');
    process.stdout.write(`${k + 1}/${todo.length} ${t.setting} $${s.cost_usd ?? '?'}${s.error ? ' ERROR ' + String(s.error).slice(0, 80) : ''}\n`);
    return rec;
  };
  const nFirst = Number(opt('--first', '5'));
  const first = await pool(todo.slice(0, nFirst), nFirst, one);
  const avg = first.reduce((x, r) => x + (r.cost_usd || 0), 0) / first.length;
  if (avg > limit || first.some((r) => r.error)) {
    console.log(`stopping after ${nFirst}: average $${avg.toFixed(3)} a session${first.some((r) => r.error) ? ', and a session errored' : ''}`);
    process.exit(2);
  }
  const rest = await pool(todo.slice(nFirst), 4, (t, k) => one(t, k + nFirst));
  answers = [...first, ...rest];
}

const { graded, page } = await grade(answers, requests);
const right = report(graded, 'sessions');
const cost = answers.reduce((s, x) => s + (x.cost_usd || 0), 0);
fs.mkdirSync(path.join(ROOT, 'evals/results'), { recursive: true });
const file = path.join(ROOT, `evals/results/c004-${path.basename(base).replace('config-', '')}.jsonl`);
fs.writeFileSync(file, graded.map((g) => JSON.stringify(g)).join('\n') + '\n');
console.log(`\n${right} of ${graded.length} right · sessions cost $${cost.toFixed(2)} · grading page ${page.seconds} s · ${path.relative(ROOT, file)}`);

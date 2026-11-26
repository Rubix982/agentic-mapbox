// T-011 (C-013): check that run_eval.mjs's offline arm really has no network and cannot read the home folder or
// /private/tmp, before any task runs on it. One short Claude session (claude-haiku-5-5 by default, a few cents) in an
// empty folder under /private/var/tmp, with the offline arm's settings and tools, is asked to make thirteen attempts that
// must fail and three ordinary ones in its own folder that must work, and to report each result.
//
//   node evals/offline_probe.mjs [--model claude-haiku-5-5]
//
// Passes (exit 0) when all sixteen were tried, the thirteen failed, the three worked (without an error) and the session
// still answered. Each attempt is judged from what its own tool call returned, not from the session's report. Ask before
// running: it is a paid session.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { offlineSettings, OFFLINE_ROOT } from './run_eval.mjs';

const a = process.argv.slice(2);
const model = a.includes('--model') ? a[a.indexOf('--model') + 1] : 'claude-haiku-5-5';
const home = os.homedir();
// a copy of GL JS that sits outside the home folder on this machine (C-013's check)
const GLJS = '/private/tmp/mbx-src-inspect/pkg/package';

// [id, must work?, which tool call is this attempt, did it reach what it asked for]
const ATTEMPTS = [
  [1, false, (t, i) => t === 'Bash' && i.includes('unpkg.com'), (r) => /\b200\b/.test(r)],
  [2, false, (t, i) => t === 'Bash' && i.includes('registry.npmjs.org'), (r) => /status 200/.test(r)],
  [3, false, (t, i) => t === 'Bash' && i.includes('npm view'), (r) => /^\s*3\.35\.2\s*$/m.test(r)],
  [4, false, (t, i) => t === 'Bash' && /\bls\b/.test(i) && i.includes('/code') && !i.includes('$d'), (r) => /agentic-mapbox/.test(r)],
  [5, false, (t, i) => t === 'Read' && i.includes('agentic-mapbox/package.json'), (r, e) => !e && /"name"/.test(r)],
  [6, false, (t, i) => t === 'Bash' && i.includes('head -c 300 /private/tmp'), (r) => /"name":\s*"mapbox-gl"/.test(r)],
  [7, false, (t, i) => t === 'Read' && i.includes('mbx-src-inspect'), (r, e) => !e && /"name":\s*"mapbox-gl"/.test(r)],
  [8, false, (t) => t === 'Glob', (r) => /dist\/(esm\/)?mapbox-gl/.test(r)],
  [9, true, (t, i) => t === 'Bash' && i.includes('echo ok'), (r, e) => !e && /\bok\b/.test(r)],
  [10, true, (t, i) => t === 'Bash' && i.includes('6*7'), (r, e) => !e && /\b42\b/.test(r)],
  [11, true, (t, i) => t === 'Read' && i.includes('probe.txt'), (r, e) => !e && /\bok\b/.test(r)],
  // 12 to 14 hide the path from Claude Code's permission rules, which stopped 4 and 6 in the first probe by reading the
  // command, so that only the sandbox is left to stop them
  [12, false, (t, i) => t === 'Bash' && i.includes('$d/tmp/'), (r) => /"name":\s*"mapbox-gl"/.test(r)],
  [13, false, (t, i) => t === 'Bash' && i.includes('$d/code'), (r) => /agentic-mapbox/.test(r)],
  [14, false, (t, i) => t === 'Bash' && i.includes('readFileSync'), (r) => /"name":\s*"mapbox-gl"/.test(r)],
  // 15 and 16: a folder beside the session's own, as an earlier task session's folder would be
  [15, false, (t, i) => t === 'Read' && i.includes('mbx-offline-sibling-'), (r, e) => !e && /k9-other-folder-text/.test(r)],
  [16, false, (t, i) => t === 'Bash' && i.includes('mbx-offline-sibling-'), (r) => /k9-other-folder-text/.test(r)],
];
// left in place afterwards (one small file)
const sibling = fs.mkdtempSync(path.join(OFFLINE_ROOT, 'mbx-offline-sibling-'));
fs.writeFileSync(path.join(sibling, 'note.txt'), 'k9-other-folder-text\n');
const PROMPT = `This is a test of this machine's sandbox. Make each of these tool calls, one tool call each, in order, and report exactly what each printed or returned, including errors. Do not try any workaround and do not combine them.
1. Bash: curl -sS -m 10 -o /dev/null -w '%{http_code}' https://unpkg.com/mapbox-gl@3.35.2/package.json
2. Bash: node -e "fetch('https://registry.npmjs.org/mapbox-gl').then(r => console.log('status', r.status)).catch(e => console.log('failed', e.message))"
3. Bash: npm view mapbox-gl@3.35.2 version
4. Bash: ls ${home}/code | head -3
5. Read the file ${home}/code/agentic-mapbox/package.json
6. Bash: head -c 300 ${GLJS}/package.json
7. Read the file ${GLJS}/package.json
8. Glob with pattern **/mapbox-gl*.js in the folder ${GLJS}
9. Bash: echo ok > ./probe.txt && cat ./probe.txt
10. Bash: node -e "console.log(6*7)"
11. Read the file probe.txt in the current folder, by its absolute path
12. Bash: d=/private; head -c 300 $d/tmp/mbx-src-inspect/pkg/package/package.json
13. Bash: d=$HOME; ls $d/code | head -3
14. Bash: cd .. && cd .. && node -e "console.log(require('fs').readFileSync(['', 'private', 'tmp', 'mbx-src-inspect', 'pkg', 'package', 'package.json'].join('/'), 'utf8').slice(0, 300))"
15. Read the file ${sibling}/note.txt
16. Bash: cat ${sibling}/note.txt
Then write the word DONE.`;

const work = fs.mkdtempSync(path.join(OFFLINE_ROOT, 'mbx-offline-probe-'));
const env = { ...process.env };
delete env.MAPBOX_ACCESS_TOKEN;
const args = ['-p', PROMPT, '--output-format', 'stream-json', '--verbose', '--allowedTools', 'Read,Write,Edit,Glob,Grep,Bash',
  '--max-turns', '20', '--strict-mcp-config', '--model', model, '--settings', JSON.stringify(offlineSettings(work))];
const { out, err } = await new Promise((resolve) => {
  const p = spawn('claude', args, { cwd: work, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let o = '', e = '';
  p.stdout.on('data', (d) => (o += d));
  p.stderr.on('data', (d) => (e += d));
  const t = setTimeout(() => p.kill('SIGTERM'), 5 * 60 * 1000);
  p.on('close', () => { clearTimeout(t); resolve({ out: o, err: e }); });
});
fs.rmSync(work, { recursive: true, force: true });

const redact = (x) => String(x).split(home).join('~').split(work).join('<work>');
const calls = new Map(), results = [];
let final = '', cost = null;
for (const line of out.split('\n')) {
  let ev; try { ev = JSON.parse(line); } catch { continue; }
  for (const part of ev.message?.content || []) {
    if (part.type === 'tool_use') calls.set(part.id, { tool: part.name, input: JSON.stringify(part.input || {}) });
    if (part.type === 'tool_result') {
      const c = calls.get(part.tool_use_id) || { tool: '?', input: '' };
      const text = Array.isArray(part.content) ? part.content.map((x) => x.text || '').join(' ') : String(part.content || '');
      results.push({ ...c, is_error: !!part.is_error, text });
    }
  }
  if (ev.type === 'result') { final = redact(ev.result || ''); cost = ev.total_cost_usd; }
}

const attempts = ATTEMPTS.map(([id, mustWork, isIt, reached]) => {
  const r = results.find((x) => isIt(x.tool, x.input));
  if (!r) return { id, must_work: mustWork, tried: false, ok: false };
  const got = reached(r.text, r.is_error);
  return { id, must_work: mustWork, tried: true, tool: r.tool, input: redact(r.input).slice(0, 200), is_error: r.is_error,
    result: redact(r.text.replace(/\s+/g, ' ')).slice(0, 300), reached: got, ok: got === mustWork };
});
const passed = /DONE/.test(final) && attempts.every((x) => x.tried && x.ok);
const rec = { ran_at: new Date().toISOString(), model, cost_usd: cost, answered: /DONE/.test(final), passed, attempts,
  stderr: redact(err).slice(0, 2000) };
const outFile = path.join(path.dirname(new URL(import.meta.url).pathname), 'results/offline-probe.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(rec, null, 2) + '\n');
for (const x of attempts) console.log(`${x.id} ${x.must_work ? 'must work ' : 'must fail '} ${!x.tried ? 'NOT TRIED' : x.ok ? 'ok' : 'WRONG'}  ${x.input || ''}\n    -> ${x.is_error ? '(error) ' : ''}${x.result || ''}`);
if (rec.stderr) console.log('stderr:', rec.stderr.slice(0, 500));
console.log(`\nanswered: ${rec.answered} · passed: ${passed} · $${cost}`);
process.exit(passed ? 0 : 1);

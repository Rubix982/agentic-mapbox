// Run the held-out GL JS tasks (evals/tasks/tasks.md) with Mapbox's Agent Skills and without, and score each first page.
//
//   node evals/run_eval.mjs [--set tasks] [--tasks 1-10 | 2,3,5] [--arms with,without] [--runs 1] [--model claude-opus-5-5] [--max-turns 40]
//                           [--concurrency 3] [--resume evals/runs/<dir>]
//
// --arms offline is the without arm with no network: Bash runs in Claude Code's sandbox with no allowed domains and no
// way out of it, WebFetch and WebSearch are denied, and neither Bash nor the file tools can read the home folder or
// /private/tmp, where this machine keeps copies of GL JS and the earlier runs' pages (offlineSettings; T-011). Its
// session folders go under /private/var/tmp instead; run it with --concurrency 1. Claude Code itself still reaches its
// API.
// --arms reference (or wrong) runs the task writer's correct (or deliberately wrong) pages, evals/tasks/reference/
// taskN.html or wrongN.html, in place of an agent: no Claude session; a test of the harness and the checks.
//
// For each task, arm and run: a fresh `claude -p` session in an empty folder outside this repository (so neither arm
// can find this repository, the checks or the reference pages, and no git status names it) gets the task and any data
// files it names, with no MCP servers (--strict-mcp-config) and no Mapbox token in its environment. The "with" arm
// loads Mapbox's Agent Skills plugin (github.com/mapbox/mapbox-agent-skills at SKILLS_COMMIT, with its MCP servers
// removed) through --plugin-dir; the "without" arm loads nothing extra. The agent writes ./index.html and must not
// open it; this script then opens it exactly once in headless Chromium (evals/harness/run_page.mjs) and grades it with
// evals/tasks/checks.mjs. "Right first time" = the map settles and the check passes.
// A session that ends in an error (e.g. the usage limit) is recorded as not run, not as a failure, and the run stops;
// --resume carries on, skipping what is done.
//
// Each session is a full Claude Code run on the user's account: 10 tasks x 2 arms is 20 sessions. Ask before running.
// Results: evals/runs/<timestamp>/results.jsonl and summary.md (the session folders and transcripts sit beside them).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { runPage } from './harness/run_page.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '..');
// --set names the task folder under evals/ (default tasks, C-001's; tasks-3x is C-005's)
const SET = process.argv.includes('--set') ? process.argv[process.argv.indexOf('--set') + 1] : 'tasks';
const TASKS_DIR = path.join(HERE, SET);
const TASKS_MD = path.join(TASKS_DIR, 'tasks.md');
const CHECKS = path.join(TASKS_DIR, 'checks.mjs');
const SKILLS_REPO = path.join(ROOT, '.cache/vendor/mapbox-agent-skills');
const SKILLS_COMMIT = '84d991e36ad5ac7195796ff9e9fdc378155f470c'; // HEAD of mapbox/mapbox-agent-skills, 2026-11-20

export const PROMPT = `Write a web page that uses Mapbox GL JS v3.35.2 to do the task below.

Your page will be opened exactly once, by a test harness, in headless Chromium at 800 x 600 px. Do not open it
yourself. The harness serves this folder over HTTP and loads ./index.html. Your page must:
- be one file, ./index.html, loading Mapbox GL JS v3.35.2 from
  https://api.mapbox.com/mapbox-gl-js/v3.35.2/mapbox-gl.js and https://api.mapbox.com/mapbox-gl-js/v3.35.2/mapbox-gl.css
  (no build step, no other map library);
- take its access token from window.MAPBOX_ACCESS_TOKEN, which is set before your scripts run (do not hard-code a token);
- make the map fill the window, and assign the map to window.map.
Any file the task names is already in this folder. Write ./index.html, then stop and say it is written. Its first run is
what counts.

Task:
{task}
`;

export function tasks() {
  const text = fs.readFileSync(TASKS_MD, 'utf8').split('## Order of work')[0];
  const items = text.split(/^\*\*(\d+)\. /m).slice(1);
  const out = {};
  for (let i = 0; i < items.length; i += 2) out[Number(items[i])] = '**' + items[i] + '. ' + items[i + 1].trim();
  return out;
}

// The task as the agent sees it: everything before its "Check:" sentence.
const taskText = (t) => t.split(/\s*Check:/)[0].replace(/\s+/g, ' ').trim();

// T-011: the settings the offline arm adds for a session working in `work`. The sandbox covers Bash and what it starts;
// the Read deny rules cover Read, Glob and Grep. Bash may still read the session's own folder and the folder node and
// npm are installed in (under the home folder here, ~/.nvm; it holds no GL JS), so node runs as in the without arm.
// In /private/tmp the sandbox and the Read rules close every entry there is when the session starts, but not the folder
// itself or Claude Code's own claude-<uid> folder in it, only that folder's entries: after every command Claude Code's
// Bash writes a new file there, and with /private/tmp closed whole each command ended in an error (C-013's probes; a
// Read deny rule closes the path to the sandbox too, so Read(//private/tmp/**) did the same). The Read rules also close
// every other entry of /private/var/tmp and of the run's own folder there, earlier sessions' folders included; run the
// offline arm with --concurrency 1, so that no session's folder appears after another's settings were made.
export const OFFLINE_ROOT = '/private/var/tmp';
const NODE_DIR = path.resolve(path.dirname(process.execPath), '..');
export function offlineSettings(work) {
  const home = os.homedir();
  const own = `claude-${process.getuid()}`;
  const ls = (d) => { try { return fs.readdirSync(d).map((n) => path.join(d, n)); } catch { return []; } };
  const tmp = [...ls('/private/tmp').filter((x) => path.basename(x) !== own), ...ls(path.join('/private/tmp', own))];
  const root = path.dirname(work);
  const varTmp = [...ls(OFFLINE_ROOT).filter((x) => x !== root && x !== work), ...ls(root).filter((x) => x !== work)];
  const isDir = (x) => { try { return fs.statSync(x).isDirectory(); } catch { return false; } };
  // the Read tool may be given either spelling (/private/tmp or /tmp, /private/var or /var); names a rule cannot hold
  // are left to the sandbox alone
  const tmpRules = [...new Set([...tmp, ...varTmp])].filter((x) => /^[\w.@+-]+$/.test(path.basename(x)))
    .flatMap((x) => [x, x.replace(/^\/private/, '')].map((y) => `Read(/${y}${isDir(x) ? '/**' : ''})`));
  return {
    sandbox: {
      enabled: true,
      failIfUnavailable: true,
      allowUnsandboxedCommands: false,
      network: { allowedDomains: [] },
      filesystem: { denyRead: [home, OFFLINE_ROOT, ...tmp], allowRead: [work, NODE_DIR] },
    },
    permissions: { defaultMode: 'dontAsk', deny: ['WebFetch', 'WebSearch', `Read(/${home}/**)`, ...tmpRules] },
  };
}

function pluginCopy(dest) {
  fs.mkdirSync(dest, { recursive: true });
  execSync(`git -C '${SKILLS_REPO}' archive ${SKILLS_COMMIT} | tar -x -C '${dest}'`, { stdio: 'inherit' });
  for (const p of ['.mcp.json', '.agents', '.plugin']) fs.rmSync(path.join(dest, p), { recursive: true, force: true });
  const pj = path.join(dest, '.claude-plugin/plugin.json');
  const j = JSON.parse(fs.readFileSync(pj, 'utf8'));
  delete j.mcpServers;
  fs.writeFileSync(pj, JSON.stringify(j, null, 2));
  return dest;
}

function copyData(n, work) {
  const d = path.join(TASKS_DIR, 'data', `task${n}`);
  if (fs.existsSync(d)) fs.cpSync(d, work, { recursive: true });
}

export function transcriptFacts(lines) {
  let skill_used = false, ran_browser = false, touched_repo = false, usage = {}, cost = null, turns = null;
  // shell commands that tried the network (C-005: three sessions downloaded GL JS's own code), and how many tool results
  // were the sandbox refusing a connection (the offline arm, C-013: there every attempt was refused)
  const fetched = [];
  let network_denied = 0;
  let model = null, skill_listed = null, skills_listed = null, mcp_tools = null, error = null, plugins = null;
  const skillsUsed = new Set();
  for (const line of lines) {
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type === 'system' && ev.subtype === 'init') {
      model = ev.model;
      skills_listed = (ev.skills || []).map(String);
      skill_listed = skills_listed.some((s) => /mapbox/i.test(s));
      mcp_tools = (ev.tools || []).filter((t) => t.startsWith('mcp__'));
      plugins = (ev.plugins || []).map((p) => p.name || String(p));
    }
    const content = ev.message?.content;
    if (Array.isArray(content)) for (const part of content) {
      if (part.type === 'tool_result' && /deny network-outbound/.test(JSON.stringify(part.content || ''))) network_denied++;
      if (part.type !== 'tool_use') continue;
      const inp = JSON.stringify(part.input || {});
      if (part.name === 'Skill') { skill_used = true; skillsUsed.add(part.input?.skill || part.input?.name || '?'); }
      const m = inp.match(/skills\/(mapbox-[a-z0-9-]+)\//);
      if (m) { skill_used = true; skillsUsed.add(m[1]); }
      if (inp.includes(ROOT) || inp.includes(ROOT.replace(os.homedir(), '~'))) touched_repo = true;
      if (part.name === 'Bash' && /chrom|playwright|puppeteer|open\s+.*index\.html|http-server|python3? -m http\.server|npx serve/i.test(inp)) ran_browser = true;
      if (part.name === 'Bash' && /\b(curl|wget|npm (pack|install|i|view)\b|npx\b|pip3? install|git clone)|unpkg\.com|jsdelivr|docs\.mapbox\.com|api\.mapbox\.com\/mapbox-gl-js/i.test(inp)) fetched.push(inp.replace(/\s+/g, ' ').slice(0, 160));
    }
    if (ev.type === 'result') {
      usage = ev.usage || {}; cost = ev.total_cost_usd; turns = ev.num_turns;
      if (ev.is_error || !['success', 'error_max_turns'].includes(ev.subtype)) error = `${ev.subtype}: ${String(ev.result).slice(0, 300)}`;
    }
  }
  if (!lines.some((l) => l.trim())) error = 'no output';
  return { skill_used, skills_used: [...skillsUsed], agent_ran_browser: ran_browser, touched_repo, fetched_over_network: fetched.length > 0, network_commands: fetched, network_denied, cost_usd: cost, turns,
    output_tokens: usage.output_tokens, model, skill_listed, skills_listed_count: skills_listed?.length, mcp_tools, plugins, session_error: error };
}

function runSession(cmd, args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.MAPBOX_ACCESS_TOKEN;
    const p = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => p.kill('SIGTERM'), timeoutMs);
    p.on('close', (code) => { clearTimeout(timer); resolve({ code, out, err }); });
  });
}

let pageLock = Promise.resolve();
function gradeOnce(work, n) {
  const job = pageLock.then(() => runPage(work, { checks: CHECKS, task: n, shot: path.join(work, 'shot.png') }));
  pageLock = job.catch(() => {});
  return job;
}

async function main() {
  const a = process.argv.slice(2);
  const opt = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
  // --tasks takes a range (1-10) or a list (2,3,5)
  const wanted = [];
  for (const part of opt('--tasks', '1-10').split(',')) {
    const [lo, hi] = part.split('-').map(Number);
    for (let n = lo; n <= (hi || lo); n++) wanted.push(n);
  }
  const arms = opt('--arms', 'with,without').split(',');
  const runs = Number(opt('--runs', '1'));
  const model = opt('--model', 'claude-opus-5-5');
  const maxTurns = opt('--max-turns', '40');
  const conc = Number(opt('--concurrency', '3'));
  let base;
  if (a.includes('--resume')) base = path.resolve(opt('--resume'));
  else {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
    base = path.join(HERE, 'runs', `${stamp}-${SET === 'tasks' ? '' : SET + '-'}${arms.join('+')}`);
    fs.mkdirSync(base, { recursive: true });
  }
  const resultsFile = path.join(base, 'results.jsonl');
  const done = fs.existsSync(resultsFile) ? fs.readFileSync(resultsFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const results = done.filter((x) => !x.session_error);
  const workroot = fs.mkdtempSync(path.join(arms.includes('offline') ? OFFLINE_ROOT : '/private/tmp', 'mbx-eval-'));
  const agentArms = arms.filter((x) => x === 'with' || x === 'without' || x === 'offline');
  const plugin = arms.includes('with') ? pluginCopy(path.join(workroot, 'plugin')) : null;
  const T = tasks();
  for (const n of wanted) if (!T[n]) throw new Error(`task ${n} not found in ${TASKS_MD}`);

  const jobs = [];
  for (const n of wanted) for (const arm of arms) for (let r = 0; r < runs; r++) {
    if (results.some((x) => x.task === n && x.arm === arm && x.run === r)) continue;
    jobs.push({ n, arm, r });
  }
  let stop = false;
  const append = (rec) => fs.appendFileSync(resultsFile, JSON.stringify(rec) + '\n');

  async function doJob({ n, arm, r }) {
    if (stop) return;
    const work = path.join(workroot, `task${n}-${arm}-${r}`);
    fs.mkdirSync(work, { recursive: true });
    copyData(n, work);
    const t0 = Date.now();
    let info;
    if (arm === 'reference' || arm === 'wrong') {
      fs.copyFileSync(path.join(TASKS_DIR, 'reference', `${arm === 'reference' ? 'task' : 'wrong'}${n}.html`), path.join(work, 'index.html'));
      info = { skill_used: false, agent_ran_browser: false, cost_usd: 0, turns: 0 };
    } else {
      const args = ['-p', PROMPT.replace('{task}', taskText(T[n])), '--output-format', 'stream-json', '--verbose',
        '--allowedTools', 'Read,Write,Edit,Glob,Grep,Bash,Skill', '--max-turns', maxTurns, '--strict-mcp-config', '--model', model];
      if (arm === 'with') args.push('--plugin-dir', plugin);
      if (arm === 'offline') args.push('--settings', JSON.stringify(offlineSettings(work)));
      const p = await runSession('claude', args, work, 30 * 60 * 1000);
      fs.writeFileSync(path.join(work, 'transcript.jsonl'), p.out);
      if (p.err.trim()) fs.writeFileSync(path.join(work, 'stderr.txt'), p.err);
      info = transcriptFacts(p.out.split('\n'));
    }
    const rec = { task: n, arm, run: r, agent_seconds: Math.round((Date.now() - t0) / 100) / 10, ...info };
    const page = path.join(work, 'index.html');
    if (rec.session_error && !fs.existsSync(page)) {
      Object.assign(rec, { page_written: false, right_first_time: null });
      append(rec);
      fs.cpSync(work, path.join(base, path.basename(work)), { recursive: true });
      console.log(JSON.stringify({ task: n, arm, run: r, session_error: rec.session_error }));
      stop = true;
      return;
    }
    if (!fs.existsSync(page)) Object.assign(rec, { page_written: false, passed: false, reasons: ['no index.html'] });
    else {
      const v = await gradeOnce(work, n);
      Object.assign(rec, { page_written: true, has_map: v.has_map, settled: v.settled, passed: v.passed, reasons: v.reasons,
        numbers: v.numbers, page_errors: v.errors, requests_by_host: v.requests_by_host, page_seconds: v.seconds });
    }
    rec.right_first_time = !!rec.passed;
    results.push(rec);
    append(rec);
    fs.cpSync(work, path.join(base, path.basename(work)), { recursive: true });
    console.log(JSON.stringify({ task: n, arm, run: r, right_first_time: rec.right_first_time, reasons: rec.reasons, skill_used: rec.skill_used, cost_usd: rec.cost_usd }));
  }

  const width = agentArms.length ? conc : 1;
  const queue = [...jobs];
  await Promise.all(Array.from({ length: Math.min(width, queue.length) }, async () => {
    while (queue.length && !stop) await doJob(queue.shift());
  }));
  if (stop) console.log(`stopped on a session error; carry on with: node evals/run_eval.mjs --arms ${arms.join(',')} --resume ${base}`);

  const lines = ['| task | ' + arms.join(' | ') + ' |', '|---|' + '---|'.repeat(arms.length)];
  for (const n of wanted) {
    lines.push(`| ${n} | ` + arms.map((arm) => {
      const rs = results.filter((x) => x.task === n && x.arm === arm);
      return `${rs.filter((x) => x.right_first_time).length}/${rs.length}`;
    }).join(' | ') + ' |');
  }
  lines.push('| total | ' + arms.map((arm) => results.filter((x) => x.arm === arm && x.right_first_time).length).join(' | ') + ' |');
  fs.writeFileSync(path.join(base, 'summary.md'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  console.log(`records: ${base}`);
}

if (path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();

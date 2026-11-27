// C-017: does an added skill's description reach the model whole? One short Claude session, set up as run_eval.mjs's
// with arm with --extra-skill (Mapbox's plugin plus the added skill, no MCP servers, no token), in an empty folder,
// is asked to copy the skill's description out of its list of skills without calling a tool. Every tool but Skill is
// denied: Claude Code gives the list of skills as part of the Skill tool, and with Skill denied too the session said it
// had no list (the second run, 2026-11-27). The copy is compared with the description in the skill's SKILL.md.
//
//   node evals/skill_description_check.mjs evals/skills/gl-js-3d-layers [--model claude-opus-5-5] [--out c017-description-check.json]
//   node evals/skill_description_check.mjs --description "<skill-name>=<description>" --out c024-description-check.json
//
// The second form adds no skill: it gives one of Mapbox's own skills the description after the "=", as run_eval.mjs's
// --description does, and checks that one (C-024).
//
// Writes evals/results/<--out>, c017-description-check.json by default. A paid session (one turn); ask before running.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pluginCopy, parseDescription } from './run_eval.mjs';

const a = process.argv.slice(2);
const swap = parseDescription(a.includes('--description') ? a[a.indexOf('--description') + 1] : '');
const skillDir = swap ? null : path.resolve(a[0]);
const model = a.includes('--model') ? a[a.indexOf('--model') + 1] : 'claude-opus-5-5';
const outName = a.includes('--out') ? a[a.indexOf('--out') + 1] : 'c017-description-check.json';
const name = swap ? swap.skill : path.basename(skillDir);
const description = swap ? swap.text : JSON.parse(fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8').match(/^description:\s*(".*")\s*$/m)[1]);

const root = fs.mkdtempSync('/private/tmp/mbx-eval-');
const plugin = pluginCopy(path.join(root, 'plugin'), skillDir, swap);
const work = path.join(root, 'check');
fs.mkdirSync(work);
const PROMPT = `Do not call any tool. In your list of available skills there is one named mapbox:${name}. Copy out its description exactly as it is given in that list, character for character, on the lines between a line that says BEGIN and a line that says END. If the list shows only part of it, copy only that part. Then stop.`;
const args = ['-p', PROMPT, '--output-format', 'stream-json', '--verbose', '--max-turns', '2', '--strict-mcp-config',
  '--model', model, '--plugin-dir', plugin, '--disallowedTools', 'Read,Write,Edit,Glob,Grep,Bash,WebFetch,WebSearch'];
const env = { ...process.env };
delete env.MAPBOX_ACCESS_TOKEN;
const out = await new Promise((resolve) => {
  const p = spawn('claude', args, { cwd: work, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let o = '';
  p.stdout.on('data', (d) => (o += d));
  const t = setTimeout(() => p.kill('SIGTERM'), 5 * 60 * 1000);
  p.on('close', () => { clearTimeout(t); resolve(o); });
});
fs.writeFileSync(path.join(work, 'transcript.jsonl'), out);

let listed = null, toolCalls = 0, result = '', cost = null;
for (const line of out.split('\n')) {
  let ev; try { ev = JSON.parse(line); } catch { continue; }
  if (ev.type === 'system' && ev.subtype === 'init') listed = (ev.skills || []).map(String).includes(`mapbox:${name}`);
  for (const part of ev.message?.content || []) if (part.type === 'tool_use') toolCalls++;
  if (ev.type === 'result') { result = ev.result || ''; cost = ev.total_cost_usd; }
}
// the lines between BEGIN and END, without any code fence or bold markers around them
const block = (result.match(/BEGIN[*_`\s]*\n([\s\S]*?)\n[*_`\s]*END/) || [])[1];
const copied = block === undefined ? null : block.replace(/^\s*```\w*\s*\n?|\n?\s*```\s*$/g, '').trim();
const norm = (x) => x.replace(/\s+/g, ' ').trim();
const rec = {
  ran_at: new Date().toISOString(), model, skill: `mapbox:${name}`, ...(skillDir ? { skill_folder: path.relative(path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), skillDir) } : { description_override: swap }), listed_at_start: listed, tool_calls: toolCalls,
  description_chars: description.length, copied_chars: copied?.length ?? null,
  exact: copied !== null && norm(copied) === norm(description),
  copied_is_start_of_description: copied !== null && norm(description).startsWith(norm(copied).replace(/(\.\.\.|…)$/, '').trim()),
  copied, reply: result, cost_usd: cost,
};
const outFile = path.join(path.dirname(new URL(import.meta.url).pathname), 'results', outName);
fs.writeFileSync(outFile, JSON.stringify(rec, null, 2) + '\n');
console.log(JSON.stringify({ ...rec, copied: copied?.slice(0, 120) }, null, 2));
console.log(`session folder left at ${root}`);

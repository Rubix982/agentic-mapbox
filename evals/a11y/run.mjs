// C-035 (T-028, candidate 4): an automated WCAG check on every map page a Claude session wrote in C-001 to C-029,
// and on a bare GL JS page as the control, so that what GL JS does by itself can be told apart from what the page adds.
//   node evals/a11y/run.mjs
// Each page loads as the harness loads it (evals/harness/run_page.mjs). axe-core 4.10.2 is added from cdnjs and run
// with the WCAG 2.0 and 2.1 Level A and AA rules, which is the standard the US Title II rule asks of state and local
// government sites. Writes evals/a11y/results.json. Map loads: one per page (82).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPage } from '../harness/run_page.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNS = path.join(HERE, '../runs');
const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BAR = 0.9, AT_ONCE = 3;

const check = async (t) => {
  await t.page.addScriptTag({ url: AXE });
  const r = await t.page.evaluate(async (tags) => {
    const out = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'incomplete'] });
    const pick = (v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) });
    return { violations: out.violations.map(pick), incomplete: out.incomplete.map((v) => v.id), version: window.axe.version };
  }, TAGS);
  return { passed: true, numbers: r };
};

const folders = fs.readdirSync(RUNS).filter((d) => !/reference\+wrong/.test(d)).sort()
  .flatMap((d) => fs.readdirSync(path.join(RUNS, d)).filter((s) => fs.existsSync(path.join(RUNS, d, s, 'index.html'))).map((s) => ({ run: d, session: s, folder: path.join(RUNS, d, s) })));
const pages = [{ run: 'control', session: 'control', folder: path.join(HERE, 'control') }, ...folders];
const rows = new Array(pages.length);
let next = 0;
await Promise.all(Array.from({ length: AT_ONCE }, async () => {
  while (next < pages.length) {
    const k = next++, p = pages[k];
    const rec = await runPage(p.folder, { check });
    rows[k] = { run: p.run, session: p.session, task: Number((/^task(\d+)/.exec(p.session) || [])[1]) || null, settled: rec.settled,
      violations: rec.numbers?.violations ?? null, incomplete: rec.numbers?.incomplete ?? null, axe: rec.numbers?.version ?? null, reasons: rec.reasons };
    process.stdout.write(`${k + 1}/${pages.length} ${p.run}/${p.session}: ${rows[k].violations ? rows[k].violations.map((v) => v.id).join(',') || 'none' : 'NOT RUN ' + (rec.reasons || []).join(' ')}\n`);
  }
}));
const control = rows[0], baseline = new Set((control.violations || []).map((v) => v.id));
const sessions = rows.slice(1).filter((r) => r.violations);
const beyond = (r) => r.violations.filter((v) => !baseline.has(v.id));
const byRule = {};
for (const r of sessions) for (const v of r.violations) (byRule[v.id] ||= { pages: 0, impact: v.impact, help: v.help, from_gl_js: baseline.has(v.id) }).pages++;
const summary = {
  axe: control.axe, tags: TAGS, control: control.violations, pages_checked: sessions.length, pages_not_checked: rows.length - 1 - sessions.length,
  pages_with_no_violations: sessions.filter((r) => r.violations.length === 0).length,
  pages_with_none_beyond_control: sessions.filter((r) => beyond(r).length === 0).length,
  share_none_beyond_control: Math.round((sessions.filter((r) => beyond(r).length === 0).length / sessions.length) * 100) / 100,
  bar: BAR, rules: Object.fromEntries(Object.entries(byRule).sort((a, b) => b[1].pages - a[1].pages)),
};
fs.writeFileSync(path.join(HERE, 'results.json'), JSON.stringify({ ran_at: new Date().toISOString(), summary, pages: rows }, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));

// Search what Mapbox GL JS and its style spec say about themselves (inventory/, made by tools/inventory.mjs).
//
//   node tools/kb.mjs find <words...>     anything whose name or doc contains every word
//   node tools/kb.mjs prop <name>         a paint or layout property: type, default, range, values, since which GL JS
//   node tools/kb.mjs layer <type>        every paint and layout property of one layer type
//   node tools/kb.mjs source <type>       a source type's options
//   node tools/kb.mjs expr <name>         an expression
//   node tools/kb.mjs method <name>       a Map method (own or inherited) or a method of another exported class
//   node tools/kb.mjs option <name>       a Map constructor option, with its default
//   node tools/kb.mjs events              every map event
//   node tools/kb.mjs class <Name>        an exported class's members (Marker, Popup, GeoJSONSource, ...)
//   node tools/kb.mjs section <name>      root-level style sections: light, light-3d, fog, terrain, projection, camera, import, config, snow, rain, colorTheme
//   node tools/kb.mjs config [name]       the Standard style's settings, for setConfigProperty('basemap', name, value);
//                                         no name lists all 48. Marks the ones a model named wrong without help (C-004).
//   node tools/kb.mjs api <words...>      web-service parameters from the API reference (inventory/api-params.json, made
//                                         by tools/api-docs.mjs) whose endpoint, name or description contains every
//                                         word. Its stated limits are the docs' word; where C-011 sent a request at and
//                                         past one, the result is shown beside it.

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const inv = path.join(root, 'inventory');
if (!fs.existsSync(path.join(inv, 'gl-js.json'))) {
  console.error('No inventory yet: run `node tools/inventory.mjs` first.');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(path.join(inv, 'style-spec.json'), 'utf8'));
const gl = JSON.parse(fs.readFileSync(path.join(inv, 'gl-js.json'), 'utf8'));

const cfgFile = path.join(inv, 'standard-config.json');
const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : null;
// what a model with no help wrote for each setting it got wrong (C-004, evals/results/c004-20261125-combined.jsonl)
const missFile = path.join(root, 'evals/results/c004-20261125-combined.jsonl');
const misses = Object.fromEntries((fs.existsSync(missFile) ? fs.readFileSync(missFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : [])
  .filter((g) => !g.right && !g.error).map((g) => [g.setting, (g.names.length ? g.names : [...g.code.matchAll(/'((?:show|color)[A-Za-z0-9]+)'/g)].map((m) => m[1])).filter((n, i, a) => a.indexOf(n) === i)]));
// C-012: how often a model got each of those settings right in three tries, without help and with one sentence telling
// it to search the schema by title (evals/results/c004-20261127-*.jsonl; a session that never finished is not counted)
const tally = (files) => {
  const t = {};
  for (const f of files.map((x) => path.join(root, 'evals/results', x)).filter((x) => fs.existsSync(x)))
    for (const g of fs.readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((g) => !g.error)) {
      t[g.setting] = t[g.setting] || [0, 0];
      t[g.setting][0] += g.right ? 1 : 0;
      t[g.setting][1]++;
    }
  return t;
};
const c012 = { plain: tally(['c004-20261127-032110.jsonl', 'c004-20261127-035137.jsonl']), hint: tally(['c004-20261127-032110-hint.jsonl']) };

const [cmd, ...args] = process.argv.slice(2);
const q = args.join(' ');
const lc = (s) => (s || '').toLowerCase();
const short = (s, n = 160) => { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const since = (p) => Object.entries(p['js-since'] || {}).map(([f, v]) => `${f}: ${v}`).join('; ');

function showProp(p) {
  const lines = [`${p.kind ? `${p.layer} ${p.kind}` : 'option'} · ${p.name}`];
  lines.push(`  type: ${p.type}${p.value ? `<${p.value}>` : ''}${p.length ? ` (length ${p.length})` : ''}   default: ${JSON.stringify(p.default)}`);
  if (p.minimum !== undefined || p.maximum !== undefined) lines.push(`  range: ${p.minimum ?? '-∞'} to ${p.maximum ?? '∞'}${p.units ? ' ' + p.units : ''}`);
  if (p.values) lines.push(`  values: ${p.values.join(', ')}`);
  if (p['property-type']) lines.push(`  property-type: ${p['property-type']}${p.transition ? ', transitions' : ''}`);
  if (p.expression) lines.push(`  expression inputs: ${(p.expression.parameters || []).join(', ')}${p.expression.interpolated ? ' (interpolated)' : ''}`);
  if (p.requires) lines.push(`  requires: ${JSON.stringify(p.requires)}`);
  if (since(p)) lines.push(`  GL JS since: ${since(p)}`);
  if (p['not-in-js']) lines.push('  NOT supported in GL JS (mobile SDKs only, per sdk-support)');
  if (p.experimental) lines.push('  experimental');
  if (p.private) lines.push('  private');
  lines.push(`  ${p.doc}`);
  return lines.join('\n');
}

function showMember(m, cls = 'Map') {
  const lines = [`${cls}${m.owner && m.owner !== cls ? ` (from ${m.owner})` : ''} · ${m.signature}`];
  if (m.summary) lines.push(`  ${m.summary}`);
  if (m.deprecated) lines.push(`  DEPRECATED ${m.deprecated === true ? '' : m.deprecated}`);
  if (m.experimental) lines.push('  experimental');
  if (m.example) lines.push('  example:\n' + m.example.split('\n').map((l) => '    ' + l).join('\n'));
  return lines.join('\n');
}

function exact(list, name) {
  return list.filter((x) => lc(x.name) === lc(name)).concat(list.filter((x) => lc(x.name) !== lc(name) && lc(x.name).includes(lc(name))));
}

const print = (xs) => console.log(xs.length ? xs.join('\n\n') : `nothing found for "${q}"`);

switch (cmd) {
  case 'prop':
    print(exact(spec.properties, q).map(showProp));
    break;
  case 'layer': {
    const t = spec.layerTypes.find((l) => l.name === q);
    if (!t) { console.log(`layer types: ${spec.layerTypes.map((l) => l.name).join(', ')}`); break; }
    console.log(`${t.name} layer${t['js-since'] ? ` (GL JS since ${t['js-since']})` : ''}${t.experimental ? ' · experimental' : ''}\n  ${short(t.doc, 400)}\n`);
    for (const kind of ['layout', 'paint']) {
      const ps = spec.properties.filter((p) => p.layer === q && p.kind === kind);
      console.log(`${kind} (${ps.length}):`);
      for (const p of ps) console.log(`  ${p.name.padEnd(40)} ${String(p.type).padEnd(10)} default ${short(JSON.stringify(p.default), 40)}${p['not-in-js'] ? '  [not in GL JS]' : ''}${p.experimental ? '  [experimental]' : ''}`);
    }
    break;
  }
  case 'source': {
    const s = spec.sources.find((x) => x.name === q);
    if (!s) { console.log(`source types: ${spec.sources.map((x) => x.name).join(', ')}`); break; }
    print(s.options.map((p) => showProp({ ...p, kind: undefined })));
    break;
  }
  case 'expr':
    print(exact(spec.expressions, q).map((e) => `expression · ${e.name}   (${e.group}${e['js-since'] ? `, GL JS since ${e['js-since']}` : ''}${e.experimental ? ', experimental' : ''})\n  ${e.doc}`));
    break;
  case 'method': {
    const own = exact(gl.map.members, q).map((m) => showMember(m));
    const other = Object.entries(gl.classes).flatMap(([c, v]) => exact(v.members, q).filter((m) => m.owner === c).map((m) => showMember(m, c)));
    print([...own, ...other].slice(0, 20));
    break;
  }
  case 'option':
    print(exact(gl.mapOptions, q).map((o) => `Map option · ${o.name}${o.optional ? '?' : ''}: ${o.type}\n  default: ${o.default ?? '(none documented)'}\n  ${o.doc || '(no documentation in the type definitions)'}`));
    break;
  case 'events':
    console.log(gl.mapEvents.map((e) => `${e.name.padEnd(28)} ${short(e.type, 90)}`).join('\n'));
    break;
  case 'class': {
    const c = gl.classes[q] || (q === 'Map' ? gl.map : undefined);
    if (!c) { console.log(`classes: Map, ${Object.keys(gl.classes).join(', ')}`); break; }
    console.log(`${q} (${c.chain.join(' > ')})`);
    for (const m of c.members) console.log(`  ${short(m.signature, 150)}${m.deprecated ? '  [deprecated]' : ''}`);
    break;
  }
  case 'section': {
    const s = spec.sections[q];
    if (!s) { console.log(`sections: ${Object.keys(spec.sections).join(', ')}; root keys: ${spec.root.map((r) => r.name).join(', ')}`); break; }
    print(s.map((p) => showProp({ ...p, kind: undefined })));
    break;
  }
  case 'config': {
    if (!cfg) { console.log('No Standard settings yet: run `node tools/inventory.mjs` with MAPBOX_ACCESS_TOKEN set (in .env).'); break; }
    const std = cfg.styles.standard || [], sat = new Set((cfg.styles['standard-satellite'] || []).map((x) => x.name));
    const flag = (n) => (misses[n] ? `  [named wrong without help: ${misses[n].join(', ') || 'no name'}]` : '');
    const show = (x) => [`config · ${x.name}   (setConfigProperty('basemap', '${x.name}', value))`,
      `  type: ${x.type ?? '(none given)'}   default: ${JSON.stringify(x.default)}`,
      ...(x.values ? [`  values: ${x.values.join(', ')}`] : []),
      ...(x.minimum !== undefined ? [`  range: ${x.minimum} to ${x.maximum}${x.step ? `, step ${x.step}` : ''}`] : []),
      `  in: standard${sat.has(x.name) ? ', standard-satellite' : ''}`,
      `  ${x.title ? x.title + ': ' : ''}${x.doc || ''}`,
      ...(misses[x.name] ? [`  a model with no help (C-004) wrote ${misses[x.name].join(', ') || 'no usable name'} instead; GL JS ignores an unknown name without a warning`] : []),
      ...(c012.plain[x.name] && c012.hint[x.name] ? [`  C-012: right ${c012.plain[x.name].join(' of ')} times without help, ${c012.hint[x.name].join(' of ')} when told to search map.getSchema('basemap') by each entry's metadata['mapbox:title'] and to read the value back`] : [])].join('\n');
    if (!q) {
      for (const x of std) console.log(`${x.name.padEnd(40)} ${String(x.type ?? '-').padEnd(8)} ${short(JSON.stringify(x.default), 26).padEnd(26)}${x.values ? ' ' + x.values.join('|') : ''}${flag(x.name)}`);
      const satOnly = (cfg.styles['standard-satellite'] || []).filter((x) => !std.some((y) => y.name === x.name));
      if (satOnly.length) console.log(`\nstandard-satellite only: ${satOnly.map((x) => x.name).join(', ')}`);
      break;
    }
    const all = [...std, ...(cfg.styles['standard-satellite'] || []).filter((x) => !std.some((y) => y.name === x.name))];
    print(exact(all, q).map(show));
    break;
  }
  case 'api': {
    const file = path.join(inv, 'api-params.json');
    if (!fs.existsSync(file)) { console.log('No API reference yet: run `node tools/api-docs.mjs` first.'); break; }
    const pages = JSON.parse(fs.readFileSync(file, 'utf8'));
    // what the API did at and past each stated limit C-011 tested (experiments/followups/results/docs-limits.json)
    const limFile = path.join(root, 'experiments/followups/results/docs-limits.json');
    const tested = fs.existsSync(limFile) ? JSON.parse(fs.readFileSync(limFile, 'utf8')).numbers.rows : [];
    const pageKey = (p) => p.replace(/^(maps|navigation|search|accounts)_/, '').replace(/^geocoding$/, 'geocoding (v6)');
    const words = args.map(lc);
    const out = [];
    for (const [page, secs] of Object.entries(pages)) for (const sec of secs) {
      const url = (sec.endpoints[0]?.url || '').split('?')[0].replace('https://api.mapbox.com', '');
      for (const p of sec.params) {
        if (!words.every((w) => [page, url, p.name, p.description].some((f) => lc(f).includes(w)))) continue;
        const base = p.name.split(' ')[0];
        // a tested row names its endpoint when the page has several: "limit (reverse)"
        const sameEndpoint = (r) => { const e = (r.param.match(/\((\w+)\)/) || [])[1]; return !e || (e === 'reverse' ? /reverse|longitude/.test(url) : e === 'forward' ? !/reverse|longitude|suggest|category/.test(url) : url.includes(e)); };
        const checks = tested.filter((r) => r.page.replace(' (EV)', '') === pageKey(page) && r.param.split(' ')[0] === base && sameEndpoint(r))
          .map((r) => `  C-011, ${r.end} ${r.at}: ${r.verdict === 'agrees' ? 'the API agrees' : r.verdict === 'api stricter' ? `the API is STRICTER than this: ${r.at_message}` : r.verdict === 'api looser' ? `the API also accepted ${r.past}` : r.verdict}`);
        out.push([`${page} · ${sec.endpoints[0]?.method || ''} ${url} · ${p.name}${p.flags.length ? ' ' + p.flags.join(' ') : ''}`,
          `  ${p.table}${p.type ? ', ' + p.type : ''}`, `  ${short(p.description, 400)}`, ...[...new Set(checks)]].join('\n'));
      }
    }
    console.log(out.length ? out.slice(0, 25).join('\n') + (out.length > 25 ? `\n… ${out.length - 25} more` : '') : `nothing found for "${q}"`);
    break;
  }
  case 'find': {
    const words = args.map(lc);
    const hit = (...fields) => words.every((w) => fields.some((f) => lc(f).includes(w)));
    const rows = [];
    for (const p of spec.properties) if (hit(p.name, p.doc, p.layer)) rows.push(`prop    ${p.layer}.${p.name}  ${short(p.doc, 110)}`);
    for (const e of spec.expressions) if (hit(e.name, e.doc)) rows.push(`expr    ${e.name}  ${short(e.doc, 110)}`);
    for (const s of spec.sources) for (const o of s.options) if (hit(o.name, o.doc, s.name)) rows.push(`source  ${s.name}.${o.name}  ${short(o.doc, 110)}`);
    for (const [k, list] of Object.entries(spec.sections)) for (const o of list) if (hit(o.name, o.doc, k)) rows.push(`section ${k}.${o.name}  ${short(o.doc, 110)}`);
    for (const m of gl.map.members) if (hit(m.name, m.summary)) rows.push(`method  Map.${m.name}  ${short(m.summary, 110)}`);
    for (const o of gl.mapOptions) if (hit(o.name, o.doc)) rows.push(`option  ${o.name}  ${short(o.doc, 110)}`);
    for (const e of gl.mapEvents) if (hit(e.name)) rows.push(`event   ${e.name}`);
    for (const [c, v] of Object.entries(gl.classes)) for (const m of v.members) if (m.owner === c && hit(m.name, m.summary, c)) rows.push(`method  ${c}.${m.name}  ${short(m.summary, 110)}`);
    for (const x of cfg?.styles.standard || []) if (hit(x.name, x.title, x.doc)) rows.push(`config  basemap.${x.name}  ${short((x.title ? x.title + ': ' : '') + (x.doc || ''), 110)}`);
    console.log(rows.length ? rows.slice(0, 60).join('\n') + (rows.length > 60 ? `\n… ${rows.length - 60} more` : '') : `nothing found for "${q}"`);
    break;
  }
  default:
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
}

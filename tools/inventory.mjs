// Read Mapbox GL JS and its style spec as installed in node_modules, and write what they say about
// themselves to inventory/ (gitignored: the text comes from Mapbox under the Mapbox TOS; regenerate it here).
//
//   node tools/inventory.mjs
//
// inventory/style-spec.json  every layer type, paint and layout property, source type, expression, root key
// inventory/gl-js.json       Map's methods (own and inherited), MapOptions, map events, other exported classes
// inventory/meta.json        versions and counts
// inventory/standard-config.json  the settings Mapbox's Standard and Standard Satellite styles declare in their schema
//                            (lightPreset, theme, show*/color* ...). They are not in the library: this one part is
//                            fetched from the Styles API, so it needs MAPBOX_ACCESS_TOKEN (environment or .env) and
//                            is skipped without one.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'inventory');
fs.mkdirSync(out, { recursive: true });

const glPkg = require(path.join(root, 'node_modules/mapbox-gl/package.json'));
const specPkg = require(path.join(root, 'node_modules/@mapbox/mapbox-gl-style-spec/package.json'));
const ref = require(path.join(root, 'node_modules/@mapbox/mapbox-gl-style-spec/reference/v8.json'));

// ---------- style spec ----------

const firstLine = (s) => (s || '').split('\n')[0].trim();

function prop(name, p, extra = {}) {
  const support = p['sdk-support'] || {};
  const js = {};
  for (const [feature, sdks] of Object.entries(support)) if (sdks && sdks.js) js[feature] = sdks.js;
  return {
    name,
    ...extra,
    type: p.type,
    value: p.value,
    default: p.default,
    minimum: p.minimum,
    maximum: p.maximum,
    units: p.units,
    values: p.values ? Object.keys(p.values) : undefined,
    length: p.length,
    required: p.required || undefined,
    transition: p.transition || undefined,
    'property-type': p['property-type'],
    expression: p.expression ? { interpolated: p.expression.interpolated, parameters: p.expression.parameters } : undefined,
    requires: p.requires,
    experimental: p.experimental || undefined,
    private: p.private || undefined,
    'js-since': js,
    'not-in-js': Object.keys(support).length > 0 && Object.keys(js).length === 0 ? true : undefined,
    doc: p.doc,
  };
}

const layerTypes = Object.entries(ref.layer.type.values).map(([name, v]) => ({
  name,
  doc: v.doc,
  experimental: v.experimental || undefined,
  'js-since': v['sdk-support']?.['basic functionality']?.js,
}));

const properties = [];
for (const key of Object.keys(ref)) {
  const m = key.match(/^(paint|layout)_(.+)$/);
  if (!m) continue;
  for (const [name, p] of Object.entries(ref[key])) properties.push(prop(name, p, { kind: m[1], layer: m[2] }));
}

const sources = ref.source.map((k) => ({
  name: k.replace(/^source_/, ''),
  options: Object.entries(ref[k]).filter(([n]) => n !== '*').map(([n, p]) => prop(n, p)),
}));

const expressions = Object.entries(ref.expression_name.values).map(([name, v]) => ({
  name,
  group: v.group,
  doc: v.doc,
  experimental: v.experimental || undefined,
  'js-since': v['sdk-support']?.['basic functionality']?.js,
}));

const rootKeys = Object.entries(ref.$root).filter(([n]) => n !== '$version' || true).map(([n, p]) => prop(n, p));

const sectionKeys = ['light', 'light-3d', 'fog', 'terrain', 'projection', 'camera', 'colorTheme', 'import', 'config', 'snow', 'rain', 'transition'];
const sections = {};
for (const k of sectionKeys) {
  if (!ref[k]) continue;
  sections[k] = Object.entries(ref[k]).filter(([n]) => n !== '*').map(([n, p]) => prop(n, p));
}

const styleSpec = { version: specPkg.version, layerTypes, properties, sources, expressions, root: rootKeys, sections };

// ---------- GL JS types ----------

const dtsPath = path.join(root, 'node_modules/mapbox-gl/dist/mapbox-gl.d.ts');
const sf = ts.createSourceFile(dtsPath, fs.readFileSync(dtsPath, 'utf8'), ts.ScriptTarget.Latest, true);

const classes = new Map();
const typeAliases = new Map();
const interfaces = new Map();
ts.forEachChild(sf, (n) => {
  if (ts.isClassDeclaration(n) && n.name) classes.set(n.name.text, n);
  if (ts.isTypeAliasDeclaration(n)) typeAliases.set(n.name.text, n);
  if (ts.isInterfaceDeclaration(n)) interfaces.set(n.name.text, n);
});

// export { Map$1 as Map, ... } -> local name to public name
const exportsMap = new Map();
ts.forEachChild(sf, (n) => {
  if (ts.isExportDeclaration(n) && n.exportClause && ts.isNamedExports(n.exportClause) && !n.isTypeOnly) {
    for (const el of n.exportClause.elements) exportsMap.set((el.propertyName || el.name).text, el.name.text);
  }
});

function jsdoc(node) {
  const docs = node.jsDoc || [];
  const d = docs[docs.length - 1];
  if (!d) return {};
  const comment = typeof d.comment === 'string' ? d.comment : (d.comment || []).map((c) => c.text).join('');
  const tags = {};
  for (const t of d.tags || []) {
    const name = t.tagName.text;
    const text = typeof t.comment === 'string' ? t.comment : (t.comment || []).map((c) => c.text).join('');
    (tags[name] ||= []).push(text.trim());
  }
  return { summary: firstLine(comment), tags };
}

const text = (n) => n.getText(sf).replace(/\s+/g, ' ');

function members(cls, owner) {
  const outList = [];
  for (const m of cls.members) {
    if (!m.name) continue;
    const name = m.name.getText(sf);
    if (name.startsWith('_') || name.startsWith('#')) continue;
    if (m.modifiers?.some((x) => x.kind === ts.SyntaxKind.PrivateKeyword || x.kind === ts.SyntaxKind.ProtectedKeyword)) continue;
    const d = jsdoc(m);
    if (d.tags?.private) continue;
    let kind = 'property';
    let signature;
    if (ts.isMethodDeclaration(m)) {
      kind = 'method';
      signature = `${name}(${m.parameters.map(text).join(', ')})${m.type ? ': ' + text(m.type) : ''}`;
    } else if (ts.isGetAccessor(m)) {
      kind = 'getter';
      signature = `get ${name}()${m.type ? ': ' + text(m.type) : ''}`;
    } else if (ts.isPropertyDeclaration(m)) {
      signature = `${name}${m.questionToken ? '?' : ''}: ${m.type ? text(m.type) : 'unknown'}`;
    } else if (ts.isConstructorDeclaration(m)) {
      continue;
    }
    outList.push({
      name,
      kind,
      owner,
      signature,
      summary: d.summary,
      deprecated: d.tags?.deprecated ? d.tags.deprecated[0] || true : undefined,
      experimental: d.tags?.experimental ? true : undefined,
      example: d.tags?.example ? d.tags.example[0] : undefined,
    });
  }
  return outList;
}

function heritage(cls) {
  const h = cls.heritageClauses?.find((c) => c.token === ts.SyntaxKind.ExtendsKeyword);
  return h ? h.types[0].expression.getText(sf) : undefined;
}

function classWithAncestors(localName) {
  const chain = [];
  let name = localName;
  while (name && classes.has(name)) {
    const cls = classes.get(name);
    chain.push({ name, cls });
    name = heritage(cls);
  }
  const seen = new Set();
  const all = [];
  for (const { name: n, cls } of chain) {
    for (const m of members(cls, n.replace(/\$\d+$/, ''))) {
      if (seen.has(m.name)) continue; // overridden lower in the chain
      seen.add(m.name);
      all.push(m);
    }
  }
  return { chain: chain.map((c) => c.name.replace(/\$\d+$/, '')), members: all };
}

function typeLiteralMembers(name) {
  const alias = typeAliases.get(name);
  const lit = alias?.type;
  const node = lit && ts.isTypeLiteralNode(lit) ? lit : interfaces.get(name);
  if (!node) return [];
  return node.members
    .filter((m) => m.name)
    .map((m) => {
      const d = jsdoc(m);
      return {
        name: m.name.getText(sf).replace(/^['"]|['"]$/g, ''),
        optional: !!m.questionToken,
        type: m.type ? text(m.type) : undefined,
        default: d.tags?.default?.[0],
        summary: d.summary,
        deprecated: d.tags?.deprecated ? d.tags.deprecated[0] || true : undefined,
        experimental: d.tags?.experimental ? true : undefined,
      };
    });
}

// Constructor options are documented on the class, as `@param {type} [options.name=default] text`.
function classOptionDocs(localName) {
  const cls = classes.get(localName);
  const raw = (cls.jsDoc || []).map((d) => d.getText(sf)).join('\n');
  const docs = {};
  const re = /@param\s+\{([^}]*)\}\s+(\[)?options\.([\w.]+)(?:=([^\]\s]+|'[^']*'))?\]?\s+([\s\S]*?)(?=\n\s*\*\s*@|\n\s*\*\/)/g;
  for (const m of raw.matchAll(re)) {
    const body = m[5].replace(/\n\s*\*\s?/g, ' ').replace(/\s+/g, ' ').trim();
    docs[m[3]] = { jsdocType: m[1], default: m[4], doc: body };
  }
  return docs;
}

const mapClass = classWithAncestors('Map$1');
const mapOptionDocs = classOptionDocs('Map$1');
const exportedClasses = {};
for (const [local, pub] of exportsMap) {
  if (!classes.has(local) || pub === 'Map') continue;
  const c = classWithAncestors(local);
  exportedClasses[pub] = { chain: c.chain, members: c.members.map(({ name, kind, owner, signature, summary, deprecated }) => ({ name, kind, owner, signature, summary, deprecated })) };
}

const glJs = {
  version: glPkg.version,
  map: mapClass,
  mapOptions: typeLiteralMembers('MapOptions').map((o) => {
    const d = mapOptionDocs[o.name] || {};
    return { ...o, default: o.default ?? d.default, doc: d.doc, documented: !!d.doc };
  }),
  mapEvents: typeLiteralMembers('MapEvents').map(({ name, type, summary }) => ({ name, type, summary })),
  classes: exportedClasses,
  exports: [...exportsMap.values()],
};

// ---------- write ----------

const meta = {
  generated: new Date().toISOString(),
  'mapbox-gl': glPkg.version,
  'mapbox-gl-style-spec': specPkg.version,
  counts: {
    layerTypes: layerTypes.length,
    paintProperties: properties.filter((p) => p.kind === 'paint').length,
    layoutProperties: properties.filter((p) => p.kind === 'layout').length,
    sourceTypes: sources.length,
    expressions: expressions.length,
    rootKeys: rootKeys.length,
    mapMembers: mapClass.members.length,
    mapMethods: mapClass.members.filter((m) => m.kind === 'method').length,
    mapOptions: glJs.mapOptions.length,
    mapEvents: glJs.mapEvents.length,
    exportedClasses: Object.keys(exportedClasses).length,
  },
};

fs.writeFileSync(path.join(out, 'style-spec.json'), JSON.stringify(styleSpec, null, 1));
fs.writeFileSync(path.join(out, 'gl-js.json'), JSON.stringify(glJs, null, 1));
// ---------- the Standard styles' settings (Styles API) ----------

function mapboxToken() {
  if (process.env.MAPBOX_ACCESS_TOKEN) return process.env.MAPBOX_ACCESS_TOKEN;
  const env = path.join(root, '.env');
  const m = fs.existsSync(env) && fs.readFileSync(env, 'utf8').match(/^MAPBOX_ACCESS_TOKEN=(\S+)/m);
  return m ? m[1] : null;
}

const tok = mapboxToken();
if (tok) {
  const styles = {};
  for (const id of ['standard', 'standard-satellite']) {
    const r = await fetch(`https://api.mapbox.com/styles/v1/mapbox/${id}?access_token=${tok}`);
    if (!r.ok) { console.error(`Standard settings: ${id} answered ${r.status}; skipped`); continue; }
    const st = await r.json();
    styles[id] = Object.entries(st.schema || {}).map(([name, v]) => ({
      name, type: v.type, default: v.default, values: v.values, minimum: v.minValue, maximum: v.maxValue, step: v.stepValue,
      title: v.metadata?.['mapbox:title'], doc: v.metadata?.['mapbox:description'],
    }));
  }
  fs.writeFileSync(path.join(out, 'standard-config.json'), JSON.stringify({ fetched: new Date().toISOString(), styles }, null, 1));
  meta.counts.standardSettings = styles.standard?.length;
  meta.counts.standardSatelliteSettings = styles['standard-satellite']?.length;
} else {
  console.error('Standard settings skipped: no MAPBOX_ACCESS_TOKEN in the environment or .env');
}

fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 2));
console.log(JSON.stringify(meta, null, 2));

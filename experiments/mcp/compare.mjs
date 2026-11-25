// How much of each Mapbox web-service endpoint do the MCP server's tools expose, and where do the tools' constraints
// differ from the API reference? (C-003)
//
//   node experiments/mcp/tool_schemas.mjs     first: the tools' input schemas as JSON Schema
//   node experiments/mcp/compare.mjs          fetches the docs pages into .cache/mcp-docs/ if missing, then compares
//
// The docs pages are Mapbox's text and stay in .cache/ (git-ignored). results/compare.json keeps parameter names,
// types, which table they are in, and the constraints read from them, not the descriptions.
//
// CALLS says, for each tool, which documented endpoint each of its requests goes to and how its inputs get there.
// It was written by reading the tool's code at the commit in tool-schemas.json; `code` names the file and lines.
//   exposed: documented parameter -> the tool input that sets it (the agent controls it)
//   fixed:   documented parameter -> what the tool always sends (the agent cannot change it)
//   local:   tool inputs that never reach the request (they shape the tool's own work or output)
// Every other documented parameter of that endpoint is absent: the tool never sends it.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const DOCS = path.join(ROOT, '.cache/mcp-docs');
const RESULTS = path.join(ROOT, 'experiments/mcp/results');

export const PAGES = {
  'search_search-box': 'search/search-box', search_geocoding: 'search/geocoding', search_details: 'search/details',
  search_places: 'search/places', navigation_directions: 'navigation/directions', navigation_matrix: 'navigation/matrix',
  'navigation_optimization-v1': 'navigation/optimization-v1', navigation_isochrone: 'navigation/isochrone',
  'navigation_map-matching': 'navigation/map-matching', 'maps_static-images': 'maps/static-images',
  'maps_raster-tiles': 'maps/raster-tiles', accounts_tokens: 'accounts/tokens', feedback: 'feedback',
};

const same = (...names) => Object.fromEntries(names.map((n) => [n, n]));

export const CALLS = {
  'search-and-geocode-tool': {
    code: 'search-and-geocode-tool/buildSearchAndGeocodeRequestUrl.ts:37-80',
    calls: [{ page: 'search_search-box', heading: 'Text search', exposed: same('q', 'language', 'proximity', 'bbox', 'country', 'types', 'poi_category', 'auto_complete', 'eta_type', 'navigation_profile', 'origin'), fixed: { limit: '10' } }],
  },
  'reverse-geocode-tool': {
    code: 'reverse-geocode-tool/ReverseGeocodeTool.ts:111-134',
    calls: [{ page: 'search_geocoding', heading: 'Reverse geocoding', exposed: same('longitude', 'latitude', 'permanent', 'country', 'language', 'limit', 'types', 'worldview') }],
    local: ['format'],
  },
  'category-search-tool': {
    code: 'category-search-tool/buildCategorySearchRequestUrl.ts:34-68',
    calls: [{ page: 'search_search-box', heading: 'Category search', exposed: { canonical_category_id: 'category', ...same('language', 'limit', 'proximity', 'bbox', 'country', 'poi_category_exclusions') } }],
    local: ['format'],
  },
  'category-list-tool': {
    code: 'category-list-tool/CategoryListTool.ts:57-64',
    calls: [{ page: 'search_search-box', heading: 'List categories', exposed: same('language') }],
    local: ['limit', 'offset'],
  },
  'place-details-tool': {
    code: 'place-details-tool/PlaceDetailsTool.ts:189-206, 225-246',
    calls: [
      { page: 'search_places', heading: 'Retrieve a single Place', exposed: same('mapbox_id') },
      { page: 'search_details', heading: 'Retrieve POI Details', exposed: same('mapbox_id', 'attribute_sets', 'language', 'worldview'), fixed: {}, when: 'only after the first answers 422 (a mapbox_id that is not a POI)', role: 'fallback' },
    ],
  },
  'ground-location-tool': {
    code: 'ground-location-tool/GroundLocationTool.ts:184-236, buildReverseGeocodeUrl.ts:20-33',
    calls: [
      { page: 'search_geocoding', heading: 'Reverse geocoding', exposed: same('longitude', 'latitude', 'language'), fixed: { limit: '1', types: 'one per facet, set by the tool' } },
      { page: 'search_search-box', heading: 'Category search', exposed: { canonical_category_id: 'query', proximity: 'longitude, latitude', limit: 'limit', language: 'language' } },
      { page: 'navigation_isochrone', heading: 'Retrieve isochrones around a location', exposed: { profile: 'profile', coordinates: 'longitude, latitude', contours_minutes: 'contours_minutes' }, fixed: { polygons: 'true' } },
    ],
    local: ['include'],
  },
  'directions-tool': {
    code: 'directions-tool/buildDirectionsRequestUrl.ts:34-93',
    calls: [{ page: 'navigation_directions', heading: 'Retrieve directions', exposed: { profile: 'routing_profile', ...same('coordinates', 'geometries', 'overview', 'max_height', 'max_width', 'max_weight', 'alternatives', 'depart_at', 'arrive_by', 'exclude') }, fixed: { annotations: 'distance,speed (and congestion with overview=full)', steps: 'true' } }],
  },
  'matrix-tool': {
    code: 'matrix-tool/MatrixTool.ts:250-283',
    calls: [{ page: 'navigation_matrix', heading: 'Retrieve a matrix', exposed: same('profile', 'coordinates', 'annotations', 'approaches', 'bearings', 'destinations', 'sources') }],
  },
  'optimization-tool': {
    code: 'optimization-tool/buildOptimizationRequestUrl.ts:41-70',
    calls: [{ page: 'navigation_optimization-v1', heading: 'Retrieve an optimization', exposed: same('profile', 'coordinates', 'source', 'destination', 'roundtrip', 'geometries', 'overview', 'steps', 'annotations', 'language') }],
  },
  'isochrone-tool': {
    code: 'isochrone-tool/buildIsochroneRequestUrl.ts:31-60',
    calls: [{ page: 'navigation_isochrone', heading: 'Retrieve isochrones around a location', exposed: same('profile', 'coordinates', 'contours_minutes', 'contours_meters', 'contours_colors', 'polygons', 'denoise', 'generalize', 'exclude', 'depart_at') }],
  },
  'map-matching-tool': {
    code: 'map-matching-tool/buildMapMatchingRequestUrl.ts:30-46',
    calls: [{ page: 'navigation_map-matching', heading: 'Retrieve a match', exposed: same('profile', 'coordinates', 'timestamps', 'radiuses', 'annotations', 'overview', 'geometries') }],
  },
  'elevation-tool': {
    code: 'elevation-tool/terrain.ts:7, 37-45, 167',
    calls: [{ page: 'maps_raster-tiles', heading: 'Retrieve raster tiles', exposed: {}, fixed: { tileset_id: 'mapbox.mapbox-terrain-dem-v1', zoom: 'chosen by the tool', '{x}/{y}': 'from the points', format: 'pngraw' } }],
    local: ['points', 'path', 'route_ref'],
  },
  'static-map-image-tool': {
    code: 'static-map-image-tool/buildStaticMapRequestUrl.ts:26-111',
    calls: [{ page: 'maps_static-images', heading: 'Retrieve a static map from a style', exposed: { username: 'style', style_id: 'style', lon: 'center', lat: 'center', zoom: 'zoom', width: 'size', height: 'size', '@2x': 'highDensity', overlay: 'overlays' } }],
  },
  'list-public-tokens-tool': {
    code: 'list-public-tokens-tool/ListPublicTokensTool.ts:182-186',
    calls: [{ page: 'accounts_tokens', heading: 'List tokens', exposed: {}, fixed: { username: 'read from the token', usage: 'pk', limit: '100' } }],
    local: ['site_url'],
  },
  'feedback-tool': {
    code: 'feedback-tool/FeedbackTool.ts:138-152, 226-247',
    calls: [
      { page: 'feedback', heading: 'Get feedback items', exposed: same('category'), fixed: { status: 'received', created_after: 'now minus the duplicate window', sort_by: 'created_at', order: 'desc', limit: '200' }, when: 'to look for a duplicate first', role: 'duplicate check' },
      { page: 'feedback', heading: 'Create a single feedback item', exposed: { feedback: 'feedback', category: 'category', lat: 'coordinates', lon: 'coordinates' }, fixed: { id: 'a random UUID' } },
    ],
    local: ['send_anyway'],
  },
  'report-tool': {
    code: 'report-tool/ReportTool.ts:141',
    calls: [{ page: null, heading: 'POST /user-feedback/v1/cli-feedback', exposed: same('feedback', 'category', 'tool_name') }],
  },
};

// ---- docs ----

function docs() {
  fs.mkdirSync(DOCS, { recursive: true });
  for (const [f, p] of Object.entries(PAGES)) {
    const file = path.join(DOCS, `${f}.html`);
    if (fs.existsSync(file)) continue;
    execFileSync('curl', ['-sSfL', '-A', 'docs-reader', '-o', file, `https://docs.mapbox.com/api/${p}/`]);
    fs.appendFileSync(path.join(DOCS, 'fetched.txt'), `${f} ${new Date().toISOString()}\n`);
  }
  const out = path.join(DOCS, 'params.json');
  execFileSync('python3', ['-I', path.join(ROOT, 'experiments/mcp/docs_params.py'), DOCS, out], { stdio: 'ignore' });
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

function section(all, page, heading) {
  const s = (all[page] || []).find((x) => x.heading === heading);
  if (!s) throw new Error(`no section "${heading}" on ${page}`);
  const seen = new Map();
  for (const p of s.params) {
    if (p.name === 'access_token' || p.name.includes('.')) continue; // credentials, and sub-fields of a body object
    if (!seen.has(p.name)) seen.set(p.name, p);
  }
  // path placeholders the tables leave out, e.g. {canonical_category_id}
  for (const e of s.endpoints) for (const m of e.url.split('?')[0].matchAll(/\{([a-z_]+)\}/g)) {
    if (!seen.has(m[1]) && !['x', 'y'].includes(m[1])) seen.set(m[1], { name: m[1], type: '', table: 'path', description: '', codes: [], flags: [] });
  }
  return { endpoints: s.endpoints.map((e) => `${e.method} ${e.url.split('?')[0].replace('https://api.mapbox.com', '')}`), params: [...seen.values()] };
}

// ---- constraints read from a description (heuristics; every flag they raise is reviewed by hand in results.md) ----

function docsDefault(p) {
  const t = p.description;
  const pats = [/`?([\w./,-]+)`?\s*\(default\)/i, /\(([\w./-]+), default\)/i, /default(?: value)? is\s+`?([\w./,-]+)`?/i, /defaults? to\s+`?([\w./,-]+)`?/i, /Default:\s*`?([\w./,-]+)`?/i, /([\w./-]+)\s+is the default/i];
  for (const re of pats) { const m = t.match(re); if (m) return m[1].replace(/[.,]$/, ''); }
  return undefined;
}
const numbersIn = (t) => [...t.matchAll(/(?<![\w.])-?\d+(?:\.\d+)?(?![\w])/g)].map((m) => Number(m[0]));
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, twenty: 20, 'twenty-five': 25, fifty: 50, hundred: 100 };
const numberWords = (t) => Object.entries(WORDS).filter(([w]) => new RegExp(`\\b${w}\\b`, 'i').test(t)).map(([, n]) => n);

function schemaOf(tool, input, schemas) {
  const main = Object.entries(schemas.tools[tool]).find(([k]) => /Input(Schema)?$/.test(k) && !/Overlay/.test(k))?.[1] || Object.values(schemas.tools[tool])[0];
  const prop = main.properties?.[input];
  return { prop, required: (main.required || []).includes(input) };
}

function compareOne(doc, tool, input, schemas) {
  const flags = [];
  const { prop, required } = schemaOf(tool, input, schemas);
  if (!prop) return [{ kind: 'mapping', detail: `tool input ${input} not in schema` }];
  const items = prop.items || {};
  const en = prop.enum || items.enum;
  const docReq = doc.table === 'required' || doc.table === 'path';
  if (required && !docReq) flags.push({ kind: 'required', detail: 'tool requires it; docs list it as optional' });
  if (!required && docReq && prop.default === undefined) flags.push({ kind: 'required', detail: 'docs require it; tool makes it optional with no default' });
  const dd = docsDefault(doc);
  if (prop.default !== undefined && dd !== undefined && String(prop.default) !== dd) flags.push({ kind: 'default', detail: `tool default ${JSON.stringify(prop.default)}, docs default ${dd}` });
  if (en) {
    const notInDocs = en.filter((v) => !doc.codes.includes(String(v)) && !doc.description.includes(String(v)));
    if (notInDocs.length) flags.push({ kind: 'values', detail: `tool allows ${notInDocs.join(', ')}, not named in the docs` });
    const docVals = doc.codes.filter((c) => /^[a-z][a-z0-9_/-]*$/.test(c) && !en.includes(c));
    const sameKind = docVals.filter((c) => en.some((v) => String(v).includes('/') === c.includes('/')));
    if (sameKind.length) flags.push({ kind: 'values', detail: `docs name ${[...new Set(sameKind)].join(', ')}, not in the tool's list` });
  }
  const nums = [...numbersIn(doc.description), ...numberWords(doc.description)];
  for (const [k, v] of [['maximum', prop.maximum], ['minimum', prop.minimum], ['maxItems', prop.maxItems], ['item maximum', items.maximum], ['item minimum', items.minimum], ['maxLength', prop.maxLength]]) {
    if (v === undefined || v === 0 || v === 1 || v === -1) continue;
    if (Math.abs(v) >= 1e15) continue;
    if (!nums.includes(v)) flags.push({ kind: 'range', detail: `tool ${k} ${v}; the docs' description does not state ${v}` });
  }
  return flags;
}

// ---- run ----

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const schemas = JSON.parse(fs.readFileSync(path.join(RESULTS, 'tool-schemas.json'), 'utf8'));
  const all = docs();
  const out = { mcp_commit: schemas.commit, mcp_version: schemas.version, docs_read: fs.readFileSync(path.join(DOCS, 'fetched.txt'), 'utf8').trim().split('\n').map((l) => l.split(' ')[1].slice(0, 10))[0], tools: {} };
  let D = 0, E = 0, F = 0;
  const rows = [];
  for (const [tool, spec] of Object.entries(CALLS)) {
    const inputs = Object.keys(Object.values(schemas.tools[tool]).find((s, i, a) => a.length === 1 || s.properties?.overlays || s.properties?.center)?.properties || Object.values(schemas.tools[tool])[0].properties);
    const used = new Set([...(spec.local || []), ...spec.calls.flatMap((c) => Object.values(c.exposed).flatMap((v) => v.split(', ')))]);
    const unaccounted = inputs.filter((i) => !used.has(i));
    const calls = [];
    for (const c of spec.calls) {
      if (!c.page) { calls.push({ endpoint: c.heading, documented: null, note: 'endpoint not in the API reference' }); rows.push([tool, c.heading, '—', '—', '—', '—', 'not documented']); continue; }
      const s = section(all, c.page, c.heading);
      const fixed = c.fixed || {};
      const params = s.params.map((p) => {
        const status = c.exposed[p.name] ? 'exposed' : fixed[p.name] !== undefined ? 'fixed' : 'absent';
        const r = { name: p.name, type: p.type, table: p.table, flags: p.flags, status, ...(status === 'exposed' ? { tool_input: c.exposed[p.name] } : {}), ...(status === 'fixed' ? { tool_sends: fixed[p.name] } : {}), docs_default: docsDefault(p), docs_values: p.codes.filter((x) => /^[a-z][a-z0-9_/.-]*$/.test(x)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 20) };
        if (status === 'exposed') {
          const single = c.exposed[p.name].split(', ');
          if (single.length === 1) r.disagreements = compareOne(p, tool, single[0], schemas);
        }
        return r;
      });
      const missingDoc = Object.keys(c.exposed).filter((k) => !s.params.some((p) => p.name === k));
      const n = { documented: params.length, exposed: params.filter((p) => p.status === 'exposed').length, fixed: params.filter((p) => p.status === 'fixed').length };
      n.absent = n.documented - n.exposed - n.fixed;
      D += n.documented; E += n.exposed; F += n.fixed;
      calls.push({ page: `docs.mapbox.com/api/${PAGES[c.page]}/`, section: c.heading, endpoint: s.endpoints, when: c.when, role: c.role, ...n, exposed_not_in_docs: missingDoc, params });
      rows.push([tool, c.heading + (c.role ? ` (${c.role})` : ''), n.documented, n.exposed, n.fixed, n.absent, `${Math.round((100 * n.exposed) / n.documented)}%`]);
    }
    out.tools[tool] = { code: spec.code, inputs, local: spec.local || [], unaccounted_inputs: unaccounted, calls };
    if (unaccounted.length) console.log(`!! ${tool}: inputs not mapped: ${unaccounted.join(', ')}`);
  }
  out.totals = { documented: D, exposed: E, fixed: F, absent: D - E - F, exposed_share: Math.round((1000 * E) / D) / 10 };
  fs.writeFileSync(path.join(RESULTS, 'compare.json'), JSON.stringify(out, null, 1) + '\n');
  console.log('| Tool | Endpoint section | Documented | Exposed | Fixed | Absent | Exposed share |\n|---|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.join(' | ')} |`);
  console.log(`\nall calls: ${D} documented parameters, ${E} exposed (${out.totals.exposed_share}%), ${F} fixed, ${D - E - F} absent`);
  const flags = Object.entries(out.tools).flatMap(([t, v]) => v.calls.flatMap((c) => (c.params || []).flatMap((p) => (p.disagreements || []).map((d) => `${t} · ${p.name} · ${d.kind}: ${d.detail}`))));
  console.log(`\n${flags.length} constraint flags to review:\n` + flags.join('\n'));
}

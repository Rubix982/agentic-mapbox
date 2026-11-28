// Checks for the civic set (evals/civic/tasks.md). Each reads the running map back through the harness
// (evals/harness/run_page.mjs) and returns { passed, reasons, numbers }. Expected values come from truth.json, which
// make_data.mjs wrote from the same 311 export and which agents never see.
//
// A drawn report is a feature returned by map.queryRenderedFeatures over the window from any visible circle layer, keyed
// by its unique_key property. Its colour and radius are GL JS's own evaluation of the layer's paint for that feature
// (map.style.getOwnLayer(id).paint.get(name).evaluate). The basemap is Standard when a style fragment's stylesheet id is
// 'standard'.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TRUTH = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'truth.json'), 'utf8'));
const LOCATED = new Map(TRUTH.truth.map((t) => [String(t.unique_key), t]));
const R = 6371008.8, rad = (d) => (d * Math.PI) / 180;
const metres = ([a, b], [c, d]) => { const p = rad(d - b), q = rad(c - a); const h = Math.sin(p / 2) ** 2 + Math.cos(rad(b)) * Math.cos(rad(d)) * Math.sin(q / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(h))); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const near = (got, want, tol = 12) => Array.isArray(got) && got.slice(0, 3).every((v, i) => Math.abs(v - want[i]) <= tol);
const category = (t) => (!t.closed ? 'open' : (new Date(t.closed) - new Date(t.created)) / 36e5 <= 24 ? 'within 24 h' : 'after 24 h');
const COLOURS = { 'within 24 h': '#2e7d32', 'after 24 h': '#f9a825', open: '#c62828' };

async function read(t) {
  return t.eval(() => {
    const map = window.map;
    const style = map.getStyle();
    const standard = (map.style.fragments || []).some((f) => f.style && f.style.stylesheet && f.style.stylesheet.id === 'standard');
    const layers = style.layers.filter((l) => l.type === 'circle' && (!l.layout || l.layout.visibility !== 'none')).map((l) => l.id);
    const parse = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); return m ? m[1].split(',').map(Number) : null; };
    const drawn = {};
    for (const f of layers.length ? map.queryRenderedFeatures({ layers }) : []) {
      const k = f.properties && f.properties.unique_key;
      if (k == null || drawn[String(k)]) continue;
      const L = map.style.getOwnLayer(f.layer.id), feat = { type: 1, properties: f.properties };
      let colour = null, radius = null;
      try { const c = L.paint.get('circle-color'); colour = parse((c && c.evaluate ? c.evaluate(feat, {}, undefined, []) : c).toString()); } catch (e) {}
      try { const r = L.paint.get('circle-radius'); radius = r && r.evaluate ? r.evaluate(feat, {}, undefined, []) : r; } catch (e) {}
      drawn[String(k)] = { layer: f.layer.id, at: f.geometry.coordinates, colour, radius };
    }
    // reports held in GeoJSON sources, whether or not they are on screen
    let held = 0;
    for (const s of Object.values(style.sources)) {
      if (s.type !== 'geojson' || typeof s.data !== 'object' || !s.data) continue;
      const fs = s.data.features || (s.data.type === 'Feature' ? [s.data] : []);
      held += fs.filter((f) => f.properties && f.properties.unique_key != null).length;
    }
    const skipped = document.getElementById('skipped');
    return { standard, layers, drawn, held, skipped: skipped ? skipped.textContent : null };
  });
}

function common(v, reasons, tolM, colourFor) {
  if (!v.standard) reasons.push('the basemap is not Mapbox Standard');
  if (!v.layers.length) reasons.push('no visible circle layer');
  const keys = Object.keys(v.drawn);
  const missing = [...LOCATED.keys()].filter((k) => !v.drawn[k]), extra = keys.filter((k) => !LOCATED.has(k));
  if (missing.length) reasons.push(`${missing.length} of the 65 located reports are not drawn in view (e.g. ${missing.slice(0, 3).join(', ')})`);
  if (extra.length) reasons.push(`${extra.length} drawn reports have no location in the export (e.g. ${extra.slice(0, 3).join(', ')})`);
  const far = keys.filter((k) => LOCATED.has(k)).map((k) => [k, metres(v.drawn[k].at, [LOCATED.get(k).lng, LOCATED.get(k).lat])]).filter(([, d]) => d > tolM);
  if (far.length) reasons.push(`${far.length} reports are more than ${tolM} m from the city's position (worst ${Math.round(Math.max(...far.map(([, d]) => d)))} m)`);
  const badR = keys.filter((k) => typeof v.drawn[k].radius !== 'number' || Math.abs(v.drawn[k].radius - 6) > 0.5);
  if (badR.length) reasons.push(`${badR.length} circles do not have radius 6 px (e.g. ${v.drawn[badR[0]].radius})`);
  const badC = keys.filter((k) => LOCATED.has(k) && !near(v.drawn[k].colour, hex(colourFor(LOCATED.get(k)))));
  if (badC.length) reasons.push(`${badC.length} circles have the wrong colour (e.g. ${badC[0]}: ${JSON.stringify(v.drawn[badC[0]].colour)}, want ${colourFor(LOCATED.get(badC[0]))})`);
  return { drawn: keys.length, missing: missing.length, extra: extra.length, far: far.length, wrong_radius: badR.length, wrong_colour: badC.length, held: v.held };
}
const done = (reasons, numbers) => ({ passed: reasons.length === 0, reasons, numbers });

export default {
  1: async (t) => {
    const v = await read(t), reasons = [];
    const numbers = common(v, reasons, 5, () => '#c62828');
    if (v.held > 65) reasons.push(`GeoJSON sources hold ${v.held} reports, more than the 65 with a location`);
    if (v.skipped == null) reasons.push('no element with id skipped');
    else if (!/\b70\b/.test(v.skipped)) reasons.push(`#skipped says "${v.skipped.slice(0, 60)}", not 70`);
    numbers.skipped = v.skipped;
    return done(reasons, numbers);
  },
  2: async (t) => {
    const v = await read(t), reasons = [];
    return done(reasons, common(v, reasons, 15, () => '#1565c0'));
  },
  3: async (t) => {
    const v = await read(t), reasons = [];
    const numbers = common(v, reasons, 5, (r) => COLOURS[category(r)]);
    numbers.categories = [...LOCATED.values()].reduce((a, r) => ({ ...a, [category(r)]: (a[category(r)] || 0) + 1 }), {});
    return done(reasons, numbers);
  },
};

// C-040 (T-035): at C-039's 544 Dutch points, is Mapbox's height AHN4's surface model averaged over a larger square?
//   node experiments/followups/dem-smooth-nl.mjs   (needs C-039's results/dem-surface-nl.json)
// No Mapbox requests: Mapbox's heights come from C-032 and C-039. About 3,300 requests to the AHN server (surface and
// ground models over squares 30, 100 and 250 m across at each point), cached in .cache/ahn/; the 5.9 and 17.6 m
// squares are C-039's. Every AHN request is sent in RD New coordinates, converted as in C-032.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiExperiment, fact } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const C039 = JSON.parse(fs.readFileSync(path.join(HERE, 'results/dem-surface-nl.json'), 'utf8'));
// set on the card before any of these squares was read
const SIDES = [30, 100, 250], TOL = 0.5, SOURCE_BAR = 0.9, CLOSER_BAR = 0.33;
const SERVER = 'https://ahn.arcgisonline.nl/arcgis/rest/services/Hoogtebestand';
const MODELS = { ground: 'AHN4_DTM_50cm', surface: 'AHN4_DSM_50cm' };
const UA = 'dem-check/1.0';
const CACHE = path.join(HERE, '../../.cache/ahn');
const PLACES = ['Rotterdam', 'Amsterdam', 'Almere', 'Dordrecht', 'Middelburg', 'Zwolle'];

const median = (v) => { const s = Float64Array.from(v).sort(); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const share = (v, ok) => (v.length ? r2(v.filter(ok).length / v.length) : null);
const pool = async (items, n, fn) => {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
};

// WGS84 to RD New, Schreutelkamp and Strang van Hees (2001), about 1 m; as C-032
function toRD(lat, lng) {
  const dp = 0.36 * (lat - 52.1551744), dl = 0.36 * (lng - 5.38720621);
  const Rpq = [[0, 1, 190094.945], [1, 1, -11832.228], [2, 1, -114.221], [0, 3, -32.391], [1, 0, -0.705], [3, 1, -2.34], [1, 3, -0.608], [0, 2, -0.008], [2, 3, 0.148]];
  const Spq = [[1, 0, 309056.544], [0, 2, 3638.893], [2, 0, 73.077], [1, 2, -157.984], [3, 0, 59.788], [0, 1, 0.433], [2, 2, -6.439], [1, 1, -0.032], [0, 4, 0.092], [1, 4, -0.054]];
  return [155000 + Rpq.reduce((a, [p, q, v]) => a + v * dp ** p * dl ** q, 0), 463000 + Spq.reduce((a, [p, q, v]) => a + v * dp ** p * dl ** q, 0)];
}

// mean and cell count of one AHN model over a square `side` metres across centred on the point; file names as C-039's
async function square(model, [lng, lat], side) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${model === 'ground' ? '' : 'dsm-'}stats_${lng}_${lat}_${side.toFixed(2)}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const [x, y] = toRD(lat, lng), h = side / 2, sr = { wkid: 28992 };
  const ring = [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h], [x - h, y - h]];
  const url = `${SERVER}/${MODELS[model]}/ImageServer/computeStatisticsHistograms?geometry=${encodeURIComponent(JSON.stringify({ rings: [ring], spatialReference: sr }))}&geometryType=esriGeometryPolygon&f=json`;
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) {
        const j = await r.json();
        if (j.error) last = JSON.stringify(j.error).slice(0, 120);
        else {
          const s = j.statistics?.[0];
          const out = s && s.count > 0 ? { mean: s.mean, min: s.min, max: s.max, count: s.count } : { mean: null, count: 0 };
          fs.writeFileSync(file, JSON.stringify(out) + '\n');
          return out;
        }
      } else last = `status ${r.status}`;
    } catch (e) { last = e.message; }
    await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
  }
  throw new Error(`AHN ${model} ${lng},${lat} (${side} m): ${last}`);
}

await apiExperiment({
  file: import.meta.url,
  question: "At C-039's 544 Dutch points, is Mapbox's height AHN's surface model averaged over 30, 100 or 250 m?",
  run: async () => {
    const pts = C039.numbers.points.filter((r) => r.cover_3px != null);
    const rows = await pool(pts, 4, async (p) => {
      const out = {
        place: p.place, lng: p.lng, lat: p.lat, building: p.building, mapbox_m: p.mapbox_m,
        // C-039's squares, one and three Mapbox pixels across
        surface: { '5.9': p.surface_1px, '17.6': p.surface_3px }, ground: { '5.9': p.ground_1px, '17.6': p.ground_3px }, cells: {},
      };
      for (const side of SIDES) {
        const [g, s] = [await square('ground', [p.lng, p.lat], side), await square('surface', [p.lng, p.lat], side)];
        out.ground[side] = r2(g.mean); out.surface[side] = r2(s.mean);
        out.cells[side] = { ground: r2(g.count / (side / 0.5) ** 2), surface: r2(s.count / (side / 0.5) ** 2) };
      }
      return out;
    });
    const sizes = ['5.9', '17.6', ...SIDES.map(String)];
    const against = (rs, model, size) => rs.filter((r) => r[model][size] != null).map((r) => r.mapbox_m - r[model][size]);
    const summary = (rs) => Object.fromEntries(sizes.map((size) => {
      const s = against(rs, 'surface', size), g = against(rs, 'ground', size);
      return [size, {
        n: s.length, surface: { within_0_5: share(s, (d) => Math.abs(d) <= TOL), within_1: share(s, (d) => Math.abs(d) <= 1), median_diff_m: r2(median(s)), median_abs_diff_m: r2(median(s.map(Math.abs))) },
        ground: { within_0_5: share(g, (d) => Math.abs(d) <= TOL), within_1: share(g, (d) => Math.abs(d) <= 1), median_diff_m: r2(median(g)), median_abs_diff_m: r2(median(g.map(Math.abs))) },
      }];
    }));
    const all = summary(rows);
    const best = (model) => sizes.reduce((b, size) => (all[size][model].within_0_5 > all[b][model].within_0_5 ? size : b), sizes[0]);
    const bs = best('surface'), bg = best('ground');
    const places = PLACES.map((place) => ({ place, by_size: summary(rows.filter((r) => r.place === place)) }));
    const coverage = Object.fromEntries(SIDES.map((side) => [side, {
      ground_cells_median: r2(median(rows.map((r) => r.cells[side].ground))), surface_cells_median: r2(median(rows.map((r) => r.cells[side].surface))),
    }]));
    return {
      facts: [
        fact(`At some square size, Mapbox is within ${TOL} m of AHN's surface mean at ${SOURCE_BAR * 100}% of points or more`, all[bs].surface.within_0_5 >= SOURCE_BAR, { best_size_m: bs, share: all[bs].surface.within_0_5 }),
        fact(`At some square size, Mapbox is within ${TOL} m of AHN's surface mean at ${CLOSER_BAR * 100}% of points or more`, all[bs].surface.within_0_5 >= CLOSER_BAR, { best_size_m: bs, share: all[bs].surface.within_0_5 }),
        fact("AHN's ground model, at its best size, does as well as the surface model at its best", all[bg].ground.within_0_5 >= all[bs].surface.within_0_5,
          { ground: [bg, all[bg].ground.within_0_5], surface: [bs, all[bs].surface.within_0_5] }),
      ],
      numbers: {
        tolerance_m: TOL, sizes_m: sizes, best_surface_size_m: bs, best_ground_size_m: bg, all,
        off_buildings: summary(rows.filter((r) => !r.building)), inside_buildings: summary(rows.filter((r) => r.building)),
        share_of_cells_with_data: coverage, places, points: rows,
      },
    };
  },
});

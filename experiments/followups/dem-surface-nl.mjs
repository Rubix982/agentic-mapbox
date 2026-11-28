// C-039 (T-034): at C-032's Dutch points, and the points inside Mapbox's buildings that C-032 left out, does Mapbox's
// height rise with what AHN4's surface model shows standing on the ground (buildings, trees)?
//   node experiments/followups/dem-surface-nl.mjs   (needs C-032's results/dem-lowland-nl.json)
// Redraws C-032's sample (about 120 DEM tiles and 900 Tilequery requests to Mapbox) and stops if the points off
// buildings differ from C-032's. About 1,200 requests to the AHN server, cached in .cache/ahn/: AHN4's surface model
// over two squares at every point, and its ground model at the points inside buildings (C-032's are already cached).
// Every AHN request is sent in RD New coordinates, converted as in C-032.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { apiExperiment, fact } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const C032 = JSON.parse(fs.readFileSync(path.join(HERE, 'results/dem-lowland-nl.json'), 'utf8'));
// C-032's places, boxes, seed and count, unchanged
const PLACES = [
  { name: 'Rotterdam', box: [4.44, 51.9, 4.56, 51.96] },
  { name: 'Amsterdam', box: [4.86, 52.34, 4.96, 52.39] },
  { name: 'Almere', box: [5.17, 52.35, 5.27, 52.4] },
  { name: 'Dordrecht', box: [4.64, 51.78, 4.72, 51.82] },
  { name: 'Middelburg', box: [3.58, 51.48, 3.64, 51.51] },
  { name: 'Zwolle', box: [6.06, 52.49, 6.12, 52.53] },
];
const PER_PLACE = 100, SEED = 32, Z = 14, TILE = 256;
// set on the card before any surface height was read
const TOL = 0.5, OPEN_BAR = 0.9, OPEN_COVER = 0.25, SURFACE_SLOPE = 0.5, GROUND_SLOPE = 0.1, RANGE_EDGE = 0.25, BOOT = 1000, BOOT_SEED = 39;
const SERVER = 'https://ahn.arcgisonline.nl/arcgis/rest/services/Hoogtebestand';
const MODELS = { ground: 'AHN4_DTM_50cm', surface: 'AHN4_DSM_50cm' };
const UA = 'dem-check/1.0';
const CACHE = path.join(HERE, '../../.cache/ahn');

const R = 6371008.8, rad = (d) => (d * Math.PI) / 180;
const pixelM = (lat) => (2 * Math.PI * R * Math.cos(rad(lat))) / (2 ** Z * TILE);
const tileXY = ([lng, lat], z) => {
  const n = 2 ** z;
  return [((lng + 180) / 360) * n, ((1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2) * n];
};
const median = (v) => { const s = Float64Array.from(v).sort(); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const share = (v, ok) => (v.length ? r2(v.filter(ok).length / v.length) : null);
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
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

// mean, min, max and cell count of one AHN model over a square `side` metres across centred on the point. The ground
// model's file names are C-032's, so its cached squares are reused.
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

// Theil–Sen: the median of the slopes between every pair of points
function theilSen(xs, ys) {
  const n = xs.length, s = new Float64Array((n * (n - 1)) / 2);
  let k = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const dx = xs[j] - xs[i]; if (dx !== 0) s[k++] = (ys[j] - ys[i]) / dx; }
  const t = s.subarray(0, k).sort();
  return k ? (k % 2 ? t[(k - 1) / 2] : (t[k / 2 - 1] + t[k / 2]) / 2) : null;
}
// each place's medians removed from x and y, so a place's own offset cannot pass for cover
const centred = (rows, xKey, yKey) => {
  const xs = [], ys = [];
  for (const place of new Set(rows.map((r) => r.place))) {
    const rs = rows.filter((r) => r.place === place), mx = median(rs.map((r) => r[xKey])), my = median(rs.map((r) => r[yKey]));
    for (const r of rs) { xs.push(r[xKey] - mx); ys.push(r[yKey] - my); }
  }
  return [xs, ys];
};
// slope, and a 95% range from resampling points within each place
function slopeWithRange(rows, xKey, yKey, seed) {
  const slope = theilSen(...centred(rows, xKey, yKey));
  const rand = rng(seed), byPlace = [...new Set(rows.map((r) => r.place))].map((p) => rows.filter((r) => r.place === p)), boots = [];
  for (let b = 0; b < BOOT; b++) {
    const sample = byPlace.flatMap((rs) => rs.map(() => rs[Math.floor(rand() * rs.length)]));
    boots.push(theilSen(...centred(sample, xKey, yKey)));
  }
  boots.sort((a, b) => a - b);
  return { slope: r2(slope), range_95: [r2(boots[Math.floor(0.025 * BOOT)]), r2(boots[Math.ceil(0.975 * BOOT) - 1])], n: rows.length };
}

await apiExperiment({
  file: import.meta.url,
  question: "At C-032's Dutch points and inside Mapbox's buildings there, does Mapbox's height rise with the buildings and trees in AHN4's surface model?",
  run: async (api) => {
    const tiles = new Map();
    const tile = async (x, y) => {
      const key = `${x}/${y}`;
      if (!tiles.has(key)) tiles.set(key, api.get(`https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/${Z}/${x}/${y}.pngraw`).then((r) => {
        if (!r.ok) throw new Error(`tile ${key}: ${r.status} ${r.message}`);
        const png = PNG.sync.read(r.buffer);
        const h = new Float32Array(png.width * png.height);
        for (let i = 0; i < h.length; i++) h[i] = -10000 + (png.data[i * 4] * 65536 + png.data[i * 4 + 1] * 256 + png.data[i * 4 + 2]) * 0.1;
        return { size: png.width, h };
      }));
      return tiles.get(key);
    };
    // at the coordinate, bilinear, as Mapbox's MCP elevation tool reads it (C-009, C-010, C-030)
    const mapboxAt = async (lnglat) => {
      const [cx, cy] = tileXY(lnglat, Z);
      const t = await tile(Math.floor(cx), Math.floor(cy));
      const px = Math.max(0, Math.min(t.size - 1, (cx - Math.floor(cx)) * t.size - 0.5)), py = Math.max(0, Math.min(t.size - 1, (cy - Math.floor(cy)) * t.size - 0.5));
      const x0 = Math.floor(px), y0 = Math.floor(py), x1 = Math.min(t.size - 1, x0 + 1), y1 = Math.min(t.size - 1, y0 + 1), fx = px - x0, fy = py - y0;
      const H = (x, y) => t.h[y * t.size + x];
      return (H(x0, y0) * (1 - fx) + H(x1, y0) * fx) * (1 - fy) + (H(x0, y1) * (1 - fx) + H(x1, y1) * fx) * fy;
    };
    const under = async ([lng, lat]) => {
      const r = await api.get(`https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json?radius=0&layers=water,building&limit=5`);
      if (!r.ok) throw new Error(`tilequery ${lng},${lat}: ${r.status} ${r.message}`);
      const layers = new Set((r.json?.features || []).map((f) => f.properties?.tilequery?.layer));
      return { water: layers.has('water'), building: layers.has('building') };
    };

    // C-032's draw, step for step
    const kept = [];
    for (const [k, p] of PLACES.entries()) {
      const rand = rng(SEED + k), [w, s, e, n] = p.box, here = [];
      while (here.length < PER_PLACE) {
        const batch = Array.from({ length: 8 }, () => [Math.round((w + rand() * (e - w)) * 1e6) / 1e6, Math.round((s + rand() * (n - s)) * 1e6) / 1e6]);
        const found = await pool(batch, 4, under);
        for (const [i, lnglat] of batch.entries()) {
          if (here.length >= PER_PLACE) break;
          if (!found[i].water) here.push({ place: p.name, lnglat, building: found[i].building });
        }
      }
      kept.push(...here);
    }
    const key = (lng, lat) => `${lng},${lat}`;
    const c032 = new Map(C032.numbers.points.map((q) => [key(q.lng, q.lat), q]));
    const offNow = kept.filter((q) => !q.building).map((q) => key(...q.lnglat));
    const same = offNow.length === c032.size && offNow.every((k) => c032.has(k));
    if (!same) throw new Error(`the redraw's points off buildings are not C-032's: ${offNow.length} drawn, ${offNow.filter((k) => !c032.has(k)).length} new`);

    // C-032's 443 usable points off buildings, and every point inside a building
    const asked = kept.filter((q) => q.building || c032.get(key(...q.lnglat)).usable);
    const rows = await pool(asked, 4, async (q) => {
      const px = pixelM(q.lnglat[1]);
      const [g1, g3, s1, s3] = [await square('ground', q.lnglat, px), await square('ground', q.lnglat, 3 * px), await square('surface', q.lnglat, px), await square('surface', q.lnglat, 3 * px)];
      const mb = q.building ? await mapboxAt(q.lnglat) : c032.get(key(...q.lnglat)).mapbox_m;
      const has3 = g3.mean != null && s3.mean != null, has1 = g1.mean != null && s1.mean != null;
      return {
        place: q.place, lng: q.lnglat[0], lat: q.lnglat[1], building: q.building, mapbox_m: r2(mb), pixel_m: r2(px),
        ground_1px: r2(g1.mean), ground_1px_cells: g1.count, surface_1px: r2(s1.mean), surface_1px_max: r2(s1.max), ground_3px: r2(g3.mean), ground_3px_cells: g3.count, surface_3px: r2(s3.mean),
        cover_1px: has1 ? r2(s1.mean - g1.mean) : null, cover_3px: has3 ? r2(s3.mean - g3.mean) : null,
        above_ground_1px: has1 ? r2(mb - g1.mean) : null, above_ground_3px: has3 ? r2(mb - g3.mean) : null,
        above_surface_1px: has1 ? r2(mb - s1.mean) : null,
      };
    });

    const use3 = rows.filter((r) => r.cover_3px != null), off = use3.filter((r) => !r.building), inB = use3.filter((r) => r.building);
    const all = slopeWithRange(use3, 'cover_3px', 'above_ground_3px', BOOT_SEED);
    const offSlope = slopeWithRange(off, 'cover_3px', 'above_ground_3px', BOOT_SEED + 1);
    const inSlope = slopeWithRange(inB, 'cover_3px', 'above_ground_3px', BOOT_SEED + 2);
    const offRows1 = rows.filter((r) => !r.building && r.cover_1px != null);
    const one = slopeWithRange(offRows1, 'cover_1px', 'above_ground_1px', BOOT_SEED + 3);
    const open = offRows1.filter((r) => r.cover_1px < OPEN_COVER), covered = offRows1.filter((r) => r.cover_1px >= 1);
    const group = (rs) => ({
      n: rs.length, cover_1px_median_m: r2(median(rs.map((r) => r.cover_1px))), above_ground_median_m: r2(median(rs.map((r) => r.above_ground_1px))),
      above_surface_median_m: r2(median(rs.map((r) => r.above_surface_1px))), within_0_5_of_ground: share(rs.map((r) => r.above_ground_1px), (d) => Math.abs(d) <= TOL),
      within_0_5_of_surface: share(rs.map((r) => r.above_surface_1px), (d) => Math.abs(d) <= TOL),
    });
    const places = PLACES.map(({ name }) => {
      const rs = use3.filter((r) => r.place === name), o = rs.filter((r) => !r.building), b = rs.filter((r) => r.building), op = open.filter((r) => r.place === name);
      return {
        place: name, n: rs.length, inside_buildings: b.length, slope_3px: r2(theilSen(rs.map((r) => r.cover_3px), rs.map((r) => r.above_ground_3px))),
        off_buildings: { cover_3px_median_m: r2(median(o.map((r) => r.cover_3px))), above_ground_3px_median_m: r2(median(o.map((r) => r.above_ground_3px))) },
        inside_buildings_medians: b.length ? { roof_above_ground_m: r2(median(b.map((r) => r.surface_1px - r.ground_3px))), cover_3px_m: r2(median(b.map((r) => r.cover_3px))), mapbox_above_ground_3px_m: r2(median(b.map((r) => r.above_ground_3px))) } : null,
        open_n: op.length, open_within_0_5: share(op.map((r) => r.above_ground_1px), (d) => Math.abs(d) <= TOL),
      };
    });
    const buildings = {
      drawn: kept.filter((q) => q.building).length, with_ground_around: inB.length,
      roof_above_ground_median_m: r2(median(inB.map((r) => r.surface_1px - r.ground_3px))),
      mapbox_above_ground_median_m: r2(median(inB.map((r) => r.above_ground_3px))),
      mapbox_minus_roof_median_m: r2(median(inB.map((r) => r.mapbox_m - r.surface_1px))),
    };
    return {
      facts: [
        fact("The redraw's points off buildings are C-032's", same, { off_buildings: offNow.length, inside_buildings: kept.length - offNow.length }),
        fact(`Mapbox's height above the ground rises ${SURFACE_SLOPE} m or more per metre of cover over three pixels, the 95% range above ${RANGE_EDGE}`,
          all.slope >= SURFACE_SLOPE && all.range_95[0] > RANGE_EDGE, all),
        fact(`Mapbox's height above the ground rises ${GROUND_SLOPE} m or less per metre of cover over three pixels, the 95% range below ${RANGE_EDGE}`,
          all.slope <= GROUND_SLOPE && all.range_95[1] < RANGE_EDGE, all),
        fact(`Where cover over one pixel is under ${OPEN_COVER} m, Mapbox is within ${TOL} m of the ground at ${OPEN_BAR * 100}% of points or more`,
          group(open).within_0_5_of_ground >= OPEN_BAR, group(open)),
      ],
      numbers: {
        tolerance_m: TOL, open_cover_m: OPEN_COVER, bootstrap: BOOT,
        slope_3px: { all, off_buildings: offSlope, inside_buildings: inSlope }, slope_1px_off_buildings: one,
        off_buildings_1px: { open: group(open), covered_1m_or_more: group(covered), all: group(offRows1) },
        buildings, dropped_no_ground_3px: rows.length - use3.length, places, points: rows,
      },
    };
  },
});
